<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Result,
  Select,
  Table,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';

import {
  fetchAgentNetcashDetailApi,
  fetchWithdrawAgentListApi,
} from '#/api/netcash/agency-account-details';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

const props = defineProps<{ adminId: string }>();
const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(11_266));
type DataRow = Record<string, unknown>;
const loading = ref(false);
const exporting = ref(false);
const rows = ref<DataRow[]>([]);
const applicant = ref('');
const status = ref<number[]>([]);
const orderId = ref('');
/** 对齐旧站：默认不传时间，查全部；用户选择后再带 BeginTime/EndTime */
const dateRange = ref<[Dayjs, Dayjs] | undefined>();
const pager = reactive({ current: 1, pageSize: 20, total: 0 });
const totalAmount = ref(0);

const statusOptions = [
  { label: '待处理', value: 1 },
  { label: '已出款', value: 2 },
  { label: '退款驳回', value: 3 },
  { label: '不退款驳回', value: 4 },
  { label: '出款异常', value: 5 },
  { label: '处理中', value: 6 },
];
const payTypeMap: Record<number, string> = {
  2: '支付宝',
  3: 'USDT',
  201: 'GCash',
  202: 'GrabPay',
  203: 'PayMaya',
  204: '银行卡',
  206: '银行卡',
  209: '银行卡',
};
const columns = [
  { dataIndex: 'Status', key: 'Status', title: '状态', width: 110 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '申请时间', width: 170 },
  { dataIndex: 'ApplyAmount', key: 'ApplyAmount', title: '申请金额', width: 120 },
  { dataIndex: 'PayType', key: 'PayType', title: '出款类型', width: 120 },
  { dataIndex: 'PayName', key: 'PayName', title: '银行/渠道', width: 140 },
  { dataIndex: 'PayAccount', key: 'PayAccount', title: '收款账号', width: 180 },
  { dataIndex: 'PayRealName', key: 'PayRealName', title: '收款人', width: 120 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号', width: 190 },
  { dataIndex: 'Desc', key: 'Desc', title: '出款备注', width: 180 },
  { dataIndex: 'CloseAccount', key: 'CloseAccount', title: '处理人', width: 120 },
];

function statusText(row: DataRow) {
  const rowStatus = Number(row.Status);
  const process = Number(row.Process);
  const refundScore = Number(row.RefundScore);
  if (rowStatus === 1 && process <= 4) return '待处理';
  if (rowStatus === 1 && process === 6) return '出款异常';
  if ([2, 4].includes(rowStatus) && process === 7) return '已出款';
  if (rowStatus === 3 && process === 8 && refundScore === 1) return '退款驳回';
  if (rowStatus === 3 && process === 8 && refundScore === 2)
    return '不退款驳回';
  if (rowStatus === 1 && process === 5) return '待冲正';
  return '处理中';
}

function payTypeText(row: DataRow) {
  return Number(row.PayType) === 204
    ? String(row.PayName || '银行卡')
    : (payTypeMap[Number(row.PayType)] ?? String(row.PayType ?? '-'));
}

function query(isExp = false) {
  const params: Record<string, unknown> = {
    AgentId: props.adminId,
    Applicant: applicant.value,
    BeginTime: '',
    EndTime: '',
    IsExp: isExp,
    OrderId: orderId.value.trim(),
    Page: pager.current,
    PageSize: pager.pageSize,
  };
  if (dateRange.value?.length === 2) {
    params.BeginTime = dateRange.value[0].startOf('day').unix();
    params.EndTime = dateRange.value[1].endOf('day').unix();
  }
  if (status.value.length > 0) {
    params.WithdrawStatus = status.value.join(',');
  }
  return params;
}

async function load() {
  if (!props.adminId || !canView.value) return;
  loading.value = true;
  try {
    if (!applicant.value) {
      const detail = await fetchAgentNetcashDetailApi(props.adminId);
      applicant.value = String(detail.Username || '');
    }
    const result = await fetchWithdrawAgentListApi(
      query() as Parameters<typeof fetchWithdrawAgentListApi>[0],
    );
    rows.value = result.Items || [];
    pager.total = Number(result.Pagination?.MaxCount ?? rows.value.length);
    totalAmount.value = Number(
      result.Total?.ApplyAmount || result.Total?.TotalApplyAmount || 0,
    );
  } catch {
    rows.value = [];
    pager.total = 0;
    totalAmount.value = 0;
  } finally {
    loading.value = false;
  }
}

function reset() {
  status.value = [];
  orderId.value = '';
  pager.current = 1;
  dateRange.value = undefined;
  void load();
}

async function exportAll() {
  exporting.value = true;
  try {
    const result = await fetchWithdrawAgentListApi(
      query(true) as Parameters<typeof fetchWithdrawAgentListApi>[0],
    );
    const data = (result.Items || []).map((row) => ({
      状态: statusText(row),
      申请时间: formatNetcashDateTime(row.CreateTime as number | string),
      申请金额: formatAmountFromCent(Number(row.ApplyAmount || 0)),
      出款类型: row.PayType,
      银行渠道: row.PayName,
      收款账号: row.PayAccount,
      收款人: row.PayRealName,
      订单号: row.OrderId,
      出款备注: row.Desc,
      处理人: row.CloseAccount,
    }));
    if (data.length === 0) return;
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data), '提款记录');
    XLSX.writeFile(
      book,
      `代理提款记录_${props.adminId}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
    );
  } finally {
    exporting.value = false;
  }
}

const summaryItems = computed(() => [
  { label: '总提款', value: formatAmountFromCent(totalAmount.value) },
]);

watch(() => props.adminId, () => {
  applicant.value = '';
  void load();
});
onMounted(load);
</script>

<template>
  <div v-if="canView" class="space-y-3">
    <div class="mb-3">
      <div class="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2">
        <Input v-model:value="orderId" allow-clear placeholder="订单号" style="width: 220px">
          <template #addonBefore>订单号</template>
        </Input>
        <Select v-model:value="status" allow-clear mode="multiple" :options="statusOptions" placeholder="全部状态"
          style="min-width: 180px" />
        <DatePicker.RangePicker v-model:value="dateRange" />
        <Button type="primary" @click="load">查询</Button>
        <Button @click="reset">重置</Button>
        <Button :loading="exporting" @click="exportAll">导出全部</Button>
      </div>
    </div>
    <SummaryCards :items="summaryItems" />
    <Table bordered :columns="columns" :data-source="rows" :loading="loading" :pagination="{
      current: pager.current,
      pageSize: pager.pageSize,
      total: pager.total,
      showSizeChanger: true,
    }" :row-key="(row) => String(row.Id ?? row.OrderId ?? '')" :scroll="{ x: 1450 }" size="small" @change="
        (page) => {
          pager.current = page.current || 1;
          pager.pageSize = page.pageSize || 20;
          load();
        }
      ">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'Status'">
          {{ statusText(record) }}
        </template>
        <template v-else-if="column.key === 'CreateTime'">
          {{ formatNetcashDateTime(record.CreateTime) }}
        </template>
        <template v-else-if="column.key === 'ApplyAmount'">
          {{ formatAmountFromCent(Number(record.ApplyAmount || 0)) }}
        </template>
        <template v-else-if="column.key === 'PayType'">
          {{ payTypeText(record) }}
        </template>
        <template v-else-if="column.key === 'CloseAccount'">
          {{
            [3, 4].includes(Number(record.Status))
              ? record.CloseAccount || '-'
              : '-'
          }}
        </template>
      </template>
    </Table>
  </div>
  <Result v-else status="403" sub-title="无提款记录查看权限" title="403" />
</template>
