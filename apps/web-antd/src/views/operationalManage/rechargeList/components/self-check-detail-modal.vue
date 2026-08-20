<script lang="ts" setup>
import type { SelfCheckListItem } from '#/types/operation-manage';
import type { SelfCheckActionRecord } from '#/types/withdraw-extra';

import { computed, ref, watch } from 'vue';

import { Button, Image, Modal, Spin, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchSelfCheckActionRecordsApi } from '#/api/operationManage/recharge-extra';
import { formatAmountFromCent } from '#/utils/format-amount';
import { getServiceImageUrl, splitImagePaths } from '#/utils/media';
import { formatSelfCheckStatus } from '#/utils/recharge-self-check';

defineOptions({ name: 'SelfCheckDetailModal' });

const props = defineProps<{
  open: boolean;
  row: null | SelfCheckListItem;
}>();

const emit = defineEmits<{
  addRecord: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const records = ref<SelfCheckActionRecord[]>([]);

const imageUrls = computed(() => {
  const raw = String(props.row?.PaymentUrlImages || '');
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => splitImagePaths(item))
    .map((item) => getServiceImageUrl(item));
});

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

async function loadRecords() {
  if (!props.row) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchSelfCheckActionRecordsApi({
      GameOrderId: props.row.GameOrderId,
      GameOrderIdOrigin: props.row.GameOrderIdOrigin,
      OrderId: props.row.OrderId,
      Page: 1,
      PageSize: 50,
      PlayerId: props.row.PlayerId,
    });
    records.value = result?.Items || [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      loadRecords();
    }
  },
);

function closeModal() {
  emit('update:open', false);
}

const columns = [
  {
    dataIndex: 'CreateTime',
    key: 'CreateTime',
    title: '操作时间',
    customRender: ({ text }: { text?: number | string }) =>
      formatDateTime(text),
  },
  {
    dataIndex: 'Status',
    key: 'Status',
    title: '状态',
    customRender: ({ text }: { text?: number }) =>
      text ? formatSelfCheckStatus(text) : '-',
  },
  { dataIndex: 'Remark', key: 'Remark', title: '备注' },
  { dataIndex: 'ReviewName', key: 'ReviewName', title: '操作人' },
];
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    title="处理记录"
    width="760px"
    @cancel="closeModal"
  >
    <div v-if="row" class="mb-4 grid grid-cols-2 gap-2 text-sm">
      <div>查单编号：{{ row.GameOrderId || '-' }}</div>
      <div>游戏订单：{{ row.GameOrderIdOrigin || '-' }}</div>
      <div>订单编号：{{ row.OrderId || '-' }}</div>
      <div>充值金额：{{ formatAmountFromCent(row.Amount) }}</div>
      <div>接单账号：{{ row.TakerName || '-' }}</div>
      <div>操作人：{{ row.ReviewName || '-' }}</div>
    </div>

    <div v-if="imageUrls.length > 0" class="mb-4">
      <div class="mb-2 font-medium">充值凭证</div>
      <Image.PreviewGroup>
        <Image
          v-for="(url, index) in imageUrls"
          :key="`${url}-${index}`"
          :src="url"
          :width="96"
          class="mr-2"
        />
      </Image.PreviewGroup>
    </div>

    <div class="mb-2 flex items-center justify-between">
      <span class="font-medium">处理记录</span>
      <Button size="small" type="link" @click="emit('addRecord')">
        新增处理记录
      </Button>
    </div>

    <Spin :spinning="loading">
      <Table
        :columns="columns"
        :data-source="records"
        :pagination="false"
        row-key="Id"
        size="small"
      />
    </Spin>
  </Modal>
</template>
