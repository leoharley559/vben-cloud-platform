<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Spin,
  Switch,
} from 'ant-design-vue';

import {
  fetchWithdrawGameConfigApi,
  fetchWithdrawTipConfigApi,
  updateWithdrawGameConfigApi,
  updateWithdrawTimesApi,
  updateWithdrawTipConfigApi,
} from '#/api/gameManage/withdraw-rules';
import { useProjectConfig } from '#/composables/use-project-config';

import WithdrawCustomTipsPanel from './withdraw-custom-tips-panel.vue';

const props = defineProps<{ mode: 'params' | 'prompt' }>();
const { projectConfig } = useProjectConfig();
const isAgentV2 = computed(
  () => String(projectConfig.value?.AgentVersion || '') === 'v2',
);
const loading = ref(false);
const saving = ref('');
const snapshot = ref<Record<string, unknown>>({});
const paramForm = reactive({
  MaxWithdrawInTimeCount: 1,
  MinWithdrawAmount: undefined as number | undefined,
  MinReservedAmount: undefined as number | undefined,
  PerWithdrawMultiple: 100,
});
const promptForm = reactive({
  AutoSkipTime: undefined as number | undefined,
  DialogSwitch: 0,
  DialogTimeSwitch: 0,
  Tips: '',
  TriggerAmount: undefined as number | undefined,
});
const multipleOptions = [
  { label: '不限', value: 100 },
  { label: '50 倍', value: 5000 },
  { label: '100 倍', value: 10_000 },
];

async function load() {
  loading.value = true;
  try {
    const data =
      props.mode === 'params'
        ? await fetchWithdrawGameConfigApi()
        : await fetchWithdrawTipConfigApi();
    snapshot.value = { ...data };
    if (props.mode === 'params') {
      paramForm.MinWithdrawAmount = Number(data.MinWithdrawAmount || 0) / 100;
      paramForm.MinReservedAmount = Number(data.MinReservedAmount || 0) / 100;
      paramForm.PerWithdrawMultiple = Number(data.PerWithdrawMultiple || 100);
      paramForm.MaxWithdrawInTimeCount = Number(
        data.MaxWithdrawInTimeCount || 1,
      );
    } else {
      promptForm.DialogSwitch = Number(data.DialogSwitch || 0);
      promptForm.DialogTimeSwitch = Number(data.DialogTimeSwitch || 0);
      promptForm.AutoSkipTime = Number(data.AutoSkipTime || 0);
      promptForm.TriggerAmount = Number(data.TriggerAmount || 0) / 100;
      promptForm.Tips = String(data.Tips || '');
    }
  } finally {
    loading.value = false;
  }
}

async function saveParam(
  field:
    | 'MaxWithdrawInTimeCount'
    | 'MinReservedAmount'
    | 'MinWithdrawAmount'
    | 'PerWithdrawMultiple',
) {
  const value = paramForm[field];
  if (value === undefined || Number(value) < 0) {
    message.warning('请输入有效数值');
    return;
  }
  saving.value = field;
  try {
    if (field === 'MaxWithdrawInTimeCount') {
      await updateWithdrawTimesApi({
        MaxWithdrawInTimeCount: Number(value),
      });
    } else {
      const payload = {
        ...snapshot.value,
        [field]: ['MinReservedAmount', 'MinWithdrawAmount'].includes(field)
          ? Math.round(Number(value) * 100)
          : Number(value),
      };
      await updateWithdrawGameConfigApi(payload);
    }
    message.success('保存成功');
    await load();
  } finally {
    saving.value = '';
  }
}

async function savePrompt(
  field:
    | 'AutoSkipTime'
    | 'DialogSwitch'
    | 'DialogTimeSwitch'
    | 'Tips'
    | 'TriggerAmount',
) {
  const value = promptForm[field];
  if (
    (field === 'AutoSkipTime' || field === 'TriggerAmount') &&
    (value === undefined || Number(value) < 0)
  ) {
    message.warning('请输入有效数值');
    return;
  }
  if (field === 'Tips' && !String(value).trim()) {
    message.warning('请输入提示文案');
    return;
  }
  saving.value = field;
  try {
    const payload = {
      ...snapshot.value,
      [field]:
        field === 'TriggerAmount' ? Math.round(Number(value) * 100) : value,
    };
    await updateWithdrawTipConfigApi(payload);
    message.success('保存成功');
    await load();
  } finally {
    saving.value = '';
  }
}

onMounted(load);
</script>

<template>
  <Spin :spinning="loading">
    <Card v-if="mode === 'params'" size="small" title="提现参数配置">
      <Form class="max-w-3xl" layout="vertical">
        <Form.Item label="最低提现金额">
          <Space>
            <InputNumber
              v-model:value="paramForm.MinWithdrawAmount"
              :min="0"
              :precision="2"
              style="width: 200px"
            />
            <Button
              :loading="saving === 'MinWithdrawAmount'"
              type="primary"
              @click="saveParam('MinWithdrawAmount')"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
        <Form.Item label="最低保留金币">
          <Space>
            <InputNumber
              v-model:value="paramForm.MinReservedAmount"
              :min="0"
              :precision="2"
              style="width: 200px"
            />
            <Button
              :loading="saving === 'MinReservedAmount'"
              type="primary"
              @click="saveParam('MinReservedAmount')"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
        <Form.Item label="单次提现金额倍数">
          <Space>
            <Select
              v-model:value="paramForm.PerWithdrawMultiple"
              :options="multipleOptions"
              style="width: 200px"
            />
            <Button
              :loading="saving === 'PerWithdrawMultiple'"
              type="primary"
              @click="saveParam('PerWithdrawMultiple')"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
        <Form.Item v-if="isAgentV2" label="同时最多提现笔数">
          <Space>
            <InputNumber
              v-model:value="paramForm.MaxWithdrawInTimeCount"
              :max="3"
              :min="1"
              style="width: 200px"
            />
            <Button
              :loading="saving === 'MaxWithdrawInTimeCount'"
              type="primary"
              @click="saveParam('MaxWithdrawInTimeCount')"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

    <Card v-else size="small" title="提现提示配置">
      <p class="mb-4 text-sm text-red-500">
        配置提现触发提示弹窗、自动跳转及提示内容。
      </p>
      <Form class="max-w-3xl" layout="vertical">
        <Form.Item label="弹窗开关">
          <Switch
            :checked="promptForm.DialogSwitch === 1"
            :loading="saving === 'DialogSwitch'"
            @change="
              (checked) => {
                promptForm.DialogSwitch = checked ? 1 : 0;
                savePrompt('DialogSwitch');
              }
            "
          />
        </Form.Item>
        <Form.Item label="自动跳转时间（秒）">
          <Space>
            <InputNumber
              v-model:value="promptForm.AutoSkipTime"
              :min="0"
              style="width: 200px"
            />
            <Button
              :loading="saving === 'AutoSkipTime'"
              type="primary"
              @click="savePrompt('AutoSkipTime')"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
        <Form.Item label="触发金额">
          <Space>
            <InputNumber
              v-model:value="promptForm.TriggerAmount"
              :min="1"
              :precision="2"
              style="width: 200px"
            />
            <Button
              :loading="saving === 'TriggerAmount'"
              type="primary"
              @click="savePrompt('TriggerAmount')"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
        <Form.Item label="提示界面文案">
          <Input.TextArea
            v-model:value="promptForm.Tips"
            :maxlength="500"
            :rows="4"
            show-count
          />
          <Button
            class="mt-2"
            :loading="saving === 'Tips'"
            type="primary"
            @click="savePrompt('Tips')"
          >
            保存
          </Button>
        </Form.Item>
        <Form.Item>
          <Checkbox
            :checked="promptForm.DialogTimeSwitch === 1"
            @change="
              (event) => {
                promptForm.DialogTimeSwitch = event.target.checked ? 1 : 0;
                savePrompt('DialogTimeSwitch');
              }
            "
          >
            提示界面取消倒计时和跳转代客充值按钮
          </Checkbox>
        </Form.Item>
      </Form>
      <WithdrawCustomTipsPanel />
    </Card>
  </Spin>
</template>
