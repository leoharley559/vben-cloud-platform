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

const { checkPermission } = useCloudPermission();

const visible = ref(false);
const saving = ref(false);
const formModel = reactive({
  Num: '100',
});

const canBuy = computed(() => checkPermission(11429) || checkPermission(187));

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
      </Form>
    </Modal>
  </div>
</template>
