import apiHelper from "../../../helpers/apiHelper";

const aucationApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/aucations`;

  function _url(path) {
    return BASE_URL + path;
  }

  async function _request(path, options, fallbackMessage) {
    const response = await apiHelper.fetchData(_url(path), options);
    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  function _jsonOptions(method, payload) {
    return {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };
  }

  async function getAucations({ isMe = "", isClosed = "" } = {}) {
    const params = [];
    if (isMe !== "" && isMe !== null && isMe !== undefined) {
      params.push(`is_me=${isMe}`);
    }
    if (isClosed !== "" && isClosed !== null && isClosed !== undefined) {
      params.push(`is_closed=${isClosed}`);
    }
    const query = params.length > 0 ? `?${params.join("&")}` : "";

    const result = await _request(
      `/${query}`,
      { method: "GET" },
      "Gagal mengambil data lelang"
    );
    return result.data?.aucations || [];
  }

  async function getAucationById(aucationId) {
    const result = await _request(
      `/${aucationId}`,
      { method: "GET" },
      "Gagal mengambil detail lelang"
    );
    return result.data?.aucation;
  }

  async function postAucation(title, description, start_bid, closed_at) {
    const result = await _request(
      "/",
      _jsonOptions("POST", {
        title,
        description,
        start_bid: Number(start_bid),
        closed_at,
      }),
      "Gagal menambahkan lelang"
    );
    return result.data;
  }

  async function putAucation(
    aucationId,
    title,
    description,
    start_bid,
    closed_at
  ) {
    const result = await _request(
      `/${aucationId}`,
      _jsonOptions("PUT", {
        title,
        description,
        start_bid: Number(start_bid),
        closed_at,
      }),
      "Gagal mengubah lelang"
    );
    return result.message;
  }

  async function postAucationCover(aucationId, cover) {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const result = await _request(
      `/${aucationId}/cover`,
      { method: "POST", body: formData },
      "Gagal mengubah cover"
    );
    return result.message;
  }

  async function deleteAucation(aucationId) {
    const result = await _request(
      `/${aucationId}`,
      { method: "DELETE" },
      "Gagal menghapus lelang"
    );
    return result.message;
  }

  async function postBid(aucationId, bid) {
    const result = await _request(
      `/${aucationId}/bids`,
      _jsonOptions("POST", { bid: Number(bid) }),
      "Gagal mengajukan penawaran"
    );
    return result.message;
  }

  async function deleteBid(aucationId) {
    const result = await _request(
      `/${aucationId}/bids`,
      { method: "DELETE" },
      "Gagal membatalkan penawaran"
    );
    return result.message;
  }

  async function deleteAllAucations() {
    const result = await _request(
      "/",
      { method: "DELETE" },
      "Gagal menghapus seluruh lelang"
    );
    return result.message;
  }

  return {
    getAucations,
    getAucationById,
    postAucation,
    putAucation,
    postAucationCover,
    deleteAucation,
    postBid,
    deleteBid,
    deleteAllAucations,
  };
})();

export default aucationApi;
