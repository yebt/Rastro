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
        <div>
          <div class="about-name">
            {{ APP_NAME }}
            <span class="about-ver">v{{ APP_VERSION }} · {{ APP_COMMIT }}</span>
          </div>
          <div class="about-tag">{{ APP_TAGLINE }}</div>
        </div>
      </div>
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
.about-ver {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0;
}
.about-tag {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}
</style>
