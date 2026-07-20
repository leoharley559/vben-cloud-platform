<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ChannelDomainOption } from '#/types/channel-config';
import type { AgentDomainRow } from '#/types/netcash';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchAgentDomainListApi,
  fetchAssignableDomainsApi,
  updateAgentDomainApi,
} from '#/api/netcash/agent-domain';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'AgentDomainManage' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_550));
const canExport = computed(() => checkPermission(10_551));
const canMutate = computed(() => checkPermission(10_555));
const filters = reactive({
  AdminStatus: '',
  ChannelId: '',
  NetCashDomain: '',
  NetCashH5Domain: '',
  Sort: '',
  Status: '',
  Type: '',
  Username: '',
});
const rows = ref<AgentDomainRow[]>([]);
const appDomains = ref<ChannelDomainOption[]>([]);
const h5Domains = ref<ChannelDomainOption[]>([]);
const modalOpen = ref(false);
const saving = ref(false);
const exporting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<AgentDomainRow>({});

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 1 },
  { label: '停用', value: 2 },
];
const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '普通', value: 1 },
  { label: '正式', value: 2 },
];

function dateTime(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  const parsed =
    Number.isFinite(numeric) && numeric > 0
      ? dayjs(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
      : dayjs(String(value));
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

const columns: VxeTableGridOptions<AgentDomainRow>['columns'] = [
  { type: 'seq', title: '序号', width: 60 },
  {
    field: 'AdminStatus',
    minWidth: 100,
    slots: { default: 'adminStatus' },
    title: '账号状态',
  },
  { field: 'Username', minWidth: 130, title: '代理账号' },
  { field: 'Name', minWidth: 130, title: '代理名称' },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) => dateTime(cellValue),
    minWidth: 165,
    sortable: true,
    title: '创建时间',
  },
  {
    field: 'Type',
    minWidth: 100,
    slots: { default: 'agentType' },
    title: '代理类型',
  },
  { field: 'ChannelId', minWidth: 105, sortable: true, title: '渠道 ID' },
  {
    field: 'Status',
    minWidth: 100,
    slots: { default: 'channelStatus' },
    title: '渠道状态',
  },
  {
    field: 'NetCashDomain',
    minWidth: 220,
    showOverflow: 'tooltip',
    title: '专属 APP 域名',
  },
  {
    field: 'NetCashH5Domain',
    minWidth: 220,
    showOverflow: 'tooltip',
    title: '专属 H5 域名',
  },
  {
    field: 'HandlerTime',
    formatter: ({ cellValue }) => dateTime(cellValue),
    minWidth: 165,
    sortable: true,
    title: '操作时间',
  },
  { field: 'HandlerName', minWidth: 110, title: '操作人' },
  {
    field: 'actions',
    fixed: 'right',
    minWidth: 90,
    slots: { default: 'actions' },
    title: '操作',
  },
];

function buildQuery(page?: { currentPage: number; pageSize: number }) {
  const currentPage = page?.currentPage ?? 1;
  const pageSize = page?.pageSize ?? 20;
  return {
    ...filters,
    Page: currentPage,
    PageSize: pageSize,
  };
}

const gridOptions: VxeTableGridOptions<AgentDomainRow> = {
  columns,
  height: 'auto',
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    autoLoad: canViewPage.value,
    ajax: {
      query: async ({ page, sort }) => {
        const result = await fetchAgentDomainListApi({
          ...buildQuery(page),
          Sort:
            sort?.field && sort?.order
              ? `${sort.order === 'desc' ? '-' : ''}${sort.field}`
              : filters.Sort,
        });
        rows.value = result.Items;
        return {
          items: rows.value,
          total: Number(result.Pagination?.MaxCount ?? rows.value.length),
        };
      },
    },
  },
  rowConfig: { keyField: 'Id' },
};
const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFirstPage() {
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

function resetFilters() {
  Object.assign(filters, {
    AdminStatus: '',
    ChannelId: '',
    NetCashDomain: '',
    NetCashH5Domain: '',
    Sort: '',
    Status: '',
    Type: '',
    Username: '',
  });
  void reloadFirstPage();
}

function domainUrl(item: ChannelDomainOption) {
  const raw = String(item.Domain || '').replaceAll(/\s+/g, '');
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.${raw}`;
}

async function loadDependencies(adminId?: number | string) {
  const domainResult = await fetchAssignableDomainsApi({
    AdminId: adminId,
    InUsed: 1,
    IsAll: 1,
    OnlyUnused: true,
    PageSize: 100_000_000,
  });
  appDomains.value = domainResult.Items.filter(
    (item) => Number(item.Type) === 4 && Number(item.InUsed) === 1,
  );
  h5Domains.value = domainResult.Items.filter(
    (item) => Number(item.Type) === 7 && Number(item.InUsed) === 1,
  );
}

async function openEdit(row: AgentDomainRow) {
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, row);
  modalOpen.value = true;
  await loadDependencies(row.AdminId);
  // 当前已绑定域名可能不会出现在 OnlyUnused=true 的结果中，必须补回选项。
  if (
    row.NetCashDomain &&
    !appDomains.value.some((item) => domainUrl(item) === row.NetCashDomain)
  ) {
    appDomains.value.unshift({
      Domain: row.NetCashDomain,
      Id: `current-app-${row.Id}`,
      InUsed: 1,
      Type: 4,
    });
  }
  if (
    row.NetCashH5Domain &&
    !h5Domains.value.some((item) => domainUrl(item) === row.NetCashH5Domain)
  ) {
    h5Domains.value.unshift({
      Domain: row.NetCashH5Domain,
      Id: `current-h5-${row.Id}`,
      InUsed: 1,
      Type: 7,
    });
  }
  formRef.value?.clearValidate();
}

async function submit() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    await updateAgentDomainApi({ ...form });
    message.success('编辑成功');
    modalOpen.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function exportExcel() {
  exporting.value = true;
  try {
    const result = await fetchAgentDomainListApi({
      ...buildQuery({ currentPage: 1, pageSize: 100_000 }),
      IsExp: true,
    });
    if (result.Items.length === 0)
      return void message.info('当前条件下没有可导出的数据');
    const data = result.Items.map((row) => ({
      代理名称: row.Name,
      代理类型: Number(row.Type) === 1 ? '普通' : '正式',
      代理账号: row.Username,
      专属APP域名: row.NetCashDomain,
      专属H5域名: row.NetCashH5Domain,
      创建时间: dateTime(row.CreateTime),
      操作人: row.HandlerName,
      操作时间: dateTime(row.HandlerTime),
      渠道ID: row.ChannelId,
      渠道状态: Number(row.Status) === 1 ? '启用' : '停用',
      账号状态: Number(row.AdminStatus) === 1 ? '启用' : '停用',
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, '渠道域名');
    XLSX.writeFile(book, '渠道域名列表.xlsx');
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 渠道域名管理"
    title="渠道域名管理"
  >
    <Card :bordered="false">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <Space wrap>
          <Input
            v-model:value="filters.Username"
            allow-clear
            placeholder="代理账号"
            style="width: 160px"
            @press-enter="reloadFirstPage"
          />
          <Select
            v-model:value="filters.Type"
            :options="typeOptions"
            style="width: 125px"
          />
          <Input
            v-model:value="filters.ChannelId"
            allow-clear
            placeholder="渠道 ID"
            style="width: 130px"
            @press-enter="reloadFirstPage"
          />
          <Input
            v-model:value="filters.NetCashDomain"
            allow-clear
            placeholder="专属 APP 域名"
            style="width: 200px"
            @press-enter="reloadFirstPage"
          />
          <Input
            v-model:value="filters.NetCashH5Domain"
            allow-clear
            placeholder="专属 H5 域名"
            style="width: 200px"
            @press-enter="reloadFirstPage"
          />
          <Select
            v-model:value="filters.AdminStatus"
            :options="statusOptions"
            placeholder="账号状态"
            style="width: 125px"
          />
          <Select
            v-model:value="filters.Status"
            :options="statusOptions"
            placeholder="渠道状态"
            style="width: 125px"
          />
          <Button type="primary" @click="reloadFirstPage">查询</Button>
          <Button @click="resetFilters">重置</Button>
        </Space>
        <Space>
          <Button
            v-if="canExport"
            :loading="exporting"
            @click="exportExcel"
          >
            导出 Excel
          </Button>
        </Space>
      </div>

      <Grid>
        <template #adminStatus="{ row }">
          <Tag :color="Number(row.AdminStatus) === 1 ? 'green' : 'red'">
            {{ Number(row.AdminStatus) === 1 ? '启用' : '停用' }}
          </Tag>
        </template>
        <template #agentType="{ row }">
          <Tag :color="Number(row.Type) === 2 ? 'green' : 'blue'">
            {{ Number(row.Type) === 2 ? '正式' : '普通' }}
          </Tag>
        </template>
        <template #channelStatus="{ row }">
          <Tag :color="Number(row.Status) === 1 ? 'green' : 'red'">
            {{ Number(row.Status) === 1 ? '启用' : '停用' }}
          </Tag>
        </template>
        <template #actions="{ row }">
          <Space v-if="canMutate" :size="2">
            <Button size="small" type="link" @click="openEdit(row)">
              编辑
            </Button>
          </Space>
        </template>
      </Grid>
    </Card>

    <Modal
      :confirm-loading="saving"
      :mask-closable="false"
      :open="modalOpen"
      title="编辑域名绑定"
      width="660px"
      @cancel="modalOpen = false"
      @ok="submit"
    >
      <Form
        ref="formRef"
        class="pt-3"
        :label-col="{ span: 7 }"
        :model="form"
        :rules="{
          NetCashDomain: [{ required: true, message: '请选择专属 APP 域名' }],
          NetCashH5Domain: [{ required: true, message: '请选择专属 H5 域名' }],
        }"
        :wrapper-col="{ span: 17 }"
      >
        <Form.Item label="代理账号" name="Username">
          <Input
            v-model:value="form.Username"
            disabled
            placeholder="请输入代理账号"
          />
        </Form.Item>
        <Form.Item label="分配渠道">
          <Input v-model:value="form.ChannelName" disabled />
        </Form.Item>
        <Form.Item label="专属 APP 域名" name="NetCashDomain">
          <Select
            v-model:value="form.NetCashDomain"
            allow-clear
            :options="
              appDomains.map((item) => ({
                label: domainUrl(item),
                value: domainUrl(item),
              }))
            "
            placeholder="请选择专属 APP 域名"
            show-search
          />
        </Form.Item>
        <Form.Item label="专属 H5 域名" name="NetCashH5Domain">
          <Select
            v-model:value="form.NetCashH5Domain"
            allow-clear
            :options="
              h5Domains.map((item) => ({
                label: domainUrl(item),
                value: domainUrl(item),
              }))
            "
            placeholder="请选择专属 H5 域名"
            show-search
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无渠道域名管理查看权限" title="403" />
</template>
