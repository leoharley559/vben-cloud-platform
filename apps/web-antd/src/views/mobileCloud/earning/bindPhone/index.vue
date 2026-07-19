<script lang="ts" setup>
import { Button, Card, Form, Input } from 'ant-design-vue';

import MobileMvpTip from '../../../mobile/components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileCloudBindPhone' });
</script>

<template>
  <Card size="small" title="绑定手机">
    <MobileMvpTip />
    <Form layout="vertical">
      <Form.Item label="手机号">
        <Input placeholder="请输入手机号" />
      </Form.Item>
      <Button block type="primary">绑定(占位)</Button>
    </Form>
  </Card>
</template>
