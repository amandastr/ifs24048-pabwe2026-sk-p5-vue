<template>
  <div v-if="profile" class="space-y-8 animate-in fade-in duration-300">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dashboard Lelang
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Temukan barang lelang menarik, ajukan penawaran, dan kelola lelang Anda.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          data-testid="delete-all-aucations-btn"
          @click="handleDeleteAll"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all"
        >
          <Trash2 :size="18" />
          <span>Hapus Semua Lelang Saya</span>
        </button>
        <button
          type="button"
          data-testid="add-aucation-btn"
          @click="showAddModal = true"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus :size="18" :stroke-width="2.5" />
          <span>Tambah Lelang</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Total Lelang
          </p>
          <h3 data-testid="stat-total" class="text-3xl font-black text-slate-800 mt-1">{{ totalCount }}</h3>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
          <Gavel :size="26" :stroke-width="2" />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Sedang Berlangsung
          </p>
          <h3 data-testid="stat-open" class="text-3xl font-black text-emerald-700 mt-1">{{ openCount }}</h3>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
          <Timer :size="26" :stroke-width="2" />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Sudah Ditutup
          </p>
          <h3 data-testid="stat-closed" class="text-3xl font-black text-slate-600 mt-1">{{ closedCount }}</h3>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
          <Lock :size="26" :stroke-width="2" />
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search
          :size="18"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
        />
        <input aria-label="Cari judul atau deskripsi lelang"
          type="text"
          data-testid="search-aucation-input"
          v-model="searchQuery"
          placeholder="Cari judul atau deskripsi lelang..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        />
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Filter :size="16" /> Filter:
        </span>
        <div class="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            v-for="item in tabs"
            :key="item.value"
            type="button"
            :data-testid="`tab-${item.value || 'all'}-btn`"
            @click="tab = item.value"
            class="px-3 py-1.5 rounded-lg transition-all"
            :class="tab === item.value ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Aucation Cards -->
    <div
      v-if="loadingAucations && filteredAucations.length === 0"
      data-testid="aucations-loading"
      class="bg-white rounded-2xl border border-slate-200/80 px-6 py-12 text-center text-slate-600"
    >
      <Loader2 :size="36" class="mx-auto text-indigo-700 animate-spin mb-2" />
      <p class="font-medium text-slate-600">Memuat daftar lelang...</p>
    </div>

    <div
      v-else-if="filteredAucations.length === 0"
      data-testid="aucations-empty"
      class="bg-white rounded-2xl border border-slate-200/80 px-6 py-12 text-center text-slate-600"
    >
      <Gavel :size="40" class="mx-auto text-slate-300 mb-2" />
      <p class="font-medium">Belum ada data lelang yang cocok.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="aucation in filteredAucations"
        :key="`aucation-${aucation.id}`"
        :data-testid="`aucation-card-${aucation.id}`"
        class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
      >
        <div class="relative h-44 bg-slate-100">
          <img
            v-if="aucation.cover"
            :src="aucation.cover"
            :alt="aucation.title"
            loading="lazy"
            decoding="async"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
            <ImageOff :size="40" />
          </div>
          <span
            v-if="isClosed(aucation)"
            :data-testid="`aucation-status-${aucation.id}`"
            class="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-white"
          >
            <Lock :size="12" /> Ditutup
          </span>
          <span
            v-else
            :data-testid="`aucation-status-${aucation.id}`"
            class="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-700 text-white"
          >
            <Timer :size="12" /> Berlangsung
          </span>
        </div>

        <div class="p-5 flex-1 flex flex-col gap-3">
          <div>
            <p class="font-bold text-slate-800 leading-snug line-clamp-1">
              {{ aucation.title }}
            </p>
            <p v-if="aucation.description" class="text-xs text-slate-600 line-clamp-2 mt-1">
              {{ aucation.description }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="rounded-xl bg-slate-50 p-3">
              <p class="text-slate-600 font-semibold uppercase tracking-wide">Harga Awal</p>
              <p class="font-bold text-slate-700 mt-0.5">{{ formatRupiah(aucation.start_bid) }}</p>
            </div>
            <div class="rounded-xl bg-emerald-50 p-3">
              <p class="text-emerald-700 font-semibold uppercase tracking-wide">Tertinggi</p>
              <p :data-testid="`highest-bid-${aucation.id}`" class="font-bold text-emerald-700 mt-0.5">
                {{ highestLabel(aucation) }}
              </p>
            </div>
          </div>

          <p
            :data-testid="`countdown-${aucation.id}`"
            class="text-xs text-slate-500 flex items-center gap-1.5"
          >
            <Clock :size="14" />
            {{ formatRemaining(aucation.closed_at, now) }}
          </p>

          <div class="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              :data-testid="`view-aucation-${aucation.id}`"
              @click="router.push(`/aucations/${aucation.id}`)"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
            >
              <Eye :size="16" /> Lihat Detail
            </button>

            <div v-if="isOwner(aucation)" class="inline-flex items-center gap-1.5">
              <button
                type="button"
                :data-testid="`edit-aucation-${aucation.id}`"
                @click="handleEditAucation(aucation.id)"
                class="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                title="Ubah Lelang"
              >
                <Pencil :size="18" />
              </button>
              <button
                type="button"
                :data-testid="`delete-aucation-${aucation.id}`"
                @click="handleDeleteAucation(aucation.id)"
                class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Hapus Lelang"
              >
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <AddModal :show="showAddModal" @close="showAddModal = false" />
    <ChangeModal
      :show="showChangeModal"
      :aucation-id="selectedAucationId"
      @close="showChangeModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatRupiah,
  formatRemaining,
  getHighestBid,
  isAucationClosed,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import {
  Plus,
  Gavel,
  Timer,
  Lock,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Search,
  Loader2,
  ImageOff,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const aucationsStore = useAucationsStore();
const usersStore = useUsersStore();

const tabs = [
  { value: "", label: "Semua Lelang" },
  { value: "mine", label: "Lelang Saya" },
  { value: "open", label: "Lelang Berlangsung" },
  { value: "closed", label: "Lelang Ditutup" },
];

const tabFilters = {
  "": {},
  mine: { isMe: 1 },
  open: { isClosed: 0 },
  closed: { isClosed: 1 },
};

const profile = computed(() => usersStore.profile);
const aucations = computed(() => aucationsStore.aucations || []);
const isAucationDeleted = computed(() => aucationsStore.isAucationDeleted);
const isAucationDeletedAll = computed(() => aucationsStore.isAucationDeletedAll);

const loadingAucations = ref(false);
const tab = ref(tabs.some((t) => t.value === route.query.tab) ? route.query.tab : "");
const searchQuery = ref("");
const showAddModal = ref(false);
const showChangeModal = ref(false);
const selectedAucationId = ref(null);
const now = ref(Date.now());

let isMounted = true;
let timer = null;

onMounted(() => {
  isMounted = true;
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  loadAucations();
});

onBeforeUnmount(() => {
  isMounted = false;
  clearInterval(timer);
});

function loadAucations() {
  loadingAucations.value = true;
  Promise.resolve(aucationsStore.asyncSetAucations(tabFilters[tab.value])).finally(() => {
    if (isMounted) loadingAucations.value = false;
  });
}

watch(tab, () => {
  loadAucations();
});

watch(
  () => route.query.tab,
  (newTab) => {
    tab.value = tabs.some((t) => t.value === newTab) ? newTab : "";
  }
);

watch(isAucationDeleted, (deleted) => {
  if (deleted) {
    aucationsStore.setIsAucationDeleted(false);
    loadAucations();
  }
});

watch(isAucationDeletedAll, (deleted) => {
  if (deleted) {
    aucationsStore.setIsAucationDeletedAll(false);
    loadAucations();
  }
});

function isClosed(aucation) {
  return isAucationClosed(aucation, now.value);
}

function isOwner(aucation) {
  return Boolean(profile.value) && aucation.user_id === profile.value.id;
}

function highestLabel(aucation) {
  const highest = getHighestBid(aucation);
  return highest > 0 ? formatRupiah(highest) : "Belum ada";
}

function handleEditAucation(aucationId) {
  selectedAucationId.value = aucationId;
  showChangeModal.value = true;
}

async function handleDeleteAucation(aucationId) {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus lelang ini?");
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsAucationDelete(aucationId);
  }
}

async function handleDeleteAll() {
  const result = await showConfirmDialog(
    "Apakah Anda yakin ingin menghapus SELURUH lelang milik Anda? Tindakan ini tidak dapat dibatalkan."
  );
  if (result.isConfirmed) {
    aucationsStore.asyncSetIsAucationDeleteAll();
  }
}

const filteredAucations = computed(() => {
  return aucations.value.filter((aucation) => {
    if (!searchQuery.value.trim()) return true;
    const q = searchQuery.value.toLowerCase();
    const title = aucation.title ? aucation.title.toLowerCase() : "";
    const description = aucation.description ? aucation.description.toLowerCase() : "";
    return title.includes(q) || description.includes(q);
  });
});

const totalCount = computed(() => aucations.value.length);
const closedCount = computed(() => aucations.value.filter((a) => isClosed(a)).length);
const openCount = computed(() => totalCount.value - closedCount.value);
</script>
