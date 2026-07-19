<script lang="ts" setup>
import { ref } from 'vue';

import { Button, Card, Form, Input, InputNumber } from 'ant-design-vue';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileOpenAccountForm' });

const emit = defineEmits<{ close: [] }>();

const formState = ref({
  CommissionRate: 0,
  Name: '',
  Username: '',
});
</script>

<template>
  <Card class="mt-3" size="small" title="新增账号">
    <MobileMvpTip>提交接口、分成校验等待下一迭代迁移。</MobileMvpTip>
    <Form layout="vertical">
      <Form.Item label="账号">
        <Input v-model:value="formState.Username" placeholder="请输入账号" />
      </Form.Item>
      <Form.Item label="昵称">
        <Input v-model:value="formState.Name" placeholder="请输入昵称" />
      </Form.Item>
      <Form.Item label="分成比例(%)">
        <InputNumber
          v-model:value="formState.CommissionRate"
          :max="100"
          :min="0"
          class="w-full"
        />
      </Form.Item>
      <div class="flex gap-2">
        <Button block @click="emit('close')">取消</Button>
        <Button block type="primary" @click="emit('close')">保存(占位)</Button>
      </div>
    </Form>
  </Card>
</template>
