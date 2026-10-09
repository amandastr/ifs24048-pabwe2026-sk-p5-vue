import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMemoryHistory } from "vue-router";
import DetailPage from "./DetailPage.vue";
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

describe("DetailPage", () => {
  const future = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
  const past = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const owner = { id: 1, name: "Pemilik", email: "owner@del.org" };
  const bidder = { id: 2, name: "Peserta", email: "bidder@del.org" };

  const baseAucation = {
    id: 5,
    user_id: 1,
    title: "Laptop Gaming",
    description: "Laptop **bekas**",
    start_bid: 5000000,
    closed_at: future,
    cover: "https://example.com/cover.jpg",
    created_at: "2026-01-01T00:00:00.000000Z",
    bids: [
      { id: 1, user_id: 2, bid: 6000000, user: { name: "Peserta" }, created_at: "2026-01-02T00:00:00Z" },
      { id: 2, user_id: 3, bid: 5500000, user_name: "Lain" },
    ],
  };

  async function setup({ profile = owner, aucation = baseAucation, route = "/aucations/5" } = {}) {
    const router = createAppRouter(createMemoryHistory());
    await router.push(route);
    await router.isReady();

    const { pinia, aucationsStore } = createMockPinia({ profile, aucation });
    const fetchSpy = vi.spyOn(aucationsStore, "asyncSetAucation").mockResolvedValue();
    const result = renderWithProviders(DetailPage, { pinia, router });
    await flush();
    return { ...result, aucationsStore, fetchSpy, router };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show loader when profile or aucation is missing", async () => {
    const { wrapper } = await setup({ aucation: null });
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-to-aucations-link"]').exists()).toBe(false);
  });

  it("should fetch aucation on mount using route param", async () => {
    const { fetchSpy } = await setup();
    expect(fetchSpy).toHaveBeenCalledWith("5");
  });

  it("should render aucation detail for owner with owner actions", async () => {
    const { wrapper } = await setup();

    expect(wrapper.text()).toContain("Laptop Gaming");
    expect(wrapper.find('[data-testid="detail-status"]').text()).toContain("Berlangsung");
    expect(wrapper.find('[data-testid="detail-start-bid"]').text()).toContain("5.000.000");
    expect(wrapper.find('[data-testid="detail-highest-bid"]').text()).toContain("6.000.000");
    expect(wrapper.find('[data-testid="detail-countdown"]').text()).toMatch(/h|j|m/);
    expect(wrapper.find('img[alt="Laptop Gaming"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="markdown-viewer"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="owner-actions"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="bid-actions"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="bid-item-0"]').text()).toContain("Peserta");
    expect(wrapper.find('[data-testid="bid-item-1"]').text()).toContain("Lain");
  });

  it("should render closed aucation without cover, description, or bids", async () => {
    const { wrapper } = await setup({
      aucation: {
        id: 5,
        user_id: 1,
        title: "Kosong",
        description: "",
        start_bid: 1000,
        closed_at: past,
        cover: null,
      },
    });

    expect(wrapper.find('[data-testid="detail-status"]').text()).toContain("Ditutup");
    expect(wrapper.find('[data-testid="detail-highest-bid"]').text()).toBe("Belum ada");
    expect(wrapper.find('[data-testid="markdown-viewer"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Tidak ada deskripsi rinci");
    expect(wrapper.find('[data-testid="bid-history-empty"]').exists()).toBe(true);
    expect(wrapper.find("img").exists()).toBe(false);
  });

  it("should render bids without id using index key", async () => {
    const { wrapper } = await setup({
      aucation: { ...baseAucation, bids: [{ bid: 6000000, user_id: 2 }] },
    });
    expect(wrapper.find('[data-testid="bid-item-0"]').exists()).toBe(true);
  });

  it("should show bid actions for a participant and hide owner actions", async () => {
    const { wrapper } = await setup({ profile: { id: 9, name: "Baru" } });

    expect(wrapper.find('[data-testid="owner-actions"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="bid-actions"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="open-bid-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="cancel-bid-btn"]').exists()).toBe(false);
  });

  it("should hide bid actions on closed aucation", async () => {
    const { wrapper } = await setup({
      profile: { id: 9, name: "Baru" },
      aucation: { ...baseAucation, closed_at: past },
    });
    expect(wrapper.find('[data-testid="bid-actions"]').exists()).toBe(false);
  });

  it("should open and close the bid modal", async () => {
    const { wrapper } = await setup({ profile: { id: 9, name: "Baru" } });

    await wrapper.find('[data-testid="open-bid-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="bid-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-bid-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="bid-modal"]').exists()).toBe(false);
  });

  it("should open cover modal and edit modal for owner", async () => {
    const { wrapper } = await setup();

    await wrapper.find('[data-testid="edit-cover-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-cover-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="edit-detail-aucation-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-aucation-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-aucation-modal"]').exists()).toBe(false);
  });

  it("should delete aucation only after confirmation", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, aucationsStore } = await setup();
    const deleteSpy = vi
      .spyOn(aucationsStore, "asyncSetIsAucationDelete")
      .mockResolvedValue();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find('[data-testid="delete-detail-aucation-btn"]').trigger("click");
    await flush();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find('[data-testid="delete-detail-aucation-btn"]').trigger("click");
    await flush();
    expect(deleteSpy).toHaveBeenCalledWith(5);
  });

  it("should cancel own bid only after confirmation", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, aucationsStore } = await setup({ profile: bidder });
    const cancelSpy = vi.spyOn(aucationsStore, "asyncSetIsBidDelete").mockResolvedValue();

    expect(wrapper.find('[data-testid="cancel-bid-btn"]').exists()).toBe(true);

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false });
    await wrapper.find('[data-testid="cancel-bid-btn"]').trigger("click");
    await flush();
    expect(cancelSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true });
    await wrapper.find('[data-testid="cancel-bid-btn"]').trigger("click");
    await flush();
    expect(cancelSpy).toHaveBeenCalledWith(5);
  });

  it("should redirect home when aucation is not found", async () => {
    const { aucationsStore } = await setup();

    aucationsStore.setAucation(null);
    aucationsStore.setIsAucation(true);
    await flush();

    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(aucationsStore.isAucation).toBe(false);
  });

  it("should stay when aucation is found after loading", async () => {
    const { aucationsStore } = await setup();

    aucationsStore.setIsAucation(true);
    await flush();

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(aucationsStore.isAucation).toBe(false);
  });

  it("should redirect home after aucation deleted", async () => {
    const { aucationsStore } = await setup();

    aucationsStore.setIsAucationDeleted(true);
    await flush();
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(aucationsStore.isAucationDeleted).toBe(false);

    mockRouter.push.mockClear();
    aucationsStore.setIsAucationDeleted(false);
    await flush();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should refetch aucation after own bid deleted", async () => {
    const { aucationsStore, fetchSpy } = await setup({ profile: bidder });
    fetchSpy.mockClear();

    aucationsStore.setIsBidDeleted(true);
    await flush();
    expect(fetchSpy).toHaveBeenCalledWith("5");
    expect(aucationsStore.isBidDeleted).toBe(false);

    fetchSpy.mockClear();
    aucationsStore.setIsBidDeleted(false);
    await flush();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should refetch when route param changes", async () => {
    const { router, fetchSpy } = await setup();
    fetchSpy.mockClear();

    await router.push("/aucations/8");
    await flush();

    expect(fetchSpy).toHaveBeenCalledWith("8");
  });

  it("should tick the countdown timer and clear it on unmount", async () => {
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { wrapper } = await setup();

    const tick = intervalSpy.mock.calls.find((call) => call[1] === 1000)[0];
    tick();
    await wrapper.vm.$nextTick();

    wrapper.unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("should treat a missing profile when computing ownership", async () => {
    const { wrapper, usersStore } = await setup({ profile: bidder });

    usersStore.setProfile(null);
    await flush();

    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });
});
