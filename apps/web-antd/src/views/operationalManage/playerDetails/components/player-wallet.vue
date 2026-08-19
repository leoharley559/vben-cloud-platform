<script lang="ts" setup>
import type { PlayerWalletItem } from '#/types/player-detail';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import { createAccountAdjustApi } from '#/api/operationManage/account-adjust';
import {
  fetchPlayerWalletListApi,
  recoverAllPlayerWalletApi,
  recoverPlayerWalletApi,
  updateWalletUnlockWaterApi,
  walletZeroApi,
} from '#/api/operationManage/player';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatVenueName } from '#/utils/game-config';
import SummaryCards from '#/components/global/summary-cards.vue';

defineOptions({ name: 'PlayerWalletPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const canViewTable = computed(() => checkPermission(10437));
const canEditUnlock = computed(() => checkPermission(10440));
const canRecoverOne = computed(() => checkPermission(10439));
const canRecoverAll = computed(() => checkPermission(10434));
const canZero = computed(() => checkPermission(10438));
const canAdjust = computed(() => checkPermission(10435));

const loading = ref(false);
const saving = ref(false);
const walletGold = ref<number | string>(0);
const walletList = ref<PlayerWalletItem[]>([]);
const editOpen = ref(false);
const adjustOpen = ref(false);

const editForm = reactive({
  GameId: '' as number | string,
  UnlockWater: 0 as number,
  gameName: '',
});

const adjustForm = reactive({
  Amount: undefined as number | undefined,
  HandleDesc: '',
  HandleType: 1 as 1 | 2,
  Mail: '',
  Reason: 1 as 1 | 2,
});

const handleTypeOptions = [
  { label: '上分', value: 1 },
  { label: '下分', value: 2 },
];

const reasonOptions = [
  { label: '系统调整', value: 1 },
  { label: '输赢调整', value: 2 },
];

const subWalletTotal = computed(() =>
  walletList.value.reduce((sum, item) => sum + Number(item.Balance || 0), 0),
);

const summaryItems = computed(() => [
  {
    label: '中心钱包总金额',
    value: formatAmountFromCent(walletGold.value),
  },
  {
    label: '场馆钱包总金额',
    value: formatAmountFromCent(subWalletTotal.value),
  },
]);

function venueName(gameId?: number | string) {
  return formatVenueName(gameId, gameConfig.value);
}

const columns = [
  { dataIndex: 'GameId', key: 'GameId', title: '游戏 ID', width: 100 },
  {
    customRender: ({ record }: { record: PlayerWalletItem }) =>
      venueName(record.GameId),
    key: 'venueName',
    title: '场馆名称',
    width: 180,
  },
  {
    dataIndex: 'Balance',
    key: 'Balance',
    title: '子钱包余额',
    width: 140,
  },
  {
    dataIndex: 'UnlockWater',
    key: 'UnlockWater',
    title: '流水要求',
    width: 140,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { key: 'action', title: '操作', width: 220 },
];

async function loadWallet() {
  if (!props.playerId) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchPlayerWalletListApi(props.playerId);
    walletGold.value = result?.Gold ?? 0;
    walletList.value = result?.Items || [];
  } finally {
    loading.value = false;
  }
}

function openEditUnlock(row: PlayerWalletItem) {
  editForm.GameId = row.GameId ?? '';
  editForm.gameName = venueName(row.GameId);
  editForm.UnlockWater = Number(row.UnlockWater || 0) / 100;
  editOpen.value = true;
}

async function submitUnlock() {
  if (!props.playerId || editForm.GameId === '') {
    return;
  }
  if (editForm.UnlockWater < 0) {
    message.warning('流水要求不能为负数');
    return;
  }
  saving.value = true;
  try {
    await updateWalletUnlockWaterApi({
      GameId: editForm.GameId,
      PlayerId: props.playerId,
      UnlockWater: Math.round(editForm.UnlockWater * 100),
    });
    message.success(
      editForm.UnlockWater > 0 ? '已设置冻结流水' : '已解锁（流水要求清零）',
    );
    editOpen.value = false;
    await loadWallet();
  } finally {
    saving.value = false;
  }
}

function handleRecoverOne(row: PlayerWalletItem) {
  if (Number(row.UnlockWater) > 0) {
    message.warning('存在流水要求时不可回收，请先清零流水');
    return;
  }
  Modal.confirm({
    content: `确认回收场馆「${venueName(row.GameId)}」余额到主钱包？`,
    onOk: async () => {
      await recoverPlayerWalletApi({
        GameId: row.GameId as number | string,
        PlayerId: props.playerId,
      });
      message.success('回收成功');
      await loadWallet();
    },
    title: '回收钱包',
  });
}

function handleRecoverAll() {
  Modal.confirm({
    content: '确认回收全部场馆余额到主钱包？存在流水要求的场馆将无法回收。',
    onOk: async () => {
      await recoverAllPlayerWalletApi({ PlayerId: props.playerId });
      message.success('全部回收已提交');
      await loadWallet();
    },
    title: '全部回收',
  });
}

function handleWalletZero(row: PlayerWalletItem) {
  if (Number(row.Balance) >= 0) {
    message.warning('仅余额为负时可清零');
    return;
  }
  Modal.confirm({
    content: `确认将场馆「${venueName(row.GameId)}」负余额清零？`,
    onOk: async () => {
      await walletZeroApi({
        Balance: row.Balance as number | string,
        GameId: row.GameId as number | string,
        PlayerId: props.playerId,
      });
      message.success('清零成功');
      await loadWallet();
    },
    title: '负值清零',
  });
}

function openAdjust() {
  adjustForm.HandleType = 1;
  adjustForm.Reason = 1;
  adjustForm.Amount = undefined;
  adjustForm.HandleDesc = '';
  adjustForm.Mail = '';
  adjustOpen.value = true;
}

async function submitAdjust() {
  if (!props.playerId) {
    return;
  }
  if (!adjustForm.Amount || adjustForm.Amount <= 0) {
    message.warning('请输入正确的调整金额');
    return;
  }
  if (!adjustForm.HandleDesc?.trim()) {
    message.warning('请填写备注');
    return;
  }

  Modal.confirm({
    content: `确认对玩家 ${props.playerId} 调整金额 ${adjustForm.Amount} 元？`,
    onOk: async () => {
      saving.value = true;
      try {
        await createAccountAdjustApi({
          Amount: Math.round(adjustForm.Amount! * 100),
          HandleDesc: adjustForm.HandleDesc.trim(),
          HandleType: adjustForm.HandleType,
          Hash: createRequestHash(),
          Mail: adjustForm.Mail?.trim() || '',
          PlayerId: props.playerId,
          Reason: adjustForm.Reason,
        });
        message.success('调账已提交');
        adjustOpen.value = false;
        await loadWallet();
      } finally {
        saving.value = false;
      }
    },
    title: '确认调账',
  });
}

watch(
  () => props.playerId,
  () => {
    loadWallet();
  },
);

onMounted(async () => {
  await ensureGameConfig();
  loadWallet();
});
</script>

<template>
  <div>
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <SummaryCards class="!mb-0 min-w-0 flex-1" :items="summaryItems" />
      <div class="flex shrink-0 items-center gap-2">
        <Button v-if="canAdjust" type="primary" @click="openAdjust">
          账户调账
        </Button>
        <Button v-if="canRecoverAll" @click="handleRecoverAll">全部回收</Button>
      </div>
    </div>

    <Table
      v-if="canViewTable || walletList.length >= 0"
      bordered
      :columns="columns"
      :data-source="walletList"
      :loading="loading"
      :pagination="false"
      :row-key="(record) => String(record.GameId ?? record.GameName ?? '')"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'Balance'">
          {{ formatAmountFromCent(record.Balance) }}
        </template>
        <template v-else-if="column.key === 'UnlockWater'">
          {{ formatAmountFromCent(record.UnlockWater) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="Number(record.UnlockWater) > 0 ? 'error' : 'success'">
            {{ Number(record.UnlockWater) > 0 ? '冻结' : '正常' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space :size="0">
            <Button
              v-if="canEditUnlock"
              size="small"
              type="link"
              @click="openEditUnlock(record)"
            >
              {{ Number(record.UnlockWater) > 0 ? '改流水/解锁' : '设冻结' }}
            </Button>
            <Button
              v-if="canZero"
              size="small"
              type="link"
              :disabled="Number(record.Balance) >= 0"
              @click="handleWalletZero(record)"
            >
              清零
            </Button>
            <Button
              v-if="canRecoverOne"
              size="small"
              type="link"
              :disabled="Number(record.UnlockWater) > 0"
              @click="handleRecoverOne(record)"
            >
              回收
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑流水要求"
      @ok="submitUnlock"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="场馆名称">
          <span>{{ editForm.gameName }}</span>
        </Form.Item>
        <Form.Item label="流水要求（元）" required>
          <InputNumber
            v-model:value="editForm.UnlockWater"
            :min="0"
            :precision="2"
            class="!w-full"
          />
        </Form.Item>
        <div class="text-xs text-gray-400">
          设为 0 即解锁（状态变为正常）；大于 0 则视为冻结。
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="adjustOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="账户调账"
      @ok="submitAdjust"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="当前余额">
          <span>{{ formatAmountFromCent(walletGold) }}</span>
        </Form.Item>
        <Form.Item label="调整方式" required>
          <Select
            v-model:value="adjustForm.HandleType"
            :options="handleTypeOptions"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="调整类型" required>
          <Select
            v-model:value="adjustForm.Reason"
            :options="reasonOptions"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="调整金额（元）" required>
          <InputNumber
            v-model:value="adjustForm.Amount"
            :min="0.01"
            :precision="2"
            class="!w-full"
            placeholder="请输入金额"
          />
        </Form.Item>
        <Form.Item label="备注" required>
          <Input
            v-model:value="adjustForm.HandleDesc"
            allow-clear
            placeholder="请输入备注"
          />
        </Form.Item>
        <Form.Item label="站内信内容">
          <Input.TextArea
            v-model:value="adjustForm.Mail"
            :rows="3"
            allow-clear
            placeholder="选填，发送给玩家的站内信"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
