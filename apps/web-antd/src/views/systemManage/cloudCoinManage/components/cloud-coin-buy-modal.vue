<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Button, Form, Input, Modal, Space, message } from 'ant-design-vue';

import { getUserInfoApi } from '#/api';
import { buyCloudCoinApi } from '#/api/systemManage/extra';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'CloudCoinBuyModal' });

const emit = defineEmits<{
  success: [];
}>();

const { checkPermission, projectConfig } = useCloudPermission();

const visible = ref(false);
const saving = ref(false);
const formModel = reactive({
  Num: '100',
});

/** 旧站购买按钮权限 187；列表区 11429 也允许入口 */
const canBuy = computed(() => checkPermission(187) || checkPermission(11429));

const cloudCoinPrice = computed(() =>
  Number(
    (projectConfig.value as { CloudCoinPrice?: number } | undefined)
      ?.CloudCoinPrice ?? 0,
  ),
);

const costCloudCoin = computed(() => {
  const num = Number(formModel.Num);
  if (!Number.isFinite(num) || num <= 0) {
    return 0;
  }
  return num * cloudCoinPrice.value;
});

const quickNums = [200, 500, 1000, 2000];

function open() {
  formModel.Num = '100';
  visible.value = true;
}

async function submit() {
  if (!/^[1-9]\d*$/.test(formModel.Num)) {
    message.error('请输入正确的购买次数');
    return;
  }
  saving.value = true;
  try {
    await buyCloudCoinApi({
      Hash: createRequestHash(),
      Num: formModel.Num,
    });
    message.success('购买成功');
    visible.value = false;
    await getUserInfoApi();
    emit('success');
  } catch {
    // 错误由拦截器提示
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <div>
    <Button v-if="canBuy" type="primary" @click="open">购买云币</Button>
    <Modal
      v-model:open="visible"
      :confirm-loading="saving"
      destroy-on-close
      title="购买云币"
      @ok="submit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="购买次数" required>
          <Input v-model:value="formModel.Num" placeholder="请输入购买次数" />
        </Form.Item>
        <Form.Item label="快捷购买">
          <Space wrap>
            <Button
              v-for="num in quickNums"
              :key="num"
              size="small"
              type="primary"
              @click="formModel.Num = String(num)"
            >
              购买{{ num }}次
            </Button>
          </Space>
        </Form.Item>
        <div class="text-lg font-medium" style="color: #ff6d00">
          需要花费：{{ costCloudCoin }}云币
        </div>
      </Form>
    </Modal>
  </div>
</template>
