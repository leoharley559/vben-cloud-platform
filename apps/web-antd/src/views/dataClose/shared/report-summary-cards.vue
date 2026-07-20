<script lang="ts" setup>
import { Card, Col, Row, Statistic } from 'ant-design-vue';

export interface ReportSummaryItem {
  title: string;
  value: number | string;
}

defineOptions({ name: 'ReportSummaryCards' });

defineProps<{
  items: ReportSummaryItem[];
}>();
</script>

<template>
  <Row v-if="items.length > 0" :gutter="[12, 12]" class="mb-4">
    <Col
      v-for="item in items"
      :key="item.title"
      :xs="12"
      :sm="8"
      :md="6"
      :lg="4"
    >
      <Card size="small">
        <Statistic :title="item.title" :value="item.value" />
      </Card>
    </Col>
  </Row>
</template>
