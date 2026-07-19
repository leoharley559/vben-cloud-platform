<script lang="ts" setup>
import { Button, Card, Form, Input } from 'ant-design-vue';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningAccountPsd' });
</script>

<template>
  <Card size="small" title="修改账号密码">
    <MobileMvpTip />
    <Form layout="vertical">
      <Form.Item label="原密码">
        <Input.Password placeholder="请输入原密码" />
      </Form.Item>
      <Form.Item label="新密码">
        <Input.Password placeholder="请输入新密码" />
      </Form.Item>
      <Button block type="primary">保存(占位)</Button>
    </Form>
  </Card>
</template>
