import { describe, expect, it } from "vitest";
import { classifyRoute } from "./routes";

describe("classifyRoute", () => {
  it("treats the sign-in and verify routes as public", () => {
    expect(classifyRoute("/")).toBe("public");
    expect(classifyRoute("/signin/verify")).toBe("public");
  });

  it("treats the access-decide endpoint as public", () => {
    expect(classifyRoute("/api/access/decide")).toBe("public");
  });

  it("treats /admin and its children as admin", () => {
    expect(classifyRoute("/admin")).toBe("admin");
    expect(classifyRoute("/admin/viewers")).toBe("admin");
  });

  it("does not treat /administrators as admin", () => {
    expect(classifyRoute("/administrators")).toBe("protected");
  });

  it("treats everything else as protected", () => {
    expect(classifyRoute("/deck")).toBe("protected");
    expect(classifyRoute("/content/index.html")).toBe("protected");
  });
});
