<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Card,
  DatePicker,
  InputNumber,
  message,
  Modal,
  Space,
  Statistic,
  Switch,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserInfoApi } from '#/api/core/user';
import {
  buySmsApi,
  fetchSmsDailyListApi,
  fetchSmsOverviewApi,
  updateSmsAutoBuyApi,
} from '#/api/gameManage/message-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'SmsOverviewPanel' });

interface DailyRow {
  BuyTimes?: number;
  Consume?: number;
  DateTime?: number | string;
  GiftTimes?: number;
  Stock?: number;
}

const { checkPermission } = useCloudPermission();
const canSummary = computed(() => checkPermission(10_936));
const canBuy = computed(() => checkPermission(10_937));
const canAutoBuy = computed(() => checkPermission(10_938));
const canDaily = computed(() => checkPermission(10_934));
const canDailyList = computed(() => checkPermission(10_932));

const summary = reactive<Record<string, unknown>>({});
const dailyTotal = reactive<Record<string, unknown>>({});
const dateRange = ref<[Dayjs, Dayjs]>([
  dayjs().subtract(30, 'day').startOf('day'),
  dayjs().endOf('day'),
]);
const autoBuy = ref(false);
const summaryLoading = ref(false);
const buyVisible = ref(false);
const saving = ref(false);
const buyNumber = ref(10_000);
const buyCost = computed(() => Number((buyNumber.value * 0.018).toFixed(2)));

const gridOptions: VxeTableGridOptions<DailyRow> = {
  columns: [
    {
      field: 'DateTime',
      formatter: ({ cellValue }) =>
        cellValue ? dayjs.unix(Number(cellValue)).format('YYYY-MM-DD') : '-',
      minWidth: 130,
      title: '日期',
    },
    { field: 'BuyTimes', minWidth: 120, title: '购买数量' },
    { field: 'GiftTimes', minWidth: 120, title: '赠送数量' },
    { field: 'Consume', minWidth: 120, title: '消耗数量' },
    { field: 'Stock', minWidth: 120, title: '当日剩余' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!canDaily.value || !canDailyList.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchSmsDailyListApi({
          BeginTime: dateRange.value[0].startOf('day').unix(),
          EndTime: dateRange.value[1].endOf('day').unix(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        Object.assign(dailyTotal, result.Total || {});
        const items = (result.Items || []) as DailyRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount ?? items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadSummary() {
  if (!canSummary.value && !canBuy.value) return;
  summaryLoading.value = true;
  try {
    const result = await fetchSmsOverviewApi();
    Object.assign(summary, result);
    autoBuy.value = Number(result.IsAutoBuy) === 1;
  } finally {
    summaryLoading.value = false;
  }
}

function search() {
  void gridApi.query();
}

function reset() {
  dateRange.value = [
    dayjs().subtract(30, 'day').startOf('day'),
    dayjs().endOf('day'),
  ];
  void gridApi.query();
}

function openBuy() {
  buyNumber.value = 10_000;
  buyVisible.value = true;
}

async function submitBuy() {
  if (
    !Number.isInteger(buyNumber.value) ||
    buyNumber.value < 100 ||
    buyNumber.value >= 999_999
  ) {
    message.warning('购买数量必须为 100 至 999998 的正整数');
    return;
  }
  saving.value = true;
  try {
    await buySmsApi({
      Hash: createRequestHash(),
      Num: buyNumber.value,
    });
    message.success('购买成功');
    buyVisible.value = false;
    await Promise.all([loadSummary(), getUserInfoApi()]);
  } finally {
    saving.value = false;
  }
}

function changeAutoBuy(checked: boolean) {
  const previous = autoBuy.value;
  autoBuy.value = checked;
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}短信不足时自动购买？`,
    onCancel() {
      autoBuy.value = previous;
    },
    async onOk() {
      try {
        await updateSmsAutoBuyApi(checked ? 1 : 2);
        message.success('自动购买设置已更新');
      } finally {
        await loadSummary();
      }
    },
    title: '自动购买确认',
  });
}

void loadSummary();
</script>

<template>
  <div>
    <div v-if="canSummary || canBuy" class="summary-grid">
      <Card v-if="canSummary" :loading="summaryLoading" class="summary-card">
        <Statistic
          title="短信剩余数量"
          :value="Number(summary.ShortMessage || 0)"
        />
        <div class="mt-3 flex gap-6 text-xs text-gray-400">
          <span>本月赠送：{{ summary.MonthGift || 0 }}</span>
          <span>本月购买：{{ summary.MonthBuy || 0 }}</span>
        </div>
      </Card>
      <Card v-if="canSummary" :loading="summaryLoading" class="summary-card">
        <Statistic title="今日消耗" :value="Number(summary.TodayConsume || 0)" />
      </Card>
      <Card v-if="canBuy" class="summary-card">
        <Statistic title="购买费率" value="180 云币 / 10,000 条" />
        <Space class="mt-3">
          <Button type="primary" @click="openBuy">购买短信</Button>
          <span v-if="canAutoBuy">
            自动购买
            <Switch
              class="ml-2"
              :checked="autoBuy"
              @change="(value) => changeAutoBuy(!!value)"
            />
          </span>
        </Space>
      </Card>
    </div>

    <template v-if="canDaily">
      <div class="query-panel">
        <DatePicker.RangePicker v-model:value="dateRange" />
        <Space>
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
        </Space>
      </div>
      <div class="daily-total">
        <Statistic
          title="购买总数"
          :value="Number(dailyTotal.TotalBuyTimes || 0)"
        />
        <Statistic
          title="消耗总数"
          :value="Number(dailyTotal.TotalConsume || 0)"
        />
      </div>
      <div v-if="canDailyList" class="data-grid"><Grid /></div>
    </template>

    <Modal
      v-model:open="buyVisible"
      :confirm-loading="saving"
      title="购买短信"
      @ok="submitBuy"
    >
      <div class="pt-4">
        <div class="mb-2 text-sm">购买数量</div>
        <InputNumber
          v-model:value="buyNumber"
          class="!w-full"
          :max="999998"
          :min="100"
          :precision="0"
        />
        <Space class="mt-3" wrap>
          <Button
            v-for="value in [10_000, 20_000, 50_000, 100_000]"
            :key="value"
            size="small"
            @click="buyNumber = value"
          >
            {{ value.toLocaleString() }}
          </Button>
        </Space>
        <div class="mt-5 text-base">
          所需云币：<span class="font-semibold text-orange-500">
            {{ buyCost }}
          </span>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.query-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  margin-bottom: 14px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.daily-total {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 240px));
  gap: 14px;
  padding: 14px 18px;
  margin-bottom: 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.data-grid {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

@media (max-width: 800px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .query-panel {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
