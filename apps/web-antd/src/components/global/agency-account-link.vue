<script lang="ts" setup>
import type { AgencyDetailQuery } from '#/utils/agency-detail-route';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useCloudPermission } from '#/composables/use-cloud-permission';
import { buildAgencyDetailPath } from '#/utils/agency-detail-route';

defineOptions({ name: 'AgencyAccountLink' });

const props = defineProps<{
  /** 代理 AdminId，有值才可跳转 */
  adminId?: null | number | string;
  /** 详情页权限，默认 11251 */
  permissionId?: number;
  /** 透传到详情页的可选 query */
  query?: AgencyDetailQuery;
  /** 展示文案（代理账号） */
  username?: null | number | string;
}>();

const router = useRouter();
const { checkPermission } = useCloudPermission();

const displayText = computed(() => {
  if (
    props.username === undefined ||
    props.username === null ||
    props.username === ''
  ) {
    return '';
  }
  return String(props.username);
});

const canOpenDetail = computed(() =>
  checkPermission(props.permissionId ?? 11_251),
);

const hasLink = computed(
  () =>
    canOpenDetail.value &&
    props.adminId !== undefined &&
    props.adminId !== null &&
    props.adminId !== '' &&
    Number(props.adminId) !== 0 &&
    displayText.value !== '',
);

function openDetail() {
  if (!hasLink.value) {
    return;
  }
  router.push({
    path: buildAgencyDetailPath(props.adminId!),
    query: {
      ...(props.query?.CountBeginTime
        ? { CountBeginTime: String(props.query.CountBeginTime) }
        : {}),
      ...(props.query?.CountEndTime
        ? { CountEndTime: String(props.query.CountEndTime) }
        : {}),
      ...(props.query?.Name ? { Name: String(props.query.Name) } : {}),
    },
  });
}
</script>

<template>
  <a
    v-if="hasLink"
    class="text-primary cursor-pointer hover:underline"
    @click.prevent="openDetail"
  >
    {{ displayText }}
  </a>
  <span v-else>{{ displayText || '-' }}</span>
</template>
