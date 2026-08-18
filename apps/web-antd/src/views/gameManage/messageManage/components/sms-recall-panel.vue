<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Descriptions,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchRecallDetailApi,
  fetchRecallListApi,
  sendRecallApi,
  updateRecallSwitchApi,
} from '#/api/gameManage/message-manage';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'SmsRecallPanel' });

const props = defineProps<{
  type: 'deposit' | 'register';
}>();

interface RecallRow {
  FirstPayNum?: number;
  NotFirstPayNum?: number;
  NotLoginNum?: number;
  NowDate?: string;
  RecallSuccess?: number;
  RegNum?: number;
  Status?: number;
}

interface RecallDetailRow {
  ChannelId?: number | string;
  ChannelName?: string;
  Count?: number;
  FirstPayTime?: number | string;
  InviteSite?: string;
  LastLoginTime?: number | string;
  LoginAccount?: string;
  PackageName?: string;
  Phone?: string;
  PlayerId?: number | string;
}

const isRegister = computed(() => props.type === 'register');
const defaultRange = (): [Dayjs, Dayjs] =>
  isRegister.value
    ? [
        dayjs().subtract(30, 'day').startOf('day'),
        dayjs().subtract(1, 'day').endOf('day'),
      ]
    : [
        dayjs().subtract(2, 'day').startOf('day'),
        dayjs().subtract(2, 'day').endOf('day'),
      ];
const dateRange = ref<[Dayjs, Dayjs]>(defaultRange());
const switchConfig = reactive({ IsAuto: false, IsOpen: false });
const recallMessage = ref('');
const messageVisible = ref(false);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailRows = ref<RecallDetailRow[]>([]);
const detailTotal = ref(0);
const detailSummary = ref(0);
const detailQuery = reactive({
  BeginTime: '',
  Page: 1,
  PageSize: 20,
  ReportType: 0,
});
const detailTitle = computed(() => {
  const metric =
    detailQuery.ReportType === 0
      ? (isRegister.value
        ? '注册人数'
        : '首存人数')
      : '待召回人数';
  return `${metric} - ${detailQuery.BeginTime}`;
});

const detailSummaryItems = computed(() => {
  if (!isRegister.value && detailQuery.ReportType !== 1) {
    return [];
  }
  return [
    {
      label: isRegister.value ? '首存人数' : '成功召回人数',
      value: detailSummary.value,
    },
  ];
});

function recallRate(row: RecallRow) {
  if (!Number(row.NotLoginNum)) return '0.00%';
  return `${(
    (Number(row.RecallSuccess || 0) / Number(row.NotLoginNum)) *
    100
  ).toFixed(2)}%`;
}

function statusText(status?: number) {
  if (Number(status) === 1) return '发送成功';
  if (Number(status) === 2) return '发送失败';
  return '未发送';
}

const listColumns: VxeTableGridOptions<RecallRow>['columns'] = [
  { field: 'NowDate', minWidth: 130, title: '日期' },
  {
    field: isRegister.value ? 'RegNum' : 'FirstPayNum',
    minWidth: 120,
    slots: { default: 'baseCount' },
    title: isRegister.value ? '注册人数' : '首存人数',
  },
  {
    field: isRegister.value ? 'NotFirstPayNum' : 'NotLoginNum',
    minWidth: 130,
    slots: { default: 'recallCount' },
    title: '待召回人数',
  },
  ...(isRegister.value
    ? []
    : [
        { field: 'RecallSuccess', minWidth: 130, title: '成功召回人数' },
        {
          field: 'recallRate',
          formatter: ({ row }: { row: RecallRow }) => recallRate(row),
          minWidth: 130,
          title: '成功召回率',
        },
      ]),
  {
    field: 'Status',
    minWidth: 110,
    slots: { default: 'status' },
    title: '状态',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 100,
  },
];

const gridOptions: VxeTableGridOptions<RecallRow> = {
  columns: listColumns,
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await fetchRecallListApi(props.type, {
            BeginTime: dateRange.value[0].format('YYYY-MM-DD'),
            EndTime: dateRange.value[1].format('YYYY-MM-DD'),
            Page: page.currentPage,
            PageSize: page.pageSize,
          });
          switchConfig.IsAuto =
            result.Switch?.IsAuto === true ||
            Number(result.Switch?.IsAuto) === 1;
          switchConfig.IsOpen =
            result.Switch?.IsOpen === true ||
            Number(result.Switch?.IsOpen) === 1;
          recallMessage.value = String(result.Message || '');
          const items = (result.Items || []) as RecallRow[];
          return {
            items,
            total: Number(result.Pagination?.MaxCount ?? items.length),
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFirstPage() {
  if (
    !isRegister.value &&
    dateRange.value[1].diff(dateRange.value[0], 'day') > 6
  ) {
    message.warning('首存次日召回最多查询 7 天');
    return;
  }
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

function reset() {
  dateRange.value = defaultRange();
  void reloadFirstPage();
}

function changeSwitch(field: 'IsAuto' | 'IsOpen', checked: boolean) {
  const previous = switchConfig[field];
  switchConfig[field] = checked;
  const label = field === 'IsOpen' ? '召回开关' : '自动发送';
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}${label}？`,
    onCancel() {
      switchConfig[field] = previous;
    },
    async onOk() {
      try {
        await updateRecallSwitchApi(props.type, { ...switchConfig });
        message.success(`${label}已更新`);
        await gridApi.reload();
      } catch (error) {
        switchConfig[field] = previous;
        throw error;
      }
    },
    title: '开关确认',
  });
}

function showDetail(row: RecallRow, reportType: number) {
  detailQuery.BeginTime = String(row.NowDate || '');
  detailQuery.Page = 1;
  detailQuery.ReportType = reportType;
  detailVisible.value = true;
  void loadDetail();
}

async function loadDetail() {
  detailLoading.value = true;
  try {
    const result = await fetchRecallDetailApi(props.type, { ...detailQuery });
    detailRows.value = (result.Items || []) as RecallDetailRow[];
    detailTotal.value = Number(
      result.Pagination?.MaxCount ?? detailRows.value.length,
    );
    detailSummary.value = Number(result.Total || 0);
  } finally {
    detailLoading.value = false;
  }
}

function confirmSend(row: RecallRow) {
  Modal.confirm({
    content: '发送后会立即消耗短信余额并通知当前日期全部待召回用户。',
    async onOk() {
      await sendRecallApi(props.type, String(row.NowDate || ''));
      message.success('发送任务已提交');
      await reloadFirstPage();
    },
    title: '确认发送召回短信？',
  });
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

async function exportDetail() {
  const result = await fetchRecallDetailApi(props.type, {
    ...detailQuery,
    Page: 1,
    PageSize: Math.max(detailTotal.value + 1, 1000),
  });
  const rows = (result.Items || []) as RecallDetailRow[];
  if (rows.length === 0) {
    message.warning('暂无可导出的明细');
    return;
  }
  const headers = [
    '游戏账号',
    '手机号',
    '玩家ID',
    isRegister.value ? '首存时间' : '最后登录时间',
    '渠道名称',
    '渠道号',
    '产品名称',
    '邀请站点',
    '接收短信次数',
  ];
  const data = rows.map((row) => [
    row.LoginAccount,
    row.Phone,
    row.PlayerId,
    formatOperationDateTime(
      isRegister.value ? row.FirstPayTime : row.LastLoginTime,
    ),
    row.ChannelName,
    row.ChannelId,
    row.PackageName,
    row.InviteSite,
    row.Count,
  ]);
  const content = [
    headers.map((item) => csvCell(item)).join(','),
    ...data.map((row) => row.map((item) => csvCell(item)).join(',')),
  ].join('\n');
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${detailTitle.value}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <Alert
    class="mb-4"
    :message="
      isRegister
        ? '统计注册用户次日尚未首存的数据，可按日期手动发送召回短信。'
        : '统计首存用户次日未登录的数据，查询区间最多 7 天。'
    "
    show-icon
    type="info"
  />
  <div class="switch-panel">
    <Space size="large" wrap>
      <span>
        召回开关
        <Switch
          class="ml-2"
          :checked="switchConfig.IsOpen"
          @change="(checked) => changeSwitch('IsOpen', !!checked)"
        />
      </span>
      <span>
        自动发送
        <Switch
          class="ml-2"
          :checked="switchConfig.IsAuto"
          @change="(checked) => changeSwitch('IsAuto', !!checked)"
        />
      </span>
      <Button type="link" @click="messageVisible = true">查看召回短信</Button>
    </Space>
  </div>
  <div class="query-panel">
    <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" precision="date" />
        </div>
    <Space>
      <Button type="primary" @click="reloadFirstPage">查询</Button>
      <Button @click="reset">重置</Button>
    </Space>
  </div>
  <div class="data-grid">
    <Grid>
      <template #baseCount="{ row }">
        <Button type="link" @click="showDetail(row, 0)">
          {{ isRegister ? row.RegNum : row.FirstPayNum }}
        </Button>
      </template>
      <template #recallCount="{ row }">
        <Button type="link" @click="showDetail(row, 1)">
          {{ isRegister ? row.NotFirstPayNum : row.NotLoginNum }}
        </Button>
      </template>
      <template #status="{ row }">
        <Tag
          :color="
            Number(row.Status) === 1
              ? 'green'
              : Number(row.Status) === 2
                ? 'red'
                : 'default'
          "
        >
          {{ statusText(row.Status) }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button
          size="small"
          type="primary"
          :disabled="
            Number(isRegister ? row.NotFirstPayNum : row.NotLoginNum) <= 0
          "
          @click="confirmSend(row)"
        >
          发送
        </Button>
      </template>
    </Grid>
  </div>

  <Modal v-model:open="messageVisible" title="召回短信" :footer="null">
    <Input.TextArea :value="recallMessage" disabled :rows="6" />
  </Modal>

  <Modal
    v-model:open="detailVisible"
    :footer="null"
    :title="detailTitle"
    width="1100px"
  >
    <div class="detail-header">
      <SummaryCards :items="detailSummaryItems" />
      <Button type="primary" @click="exportDetail">导出 CSV</Button>
    </div>
    <Descriptions class="mb-3" size="small">
      <Descriptions.Item label="总记录数">{{ detailTotal }}</Descriptions.Item>
    </Descriptions>
    <div class="detail-table-wrap">
      <table class="detail-table">
        <thead>
          <tr>
            <th>游戏账号</th>
            <th>手机号</th>
            <th>玩家 ID</th>
            <th>{{ isRegister ? '首存时间' : '最后登录时间' }}</th>
            <th>渠道名称</th>
            <th>渠道号</th>
            <th>产品名称</th>
            <th>邀请站点</th>
            <th>接收次数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="detailLoading">
            <td colspan="9">加载中...</td>
          </tr>
          <tr v-for="(row, index) in detailRows" v-else :key="index">
            <td>{{ row.LoginAccount || '-' }}</td>
            <td>{{ row.Phone || '-' }}</td>
            <td>{{ row.PlayerId || '-' }}</td>
            <td>
              {{
                formatOperationDateTime(
                  isRegister ? row.FirstPayTime : row.LastLoginTime,
                )
              }}
            </td>
            <td>{{ row.ChannelName || '-' }}</td>
            <td>{{ row.ChannelId || '-' }}</td>
            <td>{{ row.PackageName || '-' }}</td>
            <td>{{ row.InviteSite || '-' }}</td>
            <td>{{ row.Count || 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="detail-pagination">
      <Button
        :disabled="detailQuery.Page <= 1"
        @click="
          detailQuery.Page -= 1;
          loadDetail();
        "
      >
        上一页
      </Button>
      <span>第 {{ detailQuery.Page }} 页</span>
      <Button
        :disabled="detailQuery.Page * detailQuery.PageSize >= detailTotal"
        @click="
          detailQuery.Page += 1;
          loadDetail();
        "
      >
        下一页
      </Button>
    </div>
  </Modal>
</template>

<style scoped>
.switch-panel,
.query-panel {
  padding: 16px 18px;
  margin-bottom: 14px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.query-panel,
.detail-header,
.detail-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.data-grid {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.detail-table-wrap {
  overflow: auto;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.detail-table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
}

.detail-table th,
.detail-table td {
  padding: 10px 12px;
  text-align: center;
  white-space: nowrap;
  border-bottom: 1px solid hsl(var(--border));
}

.detail-table th {
  background: hsl(var(--muted));
}

.detail-pagination {
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
