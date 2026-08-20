<script lang="ts" setup>
import { Button, Card, Form, Input, Select } from 'ant-design-vue';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningAddAccount' });

const emit = defineEmits<{ back: [] }>();

</script>

<template>
  <Card size="small" title="新增收款账户">
    <MobileMvpTip />
    <Form layout="vertical">
      <Form.Item label="账户类型">
        <Select
          :options="[
            { label: '银行卡', value: 1 },
            { label: '支付宝', value: 2 },
          ]"
          placeholder="请选择"
        />
      </Form.Item>
      <Form.Item label="姓名">
        <Input placeholder="请输入姓名" />
      </Form.Item>
      <Form.Item label="账号">
        <Input placeholder="请输入账号" />
      </Form.Item>
      <div class="flex gap-2">
        <Button block @click="emit('back')">取消</Button>
        <Button block type="primary" @click="emit('back')">保存(占位)</Button>
      </div>
    </Form>
  </Card>
</template>
