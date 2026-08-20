<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  InputNumber,
  message,
  Space,
  Spin,
} from 'ant-design-vue';

import {
  fetchWithdrawEstimatedTimeApi,
  updateWithdrawEstimatedTimeApi,
} from '#/api/gameManage/withdraw-rules';
import { useCloudPermission } from '#/composables/use-cloud-permission';

const { checkPermission } = useCloudPermission();
const canVirtual = computed(() => checkPermission(12_386));
const canBank = computed(() => checkPermission(12_398));
const loading = ref(false);
const saving = ref('');
const snapshot = ref<Record<string, unknown>>({});
const form = reactive({
  EstimatedMinute: undefined as number | undefined,
  EstimatedMinuteBank: undefined as number | undefined,
});

async function load() {
  loading.value = true;
  try {
    const result = await fetchWithdrawEstimatedTimeApi();
    const data =
      result.Items && typeof result.Items === 'object'
        ? (result.Items as Record<string, unknown>)
        : result;
    snapshot.value = { ...data };
    form.EstimatedMinute = Number(data.EstimatedMinute || 0);
    form.EstimatedMinuteBank = Number(data.EstimatedMinuteBank || 0);
  } finally {
    loading.value = false;
  }
}

async function save(field: 'EstimatedMinute' | 'EstimatedMinuteBank') {
  if (form[field] === undefined || Number(form[field]) < 0) {
    message.warning('请输入非负整数分钟数');
    return;
  }
  saving.value = field;
  try {
    await updateWithdrawEstimatedTimeApi({
      ...snapshot.value,
      [field]: Number(form[field]),
    });
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
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card v-if="canVirtual" size="small" title="虚拟币提现预计到账时间">
        <Form layout="vertical">
          <Form.Item label="预计分钟">
            <Space>
              <InputNumber
                v-model:value="form.EstimatedMinute"
                :min="0"
                :precision="0"
                style="width: 220px"
              />
              <Button
                :loading="saving === 'EstimatedMinute'"
                type="primary"
                @click="save('EstimatedMinute')"
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      <Card v-if="canBank" size="small" title="银行卡普通提现预计到账时间">
        <Form layout="vertical">
          <Form.Item label="预计分钟">
            <Space>
              <InputNumber
                v-model:value="form.EstimatedMinuteBank"
                :min="0"
                :precision="0"
                style="width: 220px"
              />
              <Button
                :loading="saving === 'EstimatedMinuteBank'"
                type="primary"
                @click="save('EstimatedMinuteBank')"
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  </Spin>
</template>
