import Swal from "sweetalert2";

export function showErrorDialog(message) {
  return Swal.fire({
    title: "Terjadi Kesalahan",
    text: message,
    icon: "error",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#ef4444",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
    }
    return result;
  });
}

export function showWarningDialog(message) {
  return Swal.fire({
    title: "Peringatan",
    text: message,
    icon: "warning",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#f59e0b",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
    }
    return result;
  });
}

export function showSuccessDialog(message) {
  return Swal.fire({
    title: "Tindakan Berhasil",
    text: message,
    icon: "success",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#10b981",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
    }
    return result;
  });
}

export function showConfirmDialog(message) {
  return Swal.fire({
    title: "Konfirmasi",
    text: message,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya",
    cancelButtonText: "Tidak",
    confirmButtonColor: "#6366f1",
    cancelButtonColor: "#94a3b8",
  });
}

export function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRupiah(value) {
  const number = Number(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(number) ? number : 0);
}

export function getBidAmount(bid) {
  return Number(bid?.bid ?? bid?.amount ?? 0) || 0;
}

export function getBidderName(bid) {
  return bid?.user?.name || bid?.user_name || bid?.name || "Peserta";
}

export function getHighestBid(aucation) {
  const bids = Array.isArray(aucation?.bids) ? aucation.bids : [];
  const fromBids = bids.reduce(
    (highest, bid) => Math.max(highest, getBidAmount(bid)),
    0
  );
  const fromField = Number(aucation?.highest_bid ?? 0) || 0;
  return Math.max(fromBids, fromField);
}

export function isAucationClosed(aucation, now = Date.now()) {
  if (Number(aucation?.is_closed) === 1 || aucation?.is_closed === true) {
    return true;
  }
  if (!aucation?.closed_at) return false;
  return new Date(aucation.closed_at).getTime() <= now;
}

export function formatRemaining(closedAt, now = Date.now()) {
  if (!closedAt) return "-";
  const diff = new Date(closedAt).getTime() - now;
  if (!(diff > 0)) return "Lelang ditutup";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}h ${hours}j ${minutes}m`;
  if (hours > 0) return `${hours}j ${minutes}m ${seconds}d`;
  return `${minutes}m ${seconds}d`;
}

export function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toApiDateTime(value) {
  if (!value) return "";
  const text = String(value).replace("T", " ");
  return text.length === 16 ? `${text}:00` : text;
}
