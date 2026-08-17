<script lang="ts" setup>
import type { TableColumnType, TableProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Input,
  Menu,
  message,
  Modal,
  Pagination,
  Result,
  Row,
  Select,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPlayerAnalyzeListApi,
  updatePlayerAnalyzeStatusApi,
} from '#/api/dataClose/player-report';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import { formatAmount, formatAmountFromCent } from '#/utils/format-amount';
import { formatPlayerStatus } from '#/utils/player-status';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import {
  arrayToCsvParam,
  calcChargeExchangeRatio,
  formatOfflineDuration,
  formatOnlineDuration,
  formatReportDateTime,
  resolveReportRange,
  stripPhonePrefix,
} from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'PlayerAnalyze' });

type Row = Record<string, unknown>;

/** 对齐旧站 validLoginAccount */
const LOGIN_ACCOUNT_RE = /^[a-zA-Z0-9]{4,20}$/;

const REGISTER_OR_LOGIN_OPTIONS = [
  { label: '注册用户', value: 1 },
  { label: '登录用户', value: 2 },
];

const DATA_TYPE_OPTIONS = [
  { label: '全部', value: 2 },
  { label: '正式数据', value: 0 },
];

const RECHARGE_OPTIONS = [
  { label: '不限', value: '-1' },
  { label: '大于0', value: '0' },
  { label: '大于100', value: '100' },
  { label: '大于1000', value: '1000' },
  { label: '大于10000', value: '10000' },
  { label: '大于100000', value: '100000' },
];

const PROFIT_OPTIONS = [
  { label: '不限', value: '-1' },
  { label: '盈利', value: '1' },
  { label: '亏损', value: '2' },
];

const OFFLINE_OPTIONS = [
  { label: '不限', value: '-1' },
  { label: '大于1天', value: '86400' },
  { label: '大于3天', value: String(3 * 86_400) },
  { label: '大于7天', value: String(7 * 86_400) },
  { label: '大于14天', value: String(14 * 86_400) },
];

/** 优质/关注/封号/禁提/普通/临时关闭踢下线/测试 */
const STATUS_ACTIONS = [
  { label: '优质', value: 1 },
  { label: '关注', value: 2 },
  { label: '封号', value: 3 },
  { label: '禁提', value: 4 },
  { label: '普通', value: 0 },
  { label: '临时关闭踢下线', value: 6 },
  { label: '测试', value: 8 },
];

const { checkPermission } = useCloudPermission();
const { packageOptions } = useReportOptions();

const canView = computed(() => checkPermission(10_522));
const canExport = computed(() => checkPermission(10_523));
const canStatus = computed(() => checkPermission(10_524));
const canDetail = computed(() => checkPermission(10_525));

const loading = ref(false);
const exportLoading = ref(false);
const tableData = ref<Row[]>([]);
const total = ref(0);
const sort = ref('');

const filters = reactive({
  LoginAccount: '',
  AdminIds: [] as Array<number | string>,
  ChannelId: [] as Array<number | string>,
  PackageId: undefined as number | string | undefined,
  DataSearchType: 0 as number,
  RegisterOrLogin: 1 as number,
  Recharged: '-1' as string,
  ProfitStatus: '-1' as string,
  Offline: '-1' as string,
  dateRange: [...resolveReportRange('last7ToToday')] as [Dayjs, Dayjs],
});

const page = reactive({ current: 1, pageSize: 20 });

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...packageOptions.value,
]);

function disabledDate(current: Dayjs) {
  if (!current) return false;
  return current.isAfter(dayjs().endOf('day'));
}

function normalizeLoginAccount() {
  // 对齐旧站 keyup：去空格、转小写
  filters.LoginAccount = filters.LoginAccount.replace(/\s/g, '').toLowerCase();
}

function validateLoginAccount() {
  normalizeLoginAccount();
  const account = filters.LoginAccount;
  if (!account) return true;
  if (!LOGIN_ACCOUNT_RE.test(account)) {
    message.warning('游戏账号需为 4-20 位字母或数字');
    return false;
  }
  return true;
}

function validateDateRange(range: [Dayjs, Dayjs] | null | undefined) {
  if (!range?.[0] || !range?.[1]) {
    message.warning('请选择日期');
    return false;
  }
  const days = range[1].startOf('day').diff(range[0].startOf('day'), 'day');
  if (days > 6) {
    message.warning('查询区间最长 7 天');
    return false;
  }
  return true;
}

function buildQuery(excel: 1 | 2) {
  const range = filters.dateRange;
  return {
    Page: page.current,
    PageSize: page.pageSize,
    BeginTime: range?.[0]?.startOf('day').unix() || '',
    EndTime: range?.[1]?.endOf('day').unix() || '',
    AdminIds: arrayToCsvParam(filters.AdminIds),
    PackageId: filters.PackageId || undefined,
    LoginAccount: filters.LoginAccount || undefined,
    ChannelIds: arrayToCsvParam(filters.ChannelId),
    Offline: filters.Offline,
    ProfitStatus: filters.ProfitStatus,
    Recharged: filters.Recharged,
    RegisterOrLogin: filters.RegisterOrLogin,
    Excel: excel,
    DataSearchType: filters.DataSearchType,
    Sort: sort.value || undefined,
  };
}

function offlineText(row: Row) {
  if (row.Online) return '在线';
  if (!row.LastTime) return '-';
  const seconds = Math.floor(Date.now() / 1000) - Number(row.LastTime || 0);
  return formatOfflineDuration(seconds);
}

const columns = computed<TableColumnType<Row>[]>(() => {
  const cols: TableColumnType<Row>[] = [
    {
      align: 'center',
      key: 'LoginAccount',
      title: '账号',
      width: 150,
    },
    {
      align: 'center',
      key: 'Status',
      title: '状态',
      width: 90,
    },
    {
      align: 'center',
      dataIndex: 'ChannelId',
      key: 'ChannelId',
      title: '渠道',
      width: 110,
    },
    {
      align: 'center',
      dataIndex: 'PackageName',
      key: 'PackageName',
      title: '包体',
      width: 120,
    },
    {
      align: 'center',
      dataIndex: 'Profit',
      key: 'Profit',
      sorter: true,
      title: '盈利',
      width: 110,
    },
    {
      align: 'center',
      customRender: ({ record }) => formatAmount(record.Recharged),
      dataIndex: 'Recharged',
      key: 'Recharged',
      sorter: true,
      title: '充值',
      width: 110,
    },
    {
      align: 'center',
      customRender: ({ record }) => formatAmount(record.WithdrawGold),
      dataIndex: 'WithdrawGold',
      key: 'WithdrawGold',
      sorter: true,
      title: '兑换',
      width: 110,
    },
    {
      align: 'center',
      customRender: ({ record }) => calcChargeExchangeRatio(record.Recharged, record.WithdrawGold),
      dataIndex: 'RechargedRatio',
      key: 'RechargedRatio',
      sorter: true,
      title: '充兑比',
      width: 100,
    },
    {
      align: 'center',
      customRender: ({ record }) => formatOnlineDuration(record.OnlineTime),
      key: 'OnlineTime',
      title: '在线时长',
      width: 110,
    },
    {
      align: 'center',
      customRender: ({ record }) => offlineText(record),
      dataIndex: 'LastTime',
      key: 'LastTime',
      sorter: true,
      title: '离线时长',
      width: 110,
    },
    {
      align: 'center',
      customRender: ({ record }) => stripPhonePrefix(record.BindPhone),
      key: 'BindPhone',
      title: '手机号',
      width: 130,
    },
    {
      align: 'center',
      customRender: ({ record }) => `VIP ${record.VipLevel ?? ''}`,
      key: 'VipLevel',
      title: 'VIP',
      width: 80,
    },
    {
      align: 'center',
      dataIndex: 'RealName',
      key: 'RealName',
      title: '真实姓名',
      width: 110,
    },
    {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.CreateTime),
      key: 'CreateTime',
      title: '注册',
      width: 160,
    },
    {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.LastOfflineTime),
      key: 'LastOfflineTime',
      title: '最后登录',
      width: 160,
    },
  ];

  if (canStatus.value) {
    cols.push({
      align: 'center',
      fixed: 'right',
      key: 'actions',
      title: '操作',
      width: 100,
    });
  }

  return cols;
});

async function fetchList() {
  if (!canView.value) return;
  if (!validateLoginAccount()) return;
  if (!validateDateRange(filters.dateRange)) return;
  loading.value = true;
  try {
    const result = await fetchPlayerAnalyzeListApi(buildQuery(2));
    tableData.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || 0);
  } catch {
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.current = 1;
  void fetchList();
}

function handleSideFilterChange() {
  page.current = 1;
  void fetchList();
}

function handleReset() {
  filters.LoginAccount = '';
  filters.AdminIds = [];
  filters.ChannelId = [];
  filters.PackageId = undefined;
  filters.DataSearchType = 0;
  filters.RegisterOrLogin = 1;
  filters.Recharged = '-1';
  filters.ProfitStatus = '-1';
  filters.Offline = '-1';
  filters.dateRange = [...resolveReportRange('last7ToToday')] as [Dayjs, Dayjs];
  sort.value = '';
  handleSearch();
}

const handleTableChange: TableProps['onChange'] = (_pag, _filters, sorter) => {
  const s = Array.isArray(sorter) ? sorter[0] : sorter;
  const field = String(s?.field || s?.columnKey || '');
  if (s?.order === 'ascend') {
    sort.value = field;
  } else if (s?.order === 'descend') {
    sort.value = `-${field}`;
  } else {
    sort.value = '';
  }
  page.current = 1;
  void fetchList();
};

function handlePageChange(current: number, pageSize: number) {
  page.current = current;
  page.pageSize = pageSize;
  void fetchList();
}

async function switchStatus(row: Row, status: number) {
  const name = String(row.PlayerName || row.LoginAccount || row.PlayerId);
  const label =
    STATUS_ACTIONS.find((item) => item.value === status)?.label || formatPlayerStatus(status);
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      content:
        status === 6
          ? `确认将玩家「${name}」设置为「${label}」？`
          : `确认将玩家「${name}」的状态切换为「${label}」？`,
      title: '提示',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;

  loading.value = true;
  try {
    await updatePlayerAnalyzeStatusApi({
      PlayerId: row.PlayerId as number | string,
      Status: status,
    });
    message.success('修改成功');
    await fetchList();
  } catch {
    message.error('状态修改失败');
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  if (!validateLoginAccount()) return;
  if (!validateDateRange(filters.dateRange)) return;
  exportLoading.value = true;
  try {
    const result = await fetchPlayerAnalyzeListApi(buildQuery(1));
    const list = result.Items || [];
    if (list.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    await exportReportXlsx(
      list,
      [
        '游戏账号',
        '所属渠道',
        '产品名称',
        '盈利',
        '充值金额',
        '兑换金额',
        '充兑比',
        '在线时长',
        '离线时长',
        '手机号',
        'VIP等级',
        '真实姓名',
        '注册时间',
        '最后登录时间',
      ],
      '玩家分析',
      (row) => [
        row.LoginAccount,
        row.ChannelName || row.ChannelId,
        row.PackageName,
        formatAmountFromCent(row.Profit),
        Number(row.Recharged || 0),
        Number(row.WithdrawGold || 0),
        calcChargeExchangeRatio(row.Recharged, row.WithdrawGold),
        formatOnlineDuration(row.OnlineTime),
        offlineText(row),
        stripPhonePrefix(row.BindPhone),
        `VIP${row.VipLevel ?? ''}`,
        row.RealName,
        formatReportDateTime(row.CreateTime),
        formatReportDateTime(row.LastOfflineTime),
      ],
    );
  } catch {
    message.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canView.value) {
    void fetchList();
  }
});
</script>

<template>
  <Page v-if="canView" auto-content-height description="数据闭环 · 玩家分析" title="玩家分析">
    <Card>
      <ReportQueryCard title="查询条件">
        <Input
          v-model:value="filters.LoginAccount"
          allow-clear
          placeholder="游戏账号"
          style="width: 220px"
          @blur="normalizeLoginAccount"
          @press-enter="handleSearch"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
        <Select
          v-model:value="filters.RegisterOrLogin"
          :options="REGISTER_OR_LOGIN_OPTIONS"
          placeholder="注册/登录用户"
          style="min-width: 130px"
        />
        <AccountSelect v-model="filters.AdminIds" style="min-width: 200px" />
        <ChannelSelect v-model="filters.ChannelId" style="min-width: 180px" />
        <Select
          v-model:value="filters.PackageId"
          allow-clear
          :options="packageSelectOptions"
          placeholder="产品"
          style="min-width: 160px"
          show-search
          option-filter-prop="label"
        />
        <Select
          v-model:value="filters.DataSearchType"
          :options="DATA_TYPE_OPTIONS"
          placeholder="数据类型"
          style="min-width: 120px"
        />
        <DatePicker.RangePicker
          v-model:value="filters.dateRange"
          :disabled-date="disabledDate"
          :placeholder="['开始日期', '结束日期']"
          style="width: 260px"
        />
        <template #actions>
          <Button type="primary" :loading="loading" @click="handleSearch"> 查询 </Button>
          <Button @click="handleReset">重置</Button>
          <Button
            v-if="canExport"
            type="primary"
            ghost
            :loading="exportLoading"
            @click="handleExport"
          >
            导出 Excel
          </Button>
        </template>
        <template #extra>
          <div class="text-xs text-gray-500">默认近 7 天至今天，最长 7 天</div>
        </template>
      </ReportQueryCard>

      <Row :gutter="16">
        <Col :xs="24" :md="6" :lg="5">
          <div class="mb-3 rounded border border-gray-100 bg-white p-3">
            <div class="text-gray-500">用户数量</div>
            <div class="text-xl font-medium">{{ total }}</div>
          </div>
          <div class="mb-3">
            <div class="mb-1 text-sm text-gray-500">充值情况</div>
            <Select
              v-model:value="filters.Recharged"
              class="w-full"
              :options="RECHARGE_OPTIONS"
              @change="handleSideFilterChange"
            />
          </div>
          <div class="mb-3">
            <div class="mb-1 text-sm text-gray-500">盈利情况</div>
            <Select
              v-model:value="filters.ProfitStatus"
              class="w-full"
              :options="PROFIT_OPTIONS"
              @change="handleSideFilterChange"
            />
          </div>
          <div class="mb-3">
            <div class="mb-1 text-sm text-gray-500">离线情况</div>
            <Select
              v-model:value="filters.Offline"
              class="w-full"
              :options="OFFLINE_OPTIONS"
              @change="handleSideFilterChange"
            />
          </div>
        </Col>

        <Col :xs="24" :md="18" :lg="19">
          <Table
            :columns="columns"
            :data-source="tableData"
            :loading="loading"
            :pagination="false"
            :scroll="{ x: 'max-content' }"
            bordered
            row-key="PlayerId"
            size="small"
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'LoginAccount'">
                <PlayerAccountLink
                  v-if="canDetail"
                  :login-account="String(record.LoginAccount || '')"
                  :permission-id="10525"
                  :player-id="record.PlayerId as number | string"
                />
                <span v-else>{{ record.LoginAccount || '-' }}</span>
              </template>
              <template v-else-if="column.key === 'ChannelId'">
                {{ record.ChannelName || record.ChannelId || '-' }}
              </template>
              <template v-else-if="column.key === 'Status'">
                <PlayerStatusTag :status="record.Status as number | string" />
              </template>
              <template v-else-if="column.key === 'Profit'">
                <span
                  :style="{
                    color: Number(record.Profit) < 0 ? '#f5222d' : '#52c41a',
                  }"
                >
                  {{ formatAmountFromCent(record.Profit) }}
                </span>
              </template>
              <template v-else-if="column.key === 'actions'">
                <Dropdown>
                  <Button size="small" type="link">操作</Button>
                  <template #overlay>
                    <Menu>
                      <Menu.Item
                        v-for="action in STATUS_ACTIONS"
                        :key="action.value"
                        :disabled="Number(record.Status) === action.value"
                        @click="switchStatus(record, action.value)"
                      >
                        {{ action.label }}
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
              </template>
            </template>
          </Table>

          <div v-if="total > 0" class="mt-4 flex justify-end">
            <Pagination
              :current="page.current"
              :page-size="page.pageSize"
              :total="total"
              show-size-changer
              show-quick-jumper
              @change="handlePageChange"
              @show-size-change="handlePageChange"
            />
          </div>
        </Col>
      </Row>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无玩家分析查看权限" title="403" />
</template>
