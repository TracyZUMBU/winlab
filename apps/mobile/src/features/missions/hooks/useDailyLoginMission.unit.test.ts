import AsyncStorage from "@react-native-async-storage/async-storage";

import { submitMissionCompletion } from "../services/missionService";
import { triggerDailyLoginMission } from "./useDailyLoginMission";
import { DAILY_LOGIN_MISSION_ID } from "../constants";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock("../services/missionService", () => ({
  __esModule: true,
  submitMissionCompletion: jest.fn(),
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

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;
const mockSubmitMissionCompletion =
  submitMissionCompletion as jest.MockedFunction<
    typeof submitMissionCompletion
  >;

describe("triggerDailyLoginMission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-30T09:30:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns alreadyCompleted true and skips RPC when date already stored for today", async () => {
    mockGetItem.mockResolvedValue("2026-04-30");

    const result = await triggerDailyLoginMission();

    expect(result).toEqual({ alreadyCompleted: true });
    expect(mockSubmitMissionCompletion).not.toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("submits mission and stores date when RPC succeeds", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSubmitMissionCompletion.mockResolvedValue({
      success: true,
      completionId: "completion-1",
    });

    const result = await triggerDailyLoginMission();

    expect(mockSubmitMissionCompletion).toHaveBeenCalledWith({
      missionId: DAILY_LOGIN_MISSION_ID,
      proofData: {},
    });
    expect(mockSetItem).toHaveBeenCalledWith(ASYNC_KEY, "2026-04-30");
    expect(result).toEqual({ alreadyCompleted: false, tokensEarned: 10 });
  });

  it("stores date and returns alreadyCompleted true when RPC returns business error", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSubmitMissionCompletion.mockResolvedValue({
      success: false,
      kind: "business",
      errorCode: "MISSION_USER_LIMIT_REACHED",
    });

    const result = await triggerDailyLoginMission();

    expect(mockSetItem).toHaveBeenCalledWith(ASYNC_KEY, "2026-04-30");
    expect(result).toEqual({ alreadyCompleted: true });
  });

  it("does not store date when RPC returns technical error", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSubmitMissionCompletion.mockResolvedValue({
      success: false,
      kind: "technical",
    });

    const result = await triggerDailyLoginMission();

    expect(mockSetItem).not.toHaveBeenCalled();
    expect(result).toEqual({ alreadyCompleted: true });
  });

  it("returns alreadyCompleted true when AsyncStorage read throws", async () => {
    mockGetItem.mockRejectedValue(new Error("storage offline"));

    const result = await triggerDailyLoginMission();

    expect(result).toEqual({ alreadyCompleted: true });
    expect(mockSubmitMissionCompletion).not.toHaveBeenCalled();
  });
});
