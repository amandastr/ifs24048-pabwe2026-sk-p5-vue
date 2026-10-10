<template>
  <div v-if="!profile || !aucation" class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>

  <div v-else class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <!-- Back button & Action buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <RouterLink
        to="/"
        data-testid="back-to-aucations-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft :size="18" />
        Kembali ke Lelang
      </RouterLink>

      <div v-if="isOwner" data-testid="owner-actions" class="flex items-center gap-2">
        <button
          type="button"
          data-testid="edit-cover-btn"
          @click="showCoverModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
        >
          <ImagePlus :size="16" />
          Ubah Cover
        </button>
        <button
          type="button"
          data-testid="edit-detail-aucation-btn"
          @click="showEditModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
        >
          <Edit3 :size="16" />
          Ubah Data
        </button>
        <button
          type="button"
          data-testid="delete-detail-aucation-btn"
          @click="handleDelete"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
        >
          <Trash2 :size="16" />
          Hapus
        </button>
      </div>
    </div>

    <!-- Main Detail Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div v-if="aucation.cover" class="relative w-full h-64 sm:h-80 bg-slate-900 overflow-hidden">
        <img
          :src="aucation.cover"
          :alt="aucation.title"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-600">
              #{{ aucation.id }}
            </span>
            <span
              v-if="closed"
              data-testid="detail-status"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
            >
              <Lock :size="14" />
              Ditutup
            </span>
            <span
              v-else
              data-testid="detail-status"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <Timer :size="14" />
              Sedang Berlangsung
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ aucation.title }}
          </h1>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <div class="flex items-center gap-1.5">
              <Calendar :size="14" class="shrink-0" />
              <span>Dibuat: <strong class="text-slate-700">{{ formatDate(aucation.created_at) }}</strong></span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar :size="14" class="shrink-0" />
              <span>Ditutup: <strong class="text-slate-700">{{ formatDate(aucation.closed_at) }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Price summary -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">Harga Awal</p>
            <p data-testid="detail-start-bid" class="text-xl font-black text-slate-800 mt-1">
              {{ formatRupiah(aucation.start_bid) }}
            </p>
          </div>
          <div class="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-emerald-700">Penawaran Tertinggi</p>
            <p data-testid="detail-highest-bid" class="text-xl font-black text-emerald-700 mt-1">
              {{ highestBid > 0 ? formatRupiah(highestBid) : "Belum ada" }}
            </p>
          </div>
          <div class="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-indigo-700">Sisa Waktu</p>
            <p data-testid="detail-countdown" class="text-xl font-black text-indigo-700 mt-1">
              {{ formatRemaining(aucation.closed_at, now) }}
            </p>
          </div>
        </div>

        <!-- Bid actions -->
        <div v-if="!isOwner && !closed" data-testid="bid-actions" class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="open-bid-btn"
            @click="showBidModal = true"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/25 transition-all"
          >
            <HandCoins :size="18" />
            Ajukan Penawaran
          </button>
          <button
            v-if="myBid"
            type="button"
            data-testid="cancel-bid-btn"
            @click="handleCancelBid"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-xl transition-all"
          >
            <Undo2 :size="18" />
            Batalkan Penawaran Saya
          </button>
        </div>

        <div
          data-testid="aucation-detail-description"
          class="prose max-w-none text-slate-600 bg-slate-50/60 p-6 rounded-2xl border border-slate-100 leading-relaxed"
        >
          <MarkdownViewer v-if="aucation.description" :content="aucation.description" />
          <p v-else class="italic text-slate-600">Tidak ada deskripsi rinci untuk lelang ini.</p>
        </div>

        <!-- Bid history -->
        <div class="space-y-3">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History :size="20" class="text-indigo-600" />
            Riwayat Penawaran
          </h2>

          <div
            v-if="bids.length === 0"
            data-testid="bid-history-empty"
            class="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-600"
          >
            Belum ada penawaran untuk lelang ini.
          </div>

          <ul v-else data-testid="bid-history" class="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
            <li
              v-for="(bid, index) in bids"
              :key="`bid-${bid.id ?? index}`"
              :data-testid="`bid-item-${index}`"
              class="flex items-center justify-between px-4 py-3 bg-white"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {{ getBidderName(bid).charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">{{ getBidderName(bid) }}</p>
                  <p class="text-xs text-slate-600">{{ formatDate(bid.created_at) }}</p>
                </div>
              </div>
              <p class="text-sm font-bold text-emerald-700">{{ formatRupiah(getBidAmount(bid)) }}</p>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Cover Modal -->
    <ChangeCoverModal
      :show="showCoverModal"
      :aucation="aucation"
      @close="showCoverModal = false"
    />

    <!-- Edit Modal -->
    <ChangeModal
      :show="showEditModal"
      :aucation-id="aucation.id"
      @close="showEditModal = false"
    />

    <!-- Bid Modal -->
    <BidModal
      :show="showBidModal"
      :aucation="aucation"
      @close="showBidModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import ChangeCoverModal from "../modals/ChangeCoverModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import BidModal from "../modals/BidModal.vue";
import MarkdownViewer from "../components/MarkdownViewer.vue";
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatDate,
  formatRupiah,
  formatRemaining,
  getBidAmount,
  getBidderName,
  getHighestBid,
  isAucationClosed,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import {
  ArrowLeft,
  ImagePlus,
  Edit3,
  Trash2,
  Calendar,
  Lock,
  Timer,
  HandCoins,
  Undo2,
  History,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const aucationsStore = useAucationsStore();
const usersStore = useUsersStore();

const aucationId = computed(() => route.params.aucationId);
const profile = computed(() => usersStore.profile);
const aucation = computed(() => aucationsStore.aucation);
const isAucation = computed(() => aucationsStore.isAucation);
const isAucationDeleted = computed(() => aucationsStore.isAucationDeleted);
const isBidDeleted = computed(() => aucationsStore.isBidDeleted);

const showCoverModal = ref(false);
const showEditModal = ref(false);
const showBidModal = ref(false);
const now = ref(Date.now());

let timer = null;

const closed = computed(() => isAucationClosed(aucation.value, now.value));
const isOwner = computed(
  () => Boolean(profile.value) && aucation.value?.user_id === profile.value.id
);
const bids = computed(() =>
  Array.isArray(aucation.value?.bids) ? aucation.value.bids : []
);
const highestBid = computed(() => getHighestBid(aucation.value));
const myBid = computed(() =>
  bids.value.find((bid) => profile.value && bid.user_id === profile.value.id)
);

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  aucationsStore.asyncSetAucation(aucationId.value);
});

onBeforeUnmount(() => {
  clearInterval(timer);
});

watch(aucationId, (newId) => {
  aucationsStore.asyncSetAucation(newId);
});

watch(
  () => [isAucation.value, aucation.value],
  ([isA, a]) => {
    if (isA) {
      aucationsStore.setIsAucation(false);
      if (!a) {
        router.push("/");
      }
    }
  }
);

watch(isAucationDeleted, (isDel) => {
  if (isDel) {
    aucationsStore.setIsAucationDeleted(false);
    router.push("/");
  }
});

watch(isBidDeleted, (isDel) => {
  if (isDel) {
    aucationsStore.setIsBidDeleted(false);
    aucationsStore.asyncSetAucation(aucationId.value);
  }
});

async function handleDelete() {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus lelang ini?");
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsAucationDelete(aucation.value.id);
  }
}

async function handleCancelBid() {
  const result = await showConfirmDialog("Apakah Anda yakin ingin membatalkan penawaran Anda?");
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsBidDelete(aucation.value.id);
  }
}
</script>