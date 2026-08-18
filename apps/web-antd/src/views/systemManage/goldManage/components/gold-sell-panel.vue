<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Button, Form, Input, Modal, message } from 'ant-design-vue';

import { getUserInfoApi } from '#/api';
import {
  createGoldRefundApi,
  createGoldSellApi,
  fetchGoldSellListApi,
} from '#/api/systemManage/extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'GoldSellPanel' });

const emit = defineEmits<{
  lookRecord: [agentName: string];
}>();

type DialogMode = 'sell' | 'takeBack';

interface SellRow {
  Id: number | string;
  MonthSellScores?: number | string;
  Scores?: number | string;
  UserName?: string;
}

const { adminInfo, checkPermission } = useCloudPermission();

const filterUsername = ref('');
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>('sell');
const saving = ref(false);

const formModel = reactive({
  AddReceiptScores: '',
  AddSellScores: '',
  AgentGetScores: '',
  AgentId: '' as number | string,
  AgentNum: '',
  Note: '',
});

const canViewTable = computed(() => checkPermission(11434));
const canSell = computed(() => checkPermission(11435));
const canRefund = computed(() => checkPermission(11436));
const canLookRecord = computed(() => checkPermission(11425));

const myAccountScores = computed(() => {
  const account = adminInfo.value?.Account as
    | { Scores?: number | string }
    | number
    | string
    | undefined;
  if (account && typeof account === 'object') {
    return Number(account.Scores || 0);
  }
  return 0;
});

const operatorName = computed(() => {
  const admin = adminInfo.value?.Admin as { Username?: string } | undefined;
  if (admin?.Username) return String(admin.Username);
  const name = adminInfo.value?.AdminName;
  if (name !== undefined && name !== null && name !== '') {
    return String(name);
  }
  return '';
});

const dialogTitle = computed(() =>
  dialogMode.value === 'sell' ? '金币授信' : '追回金币',
);

const gridOptions: VxeTableGridOptions<SellRow> = {
  columns: [
    {
      align: 'center',
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 60,
    },
    {
      align: 'center',
      field: 'UserName',
      minWidth: 140,
      title: '包网账号',
    },
    {
      align: 'center',
      field: 'Scores',
      minWidth: 140,
      title: '账户剩余金币',
    },
    {
      align: 'center',
      field: 'MonthSellScores',
      minWidth: 140,
      title: '本月已发放金币',
    },
    {
      align: 'center',
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 200,
    },
    {
      align: 'center',
      field: 'lookRecord',
      fixed: 'right',
      slots: { default: 'lookRecord' },
      title: '查看记录',
      width: 110,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }) => {
        if (!canViewTable.value) {
          return { items: [], total: 0 };
        }
        try {
          const result = await fetchGoldSellListApi({
            Keyword: '',
            Page: page.currentPage,
            PageSize: page.pageSize,
            Sort:
              sort?.field && sort?.order
                ? `${sort.order === 'desc' ? '-' : ''}${sort.field}`
                : '',
            Username: filterUsername.value,
          });
          const items = (result.Items || []) as unknown as SellRow[];
          return {
            items,
            total: Number(result.Pagination?.MaxCount || items.length),
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function resetForm() {
  formModel.AddReceiptScores = '';
  formModel.AddSellScores = '';
  formModel.AgentGetScores = '';
  formModel.AgentId = '';
  formModel.AgentNum = '';
  formModel.Note = '';
}

function openDialog(mode: DialogMode, row: SellRow) {
  dialogMode.value = mode;
  resetForm();
  formModel.AgentId = row.Id;
  formModel.AgentNum = String(row.UserName || '');
  dialogVisible.value = true;
}

function onSellScoresChange(value: string) {
  formModel.AddSellScores = value;
  formModel.AgentGetScores = value;
}

function onReceiptScoresChange(value: string) {
  formModel.AddReceiptScores = value;
  formModel.AgentGetScores = value;
}

function validatePositiveInt(value: string) {
  return /^[1-9]\d*$/.test(value);
}

function submitDialog() {
  const amount =
    dialogMode.value === 'sell'
      ? formModel.AddSellScores
      : formModel.AddReceiptScores;
  if (!validatePositiveInt(amount)) {
    message.error(
      dialogMode.value === 'sell'
        ? '请输入正确的授信金币数量'
        : '请输入正确的追回金币数量',
    );
    // 校验失败时保持弹窗打开（Ant Design Vue @ok 需 reject）
    return Promise.reject(new Error('invalid amount'));
  }

  const payload = {
    AddScores: amount,
    AgentId: formModel.AgentId,
    AgentName: formModel.AgentNum,
    Hash: createRequestHash(),
    ...(dialogMode.value === 'takeBack' ? { Note: formModel.Note } : {}),
  };

  return new Promise<void>((resolve, reject) => {
    Modal.confirm({
      content:
        dialogMode.value === 'sell'
          ? `确认为包网 ${formModel.AgentNum} 授信 ${amount} 金币？`
          : `确认从包网 ${formModel.AgentNum} 追回 ${amount} 金币？`,
      onCancel: () => reject(new Error('cancelled')),
      onOk: async () => {
        saving.value = true;
        try {
          if (dialogMode.value === 'sell') {
            await createGoldSellApi(payload);
            await getUserInfoApi();
          } else {
            await createGoldRefundApi(payload);
          }
          message.success('操作成功');
          dialogVisible.value = false;
          await gridApi.reload();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          saving.value = false;
        }
      },
      title: '提示',
    });
  });
}

function handleSearch() {
  void gridApi.reload();
}

function handleReset() {
  filterUsername.value = '';
  void gridApi.reload();
}

function handleLookRecord(row: SellRow) {
  emit('lookRecord', String(row.UserName || ''));
}
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterUsername"
          allow-clear
          class="!w-[260px]"
          @press-enter="handleSearch"
          placeholder="请输入包网账号"
        >
          <template #addonBefore>包网账号</template>
        </Input>
      </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
        </div>
    </div>
  </div>

    <Grid v-if="canViewTable">
      <template #action="{ row }">
        <div class="flex flex-wrap justify-center gap-1">
          <Button
            v-if="canSell"
            size="small"
            type="primary"
            @click="openDialog('sell', row)"
          >
            金币授信
          </Button>
          <Button
            v-if="canRefund"
            danger
            size="small"
            @click="openDialog('takeBack', row)"
          >
            追回金币
          </Button>
        </div>
      </template>
      <template #lookRecord="{ row }">
        <Button
          v-if="canLookRecord"
          size="small"
          type="primary"
          @click="handleLookRecord(row)"
        >
          授信记录
        </Button>
      </template>
    </Grid>
    <div v-else class="py-8 text-center text-gray-400">无授信列表查看权限</div>

    <Modal
      v-model:open="dialogVisible"
      :confirm-loading="saving"
      :title="dialogTitle"
      destroy-on-close
      @ok="submitDialog"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="包网账号">
          <Input :value="formModel.AgentNum" disabled />
        </Form.Item>

        <template v-if="dialogMode === 'sell'">
          <Form.Item label="授信金币" required>
            <Input
              :value="formModel.AddSellScores"
              placeholder="请输入授信金币"
              @update:value="onSellScoresChange"
            />
          </Form.Item>
          <Form.Item label="我的账户">
            <Input :value="String(myAccountScores)" disabled />
          </Form.Item>
          <Form.Item label="子包网获得金币">
            <Input :value="formModel.AgentGetScores" disabled />
          </Form.Item>
        </template>

        <template v-else>
          <Form.Item label="追回金币" required>
            <Input
              :value="formModel.AddReceiptScores"
              placeholder="请输入追回金币"
              @update:value="onReceiptScoresChange"
            />
          </Form.Item>
          <Form.Item label="追回理由">
            <Input
              v-model:value="formModel.Note"
              placeholder="请输入追回理由"
            />
          </Form.Item>
          <Form.Item label="包网失去金币">
            <Input :value="formModel.AgentGetScores" disabled />
          </Form.Item>
        </template>

        <Form.Item label="操作人员">
          <Input :value="operatorName" disabled />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
