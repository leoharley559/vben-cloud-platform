<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Dropdown,
  Input,
  Menu,
  Modal,
  Select,
  Space,
  Switch,
  message,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import {
  fetchVoucherGlobalConfigApi,
  fetchVoucherListApi,
  offshelfVoucherApi,
  switchVoucherGlobalConfigApi,
} from '#/api/operationManage/voucher';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import VoucherDetailModal from './voucher-detail-modal.vue';
import VoucherGlobalConfigModal from './voucher-global-config-modal.vue';
import VoucherUpsertModal from './voucher-upsert-modal.vue';
import {
  VOUCHER_TYPE_OPTIONS,
  formatEffectiveTime,
  formatVoucherDateTime,
  formatVoucherType,
  resolveVoucherDesc,
  resolveVoucherName,
} from './voucher-shared';

defineOptions({ name: 'VoucherActivePanel' });

const props = defineProps<{
  isHistory?: boolean;
}>();

interface VoucherRow {
  Desc?: string;
  Duration?: number;
  DurationDays?: number;
  DurationEndTime?: number | string;
  DurationStartTime?: number | string;
  Id: number | string;
  IsActive?: boolean | number;
  LangText?: unknown;
  OffShelveTime?: number | string;
  Type?: number;
}

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() =>
  props.isHistory ? checkPermission(13356) : checkPermission(13354),
);
const canConfig = computed(() => checkPermission(13353) && !props.isHistory);
const canCreate = computed(() => checkPermission(13403) && !props.isHistory);
const canEdit = computed(() => checkPermission(13404) && !props.isHistory);
const canOffshelf = computed(() => checkPermission(13405) && !props.isHistory);
const canClone = computed(() => checkPermission(13357) && props.isHistory);
/** 当前票券详情 13351；历史票券详情 13352（对齐旧站） */
const canViewDetail = computed(() =>
  props.isHistory ? checkPermission(13352) : checkPermission(13351),
);

const globalActive = ref(false);
const globalLoading = ref(false);
const configOpen = ref(false);
const upsertOpen = ref(false);
const upsertMode = ref<'add' | 'clone' | 'edit'>('add');
const upsertId = ref<number | string>();
const upsertType = ref<number>(1);
const actionId = ref<number | string>();
const detailOpen = ref(false);
const detailVoucher = ref<VoucherRow | null>(null);

const filterId = ref('');
const filterName = ref('');
const filterType = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const typeFilterOptions = VOUCHER_TYPE_OPTIONS.filter(
  (item) => item.value !== '',
);
const addTypeOptions = VOUCHER_TYPE_OPTIONS.filter((item) => item.value !== '');

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  const base: Record<string, unknown> = {
    Id: filterId.value.trim(),
    Name: filterName.value.trim(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    Type: filterType.value === '' ? '' : filterType.value,
  };

  if (props.isHistory) {
    return {
      ...base,
      ClaimBeginTime: begin ? begin.unix() : '',
      ClaimEndTime: end ? end.unix() : '',
      IsExp: false,
      IsHistory: true,
    };
  }

  return {
    ...base,
    EndTime: end ? end.unix() : '',
    StartTime: begin ? begin.unix() : '',
  };
}

async function loadGlobalConfig() {
  if (!canConfig.value) {
    return;
  }
  globalLoading.value = true;
  try {
    const data = await fetchVoucherGlobalConfigApi();
    globalActive.value = Boolean(data?.IsActive);
  } finally {
    globalLoading.value = false;
  }
}

onMounted(() => {
  void loadGlobalConfig();
});

const gridOptions: VxeTableGridOptions<VoucherRow> = {
  columns: [
    ...(props.isHistory
      ? []
      : [
          {
            field: 'IsActive',
            minWidth: 100,
            slots: { default: 'activeSwitch' },
            title: '当前状态',
          } as const,
        ]),
    { field: 'Id', minWidth: 90, title: '票券ID' },
    {
      field: 'LangText',
      minWidth: 140,
      slots: { default: 'name' },
      title: '票券名称',
    },
    {
      field: 'Type',
      formatter: ({ cellValue }) => formatVoucherType(cellValue),
      minWidth: 120,
      title: '票券类型',
    },
    {
      field: 'Duration',
      formatter: ({ row }) => formatEffectiveTime(row),
      minWidth: 200,
      title: '有效时间',
    },
    ...(props.isHistory
      ? [
          {
            field: 'OffShelveTime',
            formatter: ({ cellValue }: { cellValue?: number | string }) =>
              formatVoucherDateTime(cellValue),
            minWidth: 160,
            title: '下架时间',
          } as const,
        ]
      : []),
    {
      field: 'Desc',
      formatter: ({ row }) => resolveVoucherDesc(row.LangText),
      minWidth: 220,
      title: '票券描述',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: props.isHistory ? 100 : 140,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchVoucherListApi(buildQuery(page));
        const items = (result.Items || []) as unknown as VoucherRow[];
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
  filterId.value = '';
  filterName.value = '';
  filterType.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openAdd(type: number) {
  upsertMode.value = 'add';
  upsertId.value = undefined;
  upsertType.value = type;
  upsertOpen.value = true;
}

function openEdit(row: VoucherRow) {
  upsertMode.value = 'edit';
  upsertId.value = row.Id;
  upsertType.value = Number(row.Type || 1);
  upsertOpen.value = true;
}

function openClone(row: VoucherRow) {
  upsertMode.value = 'clone';
  upsertId.value = row.Id;
  upsertType.value = Number(row.Type || 1);
  upsertOpen.value = true;
}

function openDetail(row: VoucherRow) {
  if (!canViewDetail.value) {
    return;
  }
  detailVoucher.value = row;
  detailOpen.value = true;
}

function isRowActive(row: VoucherRow) {
  return Number(row.IsActive) === 1 || row.IsActive === true;
}

async function handleToggleGlobal(checked: boolean | string | number) {
  Modal.confirm({
    content: '确认切换票券中心全局开关？',
    onOk: async () => {
      globalLoading.value = true;
      try {
        await switchVoucherGlobalConfigApi();
        globalActive.value = Boolean(checked);
        message.success('切换成功');
        await loadGlobalConfig();
      } catch {
        globalActive.value = !Boolean(checked);
      } finally {
        globalLoading.value = false;
      }
    },
    onCancel: () => {
      globalActive.value = !Boolean(checked);
    },
    title: '票券中心开关',
  });
}

function handleOffshelf(row: VoucherRow) {
  Modal.confirm({
    content: `确认下架票券「${resolveVoucherName(row.LangText)}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await offshelfVoucherApi(row.Id);
        message.success('下架成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '下架票券',
  });
}
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
              <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterId"
            allow-clear
            placeholder="请输入票券ID"
          >
            <template #addonBefore>票券ID</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">票券类型</span>
          <Select
            v-model:value="filterType"
            allow-clear
           
            :options="typeFilterOptions"
            placeholder="请选择票券类型"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterName"
            allow-clear
            placeholder="请输入票券名称"
          >
            <template #addonBefore>票券名称</template>
          </Input>
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions">
          <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
        <Space v-if="!isHistory">
        <span v-if="canConfig" class="inline-flex items-center gap-2 text-sm">
          票券中心开关
          <Switch
            :checked="globalActive"
            :loading="globalLoading"
            @change="handleToggleGlobal"
          />
        </span>
        <Button v-if="canConfig" @click="configOpen = true">全局设置</Button>
        <Dropdown v-if="canCreate" :trigger="['click']">
          <Button type="primary">新增票券</Button>
        </div>
          <template #overlay>
            <Menu @click="({ key }) => openAdd(Number(key))">
              <Menu.Item
                v-for="item in addTypeOptions"
                :key="String(item.value)"
              >
                {{ item.label }}
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </Space>
    </div>
  </div>

    <Grid>
      <template #name="{ row }">
        <Button
          v-if="canViewDetail"
          size="small"
          type="link"
          @click="openDetail(row)"
        >
          {{ resolveVoucherName(row.LangText) || '-' }}
        </Button>
        <span v-else>{{ resolveVoucherName(row.LangText) || '-' }}</span>
      </template>
      <template #activeSwitch="{ row }">
        <Switch
          :checked="isRowActive(row)"
          :disabled="!canOffshelf"
          :loading="actionId === row.Id"
          @change="() => handleOffshelf(row)"
        />
      </template>
      <template #action="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canClone"
            size="small"
            type="link"
            @click="openClone(row)"
          >
            克隆
          </Button>
          <span v-if="!canEdit && !canClone">-</span>
        </Space>
      </template>
    </Grid>

    <VoucherGlobalConfigModal v-model:open="configOpen" />
    <VoucherUpsertModal
      v-model:open="upsertOpen"
      :mode="upsertMode"
      :voucher-id="upsertId"
      :voucher-type="upsertType"
      @success="gridApi.reload()"
    />
    <VoucherDetailModal
      v-model:open="detailOpen"
      :show-payout="!isHistory"
      :voucher="detailVoucher"
    />
  </div>
  <div v-else class="py-8 text-center text-gray-400">无列表查看权限</div>
</template>
