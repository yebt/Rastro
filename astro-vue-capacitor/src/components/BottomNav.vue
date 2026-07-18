<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconDatabase from '~icons/lucide/database';
import IconDumbbell from '~icons/lucide/dumbbell';
import IconHistory from '~icons/lucide/history';
import IconRoute from '~icons/lucide/route';
import IconTrend from '~icons/lucide/trending-up';
import { $activeTab, setTab } from '../stores/ui';

const active = useStore($activeTab);
</script>

<template>
  <nav>
    <button :class="{ on: active === 'track' }" @click="setTab('track')">
      <IconRoute /> Registrar
    </button>
    <button :class="{ on: active === 'pull' }" @click="setTab('pull')">
      <IconDumbbell /> Dominadas
    </button>
    <button :class="{ on: active === 'hist' }" @click="setTab('hist')">
      <IconHistory /> Historial
    </button>
    <button :class="{ on: active === 'progress' }" @click="setTab('progress')">
      <IconTrend /> Progreso
    </button>
    <button :class="{ on: active === 'data' }" @click="setTab('data')">
      <IconDatabase /> Datos
    </button>
  </nav>
</template>
