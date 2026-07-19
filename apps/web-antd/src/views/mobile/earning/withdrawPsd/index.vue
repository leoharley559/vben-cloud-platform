<script lang="ts" setup>
import { Button, Card, Form, Input } from 'ant-design-vue';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningWithdrawPsd' });
</script>

<template>
  <Card size="small" title="提现密码设置">
    <MobileMvpTip>短信验证码、密码加密等待下一迭代迁移。</MobileMvpTip>
    <Form layout="vertical">
      <Form.Item label="新提现密码">
        <Input.Password placeholder="请输入提现密码" />
      </Form.Item>
      <Button block type="primary">保存(占位)</Button>
    </Form>
  </Card>
</template>
