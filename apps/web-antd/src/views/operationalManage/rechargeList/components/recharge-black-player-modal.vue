<script lang="ts" setup>
import type { RechargeBlackPlayerItem } from '#/types/operation-manage';

import { computed, ref, watch } from 'vue';

import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createRechargeBlackPlayerApi,
  fetchRechargeBlackConfigApi,
  updateRechargeBlackConfigApi,
  updateRechargeBlackPlayerApi,
} from '#/api/operationManage/recharge-extra';
import { queryPlayerByAccountApi } from '#/api/operationManage/player';
import { useOperationOptions } from '#/composables/use-operation-options';
import {
  RECHARGE_SPECIAL_PAY_TYPE,
  useRechargePayTypeOptions,
} from '#/utils/recharge-pay-type';

defineOptions({ name: 'RechargeBlackPlayerModal' });

const props = defineProps<{
  mode: 'auto' | 'create' | 'edit';
  open: boolean;
  row: RechargeBlackPlayerItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { packageOptions } = useOperationOptions();
const { options: payOptions } = useRechargePayTypeOptions();

const submitting = ref(false);
const lookupLoading = ref(false);
const loginAccount = ref('');
const packageId = ref<number | string>('');
const playerId = ref<number | string>('');
const remark = ref('');
const payTypes = ref<string[]>([]);
const specialPay = ref(false);
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const limit = ref<number>(20);
const specialLimit = ref<number>(3);
const editId = ref<number | string>('');

const title = computed(() => {
  if (props.mode === 'auto') {
    return '自动条件设置';
  }
  return props.mode === 'create' ? '手动添加黑名单' : '编辑黑名单';
});

const packageSelectOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageId,
    })),
);

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    submitting.value = false;
    if (props.mode === 'auto') {
      const config = await fetchRechargeBlackConfigApi();
      limit.value = Number(config?.Limit || 20);
      specialLimit.value = Number(config?.SpecialLimit || 3);
      return;
    }

    remark.value = '';
    payTypes.value = [];
    specialPay.value = false;
    dateRange.value = undefined;
    playerId.value = '';
    editId.value = '';

    if (props.mode === 'edit' && props.row) {
      editId.value = props.row.Id || '';
      loginAccount.value = String(props.row.LoginAccount || '');
      packageId.value =
        packageSelectOptions.value.find(
          (item) => item.label === props.row?.PackageName,
        )?.value || '';
      remark.value = String(props.row.Remark || '');
      const types = String(props.row.PayType || '')
        .split(',')
        .filter(Boolean);
      specialPay.value = types.includes(RECHARGE_SPECIAL_PAY_TYPE);
      payTypes.value = types.filter(
        (item) => item !== RECHARGE_SPECIAL_PAY_TYPE,
      );
      const begin = Number(props.row.BeginTime);
      const end = Number(props.row.EndTime);
      if (begin && end) {
        dateRange.value = [
          String(begin).length > 10 ? dayjs(begin) : dayjs.unix(begin),
          String(end).length > 10 ? dayjs(end) : dayjs.unix(end),
        ];
      }
      return;
    }

    loginAccount.value = '';
    packageId.value = packageSelectOptions.value[0]?.value || '';
  },
);

function closeModal() {
  emit('update:open', false);
}

async function resolvePlayer() {
  if (!loginAccount.value || !packageId.value) {
    message.warning('请填写游戏账号和所属产品');
    return;
  }
  lookupLoading.value = true;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: loginAccount.value,
      PackageId: packageId.value,
    });
    const first = result?.Items?.[0];
    if (!first?.PlayerId || String(first.PlayerId) === '0') {
      playerId.value = '';
      message.warning('未找到对应玩家');
      return;
    }
    playerId.value = first.PlayerId;
    message.success('已匹配玩家');
  } finally {
    lookupLoading.value = false;
  }
}

function buildPayType() {
  const values = [...payTypes.value];
  if (specialPay.value) {
    values.push(RECHARGE_SPECIAL_PAY_TYPE);
  }
  return values.join(',');
}

async function handleOk() {
  submitting.value = true;
  try {
    if (props.mode === 'auto') {
      if (
        !limit.value ||
        limit.value < 1 ||
        !specialLimit.value ||
        specialLimit.value < 1
      ) {
        message.warning('次数最少为 1');
        return;
      }
      await updateRechargeBlackConfigApi({
        Limit: Number(limit.value),
        SpecialLimit: Number(specialLimit.value),
      });
      message.success('自动条件已保存');
      closeModal();
      emit('success');
      return;
    }

    if (props.mode === 'create') {
      if (!playerId.value) {
        await resolvePlayer();
        if (!playerId.value) {
          return;
        }
      }
      const [begin, end] = dateRange.value || [];
      await createRechargeBlackPlayerApi({
        BeginTime: begin ? begin.startOf('day').unix() : '',
        EndTime: end ? end.endOf('day').unix() : '',
        MultiInfo: '',
        PayType: buildPayType(),
        PlayerId: playerId.value,
        Remark: remark.value,
      });
      message.success('新增成功');
    } else {
      if (!editId.value) {
        return;
      }
      const [begin, end] = dateRange.value || [];
      await updateRechargeBlackPlayerApi({
        BeginTime: begin ? begin.startOf('day').unix() : 0,
        EndTime: end ? end.endOf('day').unix() : 0,
        Id: editId.value,
        PayType: buildPayType(),
        Remark: remark.value,
      });
      message.success('编辑成功');
    }
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting || lookupLoading"
    :open="open"
    :title="title"
    width="560px"
    @cancel="closeModal"
    @ok="handleOk"
  >
    <Form v-if="mode === 'auto'" layout="vertical" class="pt-2">
      <Form.Item label="普通支付取消次数" required>
        <InputNumber v-model:value="limit" :min="1" class="w-full" />
      </Form.Item>
      <Form.Item label="极速支付取消次数" required>
        <InputNumber v-model:value="specialLimit" :min="1" class="w-full" />
      </Form.Item>
    </Form>

    <Form v-else layout="vertical" class="pt-2">
      <Form.Item label="游戏账号" required>
        <div class="flex gap-2">
          <Input
            v-model:value="loginAccount"
            :disabled="mode === 'edit'"
            allow-clear
            placeholder="请输入游戏账号"
            @blur="mode === 'create' && resolvePlayer()"
          />
          <Select
            v-model:value="packageId"
            :disabled="mode === 'edit'"
            :options="packageSelectOptions"
            class="w-40"
            placeholder="产品"
            @change="mode === 'create' && resolvePlayer()"
          />
        </div>
      </Form.Item>
      <Form.Item v-if="playerId && mode === 'create'" label="玩家ID">
        <Input :value="String(playerId)" disabled />
      </Form.Item>
      <Form.Item label="允许充值方式">
        <Checkbox.Group v-model:value="payTypes" class="flex flex-wrap gap-2">
          <Checkbox
            v-for="item in payOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </Checkbox>
        </Checkbox.Group>
        <div class="mt-2">
          <Checkbox v-model:checked="specialPay">极速支付</Checkbox>
        </div>
      </Form.Item>
      <Form.Item label="禁止日期">
        <DatePicker.RangePicker v-model:value="dateRange" class="w-full" />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="remark"
          :rows="3"
          allow-clear
          placeholder="请输入备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
