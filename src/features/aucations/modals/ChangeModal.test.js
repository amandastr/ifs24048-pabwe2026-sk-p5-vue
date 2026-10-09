import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("ChangeModal", () => {
  const mockAucation = {
    id: 1,
    title: "Initial Title",
    description: "Initial Desc",
    start_bid: 100000,
    closed_at: "2026-12-31 10:00:00",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: false, aucationId: 1 },
    });
    expect(wrapper.find('[data-testid="edit-aucation-modal"]').exists()).toBe(false);
  });

  it("should populate inputs with aucation data", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, aucationId: 1 },
      preloadedState: { aucation: mockAucation },
    });

    expect(wrapper.find('[data-testid="edit-aucation-title-input"]').element.value).toBe(
      "Initial Title"
    );
    expect(
      wrapper.find('[data-testid="edit-aucation-description-input"]').element.value
    ).toBe("Initial Desc");
    expect(wrapper.find('[data-testid="edit-aucation-start-bid-input"]').element.value).toBe(
      "100000"
    );
    expect(wrapper.find('[data-testid="edit-aucation-closed-at-input"]').element.value).toBe(
      "2026-12-31T10:00"
    );
  });

  it("should handle empty fields in aucation object", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, aucationId: 1 },
      preloadedState: {
        aucation: { id: 1, title: null, description: null, start_bid: null, closed_at: null },
      },
    });

    expect(wrapper.find('[data-testid="edit-aucation-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="edit-aucation-start-bid-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="edit-aucation-closed-at-input"]').element.value).toBe("");
  });

  it("should fetch aucation when aucationId or show changes", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(ChangeModal, {
      props: { show: false, aucationId: null },
    });
    const fetchSpy = vi
      .spyOn(aucationsStore, "asyncSetAucation")
      .mockReturnValue(Promise.resolve());

    await wrapper.setProps({ show: true });
    expect(fetchSpy).not.toHaveBeenCalled();

    await wrapper.setProps({ aucationId: 5 });
    expect(fetchSpy).toHaveBeenCalledWith(5);

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should lock body scroll when opened", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: false, aucationId: null },
    });

    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should validate title, description, start bid, and closing time", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, aucationId: 1 },
      preloadedState: { aucation: mockAucation },
    });

    const form = wrapper.find("form");
    const titleInput = wrapper.find('[data-testid="edit-aucation-title-input"]');
    const descInput = wrapper.find('[data-testid="edit-aucation-description-input"]');
    const bidInput = wrapper.find('[data-testid="edit-aucation-start-bid-input"]');
    const closedInput = wrapper.find('[data-testid="edit-aucation-closed-at-input"]');

    await titleInput.setValue("   ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await titleInput.setValue("Valid Title");
    await descInput.setValue("   ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");

    await descInput.setValue("Valid Desc");
    await bidInput.setValue("0");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Harga awal harus lebih dari 0");

    await bidInput.setValue("2000");
    await closedInput.setValue("");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Batas waktu penutupan tidak boleh kosong");
  });

  it("should dispatch asyncSetIsAucationChange and close on success", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(ChangeModal, {
      props: { show: true, aucationId: 1 },
      preloadedState: { aucation: mockAucation },
    });
    const changeSpy = vi
      .spyOn(aucationsStore, "asyncSetIsAucationChange")
      .mockReturnValue(Promise.resolve());
    const listSpy = vi
      .spyOn(aucationsStore, "asyncSetAucations")
      .mockReturnValue(Promise.resolve());

    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(
      1,
      "Initial Title",
      "Initial Desc",
      100000,
      "2026-12-31 10:00:00"
    );

    aucationsStore.setIsAucationChange(true);
    aucationsStore.setIsAucationChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(listSpy).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should keep modal open when change failed", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(ChangeModal, {
      props: { show: true, aucationId: 1 },
      preloadedState: { aucation: mockAucation },
    });

    aucationsStore.setIsAucationChange(true);
    aucationsStore.setIsAucationChanged(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeFalsy();
    expect(wrapper.find('[data-testid="edit-aucation-title-input"]').exists()).toBe(true);
  });

  it("should trigger onClose on cancel or close button click", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, aucationId: 1 },
      preloadedState: { aucation: mockAucation },
    });

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    await wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
