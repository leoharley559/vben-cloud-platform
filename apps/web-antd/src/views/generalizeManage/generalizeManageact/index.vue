<script lang="ts" setup>
import type { TableColumnsType, TableProps } from 'ant-design-vue';

import type {
  PromoterDetail,
  PromoterListItem,
  PromoterListQuery,
  PromoterTotalItem,
} from '#/types/promotion';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popover,
  Result,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

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
const loading = ref(false);
const saving = ref(false);
const rows = ref<PromoterListItem[]>([]);
const allRows = ref<PromoterListItem[]>([]);
const total = ref(0);
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
const expandedKeys = ref<Array<number | string>>([]);

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
const columns = computed<TableColumnsType<PromoterListItem>>(() => [
  { key: 'Status', title: '状态', width: 90 },
  {
    dataIndex: 'CreateTime',
    key: 'CreateTime',
    sorter: true,
    title: '创建时间',
    width: 170,
  },
  { key: 'AccountType', title: '账号类型', width: 160 },
  { dataIndex: 'Username', key: 'Username', title: '账号用户名', width: 140 },
  { dataIndex: 'Name', key: 'Name', title: '账号名称', width: 140 },
  { key: 'Commission', title: '分成比例', width: 130 },
  ...(realAdminType.value === 1
    ? [
        { key: 'PayPeriod', title: '结算周期', width: 110 },
        { key: 'ChildRate', title: '下放比例', width: 160 },
      ]
    : []),
  { dataIndex: 'ContactInf', key: 'ContactInf', title: '联系方式', width: 140 },
  { key: 'SettleType', title: '结算方式', width: 130 },
  { key: 'SettlePrice', title: '结算参数', width: 130 },
  { key: 'Total', title: '总数量/总金额', width: 150 },
  { key: 'Permission', title: '管理权限', width: 110 },
  { dataIndex: 'Note', key: 'Note', title: '备注', ellipsis: true, width: 160 },
  ...(checkPermission(10_909) || checkPermission(10_910)
    ? [{ fixed: 'right' as const, key: 'action', title: '操作', width: 180 }]
    : []),
]);

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
  items: PromoterListItem[] | null | undefined = [],
  totals: PromoterTotalItem[] | null | undefined = [],
  child = false,
) {
  const list = Array.isArray(items) ? items : [];
  const totalList = Array.isArray(totals) ? totals : [];
  return list.map((item) => ({
    ...item,
    IsOneTui: child ? false : item.IsOneTui,
    Total: calculateTotal(item, totalList),
    hasChildren:
      realAdminType.value === 1 &&
      Boolean(item.HasChildren ?? item.hasChildren ?? true),
  }));
}

async function loadData() {
  loading.value = true;
  try {
    query.ParentId = '';
    const result = (await fetchPromoterListApi(query)) || {};
    rows.value = normalizeRows(result.Items, result.ItemsTotal);
    allRows.value = [...rows.value];
    total.value = Number(result.Pagination?.MaxCount || 0);
    currentDomain.value = result.Config?.Domain || '';
    domainForm.Domain = currentDomain.value;
  } finally {
    loading.value = false;
  }
}

async function loadChildren(row: PromoterListItem) {
  if (row.children || row.Id === undefined) return;
  const result =
    (await fetchPromoterListApi({
      ...query,
      Page: 1,
      PageSize: 9999,
      ParentId: row.Id,
    })) || {};
  row.children = normalizeRows(result.Items, result.ItemsTotal, true);
  allRows.value.push(...row.children);
  if (row.children.length === 0) message.info('暂无下级推广账号');
}

async function onExpand(expanded: boolean, row: PromoterListItem) {
  if (expanded) await loadChildren(row);
  expandedKeys.value = expanded
    ? [...new Set([...expandedKeys.value, row.Id!])]
    : expandedKeys.value.filter((key) => String(key) !== String(row.Id));
}

function search() {
  query.Page = 1;
  query.Username = query.Username?.trim();
  query.Name = query.Name?.trim();
  loadData();
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
  expandedKeys.value = [];
  loadData();
}

const changeTable: TableProps['onChange'] = (pagination, _filters, sorter) => {
  const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
  query.Page = pagination.current || 1;
  query.PageSize = pagination.pageSize || 20;
  const sortField = String(
    currentSorter?.field || currentSorter?.columnKey || 'CreateTime',
  );
  query.Sort =
    currentSorter?.order === 'ascend'
      ? sortField
      : currentSorter?.order === 'descend'
        ? `-${sortField}`
        : '';
  loadData();
};

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
      await loadData();
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
    await loadData();
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
      await loadData();
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
    await loadData();
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

onMounted(() => {
  if (checkPermission(10_908)) loadData();
});
</script>

<template>
  <div v-if="checkPermission(10_908)" class="promoter-page">
    <Card class="query-card" size="small">
      <div class="query-grid">
        <Input
          v-model:value="query.Username"
          allow-clear
          addon-before="账号用户名"
          placeholder="请输入"
          @press-enter="search"
        />
        <Input
          v-model:value="query.Name"
          allow-clear
          addon-before="账号名称"
          placeholder="请输入"
          @press-enter="search"
        />
        <Select
          v-model:value="query.Status"
          allow-clear
          :options="[
            { label: '启用', value: 1 },
            { label: '停用', value: 2 },
          ]"
          placeholder="状态"
          @clear="query.Status = ''"
        />
        <Select
          v-model:value="query.SettleType"
          allow-clear
          :options="settleOptions"
          placeholder="结算方式"
          @clear="query.SettleType = ''"
        />
        <Space wrap>
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
        </Space>
      </div>
      <div class="action-bar">
        <Space wrap>
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
        </Space>
      </div>
    </Card>

    <Card class="table-card" :bordered="false">
      <Table
        :columns="columns"
        :data-source="rows"
        :expanded-row-keys="expandedKeys"
        :loading="loading"
        :pagination="{
          current: query.Page,
          pageSize: query.PageSize,
          showSizeChanger: true,
          total,
        }"
        :row-key="(row) => String(row.Id)"
        :scroll="{ x: 1650 }"
        children-column-name="children"
        size="small"
        @change="changeTable"
        @expand="onExpand"
      >
        <template #bodyCell="{ column, record }">
          <Tag
            v-if="column.key === 'Status'"
            :color="record.Status === 1 ? 'green' : 'red'"
          >
            {{ record.Status === 1 ? '启用' : '停用' }}
          </Tag>
          <span v-else-if="column.key === 'CreateTime'">
            {{ formatTime(record.CreateTime) }}
          </span>
          <Space v-else-if="column.key === 'AccountType'" size="small">
            <Tag :color="record.IsTeamAccount === 1 ? 'blue' : 'orange'">
              {{ record.IsTeamAccount === 1 ? '团队推广' : '渠道推广' }}
            </Tag>
            <Tag v-if="record.TeamType === 2" color="red">代理管理</Tag>
          </Space>
          <Button
            v-else-if="
              column.key === 'Commission' &&
              record.IsTeamAccount === 1 &&
              checkPermission(10_909)
            "
            size="small"
            type="link"
            @click="editTeamRate(record)"
          >
            {{
              (record.TeamType === 2
                ? Number(record.ProfitCommissionRate || 0)
                : Number(record.CommissionRate || 0)) / 10
            }}%
          </Button>
          <span v-else-if="column.key === 'Commission'">
            {{
              record.IsTeamAccount === 1
                ? `${
                    (record.TeamType === 2
                      ? Number(record.ProfitCommissionRate || 0)
                      : Number(record.CommissionRate || 0)) / 10
                  }%`
                : '-'
            }}
          </span>
          <Button
            v-else-if="
              column.key === 'PayPeriod' &&
              record.IsTeamAccount === 1 &&
              record.IsOneTui !== false &&
              checkPermission(10_909)
            "
            size="small"
            type="link"
            @click="editTeamRate(record)"
          >
            {{ record.PayPeriod }}
          </Button>
          <span v-else-if="column.key === 'PayPeriod'">
            {{ record.IsTeamAccount === 1 && record.IsOneTui !== false ? record.PayPeriod : '-' }}
          </span>
          <Button
            v-else-if="
              column.key === 'ChildRate' &&
              record.IsTeamAccount === 1 &&
              record.IsOneTui !== false &&
              checkPermission(10_909)
            "
            size="small"
            type="link"
            @click="editTeamRate(record)"
          >
            {{ Number(record.ChildMinCommissionRate || 0) / 10 }}% -
            {{ Number(record.ChildMaxCommissionRate || 0) / 10 }}%
          </Button>
          <span v-else-if="column.key === 'ChildRate'">
            {{
              record.IsTeamAccount === 1 && record.IsOneTui !== false
                ? `${Number(record.ChildMinCommissionRate || 0) / 10}% - ${
                    Number(record.ChildMaxCommissionRate || 0) / 10
                  }%`
                : '-'
            }}
          </span>
          <span v-else-if="column.key === 'SettleType'">
            {{
              record.IsTeamAccount === 1
                ? '-'
                : PROMOTER_SETTLE_TYPE_MAP[record.SettleType || 0] || '-'
            }}
          </span>
          <span v-else-if="column.key === 'SettlePrice'">
            {{ record.IsTeamAccount === 1 ? '-' : settleValue(record) }}
          </span>
          <span v-else-if="column.key === 'Total'">
            {{ Number(record.Total || 0).toFixed(2) }}
          </span>
          <Popover
            v-else-if="
              column.key === 'Permission' && record.IsTeamAccount !== 1
            "
            placement="left"
            title="功能权限"
          >
            <template #content>
              <Space wrap>
                <Tag
                  v-for="id in parseFunctions(record.RoleDataField)"
                  :key="id"
                  color="green"
                >
                  {{ PROMOTER_FUNCTION_MAP[id] || id }}
                </Tag>
              </Space>
            </template>
            <Button size="small" type="link">查看</Button>
          </Popover>
          <Space v-else-if="column.key === 'action'">
            <Button
              v-if="checkPermission(10_909)"
              size="small"
              type="primary"
              @click="editRow(record)"
            >
              编辑
            </Button>
            <Button
              v-if="checkPermission(10_910) && record.Status === 1"
              danger
              size="small"
              @click="switchStatus(record, 2)"
            >
              停用
            </Button>
            <Button
              v-if="checkPermission(10_910) && record.Status === 2"
              size="small"
              @click="switchStatus(record, 1)"
            >
              启用
            </Button>
          </Space>
        </template>
      </Table>
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
  </div>
  <Result v-else status="403" sub-title="无推广列表查看权限" title="403" />
</template>

<style scoped>
.promoter-page {
  min-height: 100%;
  padding: 16px;
}

.query-card,
.table-card {
  margin-bottom: 14px;
  border-radius: 10px;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(190px, 1fr)) auto;
  gap: 12px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid hsl(var(--border));
}

.modal-tip {
  padding: 10px 12px;
  font-size: 12px;
  color: #d46b08;
  background: #fff7e6;
  border-radius: 6px;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}
</style>
