<script lang="ts" setup>
import { Button, Card, Form, Input } from 'ant-design-vue';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningBindPhone' });
</script>

<template>
  <Card size="small" title="绑定手机">
    <MobileMvpTip>短信验证码流程等待下一迭代迁移。</MobileMvpTip>
    <Form layout="vertical">
      <Form.Item label="手机号">
        <Input placeholder="请输入手机号" />
      </Form.Item>
      <Form.Item label="验证码">
        <Input placeholder="请输入验证码" />
      </Form.Item>
      <Button block type="primary">绑定(占位)</Button>
    </Form>
  </Card>
</template>
