<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Button, DatePicker, Input, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchRewardProductListApi,
  fetchRewardProductTagListApi,
} from '#/api/operationManage/reward-mall';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import GoodsDetailsModal from './goods-details-modal.vue';
import GoodsUpsertModal from './goods-upsert-modal.vue';
import {
  PRODUCT_TYPE_OPTIONS,
  formatEffectiveTime,
  resolveProductDesc,
  resolveProductName,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsHistoryPanel' });

interface GoodsRow {
  ExchangedCount?: number;
  Id: number | string;
  LangText?: unknown;
  ProductExchangePoints?: number;
  ProductTag?: number;
  ProductType?: number;
  ProductValidEndTime?: number | string;
  ProductValidStartTime?: number | string;
}

const cloneOpen = ref(false);
const cloneMode = ref<'add' | 'clone' | 'edit'>('clone');
const cloneId = ref<number | string>();
const detailsOpen = ref(false);
const detailsProduct = ref<GoodsRow | null>(null);

const filterName = ref('');
const filterType = ref<number | string>('');
const filterTag = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const tagOptions = ref<Array<{ label: string; value: number }>>([]);
const tagNameMap = ref<Record<string, string>>({});

async function loadTagOptions() {
  try {
    const result = await fetchRewardProductTagListApi();
    const items = result.Items || [];
    tagOptions.value = items.map((item) => ({
      label: resolveProductName(item.LangText) || `页签${item.Id}`,
      value: Number(item.Id),
    }));
    tagNameMap.value = Object.fromEntries(
      tagOptions.value.map((item) => [String(item.value), item.label]),
    );
  } catch {
    tagOptions.value = [];
  }
}

onMounted(() => {
  void loadTagOptions();
});

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    IsHistory: true,
    Page: page.currentPage,
    PageSize: page.pageSize,
    ProductName: filterName.value.trim(),
    ProductTag: filterTag.value === '' ? '' : filterTag.value,
    ProductType: filterType.value === '' ? '' : filterType.value,
    ProductValidEndTime: end ? end.endOf('day').unix() : '',
    ProductValidStartTime: begin ? begin.startOf('day').unix() : '',
  };
}

const gridOptions: VxeTableGridOptions<GoodsRow> = {
  columns: [
    { type: 'seq', minWidth: 60, title: '序号' },
    { field: 'Id', minWidth: 80, title: '商品ID' },
    {
      field: 'LangText',
      minWidth: 150,
      slots: { default: 'name' },
      title: '商品名称',
    },
    {
      field: 'ProductTag',
      formatter: ({ cellValue }) => tagNameMap.value[String(cellValue)] || '-',
      minWidth: 120,
      title: '商品页签',
    },
    {
      field: 'ProductType',
      formatter: ({ cellValue }) =>
        PRODUCT_TYPE_OPTIONS.find((item) => item.value === Number(cellValue))
          ?.label || String(cellValue ?? '-'),
      minWidth: 100,
      title: '商品类型',
    },
    {
      field: 'ProductValidStartTime',
      formatter: ({ row }) => formatEffectiveTime(row),
      minWidth: 200,
      title: '有效时间',
    },
    { field: 'ProductExchangePoints', minWidth: 100, title: '兑换要求' },
    {
      field: 'ExchangedCount',
      minWidth: 110,
      slots: { default: 'redeemed' },
      title: '已兑换数量',
    },
    {
      field: 'Desc',
      formatter: ({ row }) => resolveProductDesc(row.LangText) || '-',
      minWidth: 200,
      title: '商品描述',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 90,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRewardProductListApi(buildQuery(page));
        const items = (result.Items || []) as unknown as GoodsRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterName.value = '';
  filterType.value = '';
  filterTag.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openClone(row: GoodsRow) {
  cloneMode.value = 'clone';
  cloneId.value = row.Id;
  cloneOpen.value = true;
}

function openDetails(row: GoodsRow) {
  detailsProduct.value = row;
  detailsOpen.value = true;
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <DatePicker.RangePicker v-model:value="filterDateRange" show-time />
      <Input
        v-model:value="filterName"
        allow-clear
        placeholder="商品名称"
        style="width: 160px"
      />
      <Select
        v-model:value="filterType"
        allow-clear
        class="w-32"
        :options="PRODUCT_TYPE_OPTIONS"
        placeholder="商品类型"
      />
      <Select
        v-model:value="filterTag"
        allow-clear
        class="w-32"
        :options="tagOptions"
        placeholder="商品页签"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
    </div>

    <Grid>
      <template #name="{ row }">
        {{ resolveProductName(row.LangText) || '-' }}
      </template>
      <template #redeemed="{ row }">
        <Button size="small" type="link" @click="openDetails(row)">
          {{ row.ExchangedCount ?? 0 }}
        </Button>
      </template>
      <template #action="{ row }">
        <Button size="small" type="link" @click="openClone(row)">克隆</Button>
      </template>
    </Grid>

    <GoodsUpsertModal
      v-model:open="cloneOpen"
      :mode="cloneMode"
      :product-id="cloneId"
      @success="gridApi.reload()"
    />
    <GoodsDetailsModal v-model:open="detailsOpen" :product="detailsProduct" />
  </div>
</template>
