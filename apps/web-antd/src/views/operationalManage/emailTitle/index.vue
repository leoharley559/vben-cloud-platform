<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Alert, Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import VisitDetailPanel from '../components/visit-detail-panel.vue';
import VisitStatisticsPanel from '../components/visit-statistics-panel.vue';

defineOptions({ name: 'EmailTitle' });

const route = useRoute();
const { checkPermission } = useCloudPermission();

/** 兼容 Id / id；需从「邮件通知」列表点击标题带入 */
const titleId = computed(() =>
  String(route.query.Id || route.query.id || '').trim(),
);
const titleName = computed(() =>
  String(route.query.Title || route.query.title || '').trim(),
);

const tabs = computed(() =>
  [
    {
      key: 'detail',
      permission: 11_950,
      tab: '明细',
    },
    {
      key: 'statistics',
      permission: 11_951,
      tab: '访问统计',
    },
  ].filter((item) => checkPermission(item.permission)),
);

/** 对齐旧站：仅校验 Tab 权限，不因缺少 Id 整页 403 */
const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('detail');

const canLoadDetail = computed(() => checkPermission(11_952));
const canExportDetail = computed(() => checkPermission(11_954));
const canLoadStatistics = computed(() => checkPermission(11_955));

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'detail';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    :description="
      titleId ? `邮件 ID: ${titleId}` : '请从邮件通知列表点击标题进入'
    "
    :title="`邮件访问统计${titleName ? ` - ${titleName}` : ''}`"
  >
    <Card>
      <Alert
        v-if="!titleId"
        show-icon
        type="warning"
        class="mb-4"
        message="缺少邮件 ID"
        description="请前往「运营管理 → 游戏公告 → 邮件通知」列表，点击邮件标题进入本页；侧边栏直接打开不会带入 Id。"
      />
      <Tabs v-else v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <VisitDetailPanel
            v-if="activeTab === 'detail' && item.key === 'detail'"
            group="Mail"
            dropdown-key="MailDropDownList"
            :title-id="titleId"
            :can-load="canLoadDetail"
            :can-export="canExportDetail"
          />
          <VisitStatisticsPanel
            v-else-if="activeTab === 'statistics' && item.key === 'statistics'"
            group="Mail"
            dropdown-key="MailDropDownList"
            :title-id="titleId"
            :can-load="canLoadStatistics"
            :show-guest-visit="false"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result
    v-else
    status="403"
    sub-title="需要明细(11950)或访问统计(11951)权限"
    title="无查看权限"
  />
</template>
