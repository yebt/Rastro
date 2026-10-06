<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { hexToHsv, type HSV, hsvToHex, normalizeHex } from "../color";

/**
 * In-app color picker (the WebView's native <input type="color"> is a crude
 * system dialog). A saturation/brightness square, a hue slider, a hex field and
 * optional preset swatches — all pointer-driven, so it works with a finger.
 */
const props = withDefaults(defineProps<{ modelValue: string; presets?: string[] }>(), { presets: () => [] });
const emit = defineEmits<{ "update:modelValue": [hex: string] }>();

const hsv = ref<HSV>(hexToHsv(normalizeHex(props.modelValue) ?? "#12a150"));
// The field shows the hex without "#" (the label carries it).
const hexText = ref(hsvToHex(hsv.value).slice(1));

// Follow outside changes (e.g. a preset applied by the parent) without fighting
// the drag: only resync when the hex really differs from what we hold.
watch(
  () => props.modelValue,
  (v) => {
    const n = normalizeHex(v);
    if (n && n !== hsvToHex(hsv.value)) {
      hsv.value = hexToHsv(n);
      hexText.value = n.slice(1);
    }
  },
);

const current = computed(() => hsvToHex(hsv.value));
const hueColor = computed(() => hsvToHex({ h: hsv.value.h, s: 1, v: 1 }));

function commit(next: HSV): void {
  hsv.value = next;
  const hex = hsvToHex(next);
  hexText.value = hex.slice(1);
  emit("update:modelValue", hex);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Pointer drag on an element → fractions (0..1) inside its box. */
function drag(e: PointerEvent, apply: (fx: number, fy: number) => void): void {
  const el = e.currentTarget as HTMLElement;
  el.setPointerCapture(e.pointerId);
  const move = (ev: PointerEvent): void => {
    const r = el.getBoundingClientRect();
    apply(clamp01((ev.clientX - r.left) / r.width), clamp01((ev.clientY - r.top) / r.height));
  };
  move(e);
  const up = (): void => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}

function onArea(e: PointerEvent): void {
  drag(e, (fx, fy) => commit({ ...hsv.value, s: fx, v: 1 - fy }));
}
function onHue(e: PointerEvent): void {
  drag(e, (fx) => commit({ ...hsv.value, h: Math.min(359.9, fx * 360) }));
}

function onHexInput(): void {
  const n = normalizeHex(hexText.value);
  if (n) commit(hexToHsv(n));
}
function onHexBlur(): void {
  hexText.value = current.value.slice(1);
}
</script>

<template>
  <div class="picker">
    <div
      class="area"
      :style="{ backgroundColor: hueColor }"
      role="slider"
      aria-label="Saturación y brillo"
      @pointerdown.prevent="onArea"
    >
      <span
        class="area-knob"
        :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: current }"
      ></span>
    </div>

    <div class="hue" role="slider" aria-label="Tono" :aria-valuenow="Math.round(hsv.h)" @pointerdown.prevent="onHue">
      <span class="hue-knob" :style="{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }"></span>
    </div>

    <div class="row">
      <span class="preview" :style="{ background: current }"></span>
      <label class="hex">
        <span>#</span>
        <input
          v-model="hexText"
          type="text"
          inputmode="text"
          maxlength="7"
          spellcheck="false"
          autocapitalize="off"
          aria-label="Color hexadecimal"
          @input="onHexInput"
          @blur="onHexBlur"
        />
      </label>
    </div>

    <div v-if="presets.length" class="presets">
      <button
        v-for="c in presets"
        :key="c"
        type="button"
        class="preset"
        :class="{ on: c.toLowerCase() === current }"
        :style="{ background: c }"
        :aria-label="`Usar ${c}`"
        @click="commit(hexToHsv(normalizeHex(c) ?? current))"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  touch-action: none;
}
.area {
  position: relative;
  height: 180px;
  border-radius: var(--r-md);
  cursor: crosshair;
  background-image:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent);
}
.area-knob {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.hue {
  position: relative;
  height: 22px;
  border-radius: 999px;
  cursor: pointer;
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
}
.hue-knob {
  position: absolute;
  top: 50%;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.preview {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
}
.hex {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 44px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--bg);
  font-family: var(--font-mono);
  color: var(--muted);
}
.hex input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 16px;
  text-transform: lowercase;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.preset {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 2px solid var(--line);
  cursor: pointer;
}
.preset.on {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 2px var(--bg);
}
</style>
