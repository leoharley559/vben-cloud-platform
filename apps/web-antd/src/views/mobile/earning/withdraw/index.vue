<script lang="ts" setup>
import { Button, Card, Form, InputNumber } from 'ant-design-vue';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningWithdraw' });
</script>

<template>
  <Card size="small" title="提现">
    <MobileMvpTip>提现申请、密码校验等待下一迭代迁移。</MobileMvpTip>
    <Form layout="vertical">
      <Form.Item label="提现金额">
        <InputNumber class="w-full" :min="0" placeholder="请输入金额" />
      </Form.Item>
      <Button block type="primary">提交提现(占位)</Button>
    </Form>
  </Card>
</template>
