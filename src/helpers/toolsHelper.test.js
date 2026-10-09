import { describe, it, expect, vi } from "vitest";
import Swal from "sweetalert2";
import {
  showErrorDialog,
  showWarningDialog,
  showSuccessDialog,
  showConfirmDialog,
  formatDate,
  formatRupiah,
  getBidAmount,
  getBidderName,
  getHighestBid,
  isAucationClosed,
  formatRemaining,
  toDateTimeLocal,
  toApiDateTime,
} from "./toolsHelper";

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
    close: vi.fn(),
  },
}));

describe("toolsHelper", () => {
  it("should call Swal.fire for showErrorDialog and handle confirmation", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    await showErrorDialog("Error test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Terjadi Kesalahan",
        text: "Error test",
        icon: "error",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    // Not confirmed branch
    Swal.fire.mockResolvedValue({ isConfirmed: false });
    await showErrorDialog("Error test");
  });

  it("should call Swal.fire for showWarningDialog and handle confirmation", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    await showWarningDialog("Warning test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Peringatan",
        text: "Warning test",
        icon: "warning",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    Swal.fire.mockResolvedValue({ isConfirmed: false });
    await showWarningDialog("Warning test");
  });

  it("should call Swal.fire for showSuccessDialog and handle confirmation", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    await showSuccessDialog("Success test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Tindakan Berhasil",
        text: "Success test",
        icon: "success",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    Swal.fire.mockResolvedValue({ isConfirmed: false });
    await showSuccessDialog("Success test");
  });

  it("should call Swal.fire for showConfirmDialog", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });
    const res = await showConfirmDialog("Confirm test?");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Konfirmasi",
        text: "Confirm test?",
        icon: "question",
      })
    );
    expect(res.isConfirmed).toBe(true);
  });

  it("should format date correctly or return fallback for empty date", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    const formatted = formatDate("2024-02-26T02:34:26.000000Z");
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe("string");
  });
});

describe("toolsHelper - aucation helpers", () => {
  it("formatRupiah should format number and fallback to zero", () => {
    expect(formatRupiah(1500000).replace(/\s/g, " ")).toContain("1.500.000");
    expect(formatRupiah(1500000)).toContain("Rp");
    expect(formatRupiah("abc")).toContain("0");
    expect(formatRupiah(undefined)).toContain("0");
  });

  it("getBidAmount should read bid, amount, or fallback to zero", () => {
    expect(getBidAmount({ bid: "5000" })).toBe(5000);
    expect(getBidAmount({ amount: 7000 })).toBe(7000);
    expect(getBidAmount({ bid: "x" })).toBe(0);
    expect(getBidAmount({})).toBe(0);
    expect(getBidAmount(null)).toBe(0);
  });

  it("getBidderName should resolve the bidder name by priority", () => {
    expect(getBidderName({ user: { name: "Andi" } })).toBe("Andi");
    expect(getBidderName({ user_name: "Budi" })).toBe("Budi");
    expect(getBidderName({ name: "Citra" })).toBe("Citra");
    expect(getBidderName({})).toBe("Peserta");
    expect(getBidderName(undefined)).toBe("Peserta");
  });

  it("getHighestBid should compute from bids and highest_bid field", () => {
    expect(getHighestBid(null)).toBe(0);
    expect(getHighestBid({})).toBe(0);
    expect(getHighestBid({ bids: "invalid" })).toBe(0);
    expect(getHighestBid({ bids: [{ bid: 100 }, { bid: 300 }, { bid: 200 }] })).toBe(300);
    expect(getHighestBid({ highest_bid: 900, bids: [{ bid: 300 }] })).toBe(900);
    expect(getHighestBid({ highest_bid: "bad" })).toBe(0);
    expect(getHighestBid({ highest_bid: 500 })).toBe(500);
  });

  it("isAucationClosed should check flag and closing time", () => {
    const now = new Date("2026-06-01T00:00:00").getTime();
    expect(isAucationClosed(null, now)).toBe(false);
    expect(isAucationClosed({ is_closed: 1 }, now)).toBe(true);
    expect(isAucationClosed({ is_closed: true }, now)).toBe(true);
    expect(isAucationClosed({ is_closed: 0 }, now)).toBe(false);
    expect(isAucationClosed({ closed_at: "2026-05-01T00:00:00" }, now)).toBe(true);
    expect(isAucationClosed({ closed_at: "2026-07-01T00:00:00" }, now)).toBe(false);
    expect(isAucationClosed({ closed_at: "2026-07-01T00:00:00" })).toBe(
      new Date("2026-07-01T00:00:00").getTime() <= Date.now()
    );
  });

  it("formatRemaining should format countdown in several ranges", () => {
    const now = new Date("2026-06-01T00:00:00").getTime();
    expect(formatRemaining(null, now)).toBe("-");
    expect(formatRemaining("2026-05-01T00:00:00", now)).toBe("Lelang ditutup");
    expect(formatRemaining("invalid-date", now)).toBe("Lelang ditutup");
    expect(formatRemaining("2026-06-03T02:05:09", now)).toBe("2h 2j 5m");
    expect(formatRemaining("2026-06-01T03:04:05", now)).toBe("3j 4m 5d");
    expect(formatRemaining("2026-06-01T00:02:30", now)).toBe("2m 30d");
    expect(typeof formatRemaining("2999-01-01T00:00:00")).toBe("string");
  });

  it("toDateTimeLocal should convert values for datetime-local input", () => {
    expect(toDateTimeLocal("")).toBe("");
    expect(toDateTimeLocal(null)).toBe("");
    expect(toDateTimeLocal("not-a-date")).toBe("");
    expect(toDateTimeLocal("2026-03-05 08:09:10")).toBe("2026-03-05T08:09");
  });

  it("toApiDateTime should convert datetime-local values to API format", () => {
    expect(toApiDateTime("")).toBe("");
    expect(toApiDateTime(undefined)).toBe("");
    expect(toApiDateTime("2026-03-05T08:09")).toBe("2026-03-05 08:09:00");
    expect(toApiDateTime("2026-03-05T08:09:30")).toBe("2026-03-05 08:09:30");
  });
});
