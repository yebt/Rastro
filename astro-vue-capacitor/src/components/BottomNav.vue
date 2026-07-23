<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import IconActivity from '~icons/lucide/activity';
import IconHome from '~icons/lucide/house';
import IconMore from '~icons/lucide/more-horizontal';
import IconUser from '~icons/lucide/user';
import { $activeTab, setTab } from '../stores/ui';

const active = useStore($activeTab);
</script>

<template>
  <nav>
    <button :class="{ on: active === 'home' }" @click="setTab('home')">
      <span class="tabbar" />
      <IconHome /> Inicio
    </button>
    <button :class="{ on: active === 'workout' }" @click="setTab('workout')">
      <span class="tabbar" />
      <IconActivity /> Moverme
    </button>
    <button :class="{ on: active === 'profile' }" @click="setTab('profile')">
      <span class="tabbar" />
      <IconUser /> Perfil
    </button>
    <button :class="{ on: active === 'more' }" @click="setTab('more')">
      <span class="tabbar" />
      <IconMore /> Más
    </button>
  </nav>
</template>
