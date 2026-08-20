<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CardMultiBindListItem } from '#/types/card-multi-bind';

import { computed, onMounted, ref } from 'vue';

import { Button, Input, message, Modal, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCardMultiBindApi,
  fetchCardMultiBindListApi,
} from '#/api/memberManage/card-multi-bind';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatCardMultiBindCategory } from '#/types/card-multi-bind';

import CardMultiBindFormModal from './card-multi-bind-form-modal.vue';

defineOptions({ name: 'CardMultiBindList' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(12_702));

const defaultBegin = dayjs().subtract(1, 'month').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterBankAccount = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);

const formOpen = ref(false);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BankAccount: filterBankAccount.value.trim() || undefined,
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<CardMultiBindListItem> = {
  columns: [
    { type: 'seq', title: '序号', width: 60 },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '添加时间',
    },
    {
      field: 'Category',
      formatter: ({ cellValue }) =>
        formatCardMultiBindCategory(Number(cellValue)),
      minWidth: 110,
      title: '账户类型',
    },
    { field: 'BankCardNum', minWidth: 180, title: '账号' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'HandlerName', minWidth: 110, title: '操作人' },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 80,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchCardMultiBindListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterBankAccount.value = '';
  filterDateRange.value = [defaultBegin, defaultEnd];
  gridApi.reload();
}

function openCreate() {
  formOpen.value = true;
}

function handleDelete(row: CardMultiBindListItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确认删除该多账号绑定记录？',
    title: '删除确认',
    onOk: async () => {
      await deleteCardMultiBindApi(row.Id!);
      message.success('删除成功');
      gridApi.reload();
    },
  });
}

onMounted(() => {
  if (canView.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <OpsListPanel v-if="canView">
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterBankAccount"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入账号"
        >
          <template #addonBefore>账号</template>
        </Input>
      </div>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker v-model="filterDateRange" label="添加时间" />
      </div>
      <div class="query-filter-actions">
        <Space>
          <Button :loading="loading" type="primary" @click="handleSearch">
            查询
          </Button>
          <Button @click="handleReset">重置</Button>
          <Button type="primary" @click="openCreate">新增</Button>
        </Space>
      </div>
    </template>

    <Grid>
      <template #actions="{ row }">
        <Button danger size="small" type="link" @click="handleDelete(row)">
          删除
        </Button>
      </template>
    </Grid>

    <CardMultiBindFormModal
      v-model:open="formOpen"
      @success="gridApi.reload()"
    />
  </OpsListPanel>
</template>
