<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useCloudPermission } from '#/composables/use-cloud-permission';
import { buildPlayerDetailPath } from '#/utils/player-detail-route';

defineOptions({ name: 'PlayerAccountLink' });

const props = defineProps<{
  loginAccount?: string;
  permissionId?: number;
  playerId?: number | string;
}>();

const router = useRouter();
const { checkPermission } = useCloudPermission();

const canOpenDetail = computed(() =>
  checkPermission(props.permissionId ?? 10442),
);

const hasLink = computed(
  () =>
    canOpenDetail.value &&
    props.playerId &&
    props.loginAccount !== undefined &&
    props.loginAccount !== '',
);

function openDetail() {
  if (!hasLink.value) {
    return;
  }
  router.push(buildPlayerDetailPath(props.playerId!, props.loginAccount));
}
</script>

<template>
  <a
    v-if="hasLink"
    class="text-primary cursor-pointer hover:underline"
    @click.prevent="openDetail"
  >
    {{ loginAccount }}
  </a>
  <span v-else>{{ loginAccount || '-' }}</span>
</template>
