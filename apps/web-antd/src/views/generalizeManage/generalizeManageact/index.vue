<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  PromoterDetail,
  PromoterListItem,
  PromoterListQuery,
  PromoterTotalItem,
} from '#/types/promotion';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Popover,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectConfigApi } from '#/api/core/project';
import {
  createPromoterCostOddApi,
  createPromoterDomainApi,
  fetchDomainListApi,
  fetchPromoterDetailApi,
  fetchPromoterListApi,
  updatePromoterApi,
  updatePromoterTeamApi,
} from '#/api/promotion/manage';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  PROMOTER_FUNCTION_MAP,
  PROMOTER_SETTLE_TYPE_MAP,
} from '#/utils/promotion';

defineOptions({ name: 'GeneralizeManageact' });

interface TeamForm extends PromoterDetail {
  ChildMaxCommissionRate?: number;
  ChildMinCommissionRate?: number;
  ProfitCommissionRate?: number;
  TeamCommissionRate?: number;
  TeamPayPeriod?: number | string;
}

const router = useRouter();
const { adminInfo, checkPermission, projectConfig } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_908));
const loading = ref(false);
const saving = ref(false);
const allRows = ref<PromoterListItem[]>([]);
const currentDomain = ref('');
const query = reactive<PromoterListQuery>({
  Keyword: '',
  Name: '',
  Page: 1,
  PageSize: 20,
  ParentId: '',
  SettleType: '',
  Sort: '',
  Status: '',
  Username: '',
});
const teamVisible = ref(false);
const teamMode = ref<'account' | 'rate'>('account');
const teamForm = reactive<TeamForm>({});
const costVisible = ref(false);
const costForm = reactive({
  CostOfPaymentOdd: 0,
  CostOfWithdrawOdd: 0,
});
const domainVisible = ref(false);
const domainList = ref<Array<{ Domain?: string; Id?: number | string }>>([]);
const domainForm = reactive({ Domain: '' });

const realAdminType = computed(() => {
  const admin = adminInfo.value as undefined | { realAdminType?: number };
  const parent = projectConfig.value?.ParentInfo as
    | undefined
    | { AdminType?: number };
  return Number(admin?.realAdminType ?? parent?.AdminType ?? 0);
});
const teamInfo = computed(
  () =>
    (projectConfig.value?.AccountTeamInfo || {}) as {
      AgentId?: number;
      CommissionRate?: number;
      Id?: number;
    },
);
const selfPercent = computed(
  () => Number(teamInfo.value.CommissionRate || 0) / 10,
);
const childRateRange = computed(() => {
  const config = projectConfig.value?.AccountTeamChildCommissionRate as
    | undefined
    | { MaxCommissionRate?: number; MinCommissionRate?: number };
  return {
    max: Number(config?.MaxCommissionRate || 0) / 10,
    min: Number(config?.MinCommissionRate || 0) / 10,
  };
});
const settleOptions = Object.entries(PROMOTER_SETTLE_TYPE_MAP)
  .filter(([value]) => value !== '2')
  .map(([value, label]) => ({ label, value: Number(value) }));

function parseFunctions(value: PromoterListItem['RoleDataField']) {
  try {
    const parsed =
      typeof value === 'string' ? JSON.parse(value) : value || {};
    return String(parsed.HaveFunction || '')
      .split(',')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function calculateTotal(
  row: PromoterListItem,
  totals: PromoterTotalItem[],
) {
  const item = totals.find(
    (totalItem) => String(totalItem.AdminId) === String(row.Id),
  );
  if (!item) return 0;
  const price = Number(row.SettlePrice || 0);
  switch (Number(row.SettleType)) {
    case 1: {
      return Number(item.SumCountPhoneNum || 0) * price;
    }
    case 2: {
      return Number(item.SumCountAlipayNum || 0) * price;
    }
    case 3: {
      return Number(item.SumDevice || 0) * price;
    }
    case 4: {
      return (Number(item.SumDayWater || 0) / 100) * (price / 100);
    }
    case 5: {
      return (
        ((Number(item.SumPayMoney || 0) +
          Number(item.SumAgentPayMoney || 0) -
          Number(item.SumWithdrawMoney || 0)) /
          100) *
        (price / 100)
      );
    }
    default: {
      return 0;
    }
  }
}

function normalizeRows(
  items: null | PromoterListItem[] | undefined = [],
  totals: null | PromoterTotalItem[] | undefined = [],
  child = false,
) {
  const list = Array.isArray(items) ? items : [];
  const totalList = Array.isArray(totals) ? totals : [];
  return list.map((item) => ({
    ...item,
    IsOneTui: child ? false : item.IsOneTui,
    Total: calculateTotal(item, totalList),
    hasChildren: realAdminType.value === 1,
  }));
}

async function fetchList(page: { currentPage: number; pageSize: number }) {
  query.ParentId = '';
  query.Page = page.currentPage;
  query.PageSize = page.pageSize;
  const result = (await fetchPromoterListApi(query)) || {};
  const items = normalizeRows(result.Items, result.ItemsTotal);
  allRows.value = [...items];
  currentDomain.value = result.Config?.Domain || '';
  domainForm.Domain = currentDomain.value;
  return {
    items,
    total: Number(result.Pagination?.MaxCount || 0),
  };
}

async function loadTreeChildren(row: PromoterListItem) {
  if (row.children) return row.children;
  if (row.Id === undefined) return [];
  const result =
    (await fetchPromoterListApi({
      ...query,
      Page: 1,
      PageSize: 9999,
      ParentId: row.Id,
    })) || {};
  const children = normalizeRows(result.Items, result.ItemsTotal, true);
  row.children = children;
  allRows.value.push(...children);
  if (children.length === 0) message.info('暂无下级推广账号');
  return children;
}

function search() {
  query.Page = 1;
  query.Username = query.Username?.trim();
  query.Name = query.Name?.trim();
  void gridApi.reload();
}

function reset() {
  Object.assign(query, {
    Keyword: '',
    Name: '',
    Page: 1,
    ParentId: '',
    SettleType: '',
    Sort: '',
    Status: '',
    Username: '',
  });
  try {
    gridApi.grid?.clearFilter?.();
  } catch {
    /* ignore */
  }
  void gridApi.reload();
}

function createChannel() {
  router.push({ path: '/generalizeManage/addGeneralize' });
}

function createTeam() {
  router.push({ path: '/generalizeManage/addPromote' });
}

async function editRow(row: PromoterListItem) {
  if (row.IsTeamAccount !== 1) {
    router.push({
      path: '/generalizeManage/addGeneralize',
      query: { id: row.Id },
    });
    return;
  }
  if (row.Id === undefined) return;
  teamMode.value = 'account';
  await openTeamDetail(row.Id);
}

async function editTeamRate(row: PromoterListItem) {
  if (row.Id === undefined) return;
  teamMode.value = 'rate';
  await openTeamDetail(row.Id);
}

async function openTeamDetail(id: number | string) {
  loading.value = true;
  try {
    const detail = await fetchPromoterDetailApi(id);
    Object.keys(teamForm).forEach(
      (key) =>
        delete (teamForm as unknown as Record<string, unknown>)[key],
    );
    Object.assign(teamForm, detail, {
      ChildMaxCommissionRate: Number(detail.ChildMaxCommissionRate || 0) / 10,
      ChildMinCommissionRate: Number(detail.ChildMinCommissionRate || 0) / 10,
      ConfirmPassword: '',
      Password: '',
      ProfitCommissionRate: Number(detail.ProfitCommissionRate || 0) / 10,
      TeamCommissionRate: Number(detail.CommissionRate || 0) / 10,
      TeamPayPeriod: detail.PayPeriod,
    });
    teamVisible.value = true;
  } finally {
    loading.value = false;
  }
}

function validateRate(value: unknown) {
  return /^(\d{1,2}(\.\d)?|100)$/.test(String(value ?? ''));
}

async function saveTeam() {
  if (teamMode.value === 'rate') {
    const values = [
      teamForm.TeamCommissionRate,
      ...(Number(teamForm.TeamType) === 2
        ? [teamForm.ProfitCommissionRate]
        : []),
      teamForm.ChildMinCommissionRate,
      teamForm.ChildMaxCommissionRate,
    ];
    if (values.some((value) => !validateRate(value))) {
      message.warning('分成比例必须为 0～100，最多一位小数');
      return;
    }
    if (
      Number(teamForm.ChildMinCommissionRate) >=
      Number(teamForm.ChildMaxCommissionRate)
    ) {
      message.warning('最小下放比例必须小于最大下放比例');
      return;
    }
    const teamRate = Number(teamForm.TeamCommissionRate);
    if (realAdminType.value !== 1) {
      if (
        teamRate < childRateRange.value.min ||
        teamRate > childRateRange.value.max
      ) {
        message.warning(
          `分成比例需在 ${childRateRange.value.min}%-${childRateRange.value.max}% 之间`,
        );
        return;
      }
      if (teamRate > selfPercent.value) {
        message.warning(`分成比例不能超过自身比例 ${selfPercent.value}%`);
        return;
      }
    } else if (teamForm.IsOneTui === false) {
      const parentId = (teamForm as TeamForm & { ParentId?: number | string })
        .ParentId;
      const parent = allRows.value.find(
        (item) => String(item.Id) === String(parentId),
      );
      const parentRate = Number(parent?.CommissionRate || 0) / 10;
      if (parent && teamRate > parentRate) {
        message.warning(`分成比例不能超过上级比例 ${parentRate}%`);
        return;
      }
    }
    saving.value = true;
    try {
      await updatePromoterTeamApi({
        AccountId: teamForm.Id,
        ChildMaxCommissionRate:
          Number(teamForm.ChildMaxCommissionRate) * 10,
        ChildMinCommissionRate:
          Number(teamForm.ChildMinCommissionRate) * 10,
        CommissionRate: Number(teamForm.TeamCommissionRate) * 10,
        PayPeriod: teamForm.TeamPayPeriod as number | string,
        ProfitCommissionRate:
          Number(teamForm.ProfitCommissionRate || 0) * 10,
        TeamType: Number(teamForm.TeamType),
      });
      teamVisible.value = false;
      message.success('编辑成功');
      await gridApi.reload();
    } finally {
      saving.value = false;
    }
    return;
  }
  if (!String(teamForm.Name || '').trim()) {
    message.warning('请输入账号名称');
    return;
  }
  if (
    teamForm.Password &&
    !/^[a-zA-Z0-9_]{6,20}$/.test(String(teamForm.Password))
  ) {
    message.warning('密码必须为 6～20 位字母、数字或下划线');
    return;
  }
  if (teamForm.Password !== teamForm.ConfirmPassword) {
    message.warning('两次密码输入不一致');
    return;
  }
  saving.value = true;
  try {
    await updatePromoterApi({ ...teamForm });
    await getProjectConfigApi();
    teamVisible.value = false;
    message.success('编辑成功');
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function switchStatus(row: PromoterListItem, status: number) {
  if (row.Id === undefined) return;
  Modal.confirm({
    content: `确定${status === 1 ? '启用' : '停用'}账号“${row.Username || ''}”吗？`,
    onOk: async () => {
      const detail = await fetchPromoterDetailApi(row.Id!);
      await updatePromoterApi({
        ...detail,
        ConfirmPassword: '',
        Password: '',
        Status: status,
      });
      await getProjectConfigApi();
      message.success('操作成功');
      await gridApi.reload();
    },
    title: status === 1 ? '启用推广账号' : '停用推广账号',
  });
}

function openCost() {
  const config = projectConfig.value?.AgentCostOdd as
    | undefined
    | { CostOfPaymentOdd?: number; CostOfWithdrawOdd?: number };
  costForm.CostOfPaymentOdd = Number(config?.CostOfPaymentOdd || 0) / 100;
  costForm.CostOfWithdrawOdd = Number(config?.CostOfWithdrawOdd || 0) / 100;
  costVisible.value = true;
}

async function saveCost() {
  if (
    [costForm.CostOfPaymentOdd, costForm.CostOfWithdrawOdd].some(
      (value) => value < 0 || value > 100,
    )
  ) {
    message.warning('成本比例范围为 0～100%');
    return;
  }
  saving.value = true;
  try {
    await createPromoterCostOddApi({
      CostOfPaymentOdd: Math.round(costForm.CostOfPaymentOdd * 100),
      CostOfWithdrawOdd: Math.round(costForm.CostOfWithdrawOdd * 100),
    });
    await getProjectConfigApi();
    costVisible.value = false;
    message.success('设置成功');
  } finally {
    saving.value = false;
  }
}

async function openDomain() {
  loading.value = true;
  try {
    const result = (await fetchDomainListApi({ Type: 10 })) || {};
    domainList.value = Array.isArray(result.Items) ? result.Items : [];
    domainForm.Domain = currentDomain.value;
    domainVisible.value = true;
  } finally {
    loading.value = false;
  }
}

async function saveDomain() {
  if (!domainForm.Domain) {
    message.warning('请选择域名');
    return;
  }
  saving.value = true;
  try {
    await createPromoterDomainApi({ Domain: domainForm.Domain });
    domainVisible.value = false;
    message.success('保存成功');
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function copyDomain() {
  if (!domainForm.Domain) return;
  await navigator.clipboard.writeText(`https://www.${domainForm.Domain}`);
  message.success('复制成功');
}

function purchaseDomain() {
  router.push({ path: '/gameManage/domainManage' });
}

function formatTime(value: unknown) {
  if (!value) return '-';
  const numeric = Number(value);
  const date =
    Number.isFinite(numeric) && String(value).length <= 10
      ? dayjs.unix(numeric)
      : dayjs(value as string);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
}

function settleValue(row: PromoterListItem) {
  const value = Number(row.SettlePrice || 0);
  return [1, 2, 3].includes(Number(row.SettleType))
    ? `${value} 元/个`
    : `${value}%`;
}

function commissionText(row: PromoterListItem) {
  if (row.IsTeamAccount !== 1) return '-';
  const rate =
    row.TeamType === 2
      ? Number(row.ProfitCommissionRate || 0)
      : Number(row.CommissionRate || 0);
  return `${rate / 10}%`;
}

function childRateText(row: PromoterListItem) {
  if (row.IsTeamAccount !== 1 || row.IsOneTui === false) return '-';
  return `${Number(row.ChildMinCommissionRate || 0) / 10}% - ${
    Number(row.ChildMaxCommissionRate || 0) / 10
  }%`;
}

function buildColumns(): VxeTableGridOptions<PromoterListItem>['columns'] {
  return [
    {
      field: 'Status',
      filterMultiple: true,
      filters: [
        { label: '启用', value: 1 },
        { label: '停用', value: 2 },
      ],
      slots: { default: 'status' },
      title: '状态',
      treeNode: true,
      width: 110,
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatTime(cellValue),
      minWidth: 170,
      sortable: true,
      title: '创建时间',
    },
    {
      field: 'AccountType',
      minWidth: 160,
      slots: { default: 'accountType' },
      title: '账号类型',
    },
    {
      field: 'Username',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '账号用户名',
    },
    { field: 'Name', minWidth: 140, showOverflow: 'tooltip', title: '账号名称' },
    {
      field: 'Commission',
      minWidth: 130,
      slots: { default: 'commission' },
      title: '分成比例',
    },
    {
      field: 'PayPeriod',
      minWidth: 110,
      slots: { default: 'payPeriod' },
      title: '结算周期',
      visible: realAdminType.value === 1,
    },
    {
      field: 'ChildRate',
      minWidth: 160,
      slots: { default: 'childRate' },
      title: '下放比例',
      visible: realAdminType.value === 1,
    },
    {
      field: 'ContactInf',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '联系方式',
    },
    {
      field: 'SettleType',
      filterMultiple: true,
      filters: settleOptions.map((item) => ({
        label: item.label,
        value: item.value,
      })),
      formatter: ({ row }) =>
        row.IsTeamAccount === 1
          ? '-'
          : PROMOTER_SETTLE_TYPE_MAP[row.SettleType || 0] || '-',
      minWidth: 130,
      title: '结算方式',
    },
    {
      field: 'SettlePrice',
      formatter: ({ row }) =>
        row.IsTeamAccount === 1 ? '-' : settleValue(row),
      minWidth: 130,
      title: '结算参数',
    },
    {
      field: 'Total',
      formatter: ({ cellValue }) => Number(cellValue || 0).toFixed(2),
      minWidth: 150,
      title: '总数量/总金额',
    },
    {
      field: 'Permission',
      slots: { default: 'permission' },
      title: '管理权限',
      width: 110,
    },
    { field: 'Note', minWidth: 160, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      visible: checkPermission(10_909) || checkPermission(10_910),
      width: 90,
    },
  ];
}

function applyListParams(
  sort?: { field?: string; order?: null | string },
  filters?: Array<{ field?: string; values?: unknown[] }>,
) {
  const sortField = sort?.field;
  const sortOrder = sort?.order;
  if (sortField && sortOrder) {
    query.Sort = sortOrder === 'asc' ? String(sortField) : `-${String(sortField)}`;
  } else {
    query.Sort = '';
  }
  const statusValues =
    filters?.find((item) => item.field === 'Status')?.values || [];
  query.Status = statusValues.length > 0 ? statusValues.join(',') : '';
  const settleValues =
    filters?.find((item) => item.field === 'SettleType')?.values || [];
  query.SettleType = settleValues.length > 0 ? settleValues.join(',') : '';
}

const gridOptions: VxeTableGridOptions<PromoterListItem> = {
  columns: buildColumns(),
  filterConfig: { remote: true },
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page, sort, filters }) => {
        if (!canViewPage.value) return { items: [], total: 0 };
        applyListParams(sort, filters);
        return fetchList(page);
      },
    },
  },
  rowConfig: { keyField: 'Id' },
  sortConfig: { remote: true },
  treeConfig: {
    childrenField: 'children',
    hasChildField: 'hasChildren',
    lazy: true,
    loadMethod: async ({ row }) => loadTreeChildren(row as PromoterListItem),
    transform: false,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});

watch(realAdminType, () => {
  gridApi.setGridOptions({ columns: buildColumns() });
});

onMounted(() => {
  if (canViewPage.value) void gridApi.reload();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 推广列表"
    title="推广列表"
  >
    <Card size="small">
      <OpsListPanel>
        <template #filters>
          <Input
            v-model:value="query.Username"
            allow-clear
            placeholder="请输入账号用户名"
            @press-enter="search"
          >
            <template #addonBefore>账号用户名</template>
          </Input>
          <Input
            v-model:value="query.Name"
            allow-clear
            placeholder="请输入账号名称"
            @press-enter="search"
          >
            <template #addonBefore>账号名称</template>
          </Input>
          <div class="query-filter-actions">
            <Button type="primary" @click="search">查询</Button>
            <Button @click="reset">重置</Button>
          </div>
        </template>
        <div class="mb-3 flex flex-wrap items-center justify-end gap-2"> 
            <Button v-if="checkPermission(10_911)" @click="openCost">
              分摊成本设置
            </Button>
            <Button v-if="checkPermission(11_917)" @click="openDomain">
              设置推广后台域名
            </Button>
            <Button
              v-if="
                checkPermission(10_912) &&
                ((Number(teamInfo.Id) > 0 && Number(teamInfo.AgentId) > 0) ||
                  realAdminType === 1)
              "
              type="primary"
              @click="createTeam"
            >
              创建下级代理
            </Button>
            <Button
              v-if="
                checkPermission(10_913) &&
                Number(teamInfo.Id || 0) === 0 &&
                Number(teamInfo.AgentId || 0) === 0
              "
              type="primary"
              @click="createChannel"
            >
              创建渠道推广
            </Button>
          </div>
        <Grid>
          <template #status="{ row }">
            <Tag :color="row.Status === 1 ? 'success' : 'error'">
              {{ row.Status === 1 ? '启用' : '停用' }}
            </Tag>
          </template>
          <template #accountType="{ row }">
            <Space size="small">
              <Tag :color="row.IsTeamAccount === 1 ? 'blue' : 'orange'">
                {{ row.IsTeamAccount === 1 ? '团队推广' : '渠道推广' }}
              </Tag>
              <Tag v-if="row.TeamType === 2" color="red">代理管理</Tag>
            </Space>
          </template>
          <template #commission="{ row }">
            <Button
              v-if="row.IsTeamAccount === 1 && checkPermission(10_909)"
              size="small"
              type="link"
              @click="editTeamRate(row)"
            >
              {{ commissionText(row) }}
            </Button>
            <span v-else>{{ commissionText(row) }}</span>
          </template>
          <template #payPeriod="{ row }">
            <Button
              v-if="
                row.IsTeamAccount === 1 &&
                row.IsOneTui !== false &&
                checkPermission(10_909)
              "
              size="small"
              type="link"
              @click="editTeamRate(row)"
            >
              {{ row.PayPeriod }}
            </Button>
            <span v-else>
              {{
                row.IsTeamAccount === 1 && row.IsOneTui !== false
                  ? row.PayPeriod
                  : '-'
              }}
            </span>
          </template>
          <template #childRate="{ row }">
            <Button
              v-if="row.IsTeamAccount === 1 && row.IsOneTui !== false"
              size="small"
              type="link"
              @click="editTeamRate(row)"
            >
              {{ childRateText(row) }}
            </Button>
            <span v-else>{{ childRateText(row) }}</span>
          </template>
          <template #permission="{ row }">
            <Popover
              v-if="row.IsTeamAccount !== 1"
              placement="left"
              trigger="hover"
            >
              <template #content>
                <table class="permission-table">
                  <thead>
                    <tr>
                      <th>管理权限</th>
                      <th>内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>功能权限</td>
                      <td>
                        <Space wrap>
                          <Tag
                            v-for="id in parseFunctions(row.RoleDataField)"
                            :key="id"
                            color="success"
                          >
                            {{ PROMOTER_FUNCTION_MAP[id] || id }}
                          </Tag>
                        </Space>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>
              <Button size="small" type="link">查看</Button>
            </Popover>
            <span v-else>-</span>
          </template>
          <template #action="{ row }">
            <Dropdown :trigger="['click']">
              <a class="text-primary">操作</a>
              <template #overlay>
                <Menu>
                  <Menu.Item
                    v-if="checkPermission(10_909)"
                    @click="editRow(row)"
                  >
                    编辑
                  </Menu.Item>
                  <Menu.Item
                    v-if="checkPermission(10_910) && row.Status === 1"
                    @click="switchStatus(row, 2)"
                  >
                    停用
                  </Menu.Item>
                  <Menu.Item
                    v-if="checkPermission(10_910) && row.Status === 2"
                    @click="switchStatus(row, 1)"
                  >
                    启用
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </Grid>
      </OpsListPanel>
    </Card> 

    <Modal
      v-model:open="teamVisible"
      :confirm-loading="saving"
      :title="teamMode === 'rate' ? '编辑团队分成设置' : '编辑团队推广账号'"
      width="680px"
      @ok="saveTeam"
    >
      <Form :label-col="{ span: 8 }">
        <template v-if="teamMode === 'account'">
          <Form.Item label="账号用户名">
            <Input v-model:value="teamForm.Username" disabled />
          </Form.Item>
          <Form.Item label="新密码">
            <Input.Password
              v-model:value="teamForm.Password"
              autocomplete="new-password"
            />
          </Form.Item>
          <Form.Item label="确认新密码">
            <Input.Password
              v-model:value="teamForm.ConfirmPassword"
              autocomplete="new-password"
            />
          </Form.Item>
          <Form.Item label="账号名称" required>
            <Input v-model:value="teamForm.Name" :maxlength="20" />
          </Form.Item>
          <Form.Item label="联系方式">
            <Input v-model:value="teamForm.ContactInf" />
          </Form.Item>
          <Form.Item label="备注">
            <Input v-model:value="teamForm.Note" />
          </Form.Item>
        </template>
        <template v-else>
          <Form.Item
            v-if="Number(teamForm.TeamType) === 2"
            label="利润分成比例"
            required
          >
            <InputNumber
              v-model:value="teamForm.ProfitCommissionRate"
              :max="100"
              :min="0"
              :precision="1"
              addon-after="%"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item
            :label="
              Number(teamForm.TeamType) === 1
                ? '税收分成比例'
                : '下级成本比例'
            "
            required
          >
            <InputNumber
              v-model:value="teamForm.TeamCommissionRate"
              :max="100"
              :min="0"
              :precision="1"
              addon-after="%"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="结算周期" required>
            <InputNumber
              v-model:value="teamForm.TeamPayPeriod"
              :min="0"
              :precision="0"
              addon-after="天"
              class="!w-full"
              :disabled="realAdminType !== 1 || teamForm.IsOneTui === false"
            />
          </Form.Item>
          <Form.Item label="下放比例" required>
            <Space.Compact block>
              <InputNumber
                v-model:value="teamForm.ChildMinCommissionRate"
                :max="100"
                :min="0"
                :precision="1"
                addon-after="%"
                class="!w-1/2"
                :disabled="realAdminType !== 1"
              />
              <InputNumber
                v-model:value="teamForm.ChildMaxCommissionRate"
                :max="100"
                :min="0"
                :precision="1"
                addon-after="%"
                class="!w-1/2"
                :disabled="realAdminType !== 1 || teamForm.IsOneTui === false"
              />
            </Space.Compact>
          </Form.Item>
        </template>
      </Form>
    </Modal>

    <Modal
      v-model:open="costVisible"
      :confirm-loading="saving"
      title="分摊成本设置"
      @ok="saveCost"
    >
      <Form layout="vertical">
        <Form.Item label="支付成本" required>
          <InputNumber
            v-model:value="costForm.CostOfPaymentOdd"
            :max="100"
            :min="0"
            :precision="2"
            addon-after="%"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="提现成本" required>
          <InputNumber
            v-model:value="costForm.CostOfWithdrawOdd"
            :max="100"
            :min="0"
            :precision="2"
            addon-after="%"
            class="!w-full"
          />
        </Form.Item>
        <div class="modal-tip">
          设置后将影响推广成本计算，请确认比例后保存。
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="domainVisible"
      :confirm-loading="saving"
      title="设置推广后台域名"
      @ok="saveDomain"
    >
      <Form layout="vertical">
        <Form.Item label="域名" required>
          <Space.Compact block>
            <Select
              v-model:value="domainForm.Domain"
              :options="
                domainList.map((item) => ({
                  label: `https://www.${item.Domain}`,
                  value: item.Domain,
                }))
              "
              placeholder="请选择域名"
              style="width: calc(100% - 80px)"
            />
            <Button @click="copyDomain">复制</Button>
          </Space.Compact>
        </Form.Item>
        <Button type="link" @click="purchaseDomain">购买新域名</Button>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无推广列表查看权限" title="403" />
</template>

<style scoped>
.modal-tip {
  padding: 10px 12px;
  font-size: 12px;
  color: #d46b08;
  background: #fff7e6;
  border-radius: 6px;
}

.permission-table {
  min-width: 360px;
  border-collapse: collapse;
}

.permission-table th,
.permission-table td {
  padding: 8px 12px;
  text-align: center;
  border: 1px solid hsl(var(--border));
}

.permission-table th {
  background: hsl(var(--muted) / 40%);
}
</style>
