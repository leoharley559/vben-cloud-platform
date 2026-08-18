<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Result,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { drawmoneyRequest } from '#/api/netcash/drawmoney-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import { payTypeLabel } from '../shared';
import ThirdChannelModals from './third-channel-modals.vue';

defineOptions({ name: 'DrawmoneyThirdChannelPanel' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(10_987));

const money = (v: unknown) => formatAmountFromCent(Number(v || 0));
const name = ref('');
const status = ref<number | string>('');
const thirdModalsRef = ref<InstanceType<typeof ThirdChannelModals>>();

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'ShowName', minWidth: 160, title: '第三方支付名称' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue as string),
      minWidth: 160,
      title: '创建时间',
    },
    {
      field: 'PayType',
      formatter: ({ cellValue }) => payTypeLabel(cellValue),
      minWidth: 110,
      title: '支付类型',
    },
    { field: 'Rate', minWidth: 90, title: '费率' },
    {
      field: 'MinDayMoney',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 100,
      title: '每日下限',
    },
    {
      field: 'MaxDayMoney',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 100,
      title: '每日上限',
    },
    {
      field: 'MinOrderMoney',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 100,
      title: '单笔下限',
    },
    {
      field: 'MaxOrderMoney',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 100,
      title: '单笔上限',
    },
    { field: 'SupportBank', minWidth: 160, title: '支持银行' },
    {
      field: 'AisleBalance',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 110,
      title: '通道余额',
    },
    {
      field: 'TotalAmount',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 110,
      title: '累计金额',
    },
    { field: 'TotalCount', minWidth: 100, title: '累计订单' },
    { field: 'Description', minWidth: 140, title: '备注' },
    {
      field: 'OnShelf',
      slots: { default: 'shelf' },
      title: '上架状态',
      width: 100,
    },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 160,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await drawmoneyRequest.thirdList({
            OnShelf: status.value,
            Page: page.currentPage,
            PageSize: page.pageSize,
            ShowName: name.value,
          });
          return {
            items: result.Items || [],
            total: Number(result.Pagination?.MaxCount || 0),
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [ThirdGrid, thirdGridApi] = useVbenVxeGrid({ gridOptions });

function resetAndReload() {
  name.value = '';
  status.value = '';
  thirdGridApi.reload();
}

async function shelf(row: Record<string, unknown>, checked: boolean) {
  if (checked) {
    if (!row.AgentParams) {
      message.warning('请先设置通道密钥');
      return;
    }
    try {
      if (Object.values(JSON.parse(String(row.AgentParams))).some((v) => !v)) {
        message.warning('请完整填写通道密钥');
        return;
      }
    } catch {
      message.warning('通道密钥格式错误');
      return;
    }
  }
  try {
    await drawmoneyRequest.channelShelf({
      Id: row.Id,
      OnShelf: checked ? 1 : 2,
    });
    message.success('切换成功');
    thirdGridApi.reload();
  } catch {
    /* */
  }
}

function onThirdSaved() {
  thirdGridApi.reload();
}
</script>

<template>
  <Result
    v-if="!canView"
    status="403"
    sub-title="无第三方支付通道查看权限"
    title="403"
  />
  <div v-else>
    <Space class="mb-3">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="name"
          style="width: 240px"
          allow-clear
          placeholder="请输入第三方名称"
        >
          <template #addonBefore>第三方名称</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">上架状态</span>
        <Select
          v-model:value="status"
          allow-clear
          :options="[
            { label: '上架', value: 1 },
            { label: '下架', value: 2 },
          ]"
          style="width: 130px"
          placeholder="请选择上架状态"
        />
      </Space.Compact>
      <Button type="primary" @click="thirdGridApi.reload()">查询</Button>
      <Button @click="resetAndReload">重置</Button>
    </Space>

    <ThirdGrid>
      <template #shelf="{ row }">
        <Switch
          :checked="Number(row.OnShelf) === 1"
          :disabled="!checkPermission(11023)"
          @change="(v) => shelf(row, !!v)"
        />
      </template>
      <template #actions="{ row }">
        <Button
          v-if="checkPermission(10988) && Number(row.OnShelf) !== 1"
          type="link"
          @click="thirdModalsRef?.openEdit(row)"
        >
          通道设置
        </Button>
        <Button
          v-if="checkPermission(10990)"
          type="link"
          :disabled="Number(row.OnShelf) === 1"
          @click="thirdModalsRef?.openSecret(row)"
        >
          密钥管理
        </Button>
      </template>
    </ThirdGrid>

    <ThirdChannelModals ref="thirdModalsRef" @saved="onThirdSaved" />
  </div>
</template>
