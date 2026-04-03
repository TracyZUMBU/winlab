import { showErrorToast } from "./toastService";
import { showToastForBusinessErrorCode } from "./mapBusinessErrorToToast";

jest.mock("./toastService", () => ({
  showErrorToast: jest.fn(),
}));

jest.mock("@/src/lib/i18n/errorCodeMessage", () => ({
  getI18nMessageForCode: jest.fn(() => "mapped-message"),
}));

describe("showToastForBusinessErrorCode", () => {
  const t = ((k: string) => k) as any;
  const i18n = { exists: () => false } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a single-line error toast when errorTitle is omitted", () => {
    showToastForBusinessErrorCode({
      t,
      i18n,
      baseKey: "errors",
      code: "X",
      fallbackKey: "errors.generic",
    });

    expect(showErrorToast).toHaveBeenCalledWith({ title: "mapped-message" });
  });

  it("shows title + message when errorTitle is set", () => {
    showToastForBusinessErrorCode({
      t,
      i18n,
      baseKey: "errors",
      code: "X",
      fallbackKey: "errors.generic",
      errorTitle: "Title",
    });

    expect(showErrorToast).toHaveBeenCalledWith({
      title: "Title",
      message: "mapped-message",
    });
  });
});
