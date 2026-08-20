<script lang="ts" setup>
import type { WithdrawWaterFlowSettingItem } from '#/types/withdraw-extra';

import { ref, watch } from 'vue';

import {
  Button,
  Form,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  createWithdrawWaterFlowSettingApi,
  deleteWithdrawWaterFlowSettingApi,
  fetchWithdrawWaterFlowSettingListApi,
  switchWithdrawWaterFlowSettingApi,
  updateWithdrawWaterFlowSettingApi,
} from '#/api/operationManage/withdraw-extra';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'WithdrawWaterSettingModal' });

const visible = defineModel<boolean>('open', { default: false });

const listLoading = ref(false);
const saving = ref(false);
const switchStatus = ref(2);
const list = ref<WithdrawWaterFlowSettingItem[]>([]);

const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formId = ref<number | string>();
const negativeProfit = ref<number>();
const balanceAmount = ref<number>();

const columns = [
  {
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'index',
    title: '#',
    width: 60,
  },
  {
    dataIndex: 'NegativeProfitAmount',
    key: 'NegativeProfitAmount',
    title: '>= 负盈利金额',
  },
  {
    dataIndex: 'BalanceAmount',
    key: 'BalanceAmount',
    title: '<= 剩余余额',
  },
  {
    key: 'actions',
    title: '操作',
    width: 140,
  },
];

async function loadList() {
  listLoading.value = true;
  try {
    const result = await fetchWithdrawWaterFlowSettingListApi();
    list.value = result?.Items || [];
    switchStatus.value = Number(result?.Switch || 2);
  } finally {
    listLoading.value = false;
  }
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      void loadList();
    }
  },
);

function openCreate() {
  formMode.value = 'create';
  formId.value = undefined;
  negativeProfit.value = undefined;
  balanceAmount.value = undefined;
  formOpen.value = true;
}

function openEdit(row: WithdrawWaterFlowSettingItem) {
  formMode.value = 'edit';
  formId.value = row.Id;
  negativeProfit.value = row.NegativeProfitAmount
    ? Number(row.NegativeProfitAmount) / 100
    : undefined;
  balanceAmount.value = row.BalanceAmount
    ? Number(row.BalanceAmount) / 100
    : undefined;
  formOpen.value = true;
}

async function handleSave() {
  if (
    negativeProfit.value === undefined ||
    negativeProfit.value === null ||
    balanceAmount.value === undefined ||
    balanceAmount.value === null
  ) {
    message.warning('请填写完整金额');
    return;
  }
  if (negativeProfit.value <= 0 || balanceAmount.value <= 0) {
    message.warning('请正确输入金额');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      BalanceAmount: Math.round(Number(balanceAmount.value) * 100),
      NegativeProfitAmount: Math.round(Number(negativeProfit.value) * 100),
      ...(formMode.value === 'edit' ? { Id: formId.value } : {}),
    };
    if (formMode.value === 'create') {
      await createWithdrawWaterFlowSettingApi(payload);
      message.success('新增成功');
    } else {
      await updateWithdrawWaterFlowSettingApi(payload);
      message.success('编辑成功');
    }
    formOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

function handleDelete(id?: number | string) {
  if (!id) {
    return;
  }
  Modal.confirm({
    content: '确认删除该规则？',
    onOk: async () => {
      await deleteWithdrawWaterFlowSettingApi(id);
      message.success('删除成功');
      await loadList();
    },
    title: '删除',
  });
}

function handleSwitch(checked: boolean) {
  const next = checked ? 1 : 2;
  Modal.confirm({
    content: checked ? '确认开启提现流水设置？' : '确认关闭提现流水设置？',
    onOk: async () => {
      await switchWithdrawWaterFlowSettingApi({ Switch: next });
      switchStatus.value = next;
      message.success('开关已更新');
    },
    title: '提示',
  });
}
</script>

<template>
  <Modal
    v-model:open="visible"
    :footer="null"
    title="提现流水设置"
    width="720px"
  >
    <div class="mb-3 flex items-center justify-between">
      <Switch
        :checked="switchStatus === 1"
        checked-children="开"
        un-checked-children="关"
        @update:checked="handleSwitch"
      />
      <Button type="primary" @click="openCreate">新增</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="listLoading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'NegativeProfitAmount'">
          {{ formatAmountFromCent(record.NegativeProfitAmount) }}
        </template>
        <template v-else-if="column.key === 'BalanceAmount'">
          {{ formatAmountFromCent(record.BalanceAmount) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space>
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
            </Button>
            <Button
              danger
              size="small"
              type="link"
              @click="handleDelete(record.Id)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <div class="mt-4 text-xs text-gray-500">
      <p>规则用于自动判断是否清零提现流水要求（金额单位：元）。</p>
      <p>A：时间窗内所有提款流水要求；B：场馆总输赢；C：剩余余额阈值。</p>
    </div>

    <Modal
      v-model:open="formOpen"
      :confirm-loading="saving"
      :title="formMode === 'create' ? '新增规则' : '编辑规则'"
      @ok="handleSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="负盈利金额（大于等于）" required>
          <InputNumber
            v-model:value="negativeProfit"
            :min="0.01"
            :precision="2"
            class="w-full"
            placeholder="请输入金额（元）"
          />
        </Form.Item>
        <Form.Item label="剩余余额（小于等于）" required>
          <InputNumber
            v-model:value="balanceAmount"
            :min="0.01"
            :precision="2"
            class="w-full"
            placeholder="请输入金额（元）"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Modal>
</template>
