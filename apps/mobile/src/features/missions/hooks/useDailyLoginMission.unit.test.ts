import AsyncStorage from "@react-native-async-storage/async-storage";

import { hasDailyLoginCompletionForCurrentUtcDay } from "../services/hasDailyLoginCompletionForCurrentUtcDay";
import { submitMissionCompletion } from "../services/missionService";
import { triggerDailyLoginMission } from "./useDailyLoginMission";
import { DAILY_LOGIN_MISSION_ID } from "../constants";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("../services/missionService", () => ({
  __esModule: true,
  submitMissionCompletion: jest.fn(),
}));

jest.mock("../services/hasDailyLoginCompletionForCurrentUtcDay", () => ({
  __esModule: true,
  hasDailyLoginCompletionForCurrentUtcDay: jest.fn(),
}));

jest.mock("@/src/lib/logger", () => ({
  __esModule: true,
  logger: {
    warn: jest.fn(),
  },
}));

jest.mock("@/src/lib/monitoring", () => ({
  __esModule: true,
  monitoring: {
    captureException: jest.fn(),
  },
}));

const ASYNC_KEY = "daily_login_last_completed_date";

const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<
  typeof AsyncStorage.removeItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;
const mockSubmitMissionCompletion =
  submitMissionCompletion as jest.MockedFunction<
    typeof submitMissionCompletion
  >;
const mockHasDailyLoginCompletion =
  hasDailyLoginCompletionForCurrentUtcDay as jest.MockedFunction<
    typeof hasDailyLoginCompletionForCurrentUtcDay
  >;

describe("triggerDailyLoginMission", () => {
  /** Profile must be from a prior UTC day so daily_login submit is allowed under prod rules. */
  const eligibleProfileCreatedAt = "2018-01-01T00:00:00.000Z";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-30T09:30:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns alreadyCompleted and skips RPCs when profile created_at is same UTC calendar day as now", async () => {
    const result = await triggerDailyLoginMission("2026-04-30T02:00:00.000Z");

    expect(result).toEqual({ alreadyCompleted: true });
    expect(mockHasDailyLoginCompletion).not.toHaveBeenCalled();
    expect(mockSubmitMissionCompletion).not.toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("returns alreadyCompleted true and skips submit when server reports completion for current UTC day", async () => {
    mockHasDailyLoginCompletion.mockResolvedValue({
      ok: true,
      hasCompletion: true,
    });

    const result = await triggerDailyLoginMission(eligibleProfileCreatedAt);

    expect(result).toEqual({ alreadyCompleted: true });
    expect(mockSubmitMissionCompletion).not.toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith(ASYNC_KEY, "2026-04-30");
  });

  it("clears local key and submits when server reports no completion", async () => {
    mockHasDailyLoginCompletion.mockResolvedValue({
      ok: true,
      hasCompletion: false,
    });
    mockSubmitMissionCompletion.mockResolvedValue({
      success: true,
      data: { completionId: "completion-1" },
    });

    const result = await triggerDailyLoginMission(eligibleProfileCreatedAt);

    expect(mockSubmitMissionCompletion).toHaveBeenCalledWith({
      missionId: DAILY_LOGIN_MISSION_ID,
      proofData: {},
    });
    expect(mockRemoveItem).toHaveBeenCalledWith(ASYNC_KEY);
    expect(mockSetItem).toHaveBeenCalledWith(ASYNC_KEY, "2026-04-30");
    expect(result).toEqual({ alreadyCompleted: false, tokensEarned: 10 });
  });

  it("does not persist UTC day when submit returns business error", async () => {
    mockHasDailyLoginCompletion.mockResolvedValue({
      ok: true,
      hasCompletion: false,
    });
    mockSubmitMissionCompletion.mockResolvedValue({
      success: false,
      kind: "business",
      errorCode: "MISSION_USER_LIMIT_REACHED",
    });

    const result = await triggerDailyLoginMission(eligibleProfileCreatedAt);

    expect(mockRemoveItem).toHaveBeenCalledWith(ASYNC_KEY);
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(result).toEqual({ alreadyCompleted: true });
  });

  it("does not persist UTC day when submit returns technical error", async () => {
    mockHasDailyLoginCompletion.mockResolvedValue({
      ok: true,
      hasCompletion: false,
    });
    mockSubmitMissionCompletion.mockResolvedValue({
      success: false,
      kind: "technical",
    });

    const result = await triggerDailyLoginMission(eligibleProfileCreatedAt);

    expect(mockRemoveItem).toHaveBeenCalledWith(ASYNC_KEY);
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(result).toEqual({ alreadyCompleted: true });
  });

  it("still submits when server lookup fails", async () => {
    mockHasDailyLoginCompletion.mockResolvedValue({ ok: false });
    mockSubmitMissionCompletion.mockResolvedValue({
      success: true,
      data: { completionId: "completion-1" },
    });

    const result = await triggerDailyLoginMission(eligibleProfileCreatedAt);

    expect(mockRemoveItem).not.toHaveBeenCalled();
    expect(mockSubmitMissionCompletion).toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith(ASYNC_KEY, "2026-04-30");
    expect(result).toEqual({ alreadyCompleted: false, tokensEarned: 10 });
  });
});
