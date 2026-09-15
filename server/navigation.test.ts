import { describe, expect, it } from "vitest";
import { primaryNavigation } from "../shared/navigation";

describe("primary navigation", () => {
  it("keeps every main StudentShare section discoverable", () => {
    expect(primaryNavigation.map(item => item.href)).toEqual([
      "/dashboard",
      "/subjects",
      "/browse",
      "/groups",
      "/upload",
      "/uploads",
    ]);
  });
});
