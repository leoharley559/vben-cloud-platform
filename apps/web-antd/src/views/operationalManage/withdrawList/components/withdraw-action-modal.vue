<script lang="ts" setup>
import type { WithdrawListItem } from '#/types/operation-manage';

import { computed, ref, watch } from 'vue';

import {
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
} from 'ant-design-vue';

import {
  agreeWithdrawApi,
  fetchWithdrawChannelOptionsApi,
  fetchWithdrawRejectReasonsApi,
  manualWithdrawApi,
  refuseWithdrawApi,
} from '#/api/operationManage/withdraw';
import { formatAmountFromCent } from '#/utils/format-amount';

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
const mailInform = ref(2);
const withdrawAccountId = ref<number | string>();
const channelOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);

const rejectReasonKey = ref('');
const refuseTitle = ref('');
const refuseEmailBody = ref('');
const rejectOptions = ref<Array<{ key: string; title: string }>>([]);
const mailContentMap = ref<Record<string, string>>({});

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
    let titleText = key;
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
    mailInform.value = 2;
    withdrawAccountId.value = undefined;
    channelOptions.value = [];
    rejectReasonKey.value = '';
    refuseTitle.value = '';
    refuseEmailBody.value = '';

    if (props.mode === 'agree' && props.row.Id) {
      const result = await fetchWithdrawChannelOptionsApi({
        Ids: props.row.Id,
        Type: props.row.AccountType ?? '',
      });
      channelOptions.value = (result?.Items || []).map((item) => ({
        label: String(item.ShowName || item.NickName || item.Id || '-'),
        value: item.Id as number | string,
      }));
      withdrawAccountId.value = channelOptions.value[0]?.value;
    }

    if (props.mode === 'reject') {
      await loadRejectReasons();
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
      if (!withdrawAccountId.value) {
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
    :confirm-loading="submitting"
    :open="visible"
    :title="title"
    width="560px"
    @cancel="visible = false"
    @ok="handleOk"
  >
    <Descriptions v-if="row" bordered :column="1" size="small" class="mb-4">
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

    <Form layout="vertical">
      <Form.Item v-if="mode === 'agree'" label="出款通道" required>
        <Select
          v-model:value="withdrawAccountId"
          :options="channelOptions"
          placeholder="请选择出款通道"
        />
      </Form.Item>

      <template v-if="mode === 'reject'">
        <Form.Item label="是否退币">
          <Radio.Group v-model:value="refundScore">
            <Radio :value="1">退币</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="邮件通知">
          <Radio.Group v-model:value="mailInform">
            <Radio :value="1">是</Radio>
            <Radio :value="2">否</Radio>
          </Radio.Group>
        </Form.Item>
        <template v-if="mailInform === 1">
          <Form.Item label="拒绝原因" required>
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
          <Form.Item label="邮件内容">
            <Input.TextArea
              v-model:value="refuseEmailBody"
              :disabled="rejectReasonKey !== 'other'"
              :rows="4"
              placeholder="邮件内容"
            />
          </Form.Item>
        </template>
      </template>

      <Form.Item label="备注">
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
