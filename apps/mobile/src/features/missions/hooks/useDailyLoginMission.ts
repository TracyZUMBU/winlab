import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";

import {
  DAILY_LOGIN_LAST_COMPLETED_DATE_KEY,
  DAILY_LOGIN_MISSION_ID,
  DAILY_LOGIN_TOKEN_REWARD,
} from "../constants";
import { clearDailyLoginLocalCache } from "../services/clearDailyLoginLocalCache";
import { hasDailyLoginCompletionForCurrentUtcDay } from "../services/hasDailyLoginCompletionForCurrentUtcDay";
import {
  submitMissionCompletion,
  type SubmitMissionCompletionParams,
  type SubmitMissionCompletionResult,
} from "../services/missionService";

export type DailyLoginMissionResult =
  | {
      alreadyCompleted: true;
    }
  | {
      alreadyCompleted: false;
      tokensEarned: number;
    };

/** UTC calendar day (YYYY-MM-DD), aligned with submit_mission_completion daily_login guard. */
function formatUtcCalendarDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

async function writeLastCompletedUtcDay(value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_LOGIN_LAST_COMPLETED_DATE_KEY, value);
  } catch {
    // UX optimization only: no crash if local persistence fails.
  }
}

export async function triggerDailyLoginMission(): Promise<DailyLoginMissionResult> {
  const todayUtc = formatUtcCalendarDate();

  try {
    const serverDay = await hasDailyLoginCompletionForCurrentUtcDay(
      DAILY_LOGIN_MISSION_ID,
    );

    if (serverDay.ok) {
      if (serverDay.hasCompletion) {
        await writeLastCompletedUtcDay(todayUtc);
        return { alreadyCompleted: true };
      }

      await clearDailyLoginLocalCache();
    }

    const payload: SubmitMissionCompletionParams = {
      missionId: DAILY_LOGIN_MISSION_ID,
      proofData: {},
    };
    const result: SubmitMissionCompletionResult =
      await submitMissionCompletion(payload);

    if (result.success) {
      await writeLastCompletedUtcDay(todayUtc);
      return {
        alreadyCompleted: false,
        tokensEarned: DAILY_LOGIN_TOKEN_REWARD,
      };
    }

    return { alreadyCompleted: true };
  } catch (error) {
    logger.warn("[missions] daily_login mission trigger failed", { error });
    monitoring.captureException({
      name: "daily_login_mission_trigger_failed",
      severity: "warning",
      feature: "missions",
      message: "daily_login mission trigger failed",
      error,
    });
    return { alreadyCompleted: true };
  }
}

type UseDailyLoginMissionState = DailyLoginMissionResult & {
  isLoading: boolean;
};

export function useDailyLoginMission(): UseDailyLoginMissionState {
  const [state, setState] = useState<UseDailyLoginMissionState>({
    alreadyCompleted: true,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const result = await triggerDailyLoginMission();
      if (!mounted) return;
      setState({
        ...result,
        isLoading: false,
      });
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
