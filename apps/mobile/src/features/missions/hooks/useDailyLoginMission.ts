import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import { logger } from "@/src/lib/logger";
import { monitoring } from "@/src/lib/monitoring";

import {
  DAILY_LOGIN_LAST_COMPLETED_DATE_KEY,
  DAILY_LOGIN_MISSION_ID,
  DAILY_LOGIN_TOKEN_REWARD,
} from "../constants";
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

function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function writeLastCompletedDate(value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_LOGIN_LAST_COMPLETED_DATE_KEY, value);
  } catch (error) {
    // UX optimization only: no crash if local persistence fails.
    logger.debug("[missions] Failed to persist daily login completion date", {
      error,
    });
  }
}

export async function triggerDailyLoginMission(): Promise<DailyLoginMissionResult> {
  const today = formatLocalDate();

  try {
    const lastCompletedDate = await AsyncStorage.getItem(
      DAILY_LOGIN_LAST_COMPLETED_DATE_KEY,
    );

    if (lastCompletedDate === today) {
      return { alreadyCompleted: true };
    }

    const payload: SubmitMissionCompletionParams = {
      missionId: DAILY_LOGIN_MISSION_ID,
      proofData: {},
    };
    const result: SubmitMissionCompletionResult =
      await submitMissionCompletion(payload);

    if (result.success) {
      await writeLastCompletedDate(today);
      return {
        alreadyCompleted: false,
        tokensEarned: DAILY_LOGIN_TOKEN_REWARD,
      };
    }

    // Retry on technical/unexpected failures by not marking local completion.
    // Only business failures are considered definitive for the day.
    if (result.kind !== "business") {
      return { alreadyCompleted: true };
    }

    await writeLastCompletedDate(today);
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
