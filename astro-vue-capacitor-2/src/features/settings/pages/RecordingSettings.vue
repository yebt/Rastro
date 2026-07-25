<script setup lang="ts">
import { AppSubScreen, Label } from "../../../shared/ui";
import PermissionList from "../../permissions/PermissionList.vue";

defineEmits<{ back: [] }>();
</script>

<template>
  <AppSubScreen title="Registro" @back="$emit('back')">
    <Label>Permisos</Label>
    <PermissionList />
  </AppSubScreen>
</template>
