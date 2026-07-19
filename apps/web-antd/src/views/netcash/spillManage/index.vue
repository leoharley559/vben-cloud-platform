<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SpillManageItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Statistic,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  auditSpillManageApi,
  fetchSpillManageListApi,
} from '#/api/netcash/spill-manage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  SPILL_STATUS_COLOR,
  SPILL_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

defineOptions({ name: 'SpillManage' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canViewPage = computed(() => checkPermission(10168));
const canAudit = computed(() => checkPermission(10169));

const defaultBegin = dayjs().subtract(30, 'day').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterLoginAccount = ref('');
const filterAccount = ref('');
const filterPackageId = ref<number | string>();
const filterStatus = ref<number | string>();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const applyTotal = ref(0);

const packageOptions = computed(() => {
  const list = projectConfig.value?.RealPackageIdNameMap || [];
  return list.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  }));
});

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    Account: filterAccount.value,
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    Status: filterStatus.value || '',
    TimeBegin: begin ? begin.startOf('day').unix() : defaultBegin.unix(),
    TimeEnd: end ? end.endOf('day').unix() : defaultEnd.unix(),
    VipLevel: -1,
  };
}

const gridOptions: VxeTableGridOptions<SpillManageItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '申请时间',
    },
    { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
    {
      field: 'RegisterTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '注册时间',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined ? '-' : `VIP${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    { field: 'OwnerAccount', minWidth: 120, title: '所属账号' },
    { field: 'Account', minWidth: 120, title: '转线账号' },
    { field: 'Url', minWidth: 160, title: '溢出链接' },
    { field: 'ApproveName', minWidth: 100, title: '操作人' },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '操作时间',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchSpillManageListApi(getQueryParams(page));
        const items = result.Items || [];
        applyTotal.value = Number(result.Pagination?.MaxCount || items.length);
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleAudit(row: SpillManageItem, status: number) {
  const actionText = status === 2 ? '通过' : '拒绝';
  Modal.confirm({
    content: `确认${actionText}该溢出申请？`,
    onOk: async () => {
      await auditSpillManageApi({ Id: row.Id, Status: status });
      message.success('操作成功');
      gridApi.reload();
    },
    title: '审核确认',
  });
}

onMounted(() => {
  if (canViewPage.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 溢出管理"
    title="溢出管理"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="游戏账号"
          style="width: 200px"
        />
        <Input
          v-model:value="filterAccount"
          allow-clear
          placeholder="转线账号"
          style="width: 200px"
        />
        <Select
          v-model:value="filterPackageId"
          allow-clear
          class="w-40"
          :options="packageOptions"
          placeholder="产品包"
        />
        <Select
          v-model:value="filterStatus"
          allow-clear
          class="w-32"
          :options="[
            { label: '申请中', value: 1 },
            { label: '已通过', value: 2 },
            { label: '已拒绝', value: 3 },
          ]"
          placeholder="状态"
        />
        <DatePicker.RangePicker v-model:value="filterDateRange" show-time />
        <Button type="primary" @click="gridApi.reload()">查询</Button>
      </div>

      <Statistic class="mb-4" title="申请数量" :value="applyTotal" />

      <Grid>
        <template #status="{ row }">
          <Tag :color="SPILL_STATUS_COLOR[Number(row.Status)] || 'default'">
            {{ SPILL_STATUS_MAP[Number(row.Status)] || row.Status }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Space v-if="canAudit && row.Status === 1">
            <Button size="small" type="link" @click="handleAudit(row, 2)">
              同意
            </Button>
            <Button
              danger
              size="small"
              type="link"
              @click="handleAudit(row, 3)"
            >
              拒绝
            </Button>
          </Space>
        </template>
      </Grid>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无溢出管理查看权限" title="403" />
</template>
