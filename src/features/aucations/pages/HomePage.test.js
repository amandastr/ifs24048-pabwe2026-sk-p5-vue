import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMemoryHistory } from "vue-router";
import HomePage from "./HomePage.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { createAppRouter } from "../../../router";
import * as toolsHelper from "../../../helpers/toolsHelper";

const mockRouter = {
  push: vi.fn(),
};

vi.mock("vue-router", async () => {
  const actual = await vi.importActual("vue-router");
  return {
    ...actual,
    useRouter: () => mockRouter,
  };
});

const flush = () => new Promise((r) => setTimeout(r, 10));

describe("HomePage", () => {
  const mockProfile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
  const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
  const past = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const mockAucations = [
    {
      id: 1,
      user_id: 1,
      title: "Laptop Gaming",
      description: "Laptop bekas",
      start_bid: 5000000,
      closed_at: future,
      cover: "https://example.com/cover1.jpg",
      bids: [{ id: 1, bid: 6000000 }],
    },
    {
      id: 2,
      user_id: 2,
      title: "Lukisan Antik",
      description: null,
      start_bid: 1000000,
      closed_at: past,
      cover: null,
      bids: [],
    },
  ];

  function setup({ state = {}, router, mockList = true } = {}) {
    const { pinia, aucationsStore } = createMockPinia({
      profile: mockProfile,
      aucations: mockAucations,
      ...state,
    });
    const listSpy = mockList
      ? vi.spyOn(aucationsStore, "asyncSetAucations").mockResolvedValue()
      : null;
    const result = renderWithProviders(HomePage, { pinia, router });
    return { ...result, aucationsStore, listSpy };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render nothing if profile is not present", () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: null },
    });
    expect(wrapper.find('[data-testid="add-aucation-btn"]').exists()).toBe(false);
  });

  it("should load aucations on mount and render stats and cards", async () => {
    const { wrapper, listSpy } = setup();
    await flush();

    expect(listSpy).toHaveBeenCalledWith({});
    expect(wrapper.find('[data-testid="stat-total"]').text()).toBe("2");
    expect(wrapper.find('[data-testid="stat-open"]').text()).toBe("1");
    expect(wrapper.find('[data-testid="stat-closed"]').text()).toBe("1");

    expect(wrapper.find('[data-testid="aucation-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="aucation-card-2"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="aucation-status-1"]').text()).toContain("Berlangsung");
    expect(wrapper.find('[data-testid="aucation-status-2"]').text()).toContain("Ditutup");
    expect(wrapper.find('[data-testid="highest-bid-1"]').text()).toContain("6.000.000");
    expect(wrapper.find('[data-testid="highest-bid-2"]').text()).toBe("Belum ada");
    expect(wrapper.find('[data-testid="countdown-2"]').text()).toContain("ditutup");
    expect(wrapper.find('img[alt="Laptop Gaming"]').exists()).toBe(true);
  });

  it("should show loading state and then empty state", async () => {
    let resolveFn;
    const { pinia, aucationsStore } = createMockPinia({
      profile: mockProfile,
      aucations: [],
    });
    vi.spyOn(aucationsStore, "asyncSetAucations").mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      })
    );
    const { wrapper } = renderWithProviders(HomePage, { pinia });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="aucations-loading"]').exists()).toBe(true);

    resolveFn();
    await flush();

    expect(wrapper.find('[data-testid="aucations-loading"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="aucations-empty"]').exists()).toBe(true);
  });

  it("should filter aucations using live search on title and description", async () => {
    const { wrapper } = setup();
    await flush();

    const input = wrapper.find('[data-testid="search-aucation-input"]');

    await input.setValue("laptop");
    expect(wrapper.find('[data-testid="aucation-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="aucation-card-2"]').exists()).toBe(false);

    await input.setValue("bekas");
    expect(wrapper.find('[data-testid="aucation-card-1"]').exists()).toBe(true);

    await input.setValue("tidak-ada");
    expect(wrapper.find('[data-testid="aucations-empty"]').exists()).toBe(true);

    await input.setValue("   ");
    expect(wrapper.find('[data-testid="aucation-card-2"]').exists()).toBe(true);
  });

  it("should handle aucations without title in search", async () => {
    const { wrapper } = setup({
      state: { aucations: [{ id: 9, user_id: 1, title: null, description: null }] },
    });
    await flush();

    await wrapper.find('[data-testid="search-aucation-input"]').setValue("x");
    expect(wrapper.find('[data-testid="aucations-empty"]').exists()).toBe(true);
  });

  it("should handle null aucations in store", async () => {
    const { wrapper } = setup({ state: { aucations: null } });
    await flush();

    expect(wrapper.find('[data-testid="stat-total"]').text()).toBe("0");
  });

  it("should reload with proper filters when tab changes", async () => {
    const { wrapper, listSpy } = setup();
    await flush();

    await wrapper.find('[data-testid="tab-mine-btn"]').trigger("click");
    expect(listSpy).toHaveBeenLastCalledWith({ isMe: 1 });

    await wrapper.find('[data-testid="tab-open-btn"]').trigger("click");
    expect(listSpy).toHaveBeenLastCalledWith({ isClosed: 0 });

    await wrapper.find('[data-testid="tab-closed-btn"]').trigger("click");
    expect(listSpy).toHaveBeenLastCalledWith({ isClosed: 1 });

    await wrapper.find('[data-testid="tab-all-btn"]').trigger("click");
    expect(listSpy).toHaveBeenLastCalledWith({});
  });

  it("should use initial tab from route query and react to query changes", async () => {
    const router = createAppRouter(createMemoryHistory());
    await router.push("/?tab=mine");
    await router.isReady();

    const { listSpy } = setup({ router });
    await flush();
    expect(listSpy).toHaveBeenCalledWith({ isMe: 1 });

    await router.push("/?tab=closed");
    await flush();
    expect(listSpy).toHaveBeenLastCalledWith({ isClosed: 1 });

    await router.push("/?tab=invalid");
    await flush();
    expect(listSpy).toHaveBeenLastCalledWith({});
  });

  it("should fallback to all tab when initial query is invalid", async () => {
    const router = createAppRouter(createMemoryHistory());
    await router.push("/?tab=oops");
    await router.isReady();

    const { listSpy } = setup({ router });
    await flush();

    expect(listSpy).toHaveBeenCalledWith({});
  });

  it("should show owner actions only for own aucations", async () => {
    const { wrapper } = setup();
    await flush();

    expect(wrapper.find('[data-testid="edit-aucation-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-aucation-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-aucation-2"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="delete-aucation-2"]').exists()).toBe(false);
  });

  it("should navigate to detail page when view button clicked", async () => {
    const { wrapper } = setup();
    await flush();

    await wrapper.find('[data-testid="view-aucation-1"]').trigger("click");
    expect(mockRouter.push).toHaveBeenCalledWith("/aucations/1");
  });

  it("should open add modal and change modal", async () => {
    const { wrapper } = setup();
    await flush();

    await wrapper.find('[data-testid="add-aucation-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-aucation-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-aucation-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="edit-aucation-1"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-aucation-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-aucation-modal"]').exists()).toBe(false);
  });

  it("should delete aucation after confirmation only", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, aucationsStore } = setup();
    const deleteSpy = vi
      .spyOn(aucationsStore, "asyncSetIsAucationDelete")
      .mockResolvedValue();
    await flush();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find('[data-testid="delete-aucation-1"]').trigger("click");
    await flush();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find('[data-testid="delete-aucation-1"]').trigger("click");
    await flush();
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should delete all aucations after confirmation only", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, aucationsStore } = setup();
    const deleteAllSpy = vi
      .spyOn(aucationsStore, "asyncSetIsAucationDeleteAll")
      .mockResolvedValue();
    await flush();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find('[data-testid="delete-all-aucations-btn"]').trigger("click");
    await flush();
    expect(deleteAllSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find('[data-testid="delete-all-aucations-btn"]').trigger("click");
    await flush();
    expect(deleteAllSpy).toHaveBeenCalled();
  });

  it("should reload list after an aucation is deleted", async () => {
    const { aucationsStore, listSpy } = setup();
    await flush();
    listSpy.mockClear();

    aucationsStore.setIsAucationDeleted(true);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(aucationsStore.isAucationDeleted).toBe(false);

    aucationsStore.setIsAucationDeleted(false);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("should reload list after all aucations are deleted", async () => {
    const { aucationsStore, listSpy } = setup();
    await flush();
    listSpy.mockClear();

    aucationsStore.setIsAucationDeletedAll(true);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(aucationsStore.isAucationDeletedAll).toBe(false);

    aucationsStore.setIsAucationDeletedAll(false);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("should tick the countdown timer and clear it on unmount", async () => {
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { wrapper } = setup();
    await flush();

    const tick = intervalSpy.mock.calls.find((call) => call[1] === 1000)[0];
    tick();
    await wrapper.vm.$nextTick();

    wrapper.unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("should not update loading state after unmount", async () => {
    let resolveFn;
    const { pinia, aucationsStore } = createMockPinia({ profile: mockProfile });
    vi.spyOn(aucationsStore, "asyncSetAucations").mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      })
    );
    const { wrapper } = renderWithProviders(HomePage, { pinia });
    wrapper.unmount();

    resolveFn();
    await flush();

    expect(wrapper.exists()).toBe(false);
  });
});
