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
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'AgentDomainManage' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_550));
const canExport = computed(() => checkPermission(10_551));
const canMutate = computed(() => checkPermission(10_555));
const filters = reactive({
  AdminStatus: '' as number | string,
  ChannelId: '' as number | string,
  NetCashDomain: '',
  NetCashH5Domain: '',
  Sort: '',
  Status: '' as number | string,
  Type: '' as number | string,
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

function agentTypeText(value: unknown) {
  const type = Number(value);
  if (type === 1) return '普通';
  if (type === 2) return '正式';
  return '-';
}

function statusText(value: unknown) {
  const status = Number(value);
  if (status === 1) return '启用';
  if (status === 2) return '停用';
  return '-';
}

/** 对齐旧站 showDomain：裸域名统一补 https://www. */
function domainUrl(item: ChannelDomainOption | string) {
  const raw = String(
    typeof item === 'string' ? item : item.Domain || '',
  ).replaceAll(/\s+/g, '');
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://www.${raw}`;
}

const columns: VxeTableGridOptions<AgentDomainRow>['columns'] = [
  { type: 'seq', title: '序号', width: 60 },
  {
    field: 'AdminStatus',
    minWidth: 100,
    slots: { default: 'adminStatus' },
    title: '账号状态',
  },
  {
    field: 'Username',
    minWidth: 130,
    slots: { default: 'username' },
    title: '代理账号',
  },
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
    AdminStatus: filters.AdminStatus,
    ChannelId: filters.ChannelId ?? '',
    NetCashDomain: filters.NetCashDomain.trim(),
    NetCashH5Domain: filters.NetCashH5Domain.trim(),
    Page: currentPage,
    PageSize: pageSize,
    Status: filters.Status,
    Type: filters.Type,
    Username: filters.Username.trim(),
  };
}

const gridOptions: VxeTableGridOptions<AgentDomainRow> = {
  columns,
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: checkPermission(10_550),
    ajax: {
      query: async ({ page, sort }) => {
        try {
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
        } catch {
          rows.value = [];
          return { items: [], total: 0 };
        }
      },
    },
  },
  // 列表 Id 恒为 null，用渠道号作行键
  rowConfig: { keyField: 'ChannelId' },
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

async function loadDependencies(adminId?: number | string) {
  try {
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
  } catch {
    appDomains.value = [];
    h5Domains.value = [];
  }
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
      Id: `current-app-${row.ChannelId || row.AdminId}`,
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
      Id: `current-h5-${row.ChannelId || row.AdminId}`,
      InUsed: 1,
      Type: 7,
    });
  }
  if (appDomains.value.length === 0 && h5Domains.value.length === 0) {
    message.warning(
      '暂无可用的专属 APP/H5 域名（Type=4/7），请先在域名管理中配置',
    );
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
  } catch {
    // 请求层已提示
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
      代理类型: agentTypeText(row.Type),
      代理账号: row.Username,
      专属APP域名: row.NetCashDomain,
      专属H5域名: row.NetCashH5Domain,
      创建时间: dateTime(row.CreateTime),
      操作人: row.HandlerName,
      操作时间: dateTime(row.HandlerTime),
      渠道ID: row.ChannelId,
      渠道状态: statusText(row.Status),
      账号状态: statusText(row.AdminStatus),
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, '渠道域名');
    XLSX.writeFile(book, '渠道域名列表.xlsx');
  } catch {
    // 请求层已提示
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
    <Card>
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Input
            v-model:value="filters.Username"
            allow-clear
            placeholder="请输入代理账号"
            @press-enter="reloadFirstPage"
          >
            <template #addonBefore>代理账号</template>
          </Input>
          <Space.Compact>
            <span class="query-field-addon">代理类型</span>
            <Select
              v-model:value="filters.Type"
              :options="typeOptions"
              placeholder="请选择代理类型"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">渠道号</span>
            <ChannelSelect
              v-model="filters.ChannelId"
              :multiple="false"
              placeholder="请输入渠道号"
            />
          </Space.Compact>
          <Input
            v-model:value="filters.NetCashDomain"
            allow-clear
            placeholder="请输入专属 APP 域名"
            @press-enter="reloadFirstPage"
          >
            <template #addonBefore>专属 APP 域名</template>
          </Input>
          <Input
            v-model:value="filters.NetCashH5Domain"
            allow-clear
            placeholder="请输入专属 H5 域名"
            @press-enter="reloadFirstPage"
          >
            <template #addonBefore>专属 H5 域名</template>
          </Input>
          <Space.Compact>
            <span class="query-field-addon">账号状态</span>
            <Select
              v-model:value="filters.AdminStatus"
              :options="statusOptions"
              placeholder="请选择账号状态"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">渠道状态</span>
            <Select
              v-model:value="filters.Status"
              :options="statusOptions"
              placeholder="请选择渠道状态"
            />
          </Space.Compact>
          <div class="query-filter-actions">
            <Button type="primary" @click="reloadFirstPage">查询</Button>
            <Button @click="resetFilters">重置</Button>
            <Button v-if="canExport" :loading="exporting" @click="exportExcel">
              导出 Excel
            </Button>
          </div>
        </div>
      </div>

      <Grid>
        <template #adminStatus="{ row }">
          <Tag
            v-if="
              Number(row.AdminStatus) === 1 || Number(row.AdminStatus) === 2
            "
            :color="Number(row.AdminStatus) === 1 ? 'green' : 'red'"
          >
            {{ statusText(row.AdminStatus) }}
          </Tag>
          <span v-else>-</span>
        </template>
        <template #username="{ row }">
          <AgencyAccountLink
            :admin-id="row.AdminId"
            :username="row.Username"
          />
        </template>
        <template #agentType="{ row }">
          <Tag
            v-if="Number(row.Type) === 1 || Number(row.Type) === 2"
            :color="Number(row.Type) === 2 ? 'green' : 'blue'"
          >
            {{ agentTypeText(row.Type) }}
          </Tag>
          <span v-else>-</span>
        </template>
        <template #channelStatus="{ row }">
          <Tag
            v-if="Number(row.Status) === 1 || Number(row.Status) === 2"
            :color="Number(row.Status) === 1 ? 'green' : 'red'"
          >
            {{ statusText(row.Status) }}
          </Tag>
          <span v-else>-</span>
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
      title="编辑域名配置"
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
            :options="[
              { label: '不设置', value: '' },
              ...appDomains.map((item) => ({
                label: domainUrl(item),
                value: domainUrl(item),
              })),
            ]"
            placeholder="请选择专属 APP 域名"
            show-search
          />
        </Form.Item>
        <Form.Item label="专属 H5 域名" name="NetCashH5Domain">
          <Select
            v-model:value="form.NetCashH5Domain"
            allow-clear
            :options="[
              { label: '不设置', value: '' },
              ...h5Domains.map((item) => ({
                label: domainUrl(item),
                value: domainUrl(item),
              })),
            ]"
            placeholder="请选择专属 H5 域名"
            show-search
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无渠道域名管理查看权限" title="403" />
</template>
