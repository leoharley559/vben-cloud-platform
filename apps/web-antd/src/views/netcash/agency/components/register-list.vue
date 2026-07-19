<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AgencyRegisterItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import {
  approveAgencyRegisterApi,
  fetchAgencyRegisterListApi,
} from '#/api/netcash/agency';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { REGISTER_STATUS_MAP, formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'AgencyRegisterList' });

const { checkPermission } = useCloudPermission();

const canViewList = computed(() => checkPermission(10132));
const canAudit = computed(() => checkPermission(10134));

const filterUsername = ref('');
const filterStatus = ref<number | string>();

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    Page: page.currentPage,
    PageSize: page.pageSize,
    Status: filterStatus.value || '',
    Username: filterUsername.value,
  };
}

const gridOptions: VxeTableGridOptions<AgencyRegisterItem> = {
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
    { field: 'Username', minWidth: 120, title: '代理账号' },
    { field: 'MobileNumber', minWidth: 120, title: '手机号' },
    { field: 'Email', minWidth: 160, title: '邮箱' },
    { field: 'DeveloperName', minWidth: 120, title: '发展人' },
    { field: 'RegisterIP', minWidth: 120, title: '注册IP' },
    { field: 'RegisterDevice', minWidth: 140, title: '注册设备' },
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
        const result = await fetchAgencyRegisterListApi(getQueryParams(page));
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleAudit(row: AgencyRegisterItem, isAccept: number) {
  const actionText = isAccept === 1 ? '通过' : '拒绝';
  Modal.confirm({
    content: `确认${actionText}该注册申请？`,
    onOk: async () => {
      await approveAgencyRegisterApi({ Id: row.Id, IsAccept: isAccept });
      message.success('操作成功');
      gridApi.reload();
    },
    title: '审核确认',
  });
}

onMounted(() => {
  if (canViewList.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewList">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterUsername"
        allow-clear
        placeholder="代理账号"
        style="width: 200px"
      />
      <Select
        v-model:value="filterStatus"
        allow-clear
        class="w-32"
        :options="[
          { label: '待审核', value: 1 },
          { label: '已通过', value: 2 },
          { label: '已拒绝', value: 3 },
        ]"
        placeholder="状态"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag>
          {{ REGISTER_STATUS_MAP[Number(row.Status)] || row.Status }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Space v-if="canAudit && row.Status === 1">
          <Button size="small" type="link" @click="handleAudit(row, 1)">
            同意
          </Button>
          <Button danger size="small" type="link" @click="handleAudit(row, 0)">
            拒绝
          </Button>
        </Space>
      </template>
    </Grid>
  </div>
</template>
