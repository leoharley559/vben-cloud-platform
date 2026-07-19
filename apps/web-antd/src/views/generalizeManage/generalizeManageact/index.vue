<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PromoterListItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Dropdown,
  Input,
  Menu,
  Result,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPromoterDetailApi,
  fetchPromoterListApi,
  updatePromoterApi,
} from '#/api/promotion/manage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  enrichPromoterList,
  formatCommissionRate,
  formatPromoterAccountType,
  formatPromoterFunctions,
  formatPromoterSettleType,
  formatPromoterSettleValue,
  formatPromoterStatus,
} from '#/utils/promotion';

import DomainModal from './components/domain-modal.vue';
import ShareCostModal from './components/share-cost-modal.vue';
import TeamEditModal from './components/team-edit-modal.vue';

defineOptions({ name: 'GeneralizeManageact' });

const router = useRouter();
const { adminInfo, checkPermission, projectConfig } = useCloudPermission();

const canViewPage = computed(() => checkPermission(10908));
const canEdit = computed(() => checkPermission(10909));
const canSwitch = computed(() => checkPermission(10910));
const canShareCost = computed(() => checkPermission(10911));
const canCreateChannel = computed(() => checkPermission(10913));
const canCreateTeam = computed(() => checkPermission(10912));
const canSetDomain = computed(() => checkPermission(11917));

const filterUsername = ref('');
const filterName = ref('');
const filterStatus = ref<string>();
const filterSettleType = ref<string>();
const currentDomain = ref('');
const shareCostOpen = ref(false);
const domainOpen = ref(false);
const teamEditOpen = ref(false);
const editingTeamRow = ref<PromoterListItem>();

const isRootTeam = computed(() => {
  const teamInfo = projectConfig.value?.AccountTeamInfo as
    | { AgentId?: number; Id?: number }
    | undefined;
  return teamInfo?.Id === 0 && teamInfo?.AgentId === 0;
});

const realAdminType = computed(() => {
  const parentInfo = projectConfig.value?.ParentInfo as
    | { AdminType?: number }
    | undefined;
  const admin = adminInfo.value as { realAdminType?: number } | undefined;
  return admin?.realAdminType ?? parentInfo?.AdminType ?? 0;
});

const canShowCreateTeam = computed(() => {
  const teamInfo = projectConfig.value?.AccountTeamInfo as
    | { AgentId?: number; Id?: number }
    | undefined;
  const inTeam =
    Number(teamInfo?.Id || 0) > 0 && Number(teamInfo?.AgentId || 0) > 0;
  return canCreateTeam.value && (inTeam || realAdminType.value === 1);
});

const hasChildTree = computed(() => realAdminType.value === 1);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    Name: filterName.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    ParentId: '',
    SettleType: filterSettleType.value || '',
    Status: filterStatus.value || '',
    Username: filterUsername.value,
  };
}

const gridOptions: VxeTableGridOptions<PromoterListItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'IsTeamAccount',
      formatter: ({ row }) => formatPromoterAccountType(row),
      minWidth: 140,
      title: '账号类型',
    },
    { field: 'Username', minWidth: 130, title: '账号用户名' },
    { field: 'Name', minWidth: 120, title: '账号姓名' },
    {
      field: 'CommissionRate',
      minWidth: 110,
      slots: { default: 'commissionRate' },
      title: '分成比例',
    },
    {
      field: 'PayPeriod',
      formatter: ({ cellValue, row }) =>
        row.IsTeamAccount === 1 ? String(cellValue ?? '-') : '-',
      minWidth: 100,
      title: '结算周期',
    },
    { field: 'ContactInf', minWidth: 120, title: '联系方式' },
    {
      field: 'SettleType',
      formatter: ({ cellValue, row }) =>
        row.IsTeamAccount === 1 ? '-' : formatPromoterSettleType(cellValue),
      minWidth: 110,
      title: '结算类型',
    },
    {
      field: 'SettlePrice',
      formatter: ({ cellValue, row }) =>
        row.IsTeamAccount === 1
          ? '-'
          : formatPromoterSettleValue(row.SettleType, cellValue),
      minWidth: 110,
      title: '结算参数',
    },
    {
      field: 'Total',
      formatter: ({ cellValue }) =>
        cellValue === undefined ? '-' : Number(cellValue).toFixed(2),
      minWidth: 120,
      title: '总数/总额',
    },
    {
      field: 'RoleDataField',
      formatter: ({ row }) =>
        row.IsTeamAccount === 1
          ? '-'
          : formatPromoterFunctions(row.RoleDataField),
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '功能权限',
    },
    { field: 'Note', minWidth: 140, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 120,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPromoterListApi(getQueryParams(page));
        currentDomain.value = result.Config?.Domain || '';
        const items = enrichPromoterList(
          result.Items || [],
          result.ItemsTotal || [],
          hasChildTree.value,
        );
        return {
          items,
          total: Number(result.Pagination?.MaxCount || 0),
        };
      },
    },
  },
  treeConfig: undefined,
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleCreateChannel() {
  router.push({ path: '/generalizeManage/addGeneralize' });
}

function handleCreateTeam() {
  router.push({ path: '/generalizeManage/addPromote' });
}

function handleEdit(row: PromoterListItem) {
  if (row.IsTeamAccount === 1) {
    editingTeamRow.value = row;
    teamEditOpen.value = true;
    return;
  }
  router.push({
    path: '/generalizeManage/addGeneralize',
    query: { id: String(row.Id || '') },
  });
}

async function handleSwitchStatus(row: PromoterListItem, status: number) {
  if (!row.Id) {
    return;
  }
  const detail = await fetchPromoterDetailApi(row.Id);
  await updatePromoterApi({
    ...detail,
    Status: status,
  });
  message.success(status === 1 ? '已启用' : '已停用');
  gridApi.reload();
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
    description="推广管理 · 推广列表"
    title="推广列表"
  >
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterUsername"
        allow-clear
        placeholder="账号用户名"
        style="width: 220px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>账号用户名</template>
      </Input>
      <Input
        v-model:value="filterName"
        allow-clear
        placeholder="账号姓名"
        style="width: 220px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>账号姓名</template>
      </Input>
      <Select
        v-model:value="filterStatus"
        allow-clear
        class="w-32"
        :options="[
          { label: '启用', value: '1' },
          { label: '停用', value: '2' },
        ]"
        placeholder="状态"
      />
      <Select
        v-model:value="filterSettleType"
        allow-clear
        class="w-36"
        :options="[
          { label: '注册', value: '1' },
          { label: '绑定兑换', value: '2' },
          { label: '设备', value: '3' },
          { label: '税收分成', value: '4' },
          { label: '利润分成', value: '5' },
        ]"
        placeholder="结算类型"
      />
      <Space wrap>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button v-if="canShareCost" @click="shareCostOpen = true">
          分摊成本设置
        </Button>
        <Button v-if="canSetDomain" @click="domainOpen = true">
          设置推广域名
        </Button>
        <Button
          v-if="canCreateTeam && canShowCreateTeam"
          type="primary"
          @click="handleCreateTeam"
        >
          新增团队推广
        </Button>
        <Button
          v-if="canCreateChannel && isRootTeam"
          type="primary"
          @click="handleCreateChannel"
        >
          创建渠道推广
        </Button>
      </Space>
    </div>

    <div v-if="currentDomain" class="mb-3 text-sm text-gray-500">
      当前推广后台域名：{{ currentDomain }}
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="row.Status === 1 ? 'success' : 'error'">
          {{ formatPromoterStatus(row.Status) }}
        </Tag>
      </template>
      <template #commissionRate="{ row }">
        <Button
          v-if="canEdit && row.IsTeamAccount === 1"
          size="small"
          type="link"
          @click="handleEdit(row)"
        >
          {{
            row.TeamType === 2
              ? formatCommissionRate(row.ProfitCommissionRate)
              : formatCommissionRate(row.CommissionRate)
          }}
        </Button>
        <span v-else-if="row.IsTeamAccount === 1">
          {{
            row.TeamType === 2
              ? formatCommissionRate(row.ProfitCommissionRate)
              : formatCommissionRate(row.CommissionRate)
          }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <Dropdown v-if="canEdit || canSwitch">
          <Button size="small" type="link">操作</Button>
          <template #overlay>
            <Menu>
              <Menu.Item v-if="canEdit" @click="handleEdit(row)">
                编辑
              </Menu.Item>
              <Menu.Item
                v-if="canSwitch && row.Status === 1"
                @click="handleSwitchStatus(row, 2)"
              >
                停用
              </Menu.Item>
              <Menu.Item
                v-if="canSwitch && row.Status === 2"
                @click="handleSwitchStatus(row, 1)"
              >
                启用
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </template>
    </Grid>

    <ShareCostModal v-model:open="shareCostOpen" @success="gridApi.reload()" />
    <DomainModal
      v-model:open="domainOpen"
      :current-domain="currentDomain"
      @success="gridApi.reload()"
    />
    <TeamEditModal
      v-model:open="teamEditOpen"
      :row="editingTeamRow"
      @success="gridApi.reload()"
    />
  </Page>
  <Result v-else status="403" sub-title="无推广列表查看权限" title="403" />
</template>
