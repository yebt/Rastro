/**
 * Curated icon registry.
 *
 * unplugin-icons resolves each `~icons/*` import statically at build time, so
 * icons are registered here explicitly and referenced by a stable name through
 * <AppIcon name="…" />. This keeps the icon set intentional (no accidental
 * catalog sprawl) and gives one place to swap an icon app-wide.
 *
 * Line icons, single family (Lucide), uniform stroke — set on AppIcon.
 */

import type { Component } from "vue";
import IconActivity from "~icons/lucide/activity";
import IconBack from "~icons/lucide/chevron-left";
import IconBell from "~icons/lucide/bell";
import IconChevron from "~icons/lucide/chevron-right";
import IconDatabase from "~icons/lucide/database";
import IconDownload from "~icons/lucide/download";
import IconEllipsis from "~icons/lucide/ellipsis";
import IconEye from "~icons/lucide/eye";
import IconEyeOff from "~icons/lucide/eye-off";
import IconFootprints from "~icons/lucide/footprints";
import IconHouse from "~icons/lucide/house";
import IconInfo from "~icons/lucide/info";
import IconMapPin from "~icons/lucide/map-pin";
import IconPalette from "~icons/lucide/palette";
import IconPlay from "~icons/lucide/play";
import IconPlus from "~icons/lucide/plus";
import IconSettings from "~icons/lucide/settings";
import IconShield from "~icons/lucide/shield-check";
import IconTheme from "~icons/lucide/sun-moon";
import IconTrash from "~icons/lucide/trash-2";
import IconUpload from "~icons/lucide/upload";
import IconUser from "~icons/lucide/user";

export const ICONS = {
  home: IconHouse,
  workout: IconActivity,
  profile: IconUser,
  more: IconEllipsis,
  play: IconPlay,
  settings: IconSettings,
  chevron: IconChevron,
  back: IconBack,
  theme: IconTheme,
  palette: IconPalette,
  data: IconDatabase,
  info: IconInfo,
  plus: IconPlus,
  shield: IconShield,
  location: IconMapPin,
  steps: IconFootprints,
  bell: IconBell,
  export: IconUpload,
  import: IconDownload,
  trash: IconTrash,
  eye: IconEye,
  eyeOff: IconEyeOff,
} satisfies Record<string, Component>;

export type IconName = keyof typeof ICONS;
