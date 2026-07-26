<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Image,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCustomLeagueApi,
  fetchCustomLeagueListApi,
  sortCustomLeagueApi,
  switchCustomLeagueApi,
} from '#/api/operationManage/league-activity';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getServiceImageUrl } from '#/utils/media';
import { formatOperationDateTime } from '#/utils/operation-status';

import {
  ACTIVE_OPTIONS,
  resolveLeagueShortName,
} from './components/custom-league-shared';
import CustomLeagueUpsertModal from './components/custom-league-upsert-modal.vue';

defineOptions({ name: 'CustomLeague' });

interface CustomLeagueRow {
  AppImageStatic?: string;
  CreateTime?: number | string;
  EndTime?: number | string;
  Id: number | string;
  IsActive?: boolean | number;
  LangText?: unknown;
  PackageName?: string;
  PcImage?: string;
  StartTime?: number | string;
}

const { packageOptions } = useOperationOptions();

/* ------------------------------------------------------------------ */
/* 查询条件                                                              */
/* ------------------------------------------------------------------ */

const filterPackageId = ref<number | string>('');
const filterIsActive = ref<number | string>(-1);
const filterLeagueShortName = ref('');
const filterDateRange = ref<[string, string] | undefined>();

const currentRows = ref<CustomLeagueRow[]>([]);

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [start, end] = filterDateRange.value || [];
  return {
    EndTime: end || '',
    IsActive: filterIsActive.value,
    LeagueShortName: filterLeagueShortName.value.trim(),
    Page: page.currentPage,
    PackageIds: filterPackageId.value,
    PageSize: page.pageSize,
    Sort: '',
    StartTime: start || '',
  };
}

const gridOptions: VxeTableGridOptions<CustomLeagueRow> = {
  columns: [
    {
      field: 'IsActive',
      minWidth: 90,
      slots: { default: 'activeSwitch' },
      title: '开关',
    },
    {
      field: 'StartTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '开始日期',
    },
    {
      field: 'EndTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '结束日期',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '创建日期',
    },
    { field: 'PackageName', minWidth: 140, title: '产品' },
    {
      field: 'LeagueName',
      minWidth: 160,
      slots: { default: 'leagueName' },
      title: '联赛名称',
    },
    {
      field: 'PcImage',
      minWidth: 100,
      slots: { default: 'pcImage' },
      title: 'PC图标',
    },
    {
      field: 'AppImageStatic',
      minWidth: 100,
      slots: { default: 'appImage' },
      title: 'APP图标',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchCustomLeagueListApi(buildQuery(page));
        const items = (result.Items || []) as unknown as CustomLeagueRow[];
        currentRows.value = items;
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
  filterPackageId.value = '';
  filterIsActive.value = -1;
  filterLeagueShortName.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

/* ------------------------------------------------------------------ */
/* 开关 / 排序 / 删除                                                      */
/* ------------------------------------------------------------------ */

const switchingId = ref<number | string>();
const sortingId = ref<number | string>();

function isRowActive(row: CustomLeagueRow) {
  return Number(row.IsActive) === 1 || row.IsActive === true;
}

function handleSwitch(row: CustomLeagueRow, checked: boolean | string) {
  const nextActive = checked === true || checked === 'true';
  Modal.confirm({
    cancelText: '取消',
    content: nextActive ? '确认开启该杯赛专题？' : '确认关闭该杯赛专题？',
    okText: '确认',
    onCancel: () => {
      gridApi.reload();
    },
    onOk: async () => {
      switchingId.value = row.Id;
      try {
        await switchCustomLeagueApi({
          Id: row.Id,
          IsActive: nextActive ? 1 : 0,
        });
        message.success('切换成功');
        await gridApi.reload();
      } finally {
        switchingId.value = undefined;
      }
    },
    title: '提示',
  });
}

async function handleSort(
  row: CustomLeagueRow,
  rowIndex: number,
  direction: 'down' | 'up',
) {
  const siblingIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
  const sibling = currentRows.value[siblingIndex];
  if (!sibling) {
    return;
  }
  sortingId.value = row.Id;
  try {
    await sortCustomLeagueApi({ Id1: row.Id, Id2: sibling.Id });
    message.success('排序成功');
    await gridApi.reload();
  } finally {
    sortingId.value = undefined;
  }
}

function handleDelete(row: CustomLeagueRow) {
  Modal.confirm({
    cancelText: '取消',
    content: '确认删除该杯赛专题？',
    okText: '确认',
    onOk: async () => {
      await deleteCustomLeagueApi(row.Id);
      message.success('删除成功');
      await gridApi.reload();
    },
    title: '提示',
  });
}

/* ------------------------------------------------------------------ */
/* 新增 / 编辑                                                            */
/* ------------------------------------------------------------------ */

const upsertOpen = ref(false);
const upsertMode = ref<'add' | 'edit'>('add');
const upsertId = ref<number | string>();

function openAdd() {
  upsertMode.value = 'add';
  upsertId.value = undefined;
  upsertOpen.value = true;
}

function openEdit(row: CustomLeagueRow) {
  upsertMode.value = 'edit';
  upsertId.value = row.Id;
  upsertOpen.value = true;
}

/* ------------------------------------------------------------------ */
/* 图片预览                                                               */
/* ------------------------------------------------------------------ */

const previewOpen = ref(false);
const previewImg = ref('');

function handlePreview(path?: string) {
  if (!path) {
    return;
  }
  previewImg.value = getServiceImageUrl(path);
  previewOpen.value = true;
}
</script>

<template>
  <Page auto-content-height description="运营管理 · 杯赛专题" title="杯赛专题">
    <Card>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">产品</span>
          <Select
            v-model:value="filterPackageId"
            :field-names="{ label: 'PackageName', value: 'PackageId' }"
            :options="packageOptions"
            style="width: 180px"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">开关</span>
          <Select
            v-model:value="filterIsActive"
            :options="ACTIVE_OPTIONS"
            style="width: 120px"
          />
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLeagueShortName"
            allow-clear
            placeholder="请输入联赛名称"
            style="width: 260px"
          >
            <template #addonBefore>联赛名称</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">时间</span>
          <DatePicker.RangePicker
            v-model:value="filterDateRange"
            allow-clear
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </div>
        <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
          <Button type="primary" ghost @click="openAdd">新增</Button>
        </Space>
      </div>

      <Grid>
        <template #activeSwitch="{ row }">
          <Switch
            :checked="isRowActive(row)"
            :loading="switchingId === row.Id"
            @change="
              (checked) => handleSwitch(row, checked as boolean | string)
            "
          />
        </template>
        <template #leagueName="{ row }">
          {{ resolveLeagueShortName(row.LangText) || '-' }}
        </template>
        <template #pcImage="{ row }">
          <div
            v-if="row.PcImage"
            class="flex cursor-pointer items-center justify-center"
            @click="handlePreview(row.PcImage)"
          >
            <img
              alt="PC图标"
              class="h-7 w-10 object-contain"
              :src="getServiceImageUrl(row.PcImage)"
            />
          </div>
          <span v-else>-</span>
        </template>
        <template #appImage="{ row }">
          <div
            v-if="row.AppImageStatic"
            class="flex cursor-pointer items-center justify-center"
            @click="handlePreview(row.AppImageStatic)"
          >
            <img
              alt="APP图标"
              class="h-7 w-10 object-contain"
              :src="getServiceImageUrl(row.AppImageStatic)"
            />
          </div>
          <span v-else>-</span>
        </template>
        <template #action="{ row, rowIndex }">
          <Space :size="4">
            <Button
              :disabled="rowIndex === 0"
              :loading="sortingId === row.Id"
              size="small"
              @click="handleSort(row, rowIndex, 'up')"
            >
              上移
            </Button>
            <Button
              :disabled="rowIndex === currentRows.length - 1"
              :loading="sortingId === row.Id"
              size="small"
              @click="handleSort(row, rowIndex, 'down')"
            >
              下移
            </Button>
            <Button size="small" type="link" @click="openEdit(row)">
              编辑
            </Button>
            <Button danger size="small" type="link" @click="handleDelete(row)">
              删除
            </Button>
          </Space>
        </template>
      </Grid>
    </Card>

    <CustomLeagueUpsertModal
      v-model:open="upsertOpen"
      :league-id="upsertId"
      :mode="upsertMode"
      @success="gridApi.reload()"
    />

    <Modal
      v-model:open="previewOpen"
      :footer="null"
      title="图片预览"
      width="35%"
    >
      <Image :preview="false" :src="previewImg" style="width: 100%" />
    </Modal>
  </Page>
</template>
