<script lang="ts" setup>
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  message,
  Modal,
  Result,
  Space,
  Tabs,
} from 'ant-design-vue';

import {
  fetchCommAlgorithmDataApi,
  fetchCommTempListApi,
  fetchMultCommTempListApi,
  fetchSendCommListApi,
  fetchTeamCommListApi,
  fetchVenueTemplateListApi,
  oneKeySendCommissionApi,
  sendCommissionApi,
} from '#/api/netcash/commission-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'CommissionManage' });

const { checkPermission } = useCloudPermission();

const canSendCommission = computed(() => checkPermission(10_472));
const canOneKeySend = computed(() => checkPermission(10_470));

const gridRefs = ref<Array<InstanceType<typeof NetcashGridPanel>>>([]);

function reloadCurrentGrid() {
  gridRefs.value[0]?.reload();
}

function handleSendCommission(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认发放代理「${row.Username || ''}」的佣金？`,
    onOk: async () => {
      await sendCommissionApi({
        Ids: String(row.Id),
        IsDeduct: 2,
        IsMulti: 0,
        IsTeam: 0,
      });
      message.success('发放成功');
      reloadCurrentGrid();
    },
    title: '发放佣金',
  });
}

function handleOneKeySend() {
  const rows = gridRefs.value[0]?.getCheckboxRecords() ?? [];
  if (rows.length === 0) {
    message.warning('请先勾选记录');
    return;
  }
  const ids = rows
    .map((row) => row.Id)
    .filter((id) => id !== undefined && id !== null)
    .join(',');
  Modal.confirm({
    content: `确认一键发放已勾选的 ${rows.length} 条佣金记录？`,
    onOk: async () => {
      await oneKeySendCommissionApi({
        Ids: ids,
        IsDeduct: 2,
        IsMulti: 0,
        IsTeam: 0,
      });
      message.success('发放成功');
      reloadCurrentGrid();
    },
    title: '一键发放',
  });
}

const tabs = computed(() =>
  [
    {
      config: {
        columns: [
          { field: 'TemplateName', title: '方案名称' },
          { field: 'LevelName', title: '等级名称' },
          { field: 'ActiveUser', title: '活跃人数' },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchCommTempListApi(query as never),
        filters: ['username'],
      } satisfies NetcashGridConfig,
      key: 'single',
      permission: 10_201,
      tab: '单层佣金方案',
    },
    {
      config: {
        columns: [
          { field: 'TemplateName', title: '方案名称' },
          { field: 'LevelName', title: '等级名称' },
          { field: 'ActiveUser', title: '活跃人数' },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchMultCommTempListApi(query as never),
        filters: ['username'],
      } satisfies NetcashGridConfig,
      key: 'multi',
      permission: 12_539,
      tab: '多层佣金方案',
    },
    {
      config: {
        columns: [
          { field: 'TemplateName', title: '模板名称' },
          { field: 'GameName', title: '场馆' },
          { field: 'Rate', title: '费率' },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchVenueTemplateListApi(query as never),
        filters: [],
      } satisfies NetcashGridConfig,
      key: 'venue',
      permission: 10_202,
      tab: '场馆费率',
    },
    {
      config: {
        actionWidth: 120,
        columns: [
          { field: 'Username', title: '代理账号' },
          {
            field: 'CommissionMoney',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '佣金金额',
          },
          {
            field: 'ReportDay',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '报表日期',
          },
        ],
        enableCheckbox: true,
        fetchApi: (query: Record<string, unknown>) =>
          fetchSendCommListApi(query as never),
        filters: ['username', 'date'],
        showActions: true,
      } satisfies NetcashGridConfig,
      key: 'grant',
      permission: 10_203,
      tab: '发放佣金',
    },
    {
      config: {
        columns: [
          { field: 'Username', title: '代理账号' },
          {
            field: 'CommissionMoney',
            formatter: (value) => formatAmountFromCent(Number(value)),
            title: '佣金金额',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '发放时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchTeamCommListApi(query as never),
        filters: ['username', 'date'],
      } satisfies NetcashGridConfig,
      key: 'record',
      permission: 11_478,
      tab: '佣金记录',
    },
    {
      config: {
        columns: [
          { field: 'TemplateName', title: '算法模板' },
          { field: 'AlgorithmName', title: '算法名称' },
          { field: 'Rate', title: '比例' },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchCommAlgorithmDataApi(query as never),
        filters: [],
      } satisfies NetcashGridConfig,
      key: 'algorithm',
      permission: 10_204,
      tab: '佣金算法设置',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('single');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'single';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 佣金管理"
    title="佣金管理"
  >
    <Card>
      <div v-if="activeTab === 'grant' && canOneKeySend" class="mb-4">
        <Space>
          <Button type="primary" @click="handleOneKeySend">一键发放</Button>
        </Space>
      </div>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <NetcashGridPanel
            v-if="activeTab === item.key"
            ref="gridRefs"
            :config="item.config"
          >
            <template v-if="item.key === 'grant'" #actions="{ row }">
              <Button
                v-if="canSendCommission"
                size="small"
                type="link"
                @click="handleSendCommission(row)"
              >
                发放
              </Button>
            </template>
          </NetcashGridPanel>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无佣金管理查看权限" title="403" />
</template>
