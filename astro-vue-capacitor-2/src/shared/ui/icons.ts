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

import type { Component } from 'vue';
import IconActivity from '~icons/lucide/activity';
import IconChevronRight from '~icons/lucide/chevron-right';
import IconEllipsis from '~icons/lucide/ellipsis';
import IconHouse from '~icons/lucide/house';
import IconPlay from '~icons/lucide/play';
import IconSettings from '~icons/lucide/settings';
import IconUser from '~icons/lucide/user';

export const ICONS = {
  home: IconHouse,
  workout: IconActivity,
  profile: IconUser,
  more: IconEllipsis,
  play: IconPlay,
  settings: IconSettings,
  chevron: IconChevronRight,
} satisfies Record<string, Component>;

export type IconName = keyof typeof ICONS;
