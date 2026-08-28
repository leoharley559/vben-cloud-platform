<script lang="ts" setup>
import type { WithdrawListItem } from '#/types/operation-manage';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Spin,
} from 'ant-design-vue';

import { fetchBankCardListApi } from '#/api/memberManage/bank-card';
import {
  agreeWithdrawApi,
  fetchWithdrawChannelOptionsApi,
  fetchWithdrawRejectReasonsApi,
  mapWithdrawChannelOptions,
  manualWithdrawApi,
  refuseWithdrawApi,
} from '#/api/operationManage/withdraw';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  matchWithdrawPayAccount,
  resolveWithdrawPayAccountKind,
  type WithdrawMatchedPayAccount,
} from '#/utils/withdraw-pay-account';

defineOptions({ name: 'WithdrawActionModal' });

const props = defineProps<{
  mode: 'agree' | 'manual' | 'reject';
  row: null | WithdrawListItem;
}>();

const emit = defineEmits<{
  success: [];
}>();

const visible = defineModel<boolean>('open', { default: false });

const submitting = ref(false);
const remark = ref('');
const refundScore = ref(1);
const mailInform = ref(1);
const withdrawAccountId = ref<number | string>();
const channelOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);

const rejectReasonKey = ref('');
const refuseTitle = ref('');
const refuseEmailBody = ref('');
const rejectOptions = ref<Array<{ key: string; title: string }>>([]);
const mailContentMap = ref<Record<string, string>>({});
const payAccountLoading = ref(false);
const channelLoading = ref(false);
const matchedPayAccount = ref<null | WithdrawMatchedPayAccount>(null);

const manualPayAccountName = computed(() => {
  if (matchedPayAccount.value?.name) {
    return matchedPayAccount.value.name;
  }
  return props.row?.RealName || '-';
});

const manualPayAccountNum = computed(() => {
  if (matchedPayAccount.value?.account) {
    return matchedPayAccount.value.account;
  }
  return props.row?.AccountNum || '-';
});

const manualPayQrCodeUrl = computed(() =>
  String(matchedPayAccount.value?.qrCodeUrl || '').trim(),
);

const showManualPayQrCode = computed(() => {
  const kind =
    matchedPayAccount.value?.kind ??
    resolveWithdrawPayAccountKind(props.row?.AccountType);
  return kind !== 'bank';
});

const manualPayTypeLabel = computed(
  () => String(props.row?.AccountBank || '').trim() || '-',
);

const manualPayAmountText = computed(() =>
  formatAmountFromCent(props.row?.RealAmount),
);

function buildManualPayCopyText() {
  return [
    '****出款信息****',
    `提现方式：${manualPayTypeLabel.value}`,
    `账号姓名：${manualPayAccountName.value}`,
    `出款账号：${manualPayAccountNum.value}`,
    `出款金额：${manualPayAmountText.value}`,
  ].join('\n');
}

async function copyManualPayInfo() {
  try {
    await navigator.clipboard.writeText(buildManualPayCopyText());
    message.success('出款信息已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

const title = computed(() => {
  switch (props.mode) {
    case 'agree': {
      return '同意出款';
    }
    case 'manual': {
      return '人工出款';
    }
    default: {
      return '拒绝出款';
    }
  }
});

function applyRejectReason(key: string) {
  const found = rejectOptions.value.find((item) => item.key === key);
  refuseTitle.value = key === 'other' ? '' : found?.title || '';
  refuseEmailBody.value = mailContentMap.value[key] || '';
}

async function loadRejectReasons() {
  const result = await fetchWithdrawRejectReasonsApi();
  const items = result?.Items || [];
  const options: Array<{ key: string; title: string }> = [];
  const contentMap: Record<string, string> = {};
  for (const item of items) {
    const key = String(item.Key || '');
    if (!key) {
      continue;
    }
    let titleText: string;
    let reasonText = '';
    try {
      const parsed = JSON.parse(String(item.Value || '{}')) as {
        reason?: string;
        title?: string;
      };
      titleText = parsed.title || key;
      reasonText = parsed.reason || '';
    } catch {
      titleText = String(item.Value || key);
    }
    options.push({ key, title: titleText });
    contentMap[key] = reasonText;
  }
  rejectOptions.value = options;
  mailContentMap.value = contentMap;
  rejectReasonKey.value = options[0]?.key || '';
  if (rejectReasonKey.value) {
    applyRejectReason(rejectReasonKey.value);
  }
}

async function loadManualPayAccount() {
  const playerId = props.row?.PlayerId;
  if (!playerId) {
    matchedPayAccount.value = null;
    return;
  }
  payAccountLoading.value = true;
  matchedPayAccount.value = null;
  try {
    const result = await fetchBankCardListApi({
      Page: 1,
      PageSize: 50,
      PlayerId: playerId,
    });
    matchedPayAccount.value =
      matchWithdrawPayAccount(
        props.row?.AccountType,
        props.row?.AccountNum,
        result,
      ) || null;
  } finally {
    payAccountLoading.value = false;
  }
}

async function loadAgreeChannels() {
  if (!props.row?.Id) {
    channelOptions.value = [];
    withdrawAccountId.value = undefined;
    return;
  }
  channelLoading.value = true;
  channelOptions.value = [];
  withdrawAccountId.value = undefined;
  try {
    const result = await fetchWithdrawChannelOptionsApi({
      Ids: props.row.Id,
      Type: props.row.AccountType ?? '',
    });
    channelOptions.value = mapWithdrawChannelOptions(result?.Items);
    withdrawAccountId.value = channelOptions.value[0]?.value;
    if (channelOptions.value.length === 0) {
      message.warning(
        '暂无可用出款通道，请先在「提现配置」中检查该提款类型是否已配置并上架通道',
      );
    }
  } catch {
    channelOptions.value = [];
    withdrawAccountId.value = undefined;
  } finally {
    channelLoading.value = false;
  }
}

watch(rejectReasonKey, (key) => {
  if (!key || props.mode !== 'reject' || !visible.value) {
    return;
  }
  applyRejectReason(key);
});

watch(
  () => [visible.value, props.row?.Id, props.mode],
  async () => {
    if (!visible.value || !props.row) {
      return;
    }
    remark.value = String(props.row.Remark || '');
    refundScore.value = 1;
    mailInform.value = 1;
    withdrawAccountId.value = undefined;
    channelOptions.value = [];
    rejectReasonKey.value = '';
    refuseTitle.value = '';
    refuseEmailBody.value = '';

    if (props.mode === 'agree' && props.row.Id) {
      await loadAgreeChannels();
      await loadManualPayAccount();
    }

    if (props.mode === 'reject') {
      await loadRejectReasons();
    }

    if (props.mode === 'manual') {
      await loadManualPayAccount();
    }
  },
  { immediate: true },
);

async function handleOk() {
  if (!props.row?.Id) {
    return;
  }
  submitting.value = true;
  try {
    if (props.mode === 'manual') {
      await manualWithdrawApi({
        Id: props.row.Id,
        RiskStatus: 1,
      });
    } else if (props.mode === 'agree') {
      if (channelLoading.value) {
        message.warning('出款通道加载中，请稍候');
        return;
      }
      if (channelOptions.value.length === 0) {
        message.warning(
          '暂无可用出款通道，请先在「提现配置」中检查该提款类型是否已配置并上架通道',
        );
        return;
      }
      if (
        withdrawAccountId.value === undefined ||
        withdrawAccountId.value === null ||
        withdrawAccountId.value === ''
      ) {
        message.warning('请选择出款通道');
        return;
      }
      await agreeWithdrawApi({
        Id: props.row.Id,
        RiskStatus: 1,
        WithdrawAccountId: withdrawAccountId.value,
      });
    } else {
      if (
        mailInform.value === 1 &&
        rejectReasonKey.value === 'other' &&
        !refuseTitle.value.trim()
      ) {
        message.warning('请填写拒绝原因');
        return;
      }
      if (mailInform.value === 1 && !refuseEmailBody.value.trim()) {
        message.warning('请填写邮件内容');
        return;
      }
      const payload: Record<string, unknown> = {
        Id: props.row.Id,
        RefundScore: refundScore.value,
        Remark: remark.value,
        RiskStatus: 2,
        mailInform: mailInform.value,
      };
      if (mailInform.value === 1) {
        payload.RejectReasonKey = rejectReasonKey.value;
        payload.HandlerInf = refuseTitle.value;
        payload.RefuseTitle = refuseTitle.value;
        payload.RefuseEmailBody = refuseEmailBody.value;
      } else {
        payload.RejectReasonKey = '';
        payload.HandlerInf = '';
        payload.RefuseTitle = '';
        payload.RefuseEmailBody = '';
      }
      await refuseWithdrawApi(payload);
    }
    message.success('操作成功');
    visible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :centered="mode === 'agree' || mode === 'manual'"
    :confirm-loading="submitting"
    :open="visible"
    :title="title"
    width="640px"
    @cancel="visible = false"
    @ok="handleOk"
  >
  <div class="mb-3 mt-4">
    <Descriptions v-if="row" bordered :column="2" size="small">
      <Descriptions.Item label="游戏账号">
        {{ row.LoginAccount || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="真实姓名">
        {{ row.RealName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="申请金额">
        {{ formatAmountFromCent(row.Amount) }}
      </Descriptions.Item>
      <Descriptions.Item label="实际金额">
        {{ formatAmountFromCent(row.RealAmount) }}
      </Descriptions.Item>
    </Descriptions>
  </div>

  <div v-if="mode === 'manual' || mode === 'agree'" class="mb-3">
    <div class="mb-2 flex items-center justify-between gap-2">
      <div class="text-sm font-medium">出款账号信息</div>
      <Button
        :disabled="payAccountLoading"
        size="small"
        type="link"
        @click="copyManualPayInfo"
      >
        复制信息
      </Button>
    </div>
    <Spin :spinning="payAccountLoading">
      <Descriptions bordered :column="2" size="small">
        <Descriptions.Item label="提现方式">
          {{ manualPayTypeLabel }}
        </Descriptions.Item>
        <Descriptions.Item label="账号姓名">
          {{ manualPayAccountName }}
        </Descriptions.Item>
        <Descriptions.Item label="出款账号">
          {{ manualPayAccountNum }}
        </Descriptions.Item>
        <Descriptions.Item label="出款金额">
          {{ manualPayAmountText }}
        </Descriptions.Item>
      </Descriptions>
      <div v-if="showManualPayQrCode" class="mt-3">
        <div class="mb-2 text-sm text-gray-600">收款码</div>
        <div
          class="flex min-h-[200px] items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50 p-4"
        >
          <img
            v-if="manualPayQrCodeUrl"
            :alt="`${manualPayAccountName || '收款'}码`"
            class="max-h-[280px] max-w-full object-contain"
            :src="manualPayQrCodeUrl"
          />
          <span v-else class="text-sm text-gray-400">玩家暂未上传</span>
        </div>
      </div>
    </Spin>
  </div>
    <Form
      :label-col="{ style: { width: '80px' } }"
      :wrapper-col="{ style: { flex: 1 } }"
      layout="horizontal"
    >
      <Form.Item v-if="mode === 'agree'" label="出款通道" required>
        <Select
          v-model:value="withdrawAccountId"
          :loading="channelLoading"
          :options="channelOptions"
          placeholder="请选择出款通道"
        />
        <div
          v-if="!channelLoading && channelOptions.length === 0"
          class="mt-1 text-xs text-orange-500"
        >
          当前订单提款类型下没有可用出款通道，请检查提现配置
        </div>
      </Form.Item>

      <template v-if="mode === 'reject'">
        <Form.Item label="是否退币" class="mb-3">
          <Radio.Group v-model:value="refundScore">
            <Radio :value="1">退币</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="邮件通知" class="mb-3">
          <Radio.Group v-model:value="mailInform">
            <Radio :value="1">是</Radio>
            <Radio :value="2">否</Radio>
          </Radio.Group>
        </Form.Item>
          <Form.Item label="拒绝原因" required class="mb-3">
            <Select
              v-model:value="rejectReasonKey"
              :options="
                rejectOptions.map((item) => ({
                  label: item.title,
                  value: item.key,
                }))
              "
              placeholder="请选择拒绝原因"
            />
            <Input
              v-if="rejectReasonKey === 'other'"
              v-model:value="refuseTitle"
              class="mt-2"
              allow-clear
              placeholder="请输入拒绝原因"
            />
          </Form.Item>
          <Form.Item label="邮件内容" required class="mb-3">
            <Input.TextArea
              v-model:value="refuseEmailBody"
              :disabled="rejectReasonKey !== 'other'"
              :rows="4"
              placeholder="请填写邮件内容"
            />
          </Form.Item>
      </template>

      <Form.Item label="备注" class="mb-0">
        <Input.TextArea
          v-model:value="remark"
          :rows="4"
          allow-clear
          placeholder="请输入备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
