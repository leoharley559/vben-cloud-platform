<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createBackWaterHandApi,
  fetchBackWaterHandListApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatGameName, formatPercentFromStorage } from '#/utils/game-config';

defineOptions({ name: 'BackWaterHandPanel' });

interface VenueRow {
  DaysDelay?: number;
  DaysOfCycle?: number;
  DayOfWeeks?: string;
  GameType?: number | string;
  Rate?: number;
  RebateMode?: number;
  SubGameId?: number | string;
  Water?: number;
  BackWater?: number;
}

interface HandInfo {
  BackWater?: number | string;
  BackWaterMax?: number | string;
  BackedWater?: number | string;
  Data?: VenueRow[];
  GameName?: string;
  InvalidWater?: number | string;
  LevelName?: string;
  LoginAccount?: string;
  NotAward?: number | string;
  PlayerId?: number | string;
  ReadyAward?: number | string;
  SchemeName?: string;
  VipLevel?: number | string;
  Water?: number | string;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canIssue = computed(() => checkPermission(11_090));

const loading = ref(false);
const saving = ref(false);
const issueOpen = ref(false);
const playerInfo = ref<HandInfo | null>(null);

const query = reactive({
  LoginAccount: '',
  PackageName: '',
  Time: dayjs().subtract(1, 'day') as Dayjs,
});

const issueForm = reactive({
  Desc: '',
  Water: undefined as number | undefined,
});

const packageSelectOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageName,
    })),
);

const venueColumns = [
  {
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'index',
    title: '序号',
    width: 60,
  },
  {
    customRender: ({ record }: { record: VenueRow }) =>
      gameConfig.value.platformGameType[String(record.GameType)] ||
      String(record.GameType ?? '-'),
    key: 'venue',
    title: '场馆',
  },
  {
    customRender: ({ record }: { record: VenueRow }) =>
      formatGameName(record.SubGameId, gameConfig.value.games),
    key: 'game',
    title: '游戏',
  },
  {
    customRender: ({ record }: { record: VenueRow }) =>
      formatRebateMode(record),
    key: 'cycle',
    title: '结算周期',
  },
  {
    customRender: ({ record }: { record: VenueRow }) =>
      formatAmountFromCent(record.Water),
    key: 'water',
    title: '流水',
  },
  {
    customRender: ({ record }: { record: VenueRow }) =>
      `${formatPercentFromStorage(record.Rate)}%`,
    key: 'rate',
    title: '比例',
  },
  {
    customRender: ({ record }: { record: VenueRow }) =>
      formatAmountFromCent(record.BackWater),
    key: 'back',
    title: '返水',
  },
];

function formatRebateMode(row: VenueRow) {
  const mode = Number(row.RebateMode);
  if (mode === 1) {
    return `按天 / ${row.DaysOfCycle || 0}+${row.DaysDelay || 0}`;
  }
  if (mode === 2) {
    return `周结 / 星期${row.DayOfWeeks || '-'}`;
  }
  return '日结';
}

function rebateModeColor(mode?: number) {
  if (Number(mode) === 1) return 'processing';
  if (Number(mode) === 2) return 'warning';
  return 'success';
}

function toCent(value: number) {
  return Math.round(Number((value * 100).toFixed(0)));
}

async function handleQuery() {
  if (!query.LoginAccount.trim()) {
    message.warning('请输入游戏账号');
    return;
  }
  if (!query.PackageName) {
    message.warning('请选择产品包');
    return;
  }
  if (!query.Time) {
    message.warning('请选择发放日期');
    return;
  }

  loading.value = true;
  try {
    await ensureGameConfig();
    const data = await fetchBackWaterHandListApi({
      LoginAccount: query.LoginAccount.trim().toLowerCase(),
      PackageName: query.PackageName,
      Time: query.Time.startOf('day').unix(),
    });
    playerInfo.value = (data || {}) as HandInfo;
    if (!playerInfo.value.PlayerId) {
      message.warning('未查询到返水数据');
    }
  } catch {
    playerInfo.value = null;
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  query.LoginAccount = '';
  query.PackageName = packageSelectOptions.value[0]?.value || '';
  query.Time = dayjs().subtract(1, 'day');
  playerInfo.value = null;
}

function openIssue() {
  if (!playerInfo.value?.PlayerId) {
    message.warning('请先查询玩家返水');
    return;
  }
  issueForm.Water = undefined;
  issueForm.Desc = '';
  issueOpen.value = true;
}

async function submitIssue() {
  if (!playerInfo.value?.PlayerId || !query.Time) {
    return;
  }
  if (!issueForm.Water || issueForm.Water <= 0) {
    message.warning('请输入发放金额');
    return;
  }
  saving.value = true;
  try {
    await createBackWaterHandApi({
      Desc: issueForm.Desc,
      PlayerId: playerInfo.value.PlayerId,
      Time: query.Time.startOf('day').unix(),
      Water: toCent(issueForm.Water),
    });
    message.success('发放成功');
    issueOpen.value = false;
    await handleQuery();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  query.PackageName = packageSelectOptions.value[0]?.value || '';
  void ensureGameConfig();
});
</script>

<template>
  <div>
    <Form layout="inline" class="mb-4 flex flex-wrap gap-2">
      <Form.Item label="游戏账号">
        <Input
          v-model:value="query.LoginAccount"
          allow-clear
          placeholder="可按游戏账号查询"
          style="width: 180px"
          @press-enter="handleQuery"
        />
      </Form.Item>
      <Form.Item label="产品包">
        <Select
          v-model:value="query.PackageName"
          :options="packageSelectOptions"
          placeholder="请选择"
          style="width: 180px"
        />
      </Form.Item>
      <Form.Item label="发放日期">
        <DatePicker
          v-model:value="query.Time"
          :disabled-date="
            (date) =>
              Boolean(
                date &&
                  date.startOf('day').isAfter(dayjs().startOf('day')),
              )
          "
          style="width: 160px"
        />
      </Form.Item>
      <Form.Item>
        <Button :loading="loading" type="primary" @click="handleQuery">
          查询返水
        </Button>
        <Button class="ml-2" @click="handleReset">重置</Button>
      </Form.Item>
    </Form>

    <div v-if="playerInfo?.PlayerId" class="mb-4">
      <div class="mb-2 font-medium">基本信息</div>
      <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        <Input
          :value="String(playerInfo.LoginAccount || query.LoginAccount || '-')"
          addon-before="游戏账号"
          disabled
        />
        <Input
          :value="String(playerInfo.VipLevel ?? '-')"
          addon-before="VIP等级"
          disabled
        />
        <Input
          :value="String(playerInfo.LevelName || '-')"
          addon-before="玩家层级"
          disabled
        />
        <Input
          :value="String(playerInfo.GameName || '-')"
          addon-before="所属游戏"
          disabled
        />
        <Input
          :value="String(playerInfo.SchemeName || '-')"
          addon-before="返水方案"
          disabled
        />
        <Input
          :value="formatAmountFromCent(playerInfo.Water)"
          addon-before="有效流水"
          disabled
        />
        <Input
          :value="formatAmountFromCent(playerInfo.InvalidWater)"
          addon-before="无效流水"
          disabled
        />
        <Input
          :value="formatAmountFromCent(playerInfo.BackWater)"
          addon-before="应发返水"
          disabled
        />
        <Input
          :value="formatAmountFromCent(playerInfo.BackedWater)"
          addon-before="已发返水"
          disabled
        />
        <Input
          :value="formatAmountFromCent(playerInfo.BackWaterMax)"
          addon-before="周期返水上限"
          disabled
        />
        <Input
          :value="formatAmountFromCent(playerInfo.ReadyAward)"
          addon-before="待发放"
          disabled
        />
        <Input
          :value="formatAmountFromCent(playerInfo.NotAward)"
          addon-before="未发放"
          disabled
        />
      </div>

      <div class="mb-2 mt-4 flex items-center justify-between">
        <span class="font-medium">流水明细</span>
        <Button
          v-if="canIssue"
          type="primary"
          :disabled="!playerInfo.PlayerId"
          @click="openIssue"
        >
          发放
        </Button>
      </div>
      <Table
        :columns="venueColumns"
        :data-source="playerInfo.Data || []"
        :loading="loading"
        :pagination="false"
        :row-key="(row) => `venue-${row.GameId ?? row.GameType ?? row.Name ?? JSON.stringify(row)}`"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cycle'">
            <Tag :color="rebateModeColor(record.RebateMode)">
              {{ formatRebateMode(record) }}
            </Tag>
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">总计</Table.Summary.Cell>
              <Table.Summary.Cell :index="1">-</Table.Summary.Cell>
              <Table.Summary.Cell :index="2">-</Table.Summary.Cell>
              <Table.Summary.Cell :index="3">-</Table.Summary.Cell>
              <Table.Summary.Cell :index="4">-</Table.Summary.Cell>
              <Table.Summary.Cell :index="5">-</Table.Summary.Cell>
              <Table.Summary.Cell :index="6">
                {{ formatAmountFromCent(playerInfo.BackWater) }}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </div>
    <div v-else class="py-10 text-center text-gray-400">
      请输入账号、产品包与日期后查询
    </div>

    <Modal
      v-model:open="issueOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="手动发放返水"
      @ok="submitIssue"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="发放金额" required>
          <InputNumber
            v-model:value="issueForm.Water"
            :min="0"
            :precision="2"
            class="!w-full"
            placeholder="单位：元"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="issueForm.Desc" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
