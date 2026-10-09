import { describe, it, expect, vi, beforeEach } from "vitest";
import aucationApi from "./aucationApi";
import apiHelper from "../../../helpers/apiHelper";

function mockResponse(body) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  });
}

describe("aucationApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAucations", () => {
    it("should fetch aucations without filter", async () => {
      const spy = mockResponse({
        success: true,
        data: { aucations: [{ id: 1 }] },
      });

      const res = await aucationApi.getAucations();

      expect(res).toEqual([{ id: 1 }]);
      expect(spy).toHaveBeenCalledWith(expect.stringMatching(/\/aucations\/$/), {
        method: "GET",
      });
    });

    it("should send is_me and is_closed filters", async () => {
      const spy = mockResponse({
        status: "success",
        data: { aucations: [] },
      });

      await aucationApi.getAucations({ isMe: 1, isClosed: 0 });

      expect(spy.mock.calls[0][0]).toContain("/aucations/?is_me=1&is_closed=0");
    });

    it("should send only is_closed filter", async () => {
      const spy = mockResponse({ success: true, data: { aucations: [] } });

      await aucationApi.getAucations({ isClosed: 1 });

      expect(spy.mock.calls[0][0]).toContain("/aucations/?is_closed=1");
      expect(spy.mock.calls[0][0]).not.toContain("is_me");
    });

    it("should ignore null and undefined filters", async () => {
      const spy = mockResponse({ success: true, data: { aucations: [] } });

      await aucationApi.getAucations({ isMe: null, isClosed: undefined });

      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/$/);
    });

    it("should return empty array when data is missing", async () => {
      mockResponse({ success: true });
      expect(await aucationApi.getAucations()).toEqual([]);
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Tidak diizinkan" });
      await expect(aucationApi.getAucations()).rejects.toThrow("Tidak diizinkan");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(aucationApi.getAucations()).rejects.toThrow(
        "Gagal mengambil data lelang"
      );
    });
  });

  describe("getAucationById", () => {
    it("should return aucation detail", async () => {
      const spy = mockResponse({
        success: true,
        data: { aucation: { id: 5, title: "Lukisan" } },
      });

      const res = await aucationApi.getAucationById(5);

      expect(res).toEqual({ id: 5, title: "Lukisan" });
      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/5$/);
    });

    it("should return undefined when data is missing", async () => {
      mockResponse({ success: true });
      expect(await aucationApi.getAucationById(5)).toBeUndefined();
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Lelang tidak ada" });
      await expect(aucationApi.getAucationById(5)).rejects.toThrow("Lelang tidak ada");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(aucationApi.getAucationById(5)).rejects.toThrow(
        "Gagal mengambil detail lelang"
      );
    });
  });

  describe("postAucation", () => {
    it("should create aucation and return data", async () => {
      const spy = mockResponse({ success: true, data: { aucation_id: 9 } });

      const res = await aucationApi.postAucation(
        "Jam",
        "Jam antik",
        "50000",
        "2026-12-31 10:00:00"
      );

      expect(res).toEqual({ aucation_id: 9 });
      expect(spy.mock.calls[0][1]).toEqual({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Jam",
          description: "Jam antik",
          start_bid: 50000,
          closed_at: "2026-12-31 10:00:00",
        }),
      });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Data tidak valid" });
      await expect(aucationApi.postAucation("", "", 0, "")).rejects.toThrow(
        "Data tidak valid"
      );
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(aucationApi.postAucation("", "", 0, "")).rejects.toThrow(
        "Gagal menambahkan lelang"
      );
    });
  });

  describe("putAucation", () => {
    it("should update aucation and return message", async () => {
      const spy = mockResponse({ success: true, message: "Berhasil diubah" });

      const res = await aucationApi.putAucation(
        3,
        "Judul",
        "Desk",
        "1000",
        "2026-12-31 10:00:00"
      );

      expect(res).toBe("Berhasil diubah");
      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/3$/);
      expect(spy.mock.calls[0][1].method).toBe("PUT");
      expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
        title: "Judul",
        description: "Desk",
        start_bid: 1000,
        closed_at: "2026-12-31 10:00:00",
      });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Gagal total" });
      await expect(aucationApi.putAucation(3, "a", "b", 1, "c")).rejects.toThrow(
        "Gagal total"
      );
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(aucationApi.putAucation(3, "a", "b", 1, "c")).rejects.toThrow(
        "Gagal mengubah lelang"
      );
    });
  });

  describe("postAucationCover", () => {
    it("should upload cover with FormData", async () => {
      const spy = mockResponse({ success: true, message: "Cover diubah" });
      const file = new File(["x"], "cover.png", { type: "image/png" });

      const res = await aucationApi.postAucationCover(2, file);

      expect(res).toBe("Cover diubah");
      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/2\/cover$/);
      expect(spy.mock.calls[0][1].method).toBe("POST");
      expect(spy.mock.calls[0][1].body.get("cover").name).toBe("cover.png");
    });

    it("should use default file name when file has no name", async () => {
      const spy = mockResponse({ success: true, message: "OK" });
      const blob = new Blob(["x"], { type: "image/jpeg" });

      await aucationApi.postAucationCover(2, blob);

      expect(spy.mock.calls[0][1].body.get("cover").name).toBe("cover.jpg");
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Format salah" });
      await expect(
        aucationApi.postAucationCover(2, new File(["x"], "a.png"))
      ).rejects.toThrow("Format salah");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(
        aucationApi.postAucationCover(2, new File(["x"], "a.png"))
      ).rejects.toThrow("Gagal mengubah cover");
    });
  });

  describe("deleteAucation", () => {
    it("should delete aucation", async () => {
      const spy = mockResponse({ success: true, message: "Terhapus" });

      expect(await aucationApi.deleteAucation(4)).toBe("Terhapus");
      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/4$/);
      expect(spy.mock.calls[0][1]).toEqual({ method: "DELETE" });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Ditolak" });
      await expect(aucationApi.deleteAucation(4)).rejects.toThrow("Ditolak");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(aucationApi.deleteAucation(4)).rejects.toThrow(
        "Gagal menghapus lelang"
      );
    });
  });

  describe("postBid", () => {
    it("should submit a bid", async () => {
      const spy = mockResponse({ success: true, message: "Bid diterima" });

      expect(await aucationApi.postBid(7, "75000")).toBe("Bid diterima");
      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/7\/bids$/);
      expect(spy.mock.calls[0][1].method).toBe("POST");
      expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({ bid: 75000 });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Bid terlalu rendah" });
      await expect(aucationApi.postBid(7, 1)).rejects.toThrow("Bid terlalu rendah");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(aucationApi.postBid(7, 1)).rejects.toThrow(
        "Gagal mengajukan penawaran"
      );
    });
  });

  describe("deleteBid", () => {
    it("should delete a bid", async () => {
      const spy = mockResponse({ success: true, message: "Bid dibatalkan" });

      expect(await aucationApi.deleteBid(7)).toBe("Bid dibatalkan");
      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/7\/bids$/);
      expect(spy.mock.calls[0][1]).toEqual({ method: "DELETE" });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Tidak bisa" });
      await expect(aucationApi.deleteBid(7)).rejects.toThrow("Tidak bisa");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(aucationApi.deleteBid(7)).rejects.toThrow(
        "Gagal membatalkan penawaran"
      );
    });
  });

  describe("deleteAllAucations", () => {
    it("should delete all aucations", async () => {
      const spy = mockResponse({ success: true, message: "Semua terhapus" });

      expect(await aucationApi.deleteAllAucations()).toBe("Semua terhapus");
      expect(spy.mock.calls[0][0]).toMatch(/\/aucations\/$/);
      expect(spy.mock.calls[0][1]).toEqual({ method: "DELETE" });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Ditolak" });
      await expect(aucationApi.deleteAllAucations()).rejects.toThrow("Ditolak");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(aucationApi.deleteAllAucations()).rejects.toThrow(
        "Gagal menghapus seluruh lelang"
      );
    });
  });
});
