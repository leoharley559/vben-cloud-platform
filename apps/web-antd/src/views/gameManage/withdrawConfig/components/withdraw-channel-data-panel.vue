<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Empty,
  Input,
  Pagination,
  Select,
  Spin,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchWithdrawChannelDataApi } from '#/api/gameManage/withdraw-data';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'WithdrawChannelDataPanel' });

interface WithdrawChannelRow {
  Account?: string;
  AccountType?: number | string;
  DailyAmount?: number;
  DailyCount?: number;
  DailySuccess?: number;
  HandleType?: number;
  Id?: number | string;
  RealName?: string;
  ThirdWithdrawId?: number | string;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();
const { memberTypeOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const canView = computed(() => checkPermission(10_984));
const loading = ref(false);
const list = ref<WithdrawChannelRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const sort = ref('');
const account = ref('');
const dataSearchType = ref(0);
const dateRange = ref<[Dayjs, Dayjs]>([
  // 对齐旧站 getBeforeDateTimestamp(31, false) → days-1=30，即近 30 天 0 点～今日结束
  dayjs().subtract(30, 'day').startOf('day'),
  dayjs().endOf('day'),
]);

const withdrawTypeMap = computed(() => {
  const source = projectConfig.value?.WithdrawTypeList as
    | Array<{
        I18nKey?: string;
        Key?: number | string;
        Name?: string;
        ShowName?: string;
      }>
    | undefined;
  return new Map(
    (source ?? []).map((item) => [
      String(item.Key ?? ''),
      item.ShowName || item.Name || item.I18nKey || String(item.Key ?? ''),
    ]),
  );
});

const columns = [
  { dataIndex: 'time', key: 'time', minWidth: 210, title: '时间' },
  {
    dataIndex: 'AccountType',
    key: 'AccountType',
    sorter: true,
    title: '通道类型',
    width: 120,
  },
  {
    dataIndex: 'accountKind',
    key: 'accountKind',
    title: '账号类型',
    width: 120,
  },
  {
    dataIndex: 'Account',
    key: 'Account',
    sorter: true,
    title: '账户',
    width: 180,
  },
  {
    dataIndex: 'RealName',
    key: 'RealName',
    sorter: true,
    title: '姓名',
    width: 120,
  },
  {
    dataIndex: 'DailyAmount',
    key: 'DailyAmount',
    sorter: true,
    title: '出款金额',
    width: 130,
  },
  {
    dataIndex: 'DailyCount',
    key: 'DailyCount',
    sorter: true,
    title: '订单数量',
    width: 110,
  },
  {
    dataIndex: 'successRate',
    key: 'successRate',
    title: '成功率',
    width: 100,
  },
];

function buildQuery() {
  return {
    Account: account.value.trim(),
    BeginTime: dateRange.value[0].unix(),
    DataSearchType: dataSearchType.value,
    EndTime: dateRange.value[1].unix(),
    Keyword: '',
    Page: page.value,
    PageSize: pageSize.value,
    Sort: sort.value,
  };
}

async function loadData() {
  if (!canView.value) return;
  loading.value = true;
  try {
    const result = await fetchWithdrawChannelDataApi(buildQuery());
    list.value = result.Items as WithdrawChannelRow[];
    total.value = Number(result.Pagination?.MaxCount ?? list.value.length);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  void loadData();
}

function handleReset() {
  account.value = '';
  dataSearchType.value = 0;
  sort.value = '';
  page.value = 1;
  dateRange.value = [
    dayjs().subtract(30, 'day').startOf('day'),
    dayjs().endOf('day'),
  ];
  void loadData();
}

function handlePageChange(nextPage: number, nextPageSize: number) {
  page.value = nextPageSize === pageSize.value ? nextPage : 1;
  pageSize.value = nextPageSize;
  void loadData();
}

const handleTableChange: NonNullable<TableProps['onChange']> = (
  _pagination,
  _filters,
  sorterValue,
) => {
  const sorter = Array.isArray(sorterValue) ? sorterValue[0] : sorterValue;
  sort.value =
    sorter?.order === 'ascend'
      ? String(sorter.field || '')
      : sorter?.order === 'descend'
        ? `-${String(sorter.field || '')}`
        : '';
  page.value = 1;
  void loadData();
};

function accountKind(row: WithdrawChannelRow) {
  if (Number(row.ThirdWithdrawId || 0) !== 0) return '第三方账户';
  if (Number(row.HandleType) === 1) return '签约账户';
  return '普通用户';
}

function successRate(row: WithdrawChannelRow) {
  const count = Number(row.DailyCount || 0);
  return count > 0
    ? `${((Number(row.DailySuccess || 0) / count) * 100).toFixed(2)}%`
    : '0.00%';
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <OpsListPanel v-if="canView">
    <template #filters>
      <Input
        v-model:value="account"
        allow-clear
        placeholder="请输入账户"
        style="width: 220px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>账户</template>
      </Input>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">日期</span>
        <DatePicker.RangePicker
          v-model:value="dateRange"
          show-time
          :allow-clear="false"
          format="YYYY-MM-DD HH:mm:ss"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">数据类型</span>
        <Select
          v-model:value="dataSearchType"
          :options="memberTypeOptions"
          style="width: 120px"
        />
      </div>
      <Button type="primary" :loading="loading" @click="handleSearch">
        查询
      </Button>
      <Button @click="handleReset">重置</Button>
    </template>

    <Spin :spinning="loading">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.Id ?? row.Account ?? '')"
        :scroll="{ x: 1100 }"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'time'">
            {{ dateRange[0].format('YYYY-MM-DD HH:mm:ss') }} -
            {{ dateRange[1].format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.key === 'AccountType'">
            {{ withdrawTypeMap.get(String(record.AccountType ?? '')) || '-' }}
          </template>
          <template v-else-if="column.key === 'accountKind'">
            {{ accountKind(record) }}
          </template>
          <template v-else-if="column.key === 'DailyAmount'">
            {{ formatAmountFromCent(record.DailyAmount) }}
          </template>
          <template v-else-if="column.key === 'successRate'">
            {{ successRate(record) }}
          </template>
        </template>
      </Table>
      <div v-if="total > 0" class="mt-3 flex justify-end">
        <Pagination
          :current="page"
          :page-size="pageSize"
          :total="total"
          show-size-changer
          show-quick-jumper
          @change="handlePageChange"
        />
      </div>
    </Spin>
  </OpsListPanel>
  <Empty v-else description="无通道数据权限（10984）" />
</template>
