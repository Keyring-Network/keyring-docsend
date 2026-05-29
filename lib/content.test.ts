import { describe, expect, it } from "vitest";
import { isImageFile, resolveImageList } from "./content";

describe("isImageFile", () => {
  it("accepts known image extensions, case-insensitively", () => {
    expect(isImageFile("a.PNG")).toBe(true);
    expect(isImageFile("b.jpeg")).toBe(true);
    expect(isImageFile("c.svg")).toBe(true);
  });

  it("rejects non-images", () => {
    expect(isImageFile("notes.txt")).toBe(false);
    expect(isImageFile("deck.pdf")).toBe(false);
  });
});

describe("resolveImageList", () => {
  it("uses the configured order when provided", () => {
    expect(resolveImageList(["2.png", "1.png"], ["1.png", "2.png"])).toEqual([
      "2.png",
      "1.png",
    ]);
  });

  it("falls back to sorted images from the directory", () => {
    expect(resolveImageList([], ["b.png", "a.png", "notes.txt"])).toEqual([
      "a.png",
      "b.png",
    ]);
  });
});
