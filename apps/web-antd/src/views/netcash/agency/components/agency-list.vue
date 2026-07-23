<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AgencyListItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchAgencyListApi,
  switchAgencyStatusApi,
} from '#/api/netcash/agency';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  AGENCY_ACCOUNT_TYPE_MAP,
  AGENCY_STATUS_MAP,
  AGENCY_TYPE_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import AgencyFormModal from './agency-form-modal.vue';
import AgencyMemberDetailModal from './agency-member-detail-modal.vue';
import AgencyMemberModal from './agency-member-modal.vue';

defineOptions({ name: 'AgencyList' });

const router = useRouter();
const { checkPermission } = useCloudPermission();

const canViewList = computed(() => checkPermission(10_085));
const canSwitch = computed(() => checkPermission(10_111));
const canViewDetail = computed(() => checkPermission(11_251));
const canAdd = computed(() => checkPermission(10_106));
const canEdit = computed(() => checkPermission(10_110));
const canAddMember = computed(() => checkPermission(11_353));

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
const filterType = ref<number | string>();
const filterMobile = ref('');
const filterRegistIP = ref('');
const filterLastLoginIP = ref('');
const filterRegistDevice = ref('');
const filterLastLoginDevice = ref('');
const filterWithdrawAccName = ref('');
const filterWithdrawAccNum = ref('');
const filterMainUsername = ref('');
const filterParentAdminId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const statisticsRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().startOf('day'),
  dayjs().endOf('day'),
]);
const drillPath = ref<Array<{ id: number | string; username: string }>>([]);
const totalData = ref<Record<string, number>>({});

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    DeveloperName: filterDeveloperName.value,
    BeginTime: filterDateRange.value?.[0]?.startOf('day').unix() || '',
    EndTime: filterDateRange.value?.[1]?.endOf('day').unix() || '',
    CountBeginTime: statisticsRange.value?.[0]?.startOf('day').unix() || '',
    CountEndTime: statisticsRange.value?.[1]?.endOf('day').unix() || '',
    LastLoginDevice: filterLastLoginDevice.value,
    LastLoginIP: filterLastLoginIP.value,
    MainUsername: filterMainUsername.value,
    MaintainerName: filterMaintainerName.value,
    MobileNumber: filterMobile.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    ParentAdminId: filterParentAdminId.value,
    RegistDevice: filterRegistDevice.value,
    RegistIP: filterRegistIP.value,
    Status: filterStatus.value || '',
    TeamName: filterTeamName.value,
    // 旧站空筛选项默认传 1,2,3（普通/特殊/测试），避免仅靠空串依赖后端兜底
    Type: filterType.value ? String(filterType.value) : '1,2,3',
    Username: filterUsername.value,
    WithdrawAccName: filterWithdrawAccName.value,
    WithdrawAccNum: filterWithdrawAccNum.value,
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
    {
      field: 'CommissionTemplateId',
      minWidth: 130,
      slots: { default: 'commission' },
      title: '佣金方案',
    },
    { field: 'ApiFeeTemplateName', minWidth: 130, title: '场馆费率' },
    { field: 'AlgorithmTemplateName', minWidth: 130, title: '佣金算法' },
    {
      field: 'CommissionRateDiff',
      formatter: ({ cellValue }) =>
        `${(Number(cellValue || 0) / 100).toFixed(2)}%`,
      minWidth: 110,
      title: '佣金级距',
    },
    { field: 'TeamName', minWidth: 120, title: '团队' },
    { field: 'DeveloperName', minWidth: 120, title: '发展人' },
    { field: 'MobileNumber', minWidth: 120, title: '手机号' },
    { field: 'MainUsername', minWidth: 120, title: '上级账号' },
    { field: 'AccountLevel', minWidth: 90, title: '代理层级' },
    {
      field: 'LowerAgent',
      minWidth: 90,
      slots: { default: 'lowerAgent' },
      title: '下级代理',
    },
    { field: 'Members', minWidth: 90, slots: { default: 'members' }, title: '下级会员' },
    { field: 'SumActiveStatus', minWidth: 90, slots: { default: 'activeMembers' }, title: '活跃人数' },
    {
      field: 'SumPayMoney',
      formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '存款',
    },
    {
      field: 'SumWithDrawMoney',
      formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '提款',
    },
    { field: 'SumBetGold', minWidth: 110, slots: { default: 'winLoss' }, title: '总输赢' },
    {
      field: 'SumBetValidMoney',
      formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '有效投注',
    },
    { field: 'RegIp', minWidth: 130, title: '注册 IP' },
    { field: 'RegAddress', minWidth: 140, title: '注册地址' },
    { field: 'LastLoginIp', minWidth: 130, title: '最后登录 IP' },
    { field: 'LastLoginAddress', minWidth: 140, title: '最后登录地址' },
    { field: 'MaintainerName', minWidth: 110, title: '维护人' },
    { field: 'PackageId', minWidth: 130, title: '推广产品' },
    {
      field: 'RemarkOnDeactivation',
      minWidth: 150,
      title: '备注',
    },
    { field: 'SettlementType', minWidth: 100, title: '佣金周期' },
    { field: 'SendCommissionType', minWidth: 110, title: '发佣方式' },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 230,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await fetchAgencyListApi(getQueryParams(page));
          const items = result.Items || [];
          totalData.value = (result.Total || {}) as Record<string, number>;
          return {
            items,
            total: Number(result.Pagination?.MaxCount || items.length),
          };
        } catch {
          totalData.value = {};
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function resetFilters() {
  filterUsername.value = '';
  filterTeamName.value = '';
  filterDeveloperName.value = '';
  filterMaintainerName.value = '';
  filterStatus.value = undefined;
  filterType.value = undefined;
  filterMobile.value = '';
  filterRegistIP.value = '';
  filterLastLoginIP.value = '';
  filterRegistDevice.value = '';
  filterLastLoginDevice.value = '';
  filterWithdrawAccName.value = '';
  filterWithdrawAccNum.value = '';
  filterMainUsername.value = '';
  filterParentAdminId.value = '';
  filterDateRange.value = undefined;
  statisticsRange.value = [
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ];
  drillPath.value = [];
  gridApi.reload();
}

function openDetail(row: AgencyListItem) {
  const adminId = row.AdminId;
  if (!canViewDetail.value || !adminId) {
    return;
  }
  router.push({
    path: `/netcash/agencyAccountDetails/${adminId}`,
    query: {
      CountBeginTime: statisticsRange.value?.[0]?.startOf('day').unix() || '',
      CountEndTime: statisticsRange.value?.[1]?.endOf('day').unix() || '',
      Name: String(row.Name || ''),
    },
  });
}

function drillDown(row: AgencyListItem) {
  const adminId = row.AdminId ?? row.Id;
  if (!adminId || Number(row.LowerAgent || 0) <= 0) {
    return;
  }
  drillPath.value.push({
    id: adminId,
    username: String(row.Username || adminId),
  });
  filterParentAdminId.value = String(adminId);
  gridApi.reload();
}

function drillBack(index: number) {
  const target = drillPath.value[index - 1];
  drillPath.value = drillPath.value.slice(0, index);
  filterParentAdminId.value = target ? String(target.id) : '';
  gridApi.reload();
}

const statusModalOpen = ref(false);
const statusRow = ref<AgencyListItem>();
const statusRemark = ref('');
const statusSubmitting = ref(false);

function handleSwitch(row: AgencyListItem) {
  statusRow.value = row;
  statusRemark.value = '';
  statusModalOpen.value = true;
}

async function submitStatus() {
  if (!/^[^\r\n]{1,400}$/.test(statusRemark.value.trim())) {
    message.warning('请输入 1-400 个字符的状态变更备注，不能包含换行');
    return;
  }
  const row = statusRow.value;
  const adminId = row?.AdminId ?? row?.Id;
  if (!row || !adminId) {
    return;
  }
  statusSubmitting.value = true;
  try {
    await switchAgencyStatusApi({
      AdminId: adminId,
      Name: String(row.Username || row.Name || ''),
      RemarkOnDeactivation: statusRemark.value.trim(),
      Status: Number(row.Status) === 1 ? 2 : 1,
    });
    message.success('操作成功');
    statusModalOpen.value = false;
    gridApi.reload();
  } catch {
    // 全局拦截已提示；避免未捕获异常
  } finally {
    statusSubmitting.value = false;
  }
}

const memberModalOpen = ref(false);
const memberRow = ref<AgencyListItem>();
function openMemberModal(row: AgencyListItem) {
  if (!row.AdminId) return;
  memberRow.value = row;
  memberModalOpen.value = true;
}

const memberDetailOpen = ref(false);
const memberDetailActiveOnly = ref(false);
const memberDetailRow = ref<AgencyListItem>();
function openMemberDetail(row: AgencyListItem, activeOnly: boolean) {
  if (!row.AdminId) return;
  memberDetailRow.value = row;
  memberDetailActiveOnly.value = activeOnly;
  memberDetailOpen.value = true;
}

const exportLoading = ref(false);
async function exportAgencyList() {
  exportLoading.value = true;
  try {
    const result = await fetchAgencyListApi({
      ...getQueryParams({ currentPage: 1, pageSize: 100_000 }),
      IsExp: true,
    });
    const data = (result?.Items || []).map((row) => ({
      状态: AGENCY_STATUS_MAP[Number(row.Status)] || row.Status,
      代理账号: row.Username,
      姓名: row.Name,
      创建时间: formatNetcashDateTime(row.CreateTime),
      代理类型: AGENCY_TYPE_MAP[Number(row.Type)] || row.Type,
      团队: row.TeamName,
      代理模式: AGENCY_ACCOUNT_TYPE_MAP[Number(row.AccountType)] || row.AccountType,
      佣金方案:
        Number(row.AccountType) === 2
          ? `${Number(row.CommissionRate || 0) / 100}%`
          : row.CommissionTemplateName ||
            row.CommissionMultiTemplateName ||
            row.CommissionTemplateId ||
            row.CommissionMultiTemplateId,
      场馆费率: row.ApiFeeTemplateName || row.ApiFeeTemplateId,
      佣金算法: row.AlgorithmTemplateName || row.AlgorithmTemplateId,
      佣金周期: row.SettlementType,
      发佣方式: row.SendCommissionType,
      佣金级距: `${(Number(row.CommissionRateDiff || 0) / 100).toFixed(2)}%`,
      代理层级: row.AccountLevel,
      上级账号: row.MainUsername,
      下级代理: row.LowerAgent,
      下级会员: row.Members,
      活跃人数: row.SumActiveStatus,
      存款: formatAmountFromCent(Number(row.SumPayMoney || 0)),
      提款: formatAmountFromCent(Number(row.SumWithDrawMoney || 0)),
      总输赢: formatAmountFromCent(
        Number(row.SumBetGold || 0) - Number(row.SumWinGold || 0),
      ),
      有效投注: formatAmountFromCent(Number(row.SumBetValidMoney || 0)),
      注册IP: row.RegIp,
      注册地址: row.RegAddress,
      最后登录IP: row.LastLoginIp,
      最后登录地址: row.LastLoginAddress,
      发展人: row.DeveloperName,
      维护人: row.MaintainerName,
      推广产品: row.PackageId,
      备注: row.RemarkOnDeactivation,
    }));
    if (!data.length) return void message.warning('暂无可导出数据');
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data), '代理列表');
    XLSX.writeFile(book, `代理列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  } catch {
    // 全局拦截已提示
  } finally {
    exportLoading.value = false;
  }
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
      <Select
        v-model:value="filterType"
        allow-clear
        :options="[
          { label: '普通代理', value: 1 },
          { label: '特殊代理', value: 2 },
          { label: '测试代理', value: 3 },
        ]"
        placeholder="代理类型"
        style="width: 130px"
      />
      <Input
        v-model:value="filterMobile"
        allow-clear
        placeholder="手机号"
        style="width: 160px"
      />
      <Input
        v-model:value="filterMainUsername"
        allow-clear
        placeholder="上级账号"
        style="width: 160px"
      />
      <Input
        v-model:value="filterParentAdminId"
        allow-clear
        placeholder="下级代理 ID"
        style="width: 160px"
      />
      <Input
        v-model:value="filterWithdrawAccName"
        allow-clear
        placeholder="银行姓名"
        style="width: 160px"
      />
      <Input
        v-model:value="filterWithdrawAccNum"
        allow-clear
        placeholder="银行卡号"
        style="width: 180px"
      />
      <Input
        v-model:value="filterRegistIP"
        allow-clear
        placeholder="注册 IP"
        style="width: 150px"
      />
      <Input
        v-model:value="filterLastLoginIP"
        allow-clear
        placeholder="最后登录 IP"
        style="width: 160px"
      />
      <Input
        v-model:value="filterRegistDevice"
        allow-clear
        placeholder="注册设备"
        style="width: 160px"
      />
      <Input
        v-model:value="filterLastLoginDevice"
        allow-clear
        placeholder="最后登录设备"
        style="width: 170px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <span class="text-sm text-gray-500">统计时间</span>
      <DatePicker.RangePicker v-model:value="statisticsRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button :loading="exportLoading" @click="exportAgencyList">导出 Excel</Button>
      <Button v-if="canAdd" type="primary" @click="openCreateModal">
        新增代理
      </Button>
    </div>

    <div v-if="drillPath.length" class="mb-3 flex items-center gap-1 text-sm">
      <Button size="small" type="link" @click="drillBack(0)">全部代理</Button>
      <template v-for="(item, index) in drillPath" :key="item.id">
        <span>/</span>
        <Button size="small" type="link" @click="drillBack(index + 1)">
          {{ item.username }}
        </Button>
      </template>
    </div>
    <div class="mb-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
      <div class="rounded border p-2">会员：{{ totalData.TotalMember ?? totalData.Members ?? 0 }}</div>
      <div class="rounded border p-2">存款：{{ formatAmountFromCent(totalData.SumPayMoney ?? totalData.TotalPayMoney ?? 0) }}</div>
      <div class="rounded border p-2">提款：{{ formatAmountFromCent(totalData.SumWithDrawMoney ?? totalData.TotalWithDrawMoney ?? 0) }}</div>
      <div class="rounded border p-2">输赢：{{ formatAmountFromCent((totalData.SumBetGold ?? 0) - (totalData.SumWinGold ?? 0)) }}</div>
      <div class="rounded border p-2">有效投注：{{ formatAmountFromCent(totalData.SumBetValidMoney ?? totalData.TotalBetMoney ?? 0) }}</div>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="row.Status === 1 ? 'success' : 'error'">
          {{ AGENCY_STATUS_MAP[Number(row.Status)] || row.Status }}
        </Tag>
      </template>
      <template #lowerAgent="{ row }">
        <Button
          v-if="Number(row.LowerAgent || 0) > 0"
          size="small"
          type="link"
          @click="drillDown(row)"
        >
          {{ row.LowerAgent ?? 0 }}
        </Button>
        <span v-else>0</span>
      </template>
      <template #members="{ row }">
        <Button size="small" type="link" @click="openMemberDetail(row, false)">
          {{ row.Members ?? 0 }}
        </Button>
      </template>
      <template #activeMembers="{ row }">
        <Button size="small" type="link" @click="openMemberDetail(row, true)">
          {{ row.SumActiveStatus ?? '查看' }}
        </Button>
      </template>
      <template #winLoss="{ row }">
        {{
          formatAmountFromCent(
            Number(row.SumBetGold || 0) - Number(row.SumWinGold || 0),
          )
        }}
      </template>
      <template #commission="{ row }">
        <span v-if="Number(row.AccountType) === 1">
          {{ row.CommissionTemplateName || row.CommissionTemplateId || '-' }}
        </span>
        <span v-else-if="Number(row.AccountType) === 2">
          {{ Number(row.CommissionRate || 0) / 100 }}%
        </span>
        <span v-else>
          {{
            row.CommissionMultiTemplateName ||
            row.CommissionMultiTemplateId ||
            '查看多费率'
          }}
        </span>
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
          <Button
            v-if="canAddMember && Number(row.Type) !== 3"
            size="small"
            type="link"
            @click="openMemberModal(row)"
          >
            添加会员
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
    <AgencyMemberModal
      v-model:open="memberModalOpen"
      :admin-id="memberRow?.AdminId"
      :admin-name="memberRow?.Username"
      @success="gridApi.reload()"
    />
    <AgencyMemberDetailModal
      v-model:open="memberDetailOpen"
      :active-only="memberDetailActiveOnly"
      :admin-id="memberDetailRow?.AdminId"
      :begin-time="statisticsRange?.[0]?.startOf('day').unix()"
      :end-time="statisticsRange?.[1]?.endOf('day').unix()"
      :username="memberDetailRow?.Username"
    />
    <Modal
      v-model:open="statusModalOpen"
      :confirm-loading="statusSubmitting"
      title="状态变更"
      @ok="submitStatus"
    >
      <p class="mb-3">
        确认{{ Number(statusRow?.Status) === 1 ? '停用' : '启用' }}代理
        {{ statusRow?.Username || '' }}？
      </p>
      <Input
        v-model:value="statusRemark"
        :maxlength="200"
        placeholder="请输入状态变更备注"
      />
    </Modal>
  </div>
</template>
