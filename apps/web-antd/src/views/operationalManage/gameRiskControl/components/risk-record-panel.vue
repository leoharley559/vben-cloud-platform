<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudListResult } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Result,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  batchDeleteDeviceRiskApi,
  batchDeleteIpRiskApi,
  deleteDeviceRiskApi,
  deleteIpRiskApi,
  fetchGameIpRiskListApi,
  fetchGameRiskListApi,
} from '#/api/operationManage/game-risk-control';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

import RiskRecordCreateModal from './risk-record-create-modal.vue';
import RiskRecordEditModal from './risk-record-edit-modal.vue';
import RiskRecordImportModal from './risk-record-import-modal.vue';

defineOptions({ name: 'RiskRecordPanel' });

const props = defineProps<{
  kind: 'device' | 'ip';
  listType: 'blacklist' | 'whitelist';
}>();

const { checkPermission } = useCloudPermission();

const permissionMap = computed(() => {
  if (props.kind === 'ip' && props.listType === 'blacklist') {
    return { create: 11414, delete: 11417, edit: 11416, view: 11413 };
  }
  if (props.kind === 'device' && props.listType === 'blacklist') {
    return { create: 10050, delete: 10053, edit: 10051, view: 10049 };
  }
  if (props.kind === 'ip' && props.listType === 'whitelist') {
    return { create: 11451, delete: 11454, edit: 11453, view: 11450 };
  }
  return { create: 10067, delete: 10070, edit: 10068, view: 10066 };
});

const canView = computed(() => checkPermission(permissionMap.value.view));
const canCreate = computed(() => checkPermission(permissionMap.value.create));
const canEdit = computed(() => checkPermission(permissionMap.value.edit));
const canDelete = computed(() => checkPermission(permissionMap.value.delete));

const filterKeyword = ref('');
const filterLoginAccount = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(1, 'month').startOf('day'),
  dayjs().endOf('day'),
]);

const createOpen = ref(false);
const importOpen = ref(false);
const editOpen = ref(false);
const editingRow = ref<null | Record<string, unknown>>(null);

const extraQuery = computed(() => {
  if (props.kind === 'ip') {
    return {
      RiskType: 1,
      Type: props.listType === 'whitelist' ? 2 : 1,
    };
  }
  return {
    RiskType: 4,
    Type: props.listType === 'whitelist' ? 2 : 1,
  };
});

const fetchApi = computed(() =>
  props.kind === 'ip' ? fetchGameIpRiskListApi : fetchGameRiskListApi,
);

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : undefined,
    EndTime: end ? end.endOf('day').unix() : undefined,
    Keyword: filterKeyword.value.trim(),
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...extraQuery.value,
  };
}

function resolveListTotal(
  result: CloudListResult<Record<string, unknown>> & { Total?: number },
  items: Record<string, unknown>[],
) {
  const pag = result?.Pagination;
  if (
    pag &&
    pag.MaxCount !== undefined &&
    pag.MaxCount !== null &&
    String(pag.MaxCount) !== ''
  ) {
    return Number(pag.MaxCount);
  }
  const total = Number(result?.Total);
  if (Number.isFinite(total) && total >= 0) {
    return total;
  }
  return items.length;
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'RiskValue',
      minWidth: 160,
      title: props.kind === 'ip' ? 'IP地址' : '设备标识',
    },
    { field: 'LoginAccount', minWidth: 140, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品名称' },
    { field: 'Operator', minWidth: 110, title: '添加人员' },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '操作时间',
    },
    { field: 'HandlerName', minWidth: 110, title: '操作人' },
    { field: 'Desc', minWidth: 140, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = (await fetchApi.value(
          getQueryParams(page),
        )) as CloudListResult<Record<string, unknown>> & { Total?: number };
        const items = result?.Items || [];
        return {
          items,
          total: resolveListTotal(result, items),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function resetFilters() {
  filterKeyword.value = '';
  filterLoginAccount.value = '';
  filterDateRange.value = [
    dayjs().subtract(1, 'month').startOf('day'),
    dayjs().endOf('day'),
  ];
  gridApi.reload();
}

function openEdit(row: Record<string, unknown>) {
  editingRow.value = row;
  editOpen.value = true;
}

function handleDeleteOne(row: Record<string, unknown>) {
  const id = row.Id as number | string | undefined;
  if (id === undefined || id === null || id === '') {
    return;
  }
  Modal.confirm({
    content: '确认删除该记录？',
    onOk: async () => {
      if (props.kind === 'ip') {
        await deleteIpRiskApi(id);
      } else {
        await deleteDeviceRiskApi(id);
      }
      message.success('已删除');
      gridApi.reload();
    },
    title: '删除',
  });
}

function handleBatchDelete() {
  const records =
    (gridApi.grid?.getCheckboxRecords?.() as Array<Record<string, unknown>>) ||
    [];
  const ids = records
    .map((item) => item.Id as number | string)
    .filter((id) => id !== undefined && id !== null && id !== '');
  if (!ids.length) {
    message.warning('请先勾选记录');
    return;
  }
  Modal.confirm({
    content: `确认批量删除选中的 ${ids.length} 条记录？`,
    onOk: async () => {
      if (props.kind === 'ip') {
        await batchDeleteIpRiskApi(ids);
      } else {
        await batchDeleteDeviceRiskApi(ids);
      }
      message.success('批量删除已提交');
      gridApi.reload();
    },
    title: '批量删除',
  });
}

onMounted(() => {
  if (canView.value) {
    gridApi.reload();
  }
});

defineExpose({ reload: () => gridApi.reload() });
</script>

<template>
  <div v-if="canView">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterKeyword"
        allow-clear
        :placeholder="kind === 'ip' ? 'IP地址' : '设备标识'"
        style="width: 180px"
        @press-enter="handleSearch"
      />
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 180px"
        @press-enter="handleSearch"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Space class="ml-auto">
        <Button v-if="canCreate" type="primary" @click="createOpen = true">
          新增
        </Button>
        <Button v-if="canCreate" @click="importOpen = true">批量导入</Button>
        <Button v-if="canDelete" danger @click="handleBatchDelete">
          批量删除
        </Button>
      </Space>
    </div>

    <Grid>
      <template #actions="{ row }">
        <Space :size="0">
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDeleteOne(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <RiskRecordCreateModal
      v-model:open="createOpen"
      :kind="kind"
      :list-type="listType"
      @success="gridApi.reload()"
    />
    <RiskRecordImportModal
      v-model:open="importOpen"
      :kind="kind"
      :list-type="listType"
      @success="gridApi.reload()"
    />
    <RiskRecordEditModal
      v-model:open="editOpen"
      :kind="kind"
      :row="editingRow"
      @success="gridApi.reload()"
    />
  </div>
  <Result
    v-else
    status="403"
    :sub-title="`需要列表权限 ${permissionMap.view}`"
    title="无权限"
  />
</template>
