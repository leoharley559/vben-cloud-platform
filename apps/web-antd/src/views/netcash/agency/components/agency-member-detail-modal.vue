<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, message, Modal, Table, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { fetchJuniorMemberListApi } from '#/api/netcash/junior-member';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

type Row = Record<string, any>;
const props = defineProps<{
  activeOnly: boolean;
  adminId?: number | string;
  beginTime?: number | string;
  endTime?: number | string;
  open: boolean;
  username?: string;
}>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const loading = ref(false);
const exporting = ref(false);
const rows = ref<Row[]>([]);
const activeTotal = ref(0);
const columns = [
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号', width: 150 },
  { dataIndex: 'Status', key: 'Status', title: '状态', width: 90 },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品', width: 130 },
  { dataIndex: 'RealName', key: 'RealName', title: '真实姓名', width: 110 },
  { dataIndex: 'Email', key: 'Email', title: '邮箱', width: 170 },
  { dataIndex: 'PayMoney', key: 'PayMoney', title: '存款', width: 120 },
  { dataIndex: 'WithDrawMoney', key: 'WithDrawMoney', title: '提款', width: 120 },
  { dataIndex: 'BetGold', key: 'BetGold', title: '总流水', width: 120 },
  { dataIndex: 'WinLoss', key: 'WinLoss', title: '总输赢', width: 120 },
  { dataIndex: 'LastTime', key: 'LastTime', title: '最后登录时间', width: 170 },
  { dataIndex: 'LastIp', key: 'LastIp', title: '最后登录 IP', width: 140 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '注册时间', width: 170 },
];
const amountFields = new Set(['PayMoney', 'WithDrawMoney', 'BetGold', 'WinLoss']);
const dateFields = new Set(['LastTime', 'CreateTime']);
const statusMap: Record<number, string> = {
  0: '正常',
  1: '良好',
  2: '订阅',
  3: '封禁',
  4: '禁止取款',
  6: '暂时关闭',
  8: '测试',
};

function query(isExport = false) {
  return {
    ActiveStatus: props.activeOnly ? 1 : '',
    AdminId: props.adminId,
    BeginTime: props.beginTime || '',
    EndTime: props.endTime || '',
    IsDialogList: true,
    IsExp: isExport,
    Page: 1,
    PageSize: isExport ? 100_000 : 999,
  };
}
function mapRows(items: Row[]) {
  return items.map((item) => ({
    ...item,
    WinLoss: Number(item.WinGold || 0) - Number(item.BetGold || 0),
  }));
}
async function load() {
  if (!props.adminId) return;
  loading.value = true;
  try {
    const result = await fetchJuniorMemberListApi(query());
    rows.value = mapRows(result.Items || []);
    activeTotal.value = Number(result.Total?.ActiveCount || 0);
  } catch {
    rows.value = [];
    activeTotal.value = 0;
  } finally {
    loading.value = false;
  }
}
function display(field: string, value: unknown) {
  if (amountFields.has(field)) return formatAmountFromCent(Number(value || 0));
  if (dateFields.has(field)) return formatNetcashDateTime(value as number);
  return value === null || value === undefined || value === '' ? '-' : String(value);
}
async function exportRows() {
  exporting.value = true;
  try {
    const result = await fetchJuniorMemberListApi(query(true));
    const data = mapRows(result.Items || []).map((item) =>
      Object.fromEntries(
        columns.map((column) => [
          column.title,
          column.key === 'Status'
            ? statusMap[Number(item.Status)] || item.Status
            : display(column.key, item[column.key]),
        ]),
      ),
    );
    if (!data.length) return void message.warning('暂无可导出数据');
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data), '会员明细');
    XLSX.writeFile(
      book,
      `${props.activeOnly ? '活跃人数' : '下级会员'}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
    );
  } catch {
    // 全局拦截已提示
  } finally {
    exporting.value = false;
  }
}
watch(
  () => props.open,
  (open) => open && load(),
);
</script>

<template>
  <Modal
    :open="open"
    :title="`${activeOnly ? '活跃人数' : '下级会员'} · ${username || ''}${activeOnly ? `（共 ${activeTotal}）` : ''}`"
    width="1100px"
    @cancel="emit('update:open', false)"
  >
    <template #footer>
      <Button @click="emit('update:open', false)">关闭</Button>
      <Button :loading="exporting" type="primary" @click="exportRows">导出 Excel</Button>
    </template>
    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      row-key="PlayerId"
      :scroll="{ x: 1500, y: 480 }"
      size="small"
    >
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.key === 'LoginAccount'">
          <PlayerAccountLink
            :login-account="String(record.LoginAccount || '')"
            :player-id="record.PlayerId as number | string | undefined"
          />
        </template>
        <template v-else-if="column.key === 'Status'">
          <Tag>{{ statusMap[Number(record.Status)] || record.Status }}</Tag>
        </template>
        <template v-else>{{ text ?? display(String(column.key), record[column.key]) }}</template>
      </template>
    </Table>
  </Modal>
</template>
