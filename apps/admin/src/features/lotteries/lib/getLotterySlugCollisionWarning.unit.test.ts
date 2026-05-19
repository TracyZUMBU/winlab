import { getLotterySlugCollisionWarning } from "./getLotterySlugCollisionWarning";

describe("getLotterySlugCollisionWarning", () => {
  it("returns warning when base slug already exists", () => {
    const warning = getLotterySlugCollisionWarning("Loterie été", [
      "loterie-t",
      "other-slug",
    ]);
    expect(warning).toMatch(/identifiant unique/i);
  });

  it("returns null when slug is free", () => {
    const warning = getLotterySlugCollisionWarning("Titre unique xyz", [
      "autre-slug",
    ]);
    expect(warning).toBeNull();
  });
});
