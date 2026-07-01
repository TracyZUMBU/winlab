import lotteryMemoMarkdown from "../lotteries/MEMO.md?raw";

export type AdminDocEntry = {
  slug: string;
  title: string;
  markdown: string;
};

export const adminDocEntries: AdminDocEntry[] = [
  {
    slug: "lotteries",
    title: "Loteries",
    markdown: lotteryMemoMarkdown,
  },
];

export function getAdminDocBySlug(slug: string | undefined): AdminDocEntry | undefined {
  if (!slug) {
    return undefined;
  }

  return adminDocEntries.find((entry) => entry.slug === slug);
}

export const defaultAdminDocSlug = adminDocEntries[0]?.slug ?? "lotteries";
