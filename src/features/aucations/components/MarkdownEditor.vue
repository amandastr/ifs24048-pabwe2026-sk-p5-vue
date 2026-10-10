// Di dalam script setup
import { onMounted, onBeforeUnmount, ref, watch } from "vue";

const editorEl = ref(null);
let editorInstance = null;

onMounted(async () => {
  // Lazy load Toast UI Editor hanya saat component di-mount
  const [{ default: Editor }, css] = await Promise.all([
    import("@toast-ui/editor"),
    import("@toast-ui/editor/dist/toastui-editor.css"),
  ]);

  editorInstance = new Editor({
    el: editorEl.value,
    height: "300px",
    initialEditType: "markdown",
    previewStyle: "vertical",
    // ... opsi lain yang sudah ada
  });
});

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.destroy();
    editorInstance = null;
  }
});