<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchBackWaterReviewListApi,
  reviewBackWaterApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'BackWaterReviewPanel' });

interface ReviewRow {
  ApplyBackWater?: number;
  Approve?: number;
  BackWater?: number;
  Id: number | string;
  LoginAccount?: string;
  PlayerId?: number | string;
  Status?: number;
}

const { checkPermission } = useCloudPermission();
const canReview = computed(
  () => checkPermission(11076) || checkPermission(11077),
);
const canBatchApprove = computed(() => checkPermission(12670));
const canBatchReject = computed(() => checkPermission(12671));

const actionId = ref<number | string>();
const batchLoading = ref(false);
const selectedRows = ref<ReviewRow[]>([]);
const approveVisible = ref(false);
const saving = ref(false);
const approveForm = reactive({
  Id: '' as number | string,
  LoginAccount: '',
  Real: 0,
});

const selectedIds = computed(() =>
  selectedRows.value
    .map((row) => row.Id)
    .filter(Boolean)
    .join(','),
);
const hasSelection = computed(() => selectedRows.value.length > 0);

function isPending(row: ReviewRow) {
  const status = Number(row.Approve ?? row.Status ?? 0);
  return status === 0 || status === 10;
}

function statusText(row: ReviewRow) {
  const status = Number(row.Approve ?? row.Status ?? 0);
  if (status === 1 || status === 11) {
    return '已通过';
  }
  if (status === 2 || status === 12) {
    return '已拒绝';
  }
  return '待审核';
}

const gridOptions: VxeTableGridOptions<ReviewRow> = {
  checkboxConfig: {
    checkMethod: ({ row }) => isPending(row as ReviewRow),
  },
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
    {
      field: 'ApplyBackWater',
      formatter: ({ cellValue, row }) =>
        formatAmountFromCent(Number(cellValue ?? row.BackWater ?? 0)),
      minWidth: 120,
      title: '申请返水',
    },
    {
      field: 'Approve',
      slots: { default: 'status' },
      title: '状态',
      width: 100,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchBackWaterReviewListApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const items = (result.Items || []) as unknown as ReviewRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: ReviewRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: ReviewRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function clearSelection() {
  selectedRows.value = [];
  gridApi.grid?.clearCheckboxRow();
}

function openApprove(row: ReviewRow) {
  approveForm.Id = row.Id;
  approveForm.LoginAccount = String(row.LoginAccount || '');
  approveForm.Real = Number(row.ApplyBackWater ?? row.BackWater ?? 0) / 100;
  approveVisible.value = true;
}

async function submitApprove() {
  if (!approveForm.Real || approveForm.Real <= 0) {
    message.warning('请输入实际返水金额');
    return;
  }
  saving.value = true;
  try {
    await reviewBackWaterApi({
      Approve: 1,
      Ids: approveForm.Id,
      Real: Math.round(approveForm.Real * 100),
    });
    message.success('审核通过');
    approveVisible.value = false;
    clearSelection();
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleReject(row: ReviewRow) {
  Modal.confirm({
    content: `确认拒绝玩家「${row.LoginAccount}」的返水申请？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await reviewBackWaterApi({ Approve: 2, Ids: row.Id });
        message.success('已拒绝');
        clearSelection();
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '拒绝审核',
  });
}

function handleBatchApprove() {
  if (!selectedIds.value) {
    message.warning('请先勾选待审核记录');
    return;
  }
  Modal.confirm({
    content: `确认批量通过 ${selectedRows.value.length} 条返水申请？`,
    onOk: async () => {
      batchLoading.value = true;
      try {
        await reviewBackWaterApi({
          Approve: 1,
          Ids: selectedIds.value,
          Real: 0,
        });
        message.success('批量审核通过');
        clearSelection();
        await gridApi.reload();
      } finally {
        batchLoading.value = false;
      }
    },
    title: '批量通过',
  });
}

function handleBatchReject() {
  if (!selectedIds.value) {
    message.warning('请先勾选待审核记录');
    return;
  }
  Modal.confirm({
    content: `确认批量拒绝 ${selectedRows.value.length} 条返水申请？`,
    onOk: async () => {
      batchLoading.value = true;
      try {
        await reviewBackWaterApi({
          Approve: 2,
          Ids: selectedIds.value,
        });
        message.success('批量拒绝成功');
        clearSelection();
        await gridApi.reload();
      } finally {
        batchLoading.value = false;
      }
    },
    title: '批量拒绝',
  });
}
</script>

<template>
  <div>
    <div
      v-if="canBatchApprove || canBatchReject"
      class="mb-3 flex flex-wrap gap-2"
    >
      <Button
        v-if="canBatchApprove"
        :disabled="!hasSelection"
        :loading="batchLoading"
        type="primary"
        @click="handleBatchApprove"
      >
        批量通过
      </Button>
      <Button
        v-if="canBatchReject"
        :disabled="!hasSelection"
        :loading="batchLoading"
        danger
        @click="handleBatchReject"
      >
        批量拒绝
      </Button>
    </div>
    <div class="mb-3 text-xs text-gray-400">
      已支持单条/批量通过、拒绝；批量通过使用申请金额默认值。
    </div>
    <Grid>
      <template #status="{ row }">
        <Tag :color="isPending(row) ? 'processing' : 'default'">
          {{ statusText(row) }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Space v-if="canReview && isPending(row)" :size="0" wrap>
          <Button size="small" type="link" @click="openApprove(row)">
            通过
          </Button>
          <Button
            danger
            size="small"
            type="link"
            :loading="actionId === row.Id"
            @click="handleReject(row)"
          >
            拒绝
          </Button>
        </Space>
        <span v-else>-</span>
      </template>
    </Grid>

    <Modal
      v-model:open="approveVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="通过审核"
      @ok="submitApprove"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="玩家账号">
          <Input :value="approveForm.LoginAccount" disabled />
        </Form.Item>
        <Form.Item label="实际返水金额" required>
          <InputNumber
            v-model:value="approveForm.Real"
            :min="0"
            class="!w-full"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
