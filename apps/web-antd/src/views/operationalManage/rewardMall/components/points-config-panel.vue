<script lang="ts" setup>
import type {
  RewardBetConfigGameRatio,
  RewardBetConfigRow,
  RewardDepositConfigRow,
} from './reward-mall-shared';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  InputNumber,
  message,
  Modal,
  Radio,
  Result,
  Switch,
  Table,
  Tooltip,
} from 'ant-design-vue';

import {
  fetchRewardBetConfigApi,
  fetchRewardDepositConfigApi,
  switchRewardBetConfigApi,
  switchRewardDepositConfigApi,
  updateRewardBetConfigApi,
  updateRewardDepositConfigApi,
} from '#/api/operationManage/reward-mall';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import VoucherRedirectField from '#/views/operationalManage/voucher/components/voucher-redirect-field.vue';
import { REDIRECT_TYPE } from '#/views/operationalManage/voucher/components/voucher-shared';

import {
  centsToYuan,
  ensureVipRows,
  formatPercentFromStorage,
  formatPercentToStorage,
  parseConfigArray,
  yuanToCents,
} from './reward-mall-shared';

defineOptions({ name: 'PointsConfigPanel' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(13_332));

const { ensureGameConfig, gameConfig } = useGameConfig();

/** 存款积分返水 | 投注积分返水 */
const mode = ref<'bet' | 'deposit'>('deposit');

const depositLoading = ref(false);
const betLoading = ref(false);
const savingDeposit = ref(false);
const savingBet = ref(false);

function createDefaultDepositRow(vip: number): RewardDepositConfigRow {
  return { DailyMaxPoint: 0, DailyMinPayment: 0, Vip: vip };
}

function createDefaultBetRow(vip: number): RewardBetConfigRow {
  return {
    DailyMaxPoint: 0,
    DailyMinBet: 0,
    DefaultWater: 0,
    Games: [],
    Vip: vip,
  };
}

/* ==================== 存款积分返水 ==================== */

const depositSwitch = ref(false);
const depositPaymentAmount = ref<number>();
const depositConfig = ref<RewardDepositConfigRow[]>(
  ensureVipRows([], createDefaultDepositRow),
);
const selectedDepositVips = ref<number[]>([]);

async function loadDepositConfig() {
  depositLoading.value = true;
  try {
    const data = (await fetchRewardDepositConfigApi()) as Record<
      string,
      unknown
    >;
    if (data) {
      depositSwitch.value = Boolean(data.Switch);
      depositPaymentAmount.value = centsToYuan(data.PaymentAmount as number);
      const rows = parseConfigArray<RewardDepositConfigRow>(data.Config).map(
        (row) => ({
          ...row,
          DailyMinPayment: centsToYuan(row.DailyMinPayment),
        }),
      );
      depositConfig.value = ensureVipRows(rows, createDefaultDepositRow);
    }
  } finally {
    depositLoading.value = false;
  }
}

function confirmSwitch(turnOn: boolean) {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      content: turnOn ? '确认开启该功能？' : '确认关闭该功能？',
      title: '提示',
      onCancel: () => resolve(false),
      onOk: () => resolve(true),
    });
  });
}

async function onDepositSwitchChange(checked: boolean | number | string) {
  const nextValue = Boolean(checked);
  const confirmed = await confirmSwitch(nextValue);
  if (!confirmed) {
    return;
  }
  try {
    await switchRewardDepositConfigApi({ Switch: nextValue });
    depositSwitch.value = nextValue;
    message.success('操作成功');
  } catch {
    // 保持原状态，错误已在请求拦截器中提示
  }
}

const depositRowSelection = computed(() => ({
  onChange: (keys: (number | string)[]) => {
    selectedDepositVips.value = keys.map(Number);
  },
  selectedRowKeys: selectedDepositVips.value,
}));

const depositEditOpen = ref(false);
const depositEditVips = ref<number[]>([]);
const depositEditForm = reactive({ DailyMaxPoint: 0, DailyMinPayment: 0 });

function openDepositBatchEdit() {
  if (selectedDepositVips.value.length === 0) {
    message.warning('请先选择要批量编辑的 VIP 等级');
    return;
  }
  depositEditVips.value = [...selectedDepositVips.value];
  depositEditForm.DailyMaxPoint = 0;
  depositEditForm.DailyMinPayment = 0;
  depositEditOpen.value = true;
}

function openDepositRowEdit(row: RewardDepositConfigRow) {
  depositEditVips.value = [row.Vip];
  depositEditForm.DailyMaxPoint = row.DailyMaxPoint;
  depositEditForm.DailyMinPayment = row.DailyMinPayment;
  depositEditOpen.value = true;
}

function confirmDepositEdit() {
  if (
    depositEditForm.DailyMaxPoint === undefined ||
    depositEditForm.DailyMaxPoint < 0
  ) {
    message.warning('请输入每日可获积分上限');
    return;
  }
  if (
    depositEditForm.DailyMinPayment === undefined ||
    depositEditForm.DailyMinPayment < 0
  ) {
    message.warning('请输入每日最低存款要求');
    return;
  }
  const vipSet = new Set(depositEditVips.value);
  depositConfig.value = depositConfig.value.map((row) =>
    vipSet.has(row.Vip)
      ? {
          ...row,
          DailyMaxPoint: depositEditForm.DailyMaxPoint,
          DailyMinPayment: depositEditForm.DailyMinPayment,
        }
      : row,
  );
  depositEditOpen.value = false;
  message.success('已应用到所选 VIP 等级，请点击保存生效');
}

async function saveDepositConfig() {
  if (
    depositPaymentAmount.value === undefined ||
    depositPaymentAmount.value < 0
  ) {
    message.warning('请输入存款满多少元可获得1积分');
    return;
  }
  savingDeposit.value = true;
  try {
    const config = depositConfig.value.map((row) => ({
      DailyMaxPoint: row.DailyMaxPoint,
      DailyMinPayment: yuanToCents(row.DailyMinPayment),
      Vip: row.Vip,
    }));
    await updateRewardDepositConfigApi({
      Config: JSON.stringify(config),
      PaymentAmount: yuanToCents(depositPaymentAmount.value),
    });
    message.success('保存成功');
    await loadDepositConfig();
  } finally {
    savingDeposit.value = false;
  }
}

/* ==================== 投注积分返水 ==================== */

const betSwitch = ref(false);
const betType = ref<number>(REDIRECT_TYPE.NONE);
const betJump = ref<number | string>('');
const betConfig = ref<RewardBetConfigRow[]>(
  ensureVipRows([], createDefaultBetRow),
);
const selectedBetVips = ref<number[]>([]);

async function loadBetConfig() {
  betLoading.value = true;
  try {
    const data = (await fetchRewardBetConfigApi()) as Record<string, unknown>;
    if (data) {
      betSwitch.value = Boolean(data.Switch);
      betType.value = Number(data.Type ?? REDIRECT_TYPE.NONE);
      betJump.value = (data.Jump as number | string) ?? '';
      const rows = parseConfigArray<RewardBetConfigRow>(data.Config).map(
        (row) => ({
          ...row,
          DailyMinBet: centsToYuan(row.DailyMinBet),
          Games: Array.isArray(row.Games) ? row.Games : [],
        }),
      );
      betConfig.value = ensureVipRows(rows, createDefaultBetRow);
    }
  } finally {
    betLoading.value = false;
  }
}

async function onBetSwitchChange(checked: boolean | number | string) {
  const nextValue = Boolean(checked);
  const confirmed = await confirmSwitch(nextValue);
  if (!confirmed) {
    return;
  }
  try {
    await switchRewardBetConfigApi({ Switch: nextValue });
    betSwitch.value = nextValue;
    message.success('操作成功');
  } catch {
    // 保持原状态
  }
}

const betRowSelection = computed(() => ({
  onChange: (keys: (number | string)[]) => {
    selectedBetVips.value = keys.map(Number);
  },
  selectedRowKeys: selectedBetVips.value,
}));

const betEditOpen = ref(false);
const betEditVips = ref<number[]>([]);
const betEditForm = reactive({
  DailyMaxPoint: 0 as number | undefined,
  DailyMinBet: 0 as number | undefined,
  DefaultWaterPercent: 100 as number | undefined,
});
const betEditGamesRatio = ref<Record<string, number | undefined>>({});

const gamesList = computed(() =>
  Object.entries(gameConfig.value.games)
    .map(([id, game]) => ({ id: Number(id), name: game.gameName || id }))
    .toSorted((a, b) => a.id - b.id),
);

function openBetBatchEdit() {
  if (selectedBetVips.value.length === 0) {
    message.warning('请先选择要批量编辑的 VIP 等级');
    return;
  }
  betEditVips.value = [...selectedBetVips.value];
  betEditForm.DefaultWaterPercent = 100;
  betEditForm.DailyMaxPoint = 0;
  betEditForm.DailyMinBet = 0;
  betEditGamesRatio.value = {};
  betEditOpen.value = true;
}

function openBetRowEdit(row: RewardBetConfigRow) {
  betEditVips.value = [row.Vip];
  betEditForm.DefaultWaterPercent = Number(
    formatPercentFromStorage(row.DefaultWater) || 0,
  );
  betEditForm.DailyMaxPoint = row.DailyMaxPoint;
  betEditForm.DailyMinBet = row.DailyMinBet;
  betEditGamesRatio.value = Object.fromEntries(
    row.Games.map((game) => [
      String(game.Id),
      Number(formatPercentFromStorage(game.Ratio) || 0),
    ]),
  );
  betEditOpen.value = true;
}

function buildGamesFromForm(): RewardBetConfigGameRatio[] {
  return Object.entries(betEditGamesRatio.value)
    .filter(
      ([, ratio]) =>
        ratio !== undefined && ratio !== null && ratio !== ('' as never),
    )
    .map(([id, ratio]) => ({
      Id: Number(id),
      Ratio: formatPercentToStorage(ratio!),
    }));
}

function confirmBetEdit() {
  if (
    betEditForm.DefaultWaterPercent === undefined ||
    betEditForm.DefaultWaterPercent < 0
  ) {
    message.warning('请输入未设置游戏返水比例');
    return;
  }
  if (
    betEditForm.DailyMaxPoint === undefined ||
    betEditForm.DailyMaxPoint < 1
  ) {
    message.warning('请输入每日可获积分上限');
    return;
  }
  if (betEditForm.DailyMinBet === undefined || betEditForm.DailyMinBet < 0) {
    message.warning('请输入每日最少有效投注要求');
    return;
  }
  const games = buildGamesFromForm();
  const vipSet = new Set(betEditVips.value);
  betConfig.value = betConfig.value.map((row) =>
    vipSet.has(row.Vip)
      ? {
          ...row,
          DailyMaxPoint: betEditForm.DailyMaxPoint!,
          DailyMinBet: betEditForm.DailyMinBet!,
          DefaultWater: formatPercentToStorage(
            betEditForm.DefaultWaterPercent!,
          ),
          Games: games,
        }
      : row,
  );
  betEditOpen.value = false;
  message.success('已应用到所选 VIP 等级，请点击保存生效');
}

async function saveBetConfig() {
  savingBet.value = true;
  try {
    const config = betConfig.value.map((row) => ({
      DailyMaxPoint: row.DailyMaxPoint,
      DailyMinBet: yuanToCents(row.DailyMinBet),
      DefaultWater: row.DefaultWater,
      Games: row.Games,
      Vip: row.Vip,
    }));
    await updateRewardBetConfigApi({
      Config: JSON.stringify(config),
      Jump: betJump.value,
      Type: betType.value,
    });
    message.success('保存成功');
    await loadBetConfig();
  } finally {
    savingBet.value = false;
  }
}

/* ==================== 表格列 ==================== */

const depositColumns = [
  { dataIndex: 'Vip', key: 'Vip', title: 'VIP等级', width: 100 },
  {
    dataIndex: 'DailyMaxPoint',
    key: 'DailyMaxPoint',
    title: '每日可获积分上限',
  },
  {
    dataIndex: 'DailyMinPayment',
    key: 'DailyMinPayment',
    title: '每日最低存款要求(元)',
  },
  { key: 'actions', title: '操作', width: 120 },
];

const betColumns = [
  { dataIndex: 'Vip', key: 'Vip', title: 'VIP等级', width: 100 },
  {
    dataIndex: 'DefaultWater',
    key: 'DefaultWater',
    title: '未设置游戏返水比例',
  },
  {
    dataIndex: 'DailyMaxPoint',
    key: 'DailyMaxPoint',
    title: '每日可获积分上限',
  },
  {
    dataIndex: 'DailyMinBet',
    key: 'DailyMinBet',
    title: '每日最少有效投注要求(元)',
  },
  { dataIndex: 'Games', key: 'Games', title: '游戏返水比例' },
  { key: 'actions', title: '操作', width: 120 },
];

onMounted(() => {
  void ensureGameConfig();
  void loadDepositConfig();
  void loadBetConfig();
});
</script>

<template>
  <div v-if="canView">
    <div class="mb-3">
      <Radio.Group v-model:value="mode" button-style="solid">
        <Radio.Button value="deposit">存款积分返水</Radio.Button>
        <Radio.Button value="bet">投注积分返水</Radio.Button>
      </Radio.Group>
    </div>

    <div v-show="mode === 'deposit'" v-loading="depositLoading">
      <Form layout="inline" class="mb-4 flex flex-wrap items-end gap-4">
        <Form.Item label="存款获取开关">
          <Switch :checked="depositSwitch" @change="onDepositSwitchChange" />
        </Form.Item>
        <Form.Item label="存款满多少元可获得1积分">
          <InputNumber
            v-model:value="depositPaymentAmount"
            :min="0"
            :precision="2"
            style="width: 160px"
          />
          <Tooltip class="ml-2" title="玩家每存款满该金额，即可获得1个积分">
            <span class="cursor-help text-gray-400">?</span>
          </Tooltip>
        </Form.Item>
      </Form>

      <div class="mb-2 flex justify-end">
        <Button
          type="primary"
          :disabled="selectedDepositVips.length === 0"
          @click="openDepositBatchEdit"
        >
          批量编辑
        </Button>
      </div>

      <Table
        :columns="depositColumns"
        :data-source="depositConfig"
        :loading="depositLoading"
        :pagination="false"
        :row-key="(row: RewardDepositConfigRow) => row.Vip"
        :row-selection="depositRowSelection"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'Vip'">VIP{{ record.Vip }}</template>
          <template v-else-if="column.key === 'actions'">
            <Button
              size="small"
              type="link"
              @click="openDepositRowEdit(record as RewardDepositConfigRow)"
            >
              编辑
            </Button>
          </template>
        </template>
      </Table>

      <div class="mt-4 flex justify-center">
        <Button
          type="primary"
          :loading="savingDeposit"
          @click="saveDepositConfig"
        >
          保存
        </Button>
      </div>
    </div>

    <div v-show="mode === 'bet'" v-loading="betLoading">
      <Form layout="inline" class="mb-4 flex flex-wrap items-end gap-4">
        <Form.Item label="投注获取开关">
          <Switch :checked="betSwitch" @change="onBetSwitchChange" />
        </Form.Item>
        <Form.Item label="跳转设置">
          <VoucherRedirectField
            v-model:type="betType"
            v-model:param="betJump"
            :allowed-types="[REDIRECT_TYPE.NONE, REDIRECT_TYPE.VENUE]"
          />
        </Form.Item>
      </Form>

      <div class="mb-2 flex justify-end">
        <Button
          type="primary"
          :disabled="selectedBetVips.length === 0"
          @click="openBetBatchEdit"
        >
          批量编辑
        </Button>
      </div>

      <Table
        :columns="betColumns"
        :data-source="betConfig"
        :loading="betLoading"
        :pagination="false"
        :row-key="(row: RewardBetConfigRow) => row.Vip"
        :row-selection="betRowSelection"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'Vip'">VIP{{ record.Vip }}</template>
          <template v-else-if="column.key === 'DefaultWater'">
            {{ formatPercentFromStorage(record.DefaultWater) || 0 }}%
          </template>
          <template v-else-if="column.key === 'Games'">
            已设置 {{ record.Games?.length || 0 }} 项
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              size="small"
              type="link"
              @click="openBetRowEdit(record as RewardBetConfigRow)"
            >
              编辑
            </Button>
          </template>
        </template>
      </Table>

      <div class="mt-4 flex justify-center">
        <Button type="primary" :loading="savingBet" @click="saveBetConfig">
          保存
        </Button>
      </div>
    </div>

    <Modal
      v-model:open="depositEditOpen"
      title="积分配置"
      @ok="confirmDepositEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="每日可获积分上限" required>
          <InputNumber
            v-model:value="depositEditForm.DailyMaxPoint"
            :min="0"
            :precision="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="每日最低存款要求(元)" required>
          <InputNumber
            v-model:value="depositEditForm.DailyMinPayment"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="betEditOpen"
      title="积分返水配置"
      width="720px"
      @ok="confirmBetEdit"
    >
      <div class="mb-4 font-medium">投注积分返水基础配置</div>
      <Form layout="inline" class="mb-4 flex flex-wrap gap-4">
        <Form.Item label="未设置游戏返水比例" required>
          <InputNumber
            v-model:value="betEditForm.DefaultWaterPercent"
            :min="0"
            :precision="2"
            style="width: 160px"
          >
            <template #addonAfter>%</template>
          </InputNumber>
        </Form.Item>
        <Form.Item label="每日可获积分上限" required>
          <InputNumber
            v-model:value="betEditForm.DailyMaxPoint"
            :min="1"
            :precision="0"
            style="width: 160px"
          />
        </Form.Item>
        <Form.Item label="每日最少有效投注要求(元)" required>
          <InputNumber
            v-model:value="betEditForm.DailyMinBet"
            :min="0"
            :precision="2"
            style="width: 160px"
          />
        </Form.Item>
      </Form>

      <div class="mb-2 font-medium">
        游戏返水比例（未填写的游戏使用上方“未设置游戏返水比例”）
      </div>
      <div class="max-h-80 overflow-y-auto rounded border p-2">
        <div
          v-for="game in gamesList"
          :key="game.id"
          class="flex items-center justify-between gap-4 border-b py-1 last:border-b-0"
        >
          <span class="text-sm">{{ game.name }}（ID: {{ game.id }}）</span>
          <InputNumber
            v-model:value="betEditGamesRatio[String(game.id)]"
            :min="0"
            :precision="2"
            style="width: 160px"
            placeholder="请输入留空则使用默认比例"
          >
            <template #addonAfter>%</template>
          </InputNumber>
        </div>
        <div v-if="gamesList.length === 0" class="py-4 text-center text-gray-400">
          暂无游戏配置数据
        </div>
      </div>
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 13332 才能查看积分设置"
    title="无权限"
  />
</template>
