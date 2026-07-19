<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  InputNumber,
  Modal,
  Result,
  message,
} from 'ant-design-vue';
import { useRouter } from 'vue-router';

import { createRechargeVoucherApi } from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'VoucherGeneratePanel' });

const router = useRouter();
const { checkPermission } = useCloudPermission();
const canGenerate = computed(() => checkPermission(10081));

const submitting = ref(false);
const form = reactive({
  ExchangeAmount: undefined as number | undefined,
  GenerateQuantity: undefined as number | undefined,
});

async function handleSubmit() {
  if (!form.ExchangeAmount || form.ExchangeAmount <= 0) {
    message.warning('请输入兑换金额');
    return;
  }
  if (form.ExchangeAmount > 100000) {
    message.warning('兑换金额不能超过 100000');
    return;
  }
  if (!form.GenerateQuantity || form.GenerateQuantity <= 0) {
    message.warning('请输入生成数量');
    return;
  }

  submitting.value = true;
  try {
    await createRechargeVoucherApi({
      ConvertType: 0,
      ExchangeAmount: Math.round(form.ExchangeAmount * 100),
      GenerateQuantity: String(form.GenerateQuantity),
      Hash: createRequestHash(),
      Password: '',
    });
    message.success('兑换码已生成');
    form.ExchangeAmount = undefined;
    form.GenerateQuantity = undefined;
    Modal.confirm({
      content: '是否前往导出管理下载兑换码文件？',
      okText: '前往',
      title: '生成成功',
      onOk: () => {
        router.push('/operationalManage/downloadCsvManage').catch(() => {
          // route may differ by menu config
        });
      },
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="canGenerate">
    <Card size="small" title="随机生成兑换码">
      <Form class="max-w-md" layout="vertical">
        <Form.Item label="兑换金额（元）" required>
          <InputNumber
            v-model:value="form.ExchangeAmount"
            :min="0.01"
            :precision="2"
            class="w-full"
            placeholder="请输入金额"
          />
        </Form.Item>
        <Form.Item label="生成数量" required>
          <InputNumber
            v-model:value="form.GenerateQuantity"
            :min="1"
            :precision="0"
            class="w-full"
            placeholder="请输入数量"
          />
        </Form.Item>
        <Button type="primary" :loading="submitting" @click="handleSubmit">
          生成兑换码
        </Button>
      </Form>
      <p class="mt-4 text-xs text-gray-400">
        MVP 仅支持随机生成；Excel 导入、邮箱通道、购买记录待下一迭代。
      </p>
    </Card>
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要权限 10081 才能生成兑换码"
    title="无权限"
  />
</template>
