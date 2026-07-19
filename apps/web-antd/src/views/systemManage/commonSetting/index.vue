<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Card, Empty } from 'ant-design-vue';

defineOptions({ name: 'CommonSetting' });
</script>

<template>
  <Page auto-content-height description="系统管理 · 公共配置" title="公共配置">
    <Card>
      <Empty description="旧版为空壳占位页，仅用于菜单权限绑定" />
    </Card>
  </Page>
</template>
