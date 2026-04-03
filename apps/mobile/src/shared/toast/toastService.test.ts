import Toast from "react-native-toast-message";

import { WINLAB_TOAST_TYPES } from "./toast.types";
import {
  hideToast,
  showErrorToast,
  showSuccessToast,
  showToast,
} from "./toastService";

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

describe("toastService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps variants to internal winlab toast types for Toast.show", () => {
    showToast({
      type: "success",
      title: "OK",
      message: "Done",
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WINLAB_TOAST_TYPES.success,
        text1: "OK",
        text2: "Done",
        position: "top",
      }),
    );
  });

  it("showSuccessToast uses success variant", () => {
    showSuccessToast({ title: "Saved" });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WINLAB_TOAST_TYPES.success,
        text1: "Saved",
      }),
    );
  });

  it("showErrorToast uses error variant", () => {
    showErrorToast({ title: "Failed" });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WINLAB_TOAST_TYPES.error,
        text1: "Failed",
      }),
    );
  });

  it("deduplicates identical toasts within the debounce window", () => {
    showSuccessToast({ title: "X" });
    showSuccessToast({ title: "X" });
    expect(Toast.show).toHaveBeenCalledTimes(1);
  });

  it("hideToast delegates to Toast.hide", () => {
    hideToast();
    expect(Toast.hide).toHaveBeenCalled();
  });
});
