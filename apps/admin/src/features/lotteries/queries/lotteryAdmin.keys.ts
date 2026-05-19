export const lotteryAdminKeys = {
  all: ["lotteryAdmin"] as const,
  lists: () => ["lotteryAdmin", "list"] as const,
  list: () => ["lotteryAdmin", "list", "overview"] as const,
  details: () => ["lotteryAdmin", "detail"] as const,
  detail: (lotteryId: string) => ["lotteryAdmin", "detail", lotteryId] as const,
  formBrands: () => ["lotteryAdmin", "form", "brands"] as const,
  formCategories: () => ["lotteryAdmin", "form", "categories"] as const,
};
