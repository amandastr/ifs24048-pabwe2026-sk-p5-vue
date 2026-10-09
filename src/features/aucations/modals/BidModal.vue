<template>
  <div
    v-if="show && aucation"
    data-testid="bid-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div
      class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      @click.stop
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <HandCoins :size="18" :stroke-width="2.5" />
          </div>
          <h3 class="text-base font-bold text-slate-800">Ajukan Penawaran</h3>
        </div>
        <button
          type="button"
          data-testid="close-bid-modal-btn"
          @click="onClose"
          class="p-1.5 rounded-lg text-slate-600 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X :size="18" />
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-6 space-y-4">
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1">
          <p class="text-sm font-semibold text-slate-800" data-testid="bid-aucation-title">
            {{ aucation.title }}
          </p>
          <p class="text-xs text-slate-500">
            Harga awal:
            <strong data-testid="bid-start-bid">{{ formatRupiah(aucation.start_bid) }}</strong>
          </p>
          <p class="text-xs text-slate-500">
            Penawaran tertinggi saat ini:
            <strong data-testid="bid-highest-bid">{{ formatRupiah(highestBid) }}</strong>
          </p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Nominal Penawaran (Rp) <span class="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            data-testid="bid-amount-input"
            v-model="bidAmount"
            placeholder="Masukkan nominal penawaran"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-sm shadow-xs"
            required
          />
          <p class="text-xs text-slate-600 mt-1.5" data-testid="bid-hint">
            {{ hint }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-bid-modal-btn"
            @click="onClose"
            :disabled="loading"
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-bid-modal-btn"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60"
          >
            <template v-if="loading">
              <Loader2 :size="18" class="animate-spin" />
              <span>Mengirim...</span>
            </template>
            <template v-else>
              <HandCoins :size="18" :stroke-width="2.5" />
              <span>Ajukan Bid</span>
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { HandCoins, X, Loader2 } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import {
  formatRupiah,
  getHighestBid,
  showErrorDialog,
} from "../../../helpers/toolsHelper";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  aucation: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const aucationsStore = useAucationsStore();

const loading = ref(false);
const bidAmount = ref("");

const highestBid = computed(() => getHighestBid(props.aucation));
const hasBid = computed(() => highestBid.value > 0);
const hint = computed(() =>
  hasBid.value
    ? `Penawaran harus lebih tinggi dari ${formatRupiah(highestBid.value)}.`
    : `Penawaran pertama minimal ${formatRupiah(props.aucation?.start_bid)}.`
);

function onClose() {
  emit("close");
}

watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      document.body.style.overflow = "hidden";
      bidAmount.value = "";
    } else {
      document.body.style.overflow = "auto";
    }
  }
);

watch(
  () => [aucationsStore.isBidAdd, aucationsStore.isBidAdded],
  ([isBidAdd, isBidAdded]) => {
    if (isBidAdd) {
      loading.value = false;
      aucationsStore.setIsBidAdd(false);
      if (isBidAdded) {
        aucationsStore.setIsBidAdded(false);
        aucationsStore.asyncSetAucation(props.aucation?.id);
        onClose();
      }
    }
  }
);

function handleSave() {
  const amount = Number(bidAmount.value);

  if (!(amount > 0)) {
    showErrorDialog("Nominal penawaran harus lebih dari 0");
    return;
  }

  if (hasBid.value && amount <= highestBid.value) {
    showErrorDialog(
      `Penawaran harus lebih tinggi dari penawaran tertinggi saat ini (${formatRupiah(highestBid.value)})`
    );
    return;
  }

  if (!hasBid.value && amount < Number(props.aucation.start_bid)) {
    showErrorDialog(
      `Penawaran pertama minimal sebesar harga awal (${formatRupiah(props.aucation.start_bid)})`
    );
    return;
  }

  loading.value = true;
  aucationsStore.asyncSetIsBidAdd(props.aucation.id, amount);
}
</script>
