import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAucationsStore } from "./aucationsStore";
import aucationApi from "../api/aucationApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("aucationsStore", () => {
  let successSpy;
  let errorSpy;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    successSpy = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => {});
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should have correct default state", () => {
    const store = useAucationsStore();
    expect(store.aucations).toEqual([]);
    expect(store.aucation).toBeNull();
    [
      "isAucation",
      "isAucationAdd",
      "isAucationAdded",
      "isAucationChange",
      "isAucationChanged",
      "isAucationChangeCover",
      "isAucationChangedCover",
      "isAucationDelete",
      "isAucationDeleted",
      "isBidAdd",
      "isBidAdded",
      "isBidDelete",
      "isBidDeleted",
      "isAucationDeleteAll",
      "isAucationDeletedAll",
    ].forEach((key) => expect(store[key]).toBe(false));
  });

  it("should update state with setters", () => {
    const store = useAucationsStore();
    store.setAucations([{ id: 1 }]);
    expect(store.aucations).toEqual([{ id: 1 }]);
    store.setAucation({ id: 1 });
    expect(store.aucation).toEqual({ id: 1 });

    const setters = {
      setIsAucation: "isAucation",
      setIsAucationAdd: "isAucationAdd",
      setIsAucationAdded: "isAucationAdded",
      setIsAucationChange: "isAucationChange",
      setIsAucationChanged: "isAucationChanged",
      setIsAucationChangeCover: "isAucationChangeCover",
      setIsAucationChangedCover: "isAucationChangedCover",
      setIsAucationDelete: "isAucationDelete",
      setIsAucationDeleted: "isAucationDeleted",
      setIsBidAdd: "isBidAdd",
      setIsBidAdded: "isBidAdded",
      setIsBidDelete: "isBidDelete",
      setIsBidDeleted: "isBidDeleted",
      setIsAucationDeleteAll: "isAucationDeleteAll",
      setIsAucationDeletedAll: "isAucationDeletedAll",
    };
    Object.entries(setters).forEach(([setter, key]) => {
      store[setter](true);
      expect(store[key]).toBe(true);
    });
  });

  describe("asyncSetAucations", () => {
    it("should set aucations on success", async () => {
      const store = useAucationsStore();
      const spy = vi.spyOn(aucationApi, "getAucations").mockResolvedValue([{ id: 1 }]);

      await store.asyncSetAucations({ isMe: 1 });

      expect(spy).toHaveBeenCalledWith({ isMe: 1 });
      expect(store.aucations).toEqual([{ id: 1 }]);
    });

    it("should use empty filters by default and set empty array on error", async () => {
      const store = useAucationsStore();
      const spy = vi.spyOn(aucationApi, "getAucations").mockRejectedValue(new Error("x"));

      await store.asyncSetAucations();

      expect(spy).toHaveBeenCalledWith({});
      expect(store.aucations).toEqual([]);
    });
  });

  describe("asyncSetAucation", () => {
    it("should set aucation on success", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "getAucationById").mockResolvedValue({ id: 2 });

      await store.asyncSetAucation(2);

      expect(store.aucation).toEqual({ id: 2 });
      expect(store.isAucation).toBe(true);
    });

    it("should set null on error", async () => {
      const store = useAucationsStore();
      store.setAucation({ id: 1 });
      vi.spyOn(aucationApi, "getAucationById").mockRejectedValue(new Error("x"));

      await store.asyncSetAucation(2);

      expect(store.aucation).toBeNull();
      expect(store.isAucation).toBe(true);
    });
  });

  describe("asyncSetIsAucationAdd", () => {
    it("should flag added on success", async () => {
      const store = useAucationsStore();
      const spy = vi.spyOn(aucationApi, "postAucation").mockResolvedValue({});

      await store.asyncSetIsAucationAdd("T", "D", 1000, "2026-12-31 10:00:00");

      expect(spy).toHaveBeenCalledWith("T", "D", 1000, "2026-12-31 10:00:00");
      expect(successSpy).toHaveBeenCalledWith("Lelang berhasil ditambahkan!");
      expect(store.isAucationAdded).toBe(true);
      expect(store.isAucationAdd).toBe(true);
    });

    it("should show error on failure", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "postAucation").mockRejectedValue(new Error("Gagal"));

      await store.asyncSetIsAucationAdd("T", "D", 1, "x");

      expect(errorSpy).toHaveBeenCalledWith("Gagal");
      expect(store.isAucationAdded).toBe(false);
      expect(store.isAucationAdd).toBe(true);
    });
  });

  describe("asyncSetIsAucationChange", () => {
    it("should use API message on success", async () => {
      const store = useAucationsStore();
      const spy = vi.spyOn(aucationApi, "putAucation").mockResolvedValue("Diubah");

      await store.asyncSetIsAucationChange(1, "T", "D", 10, "x");

      expect(spy).toHaveBeenCalledWith(1, "T", "D", 10, "x");
      expect(successSpy).toHaveBeenCalledWith("Diubah");
      expect(store.isAucationChanged).toBe(true);
      expect(store.isAucationChange).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "putAucation").mockResolvedValue(undefined);

      await store.asyncSetIsAucationChange(1, "T", "D", 10, "x");

      expect(successSpy).toHaveBeenCalledWith("Lelang berhasil diperbarui!");
    });

    it("should show error on failure", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "putAucation").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsAucationChange(1, "T", "D", 10, "x");

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isAucationChanged).toBe(false);
      expect(store.isAucationChange).toBe(true);
    });
  });

  describe("asyncSetIsAucationChangeCover", () => {
    it("should use API message on success", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "postAucationCover").mockResolvedValue("Cover OK");

      await store.asyncSetIsAucationChangeCover(1, new File(["x"], "a.png"));

      expect(successSpy).toHaveBeenCalledWith("Cover OK");
      expect(store.isAucationChangedCover).toBe(true);
      expect(store.isAucationChangeCover).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "postAucationCover").mockResolvedValue("");

      await store.asyncSetIsAucationChangeCover(1, new File(["x"], "a.png"));

      expect(successSpy).toHaveBeenCalledWith("Cover berhasil diperbarui!");
    });

    it("should show error on failure", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "postAucationCover").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsAucationChangeCover(1, new File(["x"], "a.png"));

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isAucationChangedCover).toBe(false);
      expect(store.isAucationChangeCover).toBe(true);
    });
  });

  describe("asyncSetIsAucationDelete", () => {
    it("should use API message on success", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteAucation").mockResolvedValue("Dihapus");

      await store.asyncSetIsAucationDelete(1);

      expect(successSpy).toHaveBeenCalledWith("Dihapus");
      expect(store.isAucationDeleted).toBe(true);
      expect(store.isAucationDelete).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteAucation").mockResolvedValue(null);

      await store.asyncSetIsAucationDelete(1);

      expect(successSpy).toHaveBeenCalledWith("Lelang berhasil dihapus!");
    });

    it("should show error on failure", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteAucation").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsAucationDelete(1);

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isAucationDeleted).toBe(false);
      expect(store.isAucationDelete).toBe(true);
    });
  });

  describe("asyncSetIsBidAdd", () => {
    it("should use API message on success", async () => {
      const store = useAucationsStore();
      const spy = vi.spyOn(aucationApi, "postBid").mockResolvedValue("Bid OK");

      await store.asyncSetIsBidAdd(1, 5000);

      expect(spy).toHaveBeenCalledWith(1, 5000);
      expect(successSpy).toHaveBeenCalledWith("Bid OK");
      expect(store.isBidAdded).toBe(true);
      expect(store.isBidAdd).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "postBid").mockResolvedValue(undefined);

      await store.asyncSetIsBidAdd(1, 5000);

      expect(successSpy).toHaveBeenCalledWith("Penawaran berhasil diajukan!");
    });

    it("should show error on failure", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "postBid").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsBidAdd(1, 5000);

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isBidAdded).toBe(false);
      expect(store.isBidAdd).toBe(true);
    });
  });

  describe("asyncSetIsBidDelete", () => {
    it("should use API message on success", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteBid").mockResolvedValue("Dibatalkan");

      await store.asyncSetIsBidDelete(1);

      expect(successSpy).toHaveBeenCalledWith("Dibatalkan");
      expect(store.isBidDeleted).toBe(true);
      expect(store.isBidDelete).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteBid").mockResolvedValue(undefined);

      await store.asyncSetIsBidDelete(1);

      expect(successSpy).toHaveBeenCalledWith("Penawaran berhasil dibatalkan!");
    });

    it("should show error on failure", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteBid").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsBidDelete(1);

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isBidDeleted).toBe(false);
      expect(store.isBidDelete).toBe(true);
    });
  });

  describe("asyncSetIsAucationDeleteAll", () => {
    it("should use API message on success", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteAllAucations").mockResolvedValue("Semua dihapus");

      await store.asyncSetIsAucationDeleteAll();

      expect(successSpy).toHaveBeenCalledWith("Semua dihapus");
      expect(store.isAucationDeletedAll).toBe(true);
      expect(store.isAucationDeleteAll).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteAllAucations").mockResolvedValue(undefined);

      await store.asyncSetIsAucationDeleteAll();

      expect(successSpy).toHaveBeenCalledWith("Seluruh lelang berhasil dihapus!");
    });

    it("should show error on failure", async () => {
      const store = useAucationsStore();
      vi.spyOn(aucationApi, "deleteAllAucations").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsAucationDeleteAll();

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isAucationDeletedAll).toBe(false);
      expect(store.isAucationDeleteAll).toBe(true);
    });
  });
});
