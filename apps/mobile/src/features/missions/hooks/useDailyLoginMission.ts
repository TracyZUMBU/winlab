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
  type MissionSubmissionBusinessErrorCode,
  type SubmitMissionCompletionParams,
  type SubmitMissionCompletionResult,
} from "../services/missionService";
import { isDailyLoginIneligibleFirstUtcDay } from "../utils/dailyLoginFirstUtcDay";

/** Expected daily_login outcomes — no monitoring noise. */
const SILENT_DAILY_LOGIN_BUSINESS_ERRORS = new Set<
  MissionSubmissionBusinessErrorCode
>(["MISSION_USER_LIMIT_REACHED", "DAILY_LOGIN_INELIGIBLE_FIRST_UTC_DAY"]);

function reportUnexpectedDailyLoginSubmitFailure(
  result: Extract<SubmitMissionCompletionResult, { success: false }>,
): void {
  // technical / unexpected failures are already logged in submitMissionCompletion.
  if (result.kind !== "business") {
    return;
  }
  if (SILENT_DAILY_LOGIN_BUSINESS_ERRORS.has(result.errorCode)) {
    return;
  }

  logger.warn("[missions] daily_login submit rejected", {
    errorCode: result.errorCode,
  });
  const error = new Error(`daily_login submit rejected: ${result.errorCode}`);
  monitoring.captureException({
    name: "daily_login_submit_business_error",
    severity: "warning",
    feature: "missions",
    message: error.message,
    error,
    extra: { errorCode: result.errorCode },
  });
}

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

export async function triggerDailyLoginMission(
  profileCreatedAt?: string | null,
): Promise<DailyLoginMissionResult> {
  const todayUtc = formatUtcCalendarDate();

  try {
    if (isDailyLoginIneligibleFirstUtcDay(profileCreatedAt)) {
      return { alreadyCompleted: true };
    }

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

    reportUnexpectedDailyLoginSubmitFailure(result);
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
      const result = await triggerDailyLoginMission(undefined);
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
