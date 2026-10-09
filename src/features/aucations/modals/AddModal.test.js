import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

async function fillForm(wrapper, { title, desc, startBid, closedAt } = {}) {
  if (title !== undefined) {
    await wrapper.find('[data-testid="add-aucation-title-input"]').setValue(title);
  }
  if (desc !== undefined) {
    await wrapper.find('[data-testid="add-aucation-description-input"]').setValue(desc);
  }
  if (startBid !== undefined) {
    await wrapper.find('[data-testid="add-aucation-start-bid-input"]').setValue(startBid);
  }
  if (closedAt !== undefined) {
    await wrapper.find('[data-testid="add-aucation-closed-at-input"]').setValue(closedAt);
  }
}

describe("AddModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: false },
    });
    expect(wrapper.find('[data-testid="add-aucation-modal"]').exists()).toBe(false);
  });

  it("should lock and unlock body scroll when show changes", async () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: false },
    });

    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should validate title, description, start bid, and closing time", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper, aucationsStore } = renderWithProviders(AddModal, {
      props: { show: true },
    });
    const addSpy = vi.spyOn(aucationsStore, "asyncSetIsAucationAdd");
    const form = wrapper.find("form");

    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await fillForm(wrapper, { title: "Jam Tangan" });
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");

    await fillForm(wrapper, { desc: "Jam antik" });
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Harga awal harus lebih dari 0");

    await fillForm(wrapper, { startBid: "0" });
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledTimes(4);

    await fillForm(wrapper, { startBid: "50000" });
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Batas waktu penutupan tidak boleh kosong");
    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should dispatch asyncSetIsAucationAdd and close on successful add", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(AddModal, {
      props: { show: true },
    });
    const addSpy = vi
      .spyOn(aucationsStore, "asyncSetIsAucationAdd")
      .mockReturnValue(Promise.resolve());
    const listSpy = vi
      .spyOn(aucationsStore, "asyncSetAucations")
      .mockReturnValue(Promise.resolve());

    await fillForm(wrapper, {
      title: "  Jam Tangan  ",
      desc: "Jam antik",
      startBid: "50000",
      closedAt: "2026-12-31T10:00",
    });
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith(
      "Jam Tangan",
      "Jam antik",
      50000,
      "2026-12-31 10:00:00"
    );

    aucationsStore.setIsAucationAdd(true);
    aucationsStore.setIsAucationAdded(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(listSpy).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toBeTruthy();
    expect(wrapper.find('[data-testid="add-aucation-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="add-aucation-start-bid-input"]').element.value).toBe("");
  });

  it("should keep modal open when add failed", async () => {
    const { wrapper, aucationsStore } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    aucationsStore.setIsAucationAdd(true);
    aucationsStore.setIsAucationAdded(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeFalsy();
    expect(wrapper.find('[data-testid="add-aucation-modal"]').exists()).toBe(true);
  });

  it("should close modal when close or cancel button clicked", async () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
