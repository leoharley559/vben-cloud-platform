<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  InputNumber,
  Modal,
  Radio,
  Space,
  message,
} from 'ant-design-vue';

import {
  fetchVipLevelModeApi,
  fetchVipRelegationDayApi,
  fetchVipVirtualPrizeListApi,
  updateVipLevelModeApi,
  updateVipRelegationDayApi,
  updateVipVirtualPrizeApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'VipGradePanel' });

interface VipGradeRow {
  BirthdayDividend?: number;
  DayWithdrawal?: number;
  DayWithdrawalTimes?: number;
  FirstHalfMonthDividend?: number;
  HoldLevelTurnover?: number;
  Id: number | string;
  LastHalfMonthDividend?: number;
  UpgradeDividend?: number;
  UpgradeDividendMultiple?: number;
  UpgradeMoney?: number;
  UpgradeTurnover?: number;
  VipLevel?: number | string;
}

const { checkPermission } = useCloudPermission();
const canEdit = computed(
  () => checkPermission(11000) || checkPermission(10963),
);

const editVisible = ref(false);
const relegationVisible = ref(false);
const saving = ref(false);
const vipLevelMode = ref(1);
const relegationDay = ref(90);

const form = reactive({
  BirthdayDividend: 0,
  DayWithdrawal: 0,
  DayWithdrawalTimes: 0,
  FirstHalfMonthDividend: 0,
  HoldLevelTurnover: 0,
  Id: '' as number | string,
  LastHalfMonthDividend: 0,
  UpgradeDividend: 0,
  UpgradeDividendMultiple: 0,
  UpgradeMoney: 0,
  UpgradeTurnover: 0,
  VipLevel: '' as number | string,
});

const gridOptions: VxeTableGridOptions<VipGradeRow> = {
  columns: [
    { field: 'VipLevel', minWidth: 80, title: '等级' },
    {
      field: 'UpgradeMoney',
      formatter: ({ cellValue }) => String(Number(cellValue || 0) / 100),
      minWidth: 100,
      title: '升级存款',
    },
    {
      field: 'UpgradeTurnover',
      formatter: ({ cellValue }) => String(Number(cellValue || 0) / 100),
      minWidth: 100,
      title: '升级流水',
    },
    {
      field: 'HoldLevelTurnover',
      formatter: ({ cellValue }) => String(Number(cellValue || 0) / 100),
      minWidth: 100,
      title: '保级流水',
    },
    {
      field: 'DayWithdrawal',
      formatter: ({ cellValue }) => String(Number(cellValue || 0) / 100),
      minWidth: 100,
      title: '日提现额',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 100,
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchVipVirtualPrizeListApi({
          Page: 1,
          PageSize: 200,
        });
        const items = (result.Items || []) as unknown as VipGradeRow[];
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function toYuan(value?: number) {
  return Number(value || 0) / 100;
}

function toCent(value: number) {
  return Math.ceil(Number((value * 100).toFixed(0)));
}

function openEdit(row: VipGradeRow) {
  form.Id = row.Id;
  form.VipLevel = row.VipLevel || '';
  form.UpgradeMoney = toYuan(row.UpgradeMoney);
  form.UpgradeTurnover = toYuan(row.UpgradeTurnover);
  form.HoldLevelTurnover = toYuan(row.HoldLevelTurnover);
  form.DayWithdrawalTimes = Number(row.DayWithdrawalTimes || 0);
  form.DayWithdrawal = toYuan(row.DayWithdrawal);
  form.UpgradeDividend = toYuan(row.UpgradeDividend);
  form.UpgradeDividendMultiple = Number(row.UpgradeDividendMultiple || 0);
  form.BirthdayDividend = toYuan(row.BirthdayDividend);
  form.FirstHalfMonthDividend = toYuan(row.FirstHalfMonthDividend);
  form.LastHalfMonthDividend = toYuan(row.LastHalfMonthDividend);
  editVisible.value = true;
}

async function submitEdit() {
  saving.value = true;
  try {
    await updateVipVirtualPrizeApi({
      BirthdayDividend: toCent(form.BirthdayDividend),
      DayWithdrawal: toCent(form.DayWithdrawal),
      DayWithdrawalTimes: form.DayWithdrawalTimes,
      FirstHalfMonthDividend: toCent(form.FirstHalfMonthDividend),
      HoldLevelTurnover: toCent(form.HoldLevelTurnover),
      Id: form.Id,
      LastHalfMonthDividend: toCent(form.LastHalfMonthDividend),
      UpgradeDividend: toCent(form.UpgradeDividend),
      UpgradeDividendMultiple: form.UpgradeDividendMultiple,
      UpgradeMoney: toCent(form.UpgradeMoney),
      UpgradeTurnover: toCent(form.UpgradeTurnover),
      VipLevel: form.VipLevel,
    });
    message.success('保存成功');
    editVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function loadSettings() {
  try {
    const [mode, day] = await Promise.all([
      fetchVipLevelModeApi(),
      fetchVipRelegationDayApi(),
    ]);
    if (Number(mode?.VipLevelMode) > 0) {
      vipLevelMode.value = Number(mode.VipLevelMode);
    }
    if (Number(day?.RelegationDay) > 0) {
      relegationDay.value = Number(day.RelegationDay);
    }
  } catch {
    // keep defaults
  }
}

async function saveVipMode() {
  saving.value = true;
  try {
    await updateVipLevelModeApi({ VipLevelMode: vipLevelMode.value });
    message.success('升级模式已保存');
  } finally {
    saving.value = false;
  }
}

async function saveRelegationDay() {
  if (!relegationDay.value || relegationDay.value <= 0) {
    message.error('请输入有效天数');
    return;
  }
  saving.value = true;
  try {
    await updateVipRelegationDayApi({ RelegationDay: relegationDay.value });
    message.success('保级天数已保存');
    relegationVisible.value = false;
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadSettings();
});
</script>

<template>
  <div>
    <div
      v-if="canEdit"
      class="mb-3 flex flex-wrap items-center justify-between gap-3"
    >
      <Space wrap>
        <span class="text-sm text-gray-500">升级模式</span>
        <Radio.Group v-model:value="vipLevelMode">
          <Radio :value="1">有效投注+存款</Radio>
          <Radio :value="2">仅有效投注</Radio>
        </Radio.Group>
        <Button
          type="primary"
          size="small"
          :loading="saving"
          @click="saveVipMode"
        >
          保存模式
        </Button>
        <Button size="small" @click="relegationVisible = true">
          保级天数（{{ relegationDay }}天）
        </Button>
      </Space>
    </div>
    <div class="mb-3 text-xs text-gray-400">
      已支持等级参数、升级模式、保级天数。
    </div>
    <Grid>
      <template #action="{ row }">
        <Button
          v-if="canEdit"
          size="small"
          type="primary"
          @click="openEdit(row)"
        >
          编辑
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑 VIP 等级"
      width="560px"
      @ok="submitEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="VIP 等级">
          <InputNumber
            :value="Number(form.VipLevel)"
            disabled
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="升级存款">
          <InputNumber
            v-model:value="form.UpgradeMoney"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="升级流水">
          <InputNumber
            v-model:value="form.UpgradeTurnover"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="保级流水">
          <InputNumber
            v-model:value="form.HoldLevelTurnover"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="日提现次数">
          <InputNumber
            v-model:value="form.DayWithdrawalTimes"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="日提现限额">
          <InputNumber
            v-model:value="form.DayWithdrawal"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="升级红利">
          <InputNumber
            v-model:value="form.UpgradeDividend"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="升级红利流水倍数">
          <InputNumber
            v-model:value="form.UpgradeDividendMultiple"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="生日礼金">
          <InputNumber
            v-model:value="form.BirthdayDividend"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="上半月红利">
          <InputNumber
            v-model:value="form.FirstHalfMonthDividend"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
        <Form.Item label="下半月红利">
          <InputNumber
            v-model:value="form.LastHalfMonthDividend"
            class="!w-full"
            :min="0"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="relegationVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="保级流水天数"
      @ok="saveRelegationDay"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="天数" required>
          <InputNumber v-model:value="relegationDay" :min="1" class="!w-full" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
