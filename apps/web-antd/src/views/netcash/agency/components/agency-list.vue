<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AgencyListItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchAgencyListApi,
  switchAgencyStatusApi,
} from '#/api/netcash/agency';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  AGENCY_ACCOUNT_TYPE_MAP,
  AGENCY_STATUS_MAP,
  AGENCY_TYPE_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import AgencyFormModal from './agency-form-modal.vue';

defineOptions({ name: 'AgencyList' });

const router = useRouter();
const { checkPermission } = useCloudPermission();

const canViewList = computed(() => checkPermission(10_085));
const canSwitch = computed(() => checkPermission(10_111));
const canViewDetail = computed(() => checkPermission(11_251));
const canAdd = computed(() => checkPermission(10_106));
const canEdit = computed(() => checkPermission(10_110));

const formModalOpen = ref(false);
const formModalMode = ref<'create' | 'edit'>('create');
const formModalRow = ref<AgencyListItem | null>(null);

function openCreateModal() {
  formModalMode.value = 'create';
  formModalRow.value = null;
  formModalOpen.value = true;
}

function openEditModal(row: AgencyListItem) {
  formModalMode.value = 'edit';
  formModalRow.value = row;
  formModalOpen.value = true;
}

const filterUsername = ref('');
const filterTeamName = ref('');
const filterDeveloperName = ref('');
const filterMaintainerName = ref('');
const filterStatus = ref<number | string>();

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    DeveloperName: filterDeveloperName.value,
    MaintainerName: filterMaintainerName.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    Status: filterStatus.value || '',
    TeamName: filterTeamName.value,
    Username: filterUsername.value,
  };
}

const gridOptions: VxeTableGridOptions<AgencyListItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'Username',
      minWidth: 130,
      slots: { default: 'username' },
      title: '代理账号',
    },
    { field: 'Name', minWidth: 100, title: '姓名' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '创建时间',
    },
    {
      field: 'Type',
      formatter: ({ cellValue }) =>
        AGENCY_TYPE_MAP[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 100,
      title: '代理类型',
    },
    {
      field: 'AccountType',
      formatter: ({ cellValue }) =>
        AGENCY_ACCOUNT_TYPE_MAP[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 110,
      title: '代理模式',
    },
    { field: 'TeamName', minWidth: 120, title: '团队' },
    { field: 'DeveloperName', minWidth: 120, title: '发展人' },
    { field: 'MobileNumber', minWidth: 120, title: '手机号' },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchAgencyListApi(getQueryParams(page));
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

function openDetail(row: AgencyListItem) {
  if (!canViewDetail.value || !row.Id) {
    return;
  }
  router.push({
    path: '/netcash/agencyAccountDetails',
    query: { id: String(row.Id) },
  });
}

function handleSwitch(row: AgencyListItem) {
  const nextStatus = row.Status === 1 ? 2 : 1;
  const actionText = nextStatus === 1 ? '启用' : '停用';
  Modal.confirm({
    content: `确认${actionText}代理 ${row.Username || ''}？`,
    onOk: async () => {
      await switchAgencyStatusApi({ Id: row.Id, Status: nextStatus });
      message.success('操作成功');
      gridApi.reload();
    },
    title: '状态变更',
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
        style="width: 180px"
      />
      <Input
        v-model:value="filterTeamName"
        allow-clear
        placeholder="团队名称"
        style="width: 180px"
      />
      <Input
        v-model:value="filterDeveloperName"
        allow-clear
        placeholder="发展人"
        style="width: 180px"
      />
      <Input
        v-model:value="filterMaintainerName"
        allow-clear
        placeholder="维护人"
        style="width: 180px"
      />
      <Select
        v-model:value="filterStatus"
        allow-clear
        class="w-32"
        :options="[
          { label: '启用', value: 1 },
          { label: '停用', value: 2 },
        ]"
        placeholder="状态"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button v-if="canAdd" type="primary" @click="openCreateModal">
        新增代理
      </Button>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="row.Status === 1 ? 'success' : 'error'">
          {{ AGENCY_STATUS_MAP[Number(row.Status)] || row.Status }}
        </Tag>
      </template>
      <template #username="{ row }">
        <Button
          v-if="canViewDetail"
          size="small"
          type="link"
          @click="openDetail(row)"
        >
          {{ row.Username }}
        </Button>
        <span v-else>{{ row.Username }}</span>
      </template>
      <template #action="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEditModal(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canSwitch"
            size="small"
            type="link"
            @click="handleSwitch(row)"
          >
            {{ row.Status === 1 ? '停用' : '启用' }}
          </Button>
        </Space>
      </template>
    </Grid>

    <AgencyFormModal
      v-model:open="formModalOpen"
      :mode="formModalMode"
      :row="formModalRow"
      @success="gridApi.reload()"
    />
  </div>
</template>
