<script setup lang="ts">
import { AppSubScreen, Card, Logo } from "../../../shared/ui";
import { APP_COMMIT, APP_NAME, APP_TAGLINE, APP_VERSION } from "../../../shared/app-meta";

defineEmits<{ back: [] }>();
</script>

<template>
  <AppSubScreen title="Acerca de" @back="$emit('back')">
    <Card>
      <div class="about">
        <Logo size="30px" class="about-ic" />
        <div class="about-head">
          <div class="about-name">{{ APP_NAME }}</div>
          <div class="about-tag">{{ APP_TAGLINE }}</div>
        </div>
      </div>
    </Card>

    <Card>
      <dl class="meta">
        <div class="meta-row">
          <dt>Versión</dt>
          <dd>{{ APP_VERSION }}</dd>
        </div>
        <div class="meta-row">
          <dt>Commit</dt>
          <dd class="mono">{{ APP_COMMIT }}</dd>
        </div>
      </dl>
    </Card>
  </AppSubScreen>
</template>

<style scoped>
.about {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.about-ic {
  color: var(--accent);
  flex: none;
}
.about-name {
  font-family: var(--font-cond);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.about-tag {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.meta {
  margin: 0;
  display: flex;
  flex-direction: column;
}
.meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
}
.meta-row + .meta-row {
  border-top: 1px solid var(--line);
}
.meta dt {
  font-size: 13px;
  color: var(--muted);
}
.meta dd {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.meta dd.mono {
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--muted);
}
</style>
