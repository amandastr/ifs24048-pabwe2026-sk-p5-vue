import { describe, it, expect, vi, beforeEach } from "vitest";
import BidModal from "./BidModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("BidModal", () => {
  const noBidAucation = { id: 1, title: "Lukisan", start_bid: 100000, bids: [] };
  const withBidAucation = {
    id: 2,
    title: "Jam",
    start_bid: 100000,
    bids: [{ id: 1, bid: 150000 }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false or aucation is missing", () => {
    const first = renderWithProviders(BidModal, {
      props: { show: false, aucation: noBidAucation },
    });
    expect(first.wrapper.find('[data-testid="bid-modal"]').exists()).toBe(false);

    const second = renderWithProviders(BidModal, {
      props: { show: true, aucation: null },
    });
    expect(second.wrapper.find('[data-testid="bid-modal"]').exists()).toBe(false);
  });

  it("should show aucation info and first-bid hint", () => {
    const { wrapper } = renderWithProviders(BidModal, {
      props: { show: true, aucation: noBidAucation },
    });

    expect(wrapper.find('[data-testid="bid-aucation-title"]').text()).toBe("Lukisan");
    expect(wrapper.find('[data-testid="bid-start-bid"]').text()).toContain("100.000");
    expect(wrapper.find('[data-testid="bid-hint"]').text()).toContain("minimal");
  });

  it("should show highest bid hint when bids exist", () => {
    const { wrapper } = renderWithProviders(BidModal, {
      props: { show: true, aucation: withBidAucation },
    });

    expect(wrapper.find('[data-testid="bid-highest-bid"]').text()).toContain("150.000");
    expect(wrapper.find('[data-testid="bid-hint"]').text()).toContain("lebih tinggi");
  });

  it("should handle hint when aucation is not provided at render time", async () => {
    const { wrapper } = renderWithProviders(BidModal, {
      props: { show: false, aucation: null },
    });

    await wrapper.setProps({ show: true });
    expect(wrapper.find('[data-testid="bid-modal"]').exists()).toBe(false);
  });

  it("should validate bid amount", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const first = renderWithProviders(BidModal, {
      props: { show: true, aucation: noBidAucation },
    });
    const addSpy = vi.spyOn(first.aucationsStore, "asyncSetIsBidAdd");

    const input1 = first.wrapper.find('[data-testid="bid-amount-input"]');
    await input1.setValue("0");
    await first.wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Nominal penawaran harus lebih dari 0");

    await input1.setValue("50000");
    await first.wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Penawaran pertama minimal")
    );

    const second = renderWithProviders(BidModal, {
      props: { show: true, aucation: withBidAucation },
    });
    await second.wrapper.find('[data-testid="bid-amount-input"]').setValue("150000");
    await second.wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("lebih tinggi dari penawaran tertinggi")
    );

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should submit first bid equal to start bid and close on success", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(BidModal, {
      props: { show: true, aucation: noBidAucation },
    });
    const addSpy = vi.spyOn(aucationsStore, "asyncSetIsBidAdd").mockReturnValue(Promise.resolve());
    const fetchSpy = vi
      .spyOn(aucationsStore, "asyncSetAucation")
      .mockReturnValue(Promise.resolve());

    await wrapper.find('[data-testid="bid-amount-input"]').setValue("100000");
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith(1, 100000);

    aucationsStore.setIsBidAdd(true);
    aucationsStore.setIsBidAdded(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(fetchSpy).toHaveBeenCalledWith(1);
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should submit bid higher than current highest bid", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(BidModal, {
      props: { show: true, aucation: withBidAucation },
    });
    const addSpy = vi.spyOn(aucationsStore, "asyncSetIsBidAdd").mockReturnValue(Promise.resolve());

    await wrapper.find('[data-testid="bid-amount-input"]').setValue("200000");
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith(2, 200000);
  });

  it("should keep modal open when bid failed", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(BidModal, {
      props: { show: true, aucation: noBidAucation },
    });

    aucationsStore.setIsBidAdd(true);
    aucationsStore.setIsBidAdded(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeFalsy();
  });

  it("should reset input and lock scroll when opened, unlock when closed", async () => {
    const { wrapper } = renderWithProviders(BidModal, {
      props: { show: false, aucation: noBidAucation },
    });

    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");
    expect(wrapper.find('[data-testid="bid-amount-input"]').element.value).toBe("");

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should close when close or cancel button clicked", async () => {
    const { wrapper } = renderWithProviders(BidModal, {
      props: { show: true, aucation: noBidAucation },
    });

    await wrapper.find('[data-testid="close-bid-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    await wrapper.find('[data-testid="cancel-bid-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
