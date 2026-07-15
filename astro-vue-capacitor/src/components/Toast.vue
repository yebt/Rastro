<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { $toast } from '../stores/ui';

const toast = useStore($toast);
</script>

<template>
  <div id="toast" :class="{ show: !!toast }">{{ toast }}</div>
</template>
