import { describe, it, expect } from "vitest";
import { createMemoryHistory } from "vue-router";
import { routes, createAppRouter } from "./router";
import defaultRouter from "./router";

function collect(list) {
  return list.flatMap((route) => [route, ...collect(route.children || [])]);
}

describe("router", () => {
  it("should lazy-load every route component", async () => {
    const components = collect(routes)
      .map((route) => route.component)
      .filter(Boolean);

    expect(components.length).toBe(9);
    const modules = await Promise.all(components.map((load) => load()));
    modules.forEach((mod) => expect(mod.default).toBeDefined());
  });

  it("should expose the expected route paths", () => {
    const router = createAppRouter(createMemoryHistory());
    const paths = router.getRoutes().map((r) => r.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/auth/login",
        "/auth/register",
        "/",
        "/aucations/:aucationId",
        "/users",
        "/profile",
      ])
    );
    expect(defaultRouter).toBeDefined();
  });
});
