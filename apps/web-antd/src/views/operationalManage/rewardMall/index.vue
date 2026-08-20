<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Radio, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ExchangeRecordPanel from './components/exchange-record-panel.vue';
import GoodsManagePanel from './components/goods-manage-panel.vue';
import PointsAdjustAuditPanel from './components/points-adjust-audit-panel.vue';
import PointsAdjustFormPanel from './components/points-adjust-form.vue';
import PointsAdjustRecordPanel from './components/points-adjust-record-panel.vue';
import PointsConfigPanel from './components/points-config-panel.vue';
import PointsRecordPanel from './components/points-record-panel.vue';

defineOptions({ name: 'RewardMall' });

const { checkPermission } = useCloudPermission();

const canPointsSubmit = computed(() => checkPermission(13_335));
const canPointsAudit = computed(() => checkPermission(13_336));
const canPointsRecord = computed(() => checkPermission(13_337));

/** 积分调整子页顺序对齐旧站 pointsAdjust.vue：账户调整 -> 调整审核 -> 调整记录 */
const pointsAdjustSubTabs = computed(() =>
  [
    { key: 'submit', permission: canPointsSubmit.value, tab: '账户调整' },
    { key: 'audit', permission: canPointsAudit.value, tab: '调整审核' },
    { key: 'record', permission: canPointsRecord.value, tab: '调整记录' },
  ].filter((item) => item.permission),
);

/** 顶层页签顺序对齐旧站 rewardMall.vue：商品设置 -> 兑换记录 -> 积分设置 -> 积分记录 -> 积分调整 */
const tabs = computed(() =>
  [
    { key: 'goods', permission: 13_378, tab: '商品设置' },
    { key: 'exchange', permission: 13_331, tab: '兑换记录' },
    { key: 'pointsConfig', permission: 13_332, tab: '积分设置' },
    { key: 'pointsRecord', permission: 13_333, tab: '积分记录' },
    { key: 'pointsAdjust', permission: 13_334, tab: '积分调整' },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('goods');
const activePointsSubTab = ref('submit');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'goods';
  activePointsSubTab.value = pointsAdjustSubTabs.value[0]?.key || 'submit';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 积分商城"
    title="积分商城"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <GoodsManagePanel
            v-if="item.key === 'goods' && activeTab === 'goods'"
          />
          <ExchangeRecordPanel
            v-else-if="item.key === 'exchange' && activeTab === 'exchange'"
          />
          <PointsConfigPanel
            v-else-if="
              item.key === 'pointsConfig' && activeTab === 'pointsConfig'
            "
          />
          <PointsRecordPanel
            v-else-if="
              item.key === 'pointsRecord' && activeTab === 'pointsRecord'
            "
          />
          <template
            v-else-if="
              item.key === 'pointsAdjust' && activeTab === 'pointsAdjust'
            "
          >
            <div v-if="pointsAdjustSubTabs.length > 0" class="mb-3">
              <Radio.Group
                v-model:value="activePointsSubTab"
                button-style="solid"
              >
                <Radio.Button
                  v-for="sub in pointsAdjustSubTabs"
                  :key="sub.key"
                  :value="sub.key"
                >
                  {{ sub.tab }}
                </Radio.Button>
              </Radio.Group>
            </div>

            <PointsAdjustFormPanel
              v-if="activePointsSubTab === 'submit' && canPointsSubmit"
            />
            <PointsAdjustAuditPanel
              v-else-if="activePointsSubTab === 'audit' && canPointsAudit"
            />
            <PointsAdjustRecordPanel
              v-else-if="activePointsSubTab === 'record' && canPointsRecord"
            />

            <div
              v-if="pointsAdjustSubTabs.length === 0"
              class="rounded border border-dashed p-4 text-sm text-gray-500"
            >
              暂无积分调整子页权限
            </div>
          </template>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无积分商城查看权限" title="403" />
</template>
