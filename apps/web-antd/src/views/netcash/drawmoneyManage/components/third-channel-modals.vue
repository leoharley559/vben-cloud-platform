<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
} from 'ant-design-vue';

import { drawmoneyRequest } from '#/api/netcash/drawmoney-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import { MULTIPLY_OPTIONS } from '../shared';

defineOptions({ name: 'DrawmoneyThirdChannelModals' });

const emit = defineEmits<{
  saved: [fromStrategy: boolean];
}>();

const { projectConfig } = useCloudPermission();

const formOpen = ref(false);
const secretOpen = ref(false);
const form = reactive<Record<string, any>>({});
const secretFields = ref<Array<{ description: string; name: string }>>([]);

function openEdit(row: Record<string, unknown>) {
  Object.assign(form, row, {
    CustomRate: Number(row.CustomRate || 0) / 10_000,
    Id: row.ThirdWithdrawId || row.Id,
    MaxDayMoney: Number(row.MaxDayMoney || 0) / 100,
    MaxOrderMoney: Number(row.MaxOrderMoney || 0) / 100,
    MinDayMoney: Number(row.MinDayMoney || 0) / 100,
    MinOrderMoney: Number(row.MinOrderMoney || 0) / 100,
    SupportBank: row.SupportBank
      ? String(row.SupportBank).split(',')
      : (projectConfig.value?.BankList || []).map((b: any) => b.BankCode),
    WithdrawId: row.ThirdWithdrawId ? row.Id : undefined,
    fromStrategy: !!row.ThirdWithdrawId,
  });
  formOpen.value = true;
}

function openSecret(row: Record<string, unknown>) {
  let params: Record<string, unknown> = {};
  try {
    params = row.AgentParams ? JSON.parse(String(row.AgentParams)) : {};
  } catch {
    params = {};
  }
  Object.assign(form, row, { Paramss: params });
  try {
    secretFields.value = JSON.parse(String(row.Params || '[]'));
  } catch {
    secretFields.value = [];
  }
  secretOpen.value = true;
}

async function saveForm() {
  if (
    Number(form.MaxDayMoney) < Number(form.MinDayMoney) ||
    Number(form.MaxOrderMoney) < Number(form.MinOrderMoney)
  ) {
    message.warning('最大金额不能小于最小金额');
    return;
  }
  try {
    await drawmoneyRequest.channelEdit({
      CustomRate: Number(form.CustomRate || 0) * 10_000,
      Description: form.Description,
      Id: form.Id,
      MaxDayMoney: Number(form.MaxDayMoney || 0) * 100,
      MaxOrderMoney: Number(form.MaxOrderMoney || 0) * 100,
      MinDayMoney: Number(form.MinDayMoney || 0) * 100,
      MinOrderMoney: Number(form.MinOrderMoney || 0) * 100,
      PerMulti: form.PerMulti,
      Rate: form.Rate,
      RateType: form.RateType,
      SupportBank: Array.isArray(form.SupportBank)
        ? form.SupportBank.join(',')
        : form.SupportBank,
      WithdrawId: form.WithdrawId,
    });
    if (form.fromStrategy) {
      await drawmoneyRequest.channelShelf({ Id: form.Id, OnShelf: 1 });
    }
    formOpen.value = false;
    message.success('保存成功');
    emit('saved', !!form.fromStrategy);
  } catch {
    /* 全局拦截已提示 */
  }
}

async function saveSecret() {
  try {
    await drawmoneyRequest.thirdEditParams({
      Id: form.Id,
      Params: JSON.stringify(form.Paramss),
    });
    secretOpen.value = false;
    message.success('密钥保存成功');
    emit('saved', false);
  } catch {
    /* 全局拦截已提示 */
  }
}

defineExpose({ openEdit, openSecret });
</script>

<template>
  <Modal
    v-model:open="formOpen"
    title="第三方通道设置"
    width="700px"
    @ok="saveForm"
  >
    <Form layout="vertical">
      <Form.Item label="通道名称">
        <Input v-model:value="form.ShowName" disabled />
      </Form.Item>
      <Form.Item label="费率模式">
        <Radio.Group v-model:value="form.RateType">
          <Radio :value="0">百分比</Radio>
          <Radio :value="1">固定</Radio>
          <Radio :value="2">混合</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item v-if="form.RateType !== 1" label="百分比费率">
        <InputNumber v-model:value="form.Rate" addon-after="%" />
      </Form.Item>
      <Form.Item v-if="form.RateType !== 0" label="自定义费率">
        <InputNumber v-model:value="form.CustomRate" />
      </Form.Item>
      <Form.Item v-if="form.fromStrategy" label="匹配倍数">
        <Select v-model:value="form.PerMulti" :options="MULTIPLY_OPTIONS" />
      </Form.Item>
      <Space>
        <Form.Item label="每日下限">
          <InputNumber v-model:value="form.MinDayMoney" />
        </Form.Item>
        <Form.Item label="每日上限">
          <InputNumber v-model:value="form.MaxDayMoney" />
        </Form.Item>
        <Form.Item label="单笔下限">
          <InputNumber v-model:value="form.MinOrderMoney" />
        </Form.Item>
        <Form.Item label="单笔上限">
          <InputNumber v-model:value="form.MaxOrderMoney" />
        </Form.Item>
      </Space>
      <Form.Item label="支持银行">
        <Checkbox.Group
          v-model:value="form.SupportBank"
          :options="
            (projectConfig?.BankList || []).map((b: any) => ({
              label: b.BankName,
              value: b.BankCode,
            }))
          "
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea v-model:value="form.Description" />
      </Form.Item>
    </Form>
  </Modal>

  <Modal v-model:open="secretOpen" title="密钥管理" @ok="saveSecret">
    <Form layout="vertical">
      <Form.Item label="通道名称">
        <Input v-model:value="form.ShowName" disabled />
      </Form.Item>
      <Form.Item
        v-for="field in secretFields"
        :key="field.name"
        :label="field.description"
      >
        <Input.Password v-model:value="form.Paramss[field.name]" />
      </Form.Item>
    </Form>
  </Modal>
</template>
