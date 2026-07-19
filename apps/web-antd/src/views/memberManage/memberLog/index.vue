<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Radio, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import LoginRecordList from './components/login-record-list.vue';
import LoginSummaryPanel from './components/login-summary-panel.vue';

defineOptions({ name: 'MemberLogManage' });

const { checkPermission } = useCloudPermission();

const canViewPage = computed(() => checkPermission(12220));
const canViewDetail = computed(() => checkPermission(12221));
const canViewSummary = computed(() => checkPermission(12222));

const canViewAny = computed(() => canViewDetail.value || canViewSummary.value);

/** 1 明细 / 2 统计 —— 对齐旧站 radio */
const recordType = ref(1);

function resolveDefaultType() {
  if (canViewDetail.value) {
    recordType.value = 1;
    return;
  }
  if (canViewSummary.value) {
    recordType.value = 2;
  }
}

watch([canViewDetail, canViewSummary], () => {
  if (recordType.value === 1 && !canViewDetail.value && canViewSummary.value) {
    recordType.value = 2;
  }
  if (recordType.value === 2 && !canViewSummary.value && canViewDetail.value) {
    recordType.value = 1;
  }
});

onMounted(() => {
  resolveDefaultType();
});
</script>

<template>
  <Page
    v-if="canViewPage && canViewAny"
    auto-content-height
    description="会员管理 · 会员日志"
    title="会员日志"
  >
    <Card>
      <div class="mb-3">
        <Radio.Group v-model:value="recordType" button-style="solid">
          <Radio.Button v-if="canViewDetail" :value="1">明细</Radio.Button>
          <Radio.Button v-if="canViewSummary" :value="2">统计</Radio.Button>
        </Radio.Group>
      </div>
      <LoginRecordList v-if="recordType === 1 && canViewDetail" />
      <LoginSummaryPanel v-else-if="recordType === 2 && canViewSummary" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无会员日志查看权限" title="403" />
</template>
