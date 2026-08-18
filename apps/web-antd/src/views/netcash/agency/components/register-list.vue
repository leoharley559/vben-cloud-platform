<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AgencyRegisterItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';

import { Button, Input, message, Modal, Select, Space, Switch, Tag } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  approveAgencyRegisterApi,
  fetchAgencyRegisterListApi,
  switchAgencyAutoAuditApi,
} from '#/api/netcash/agency';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'AgencyRegisterList' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(10_132));
const canApprove = computed(() => checkPermission(10_134));
const canReject = computed(() => checkPermission(10_135));
const canAutoAudit = computed(() => checkPermission(10_136));
const username = ref('');
const email = ref('');
const regIp = ref('');
const mobile = ref('');
const approve = ref<number | string>('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const autoAudit = ref(false);
const selectedRows = ref<AgencyRegisterItem[]>([]);

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    Approve: approve.value,
    BeginTime: dateRange.value?.[0]?.unix() || '',
    Email: email.value,
    EndTime: dateRange.value?.[1]?.unix() || '',
    Mobile: mobile.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    RegIp: regIp.value,
    Username: username.value,
  };
}

const gridOptions: VxeTableGridOptions<AgencyRegisterItem> = {
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'Approve', minWidth: 90, slots: { default: 'status' }, title: '状态' },
    { field: 'CreateTime', formatter: ({ cellValue }) => formatNetcashDateTime(cellValue), minWidth: 165, title: '申请时间' },
    { field: 'Username', minWidth: 120, title: '代理账号' },
    { field: 'Mobile', minWidth: 120, title: '手机号' },
    { field: 'Email', minWidth: 160, title: '邮箱' },
    { field: 'DeveloperName', minWidth: 120, title: '发展人' },
    { field: 'CloneChannelPlanName', minWidth: 130, title: '克隆渠道方案' },
    { field: 'RegIp', minWidth: 120, title: '注册 IP' },
    { field: 'DevicePlatform', minWidth: 120, title: '注册设备' },
    { field: 'ApproveName', minWidth: 120, title: '审核人' },
    { field: 'action', fixed: 'right', minWidth: 140, slots: { default: 'action' }, title: '操作' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  checkboxConfig: { checkMethod: ({ row }) => Number(row.Approve ?? row.Status) === 1 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await fetchAgencyRegisterListApi(getQueryParams(page));
          const items = result?.Items || [];
          const config = (result as Record<string, unknown>)?.Config as
            | Record<string, unknown>
            | undefined;
          const enable = Number(config?.Enable);
          if (enable) autoAudit.value = enable === 1;
          return {
            items,
            total: Number(result?.Pagination?.MaxCount || items.length),
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
};
const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: AgencyRegisterItem[] }) => (selectedRows.value = records),
    checkboxChange: ({ records }: { records: AgencyRegisterItem[] }) => (selectedRows.value = records),
  },
  gridOptions,
});

function audit(rows: AgencyRegisterItem[], status: 2 | 3) {
  const ids = rows.map((row) => row.Id).filter(Boolean).join(',');
  if (!ids) return;
  const action = status === 2 ? '通过' : '拒绝';
  Modal.confirm({
    content: `确认${action}所选注册申请？`,
    title: `${action}审核`,
    onOk: async () => {
      try {
        await approveAgencyRegisterApi({ Approve: status, Ids: ids });
        message.success('操作成功');
        selectedRows.value = [];
        gridApi.reload();
      } catch {
        // 全局拦截已提示
      }
    },
  });
}
async function toggleAutoAudit(checked: boolean) {
  const previous = autoAudit.value;
  autoAudit.value = checked;
  try {
    await switchAgencyAutoAuditApi({ Enable: checked ? 1 : 2 });
    message.success('自动审核设置已更新');
    gridApi.reload();
  } catch {
    autoAudit.value = previous;
  }
}
function reset() {
  username.value = email.value = regIp.value = mobile.value = '';
  approve.value = '';
  dateRange.value = undefined;
  gridApi.reload();
}
onMounted(() => canView.value && gridApi.reload());
</script>

<template>
  <div v-if="canView">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="username"
          allow-clear
          placeholder="请输入代理账号"
        >
          <template #addonBefore>代理账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="email"
          allow-clear
          placeholder="请输入申请邮箱"
        >
          <template #addonBefore>申请邮箱</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="regIp"
          allow-clear
          placeholder="请输入注册 IP"
        >
          <template #addonBefore>注册 IP</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="mobile"
          allow-clear
          placeholder="请输入手机号"
        >
          <template #addonBefore>手机号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">审核状态</span>
        <Select
          v-model:value="approve"
          allow-clear
          :options="[{ label: '待审核', value: 1 }, { label: '已通过', value: 2 }, { label: '已拒绝', value: 3 }]"
          placeholder="请选择审核状态"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="reset">重置</Button>
        </div>
    </div>
  </div>
    <div class="mb-3 flex flex-wrap items-center justify-end gap-2">
      <Button v-if="canApprove" type="primary" :disabled="!selectedRows.length" @click="audit(selectedRows, 2)">批量通过</Button>
      <Button v-if="canReject" danger :disabled="!selectedRows.length" @click="audit(selectedRows, 3)">批量拒绝</Button>
      <Space v-if="canAutoAudit">
        <span>自动审核</span>
        <Switch :checked="autoAudit" @change="(value) => toggleAutoAudit(!!value)" />
      </Space>
    </div>
    <Grid>
      <template #status="{ row }">
        <Tag :color="Number(row.Approve ?? row.Status) === 2 ? 'success' : Number(row.Approve ?? row.Status) === 3 ? 'error' : 'default'">
          {{ Number(row.Approve ?? row.Status) === 2 ? '已通过' : Number(row.Approve ?? row.Status) === 3 ? '已拒绝' : '待审核' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Space v-if="Number(row.Approve ?? row.Status) === 1">
          <Button v-if="canApprove" size="small" type="link" @click="audit([row], 2)">通过</Button>
          <Button v-if="canReject" danger size="small" type="link" @click="audit([row], 3)">拒绝</Button>
        </Space>
      </template>
    </Grid>
  </div>
</template>
