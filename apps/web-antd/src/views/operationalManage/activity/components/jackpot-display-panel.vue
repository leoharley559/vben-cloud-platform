<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  TimePicker,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { fetchHotSubGameListApi } from '#/api/gameManage';
import {
  fetchJackpotConfigApi,
  updateJackpotConfigApi,
} from '#/api/operationManage/jackpot';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';

defineOptions({ name: 'JackpotDisplayPanel' });

interface TimeRow {
  IntervalTime: number;
  TimeRange: [string, string];
}

interface GameRow {
  BonusRange: [number, number];
  ContinuousCount: number;
  HotSubGameId?: number;
  Index?: number;
}

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const canEdit = computed(() => checkPermission(12657));

const loading = ref(false);
const saving = ref(false);
const section = ref<'display' | 'venue' | 'winning'>('display');
const fullConfig = ref<Record<string, unknown>>({});
const hotGameOptions = ref<Array<{ label: string; value: number }>>([]);

const displayForm = reactive({
  BaseAmt: 0,
  DownHrFrom: 0,
  DownHrTo: 0,
  FinalAmt: 0,
  IsOpen: false,
  MaxDecrease: 0,
  MaxIncrease: 0,
  MinDecrease: 0,
  MinIncrease: 0,
  UpTimeFrom: 0,
  UpTimeTo: 0,
});

const venueForm = reactive({
  ShowGoldGameIds: [] as string[],
  ShowGoldPlayerNameCharacter: 0,
  ShowGoldPlayerNameMax: 0,
  ShowGoldPlayerNameMin: 0,
  ShowGoldRangeMax: 0,
  ShowGoldRangeMin: 0,
  ShowGoldRefreshTime: 0,
});

const winningForm = reactive({
  BigWinPlayerNameCharacter: 0,
  BigWinPlayerNameMax: 0,
  BigWinPlayerNameMin: 0,
});

const timeRows = ref<TimeRow[]>([]);
const gameRows = ref<GameRow[]>([]);

const timeDialogOpen = ref(false);
const gameDialogOpen = ref(false);
const editTimeIndex = ref(-1);
const editGameIndex = ref(-1);
const timeDraft = reactive({
  IntervalTime: 30,
  TimeRange: null as null | [Dayjs, Dayjs],
});
const gameDraft = reactive({
  BonusMax: 1000,
  BonusMin: 10,
  ContinuousCount: 1,
  HotSubGameId: undefined as number | undefined,
});

const venueGameOptions = computed(() => {
  const list = Object.entries(gameConfig.value.games)
    .filter(
      ([, game]) => Number(game.resType) === 8 || Number(game.resType) === 0,
    )
    .map(([id, game]) => ({
      label: game.gameName || id,
      value: id,
    }));
  if (list.length) {
    return list;
  }
  return Object.entries(gameConfig.value.games).map(([id, game]) => ({
    label: game.gameName || id,
    value: id,
  }));
});

const hotGameNameMap = computed(() => {
  const map: Record<string, string> = {};
  for (const item of hotGameOptions.value) {
    map[String(item.value)] = item.label;
  }
  return map;
});

const timeColumns = [
  {
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'index',
    title: '序号',
    width: 70,
  },
  {
    customRender: ({ record }: { record: TimeRow }) =>
      `${record.TimeRange?.[0] || '-'} ~ ${record.TimeRange?.[1] || '-'}`,
    key: 'time',
    title: '中奖时间',
  },
  { dataIndex: 'IntervalTime', key: 'IntervalTime', title: '间隔(秒)' },
  { key: 'action', title: '操作', width: 160 },
];

const gameColumns = [
  {
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'index',
    title: '序号',
    width: 70,
  },
  {
    customRender: ({ record }: { record: GameRow }) =>
      hotGameNameMap.value[String(record.HotSubGameId)] ||
      String(record.HotSubGameId ?? '-'),
    key: 'game',
    title: '热门游戏',
  },
  {
    customRender: ({ record }: { record: GameRow }) =>
      `${record.BonusRange?.[0] ?? '-'} ~ ${record.BonusRange?.[1] ?? '-'}`,
    key: 'bonus',
    title: '金额区间',
  },
  {
    dataIndex: 'ContinuousCount',
    key: 'ContinuousCount',
    title: '连中次数',
  },
  { key: 'action', title: '操作', width: 160 },
];

function resolveConfig(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    return {};
  }
  const payload = data as { Items?: Record<string, unknown> };
  if (
    payload.Items &&
    typeof payload.Items === 'object' &&
    !Array.isArray(payload.Items)
  ) {
    return payload.Items;
  }
  return data as Record<string, unknown>;
}

function parseJsonArray<T>(value: unknown): T[] {
  if (!value || value === 'null') {
    return [];
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseGameIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function assignForms(source: Record<string, unknown>) {
  displayForm.BaseAmt = Number(source.BaseAmt || 0);
  displayForm.FinalAmt = Number(source.FinalAmt || 0);
  displayForm.MinIncrease = Number(source.MinIncrease || 0);
  displayForm.MaxIncrease = Number(source.MaxIncrease || 0);
  displayForm.UpTimeFrom = Number(source.UpTimeFrom || 0);
  displayForm.UpTimeTo = Number(source.UpTimeTo || 0);
  displayForm.DownHrFrom = Number(source.DownHrFrom || 0);
  displayForm.DownHrTo = Number(source.DownHrTo || 0);
  displayForm.MinDecrease = Number(source.MinDecrease || 0);
  displayForm.MaxDecrease = Number(source.MaxDecrease || 0);
  displayForm.IsOpen = Boolean(source.IsOpen);

  venueForm.ShowGoldRangeMin = Number(source.ShowGoldRangeMin || 0);
  venueForm.ShowGoldRangeMax = Number(source.ShowGoldRangeMax || 0);
  venueForm.ShowGoldRefreshTime = Number(source.ShowGoldRefreshTime || 0);
  venueForm.ShowGoldPlayerNameMin = Number(source.ShowGoldPlayerNameMin || 0);
  venueForm.ShowGoldPlayerNameMax = Number(source.ShowGoldPlayerNameMax || 0);
  venueForm.ShowGoldPlayerNameCharacter = Number(
    source.ShowGoldPlayerNameCharacter || 0,
  );
  venueForm.ShowGoldGameIds = parseGameIds(source.ShowGoldGameIds);

  winningForm.BigWinPlayerNameMin = Number(source.BigWinPlayerNameMin || 0);
  winningForm.BigWinPlayerNameMax = Number(source.BigWinPlayerNameMax || 0);
  winningForm.BigWinPlayerNameCharacter = Number(
    source.BigWinPlayerNameCharacter || 0,
  );
  timeRows.value = parseJsonArray<TimeRow>(source.BigWinTimeSetting);
  gameRows.value = parseJsonArray<GameRow>(source.BigWinGameSetting);
}

async function loadHotGames() {
  try {
    const data = await fetchHotSubGameListApi();
    const items = data?.Items || [];
    hotGameOptions.value = items
      .filter((item) => item.SubGameId !== undefined)
      .map((item) => ({
        label: String(item.Name || item.SubGameId),
        value: Number(item.SubGameId),
      }));
  } catch {
    hotGameOptions.value = [];
  }
}

async function loadConfig() {
  loading.value = true;
  try {
    await ensureGameConfig();
    const data = await fetchJackpotConfigApi();
    fullConfig.value = resolveConfig(data);
    assignForms(fullConfig.value);
  } finally {
    loading.value = false;
  }
}

function validatePositiveRange(min: number, max: number, label: string) {
  if (min <= 0 || max <= 0) {
    message.warning(`${label}需为正数`);
    return false;
  }
  if (min > max) {
    message.warning(`${label}最小值不能大于最大值`);
    return false;
  }
  return true;
}

async function saveConfig(patch: Record<string, unknown>) {
  saving.value = true;
  try {
    const payload = { ...fullConfig.value, ...patch };
    await updateJackpotConfigApi(payload);
    message.success('保存成功');
    await loadConfig();
  } finally {
    saving.value = false;
  }
}

async function handleSaveDisplay() {
  if (
    !validatePositiveRange(
      displayForm.MinIncrease,
      displayForm.MaxIncrease,
      '滚动增加金额',
    ) ||
    !validatePositiveRange(
      displayForm.UpTimeFrom,
      displayForm.UpTimeTo,
      '刷新时间',
    ) ||
    !validatePositiveRange(
      displayForm.DownHrFrom,
      displayForm.DownHrTo,
      '放奖天数',
    ) ||
    !validatePositiveRange(
      displayForm.MinDecrease,
      displayForm.MaxDecrease,
      '大奖金额',
    )
  ) {
    return;
  }
  await saveConfig({ ...displayForm });
}

async function handleSwitch(checked: boolean) {
  displayForm.IsOpen = checked;
  await saveConfig({ ...displayForm });
}

async function handleSaveVenue() {
  if (
    !validatePositiveRange(
      venueForm.ShowGoldRangeMin,
      venueForm.ShowGoldRangeMax,
      '显示金额',
    ) ||
    !validatePositiveRange(
      venueForm.ShowGoldPlayerNameMin,
      venueForm.ShowGoldPlayerNameMax,
      '玩家名称长度',
    )
  ) {
    return;
  }
  if (venueForm.ShowGoldRefreshTime <= 0) {
    message.warning('刷新时间需为正数');
    return;
  }
  if (venueForm.ShowGoldPlayerNameCharacter <= 0) {
    message.warning('未脱敏字符数需为正数');
    return;
  }
  await saveConfig({
    ShowGoldGameIds: venueForm.ShowGoldGameIds.join(','),
    ShowGoldPlayerNameCharacter: venueForm.ShowGoldPlayerNameCharacter,
    ShowGoldPlayerNameMax: venueForm.ShowGoldPlayerNameMax,
    ShowGoldPlayerNameMin: venueForm.ShowGoldPlayerNameMin,
    ShowGoldRangeMax: venueForm.ShowGoldRangeMax,
    ShowGoldRangeMin: venueForm.ShowGoldRangeMin,
    ShowGoldRefreshTime: venueForm.ShowGoldRefreshTime,
  });
}

async function handleSaveWinning() {
  if (
    !validatePositiveRange(
      winningForm.BigWinPlayerNameMin,
      winningForm.BigWinPlayerNameMax,
      '玩家名称长度',
    )
  ) {
    return;
  }
  if (winningForm.BigWinPlayerNameCharacter <= 0) {
    message.warning('未脱敏字符数需为正数');
    return;
  }
  await saveConfig({
    BigWinGameSetting: JSON.stringify(
      gameRows.value.map((row, index) => ({ ...row, Index: index + 1 })),
    ),
    BigWinPlayerNameCharacter: winningForm.BigWinPlayerNameCharacter,
    BigWinPlayerNameMax: winningForm.BigWinPlayerNameMax,
    BigWinPlayerNameMin: winningForm.BigWinPlayerNameMin,
    BigWinTimeSetting: JSON.stringify(timeRows.value),
  });
}

function openAddTime() {
  editTimeIndex.value = -1;
  timeDraft.IntervalTime = 30;
  timeDraft.TimeRange = [dayjs('12:00', 'HH:mm'), dayjs('13:00', 'HH:mm')];
  timeDialogOpen.value = true;
}

function openEditTime(row: TimeRow, index: number) {
  editTimeIndex.value = index;
  timeDraft.IntervalTime = Number(row.IntervalTime || 30);
  timeDraft.TimeRange = [
    dayjs(row.TimeRange?.[0] || '12:00', 'HH:mm'),
    dayjs(row.TimeRange?.[1] || '13:00', 'HH:mm'),
  ];
  timeDialogOpen.value = true;
}

async function submitTimeDraft() {
  if (!timeDraft.TimeRange?.[0] || !timeDraft.TimeRange?.[1]) {
    message.warning('请选择中奖时间');
    return;
  }
  if (timeDraft.IntervalTime < 30) {
    message.warning('中奖间隔至少 30 秒');
    return;
  }
  const next: TimeRow = {
    IntervalTime: timeDraft.IntervalTime,
    TimeRange: [
      timeDraft.TimeRange[0].format('HH:mm'),
      timeDraft.TimeRange[1].format('HH:mm'),
    ],
  };
  const list = [...timeRows.value];
  if (editTimeIndex.value >= 0) {
    list[editTimeIndex.value] = next;
  } else {
    list.push(next);
  }
  timeRows.value = list;
  timeDialogOpen.value = false;
  await handleSaveWinning();
}

function removeTime(index: number) {
  Modal.confirm({
    content: '确认删除该中奖时间？',
    onOk: async () => {
      timeRows.value = timeRows.value.filter((_, i) => i !== index);
      await handleSaveWinning();
    },
    title: '删除',
  });
}

function openAddGame() {
  editGameIndex.value = -1;
  gameDraft.HotSubGameId = undefined;
  gameDraft.BonusMin = 10;
  gameDraft.BonusMax = 1000;
  gameDraft.ContinuousCount = 1;
  gameDialogOpen.value = true;
}

function openEditGame(row: GameRow, index: number) {
  editGameIndex.value = index;
  gameDraft.HotSubGameId = row.HotSubGameId
    ? Number(row.HotSubGameId)
    : undefined;
  gameDraft.BonusMin = Number(row.BonusRange?.[0] || 10);
  gameDraft.BonusMax = Number(row.BonusRange?.[1] || 1000);
  gameDraft.ContinuousCount = Number(row.ContinuousCount || 1);
  gameDialogOpen.value = true;
}

async function submitGameDraft() {
  if (!gameDraft.HotSubGameId) {
    message.warning('请选择热门游戏');
    return;
  }
  if (
    !validatePositiveRange(gameDraft.BonusMin, gameDraft.BonusMax, '金额区间')
  ) {
    return;
  }
  if (gameDraft.ContinuousCount < 1) {
    message.warning('连中次数至少为 1');
    return;
  }
  const next: GameRow = {
    BonusRange: [gameDraft.BonusMin, gameDraft.BonusMax],
    ContinuousCount: gameDraft.ContinuousCount,
    HotSubGameId: gameDraft.HotSubGameId,
  };
  const list = [...gameRows.value];
  if (editGameIndex.value >= 0) {
    list[editGameIndex.value] = next;
  } else {
    list.push(next);
  }
  gameRows.value = list;
  gameDialogOpen.value = false;
  await handleSaveWinning();
}

function removeGame(index: number) {
  Modal.confirm({
    content: '确认删除该游戏配置？',
    onOk: async () => {
      gameRows.value = gameRows.value.filter((_, i) => i !== index);
      await handleSaveWinning();
    },
    title: '删除',
  });
}

onMounted(() => {
  void loadConfig();
  void loadHotGames();
});
</script>

<template>
  <Spin :spinning="loading">
    <div class="mb-3">
      <Radio.Group v-model:value="section" button-style="solid">
        <Radio.Button value="display">大奖显示设置</Radio.Button>
        <Radio.Button value="venue">场馆奖金列表</Radio.Button>
        <Radio.Button value="winning">连中大奖设置</Radio.Button>
      </Radio.Group>
    </div>

    <div v-show="section === 'display'">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <span class="text-sm text-gray-500">APP/H5 开关</span>
        <Switch
          :checked="displayForm.IsOpen"
          :disabled="!canEdit || saving"
          checked-children="开"
          un-checked-children="关"
          @change="(checked) => handleSwitch(!!checked)"
        />
      </div>
      <Form
        class="max-w-xl"
        :label-col="{ style: { width: '160px' } }"
        label-align="left"
      >
        <Form.Item label="滚动金额实时数据">
          <div class="text-lg font-semibold text-blue-600">
            {{ displayForm.FinalAmt.toLocaleString('en-US') }}
          </div>
        </Form.Item>
        <Form.Item label="启动大奖数值">
          <Input
            :value="String(displayForm.BaseAmt)"
            disabled
            style="max-width: 160px"
          />
        </Form.Item>
        <Form.Item label="滚动增加金额区间" required>
          <div class="flex items-center gap-2">
            <InputNumber
              v-model:value="displayForm.MinIncrease"
              :min="1"
              class="!w-28"
            />
            <span>~</span>
            <InputNumber
              v-model:value="displayForm.MaxIncrease"
              :min="1"
              class="!w-28"
            />
          </div>
        </Form.Item>
        <Form.Item label="刷新时间区间" required>
          <div class="flex items-center gap-2">
            <InputNumber
              v-model:value="displayForm.UpTimeFrom"
              :min="1"
              class="!w-28"
            />
            <span>~</span>
            <InputNumber
              v-model:value="displayForm.UpTimeTo"
              :min="1"
              class="!w-28"
            />
            <span class="text-gray-400">秒</span>
          </div>
        </Form.Item>
        <Form.Item label="大奖放奖天数区间" required>
          <div class="flex items-center gap-2">
            <InputNumber
              v-model:value="displayForm.DownHrFrom"
              :min="1"
              class="!w-28"
            />
            <span>~</span>
            <InputNumber
              v-model:value="displayForm.DownHrTo"
              :min="1"
              class="!w-28"
            />
            <span class="text-gray-400">小时</span>
          </div>
        </Form.Item>
        <Form.Item label="大奖金额区间" required>
          <div class="flex items-center gap-2">
            <InputNumber
              v-model:value="displayForm.MinDecrease"
              :min="1"
              class="!w-28"
            />
            <span>~</span>
            <InputNumber
              v-model:value="displayForm.MaxDecrease"
              :min="1"
              class="!w-28"
            />
          </div>
        </Form.Item>
        <Form.Item>
          <Button
            v-if="canEdit"
            :loading="saving"
            type="primary"
            @click="handleSaveDisplay"
          >
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>

    <div v-show="section === 'venue'">
      <Form layout="vertical" class="max-w-3xl">
        <div class="mb-3 flex flex-wrap gap-4">
          <Form.Item label="显示金额区间" required>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model:value="venueForm.ShowGoldRangeMin"
                :min="1"
                class="!w-28"
              />
              <span>~</span>
              <InputNumber
                v-model:value="venueForm.ShowGoldRangeMax"
                :min="1"
                class="!w-28"
              />
            </div>
          </Form.Item>
          <Form.Item label="刷新时间(秒)" required>
            <InputNumber
              v-model:value="venueForm.ShowGoldRefreshTime"
              :min="1"
              class="!w-28"
            />
          </Form.Item>
        </div>
        <div class="mb-3 flex flex-wrap gap-4">
          <Form.Item label="玩家名称长度区间" required>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model:value="venueForm.ShowGoldPlayerNameMin"
                :min="1"
                class="!w-28"
              />
              <span>~</span>
              <InputNumber
                v-model:value="venueForm.ShowGoldPlayerNameMax"
                :min="1"
                class="!w-28"
              />
            </div>
          </Form.Item>
          <Form.Item label="未脱敏字符数" required>
            <InputNumber
              v-model:value="venueForm.ShowGoldPlayerNameCharacter"
              :min="1"
              class="!w-28"
            />
          </Form.Item>
        </div>
        <Form.Item label="游戏场馆">
          <Select
            v-model:value="venueForm.ShowGoldGameIds"
            allow-clear
            mode="multiple"
            :options="venueGameOptions"
            option-filter-prop="label"
            placeholder="选择场馆"
            show-search
            style="width: 100%"
          />
        </Form.Item>
        <Button
          v-if="canEdit"
          :loading="saving"
          type="primary"
          @click="handleSaveVenue"
        >
          保存
        </Button>
      </Form>
    </div>

    <div v-show="section === 'winning'">
      <Form layout="vertical" class="mb-4 max-w-3xl">
        <div class="flex flex-wrap gap-4">
          <Form.Item label="玩家名称长度区间" required>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model:value="winningForm.BigWinPlayerNameMin"
                :min="1"
                class="!w-28"
              />
              <span>~</span>
              <InputNumber
                v-model:value="winningForm.BigWinPlayerNameMax"
                :min="1"
                class="!w-28"
              />
            </div>
          </Form.Item>
          <Form.Item label="未脱敏字符数" required>
            <InputNumber
              v-model:value="winningForm.BigWinPlayerNameCharacter"
              :min="1"
              class="!w-28"
            />
          </Form.Item>
        </div>
      </Form>

      <div class="mb-2 flex items-center justify-between">
        <span class="font-medium">中奖时间</span>
        <Button v-if="canEdit" size="small" type="primary" @click="openAddTime">
          添加时间
        </Button>
      </div>
      <Table
        :columns="timeColumns"
        :data-source="timeRows"
        :pagination="false"
        :row-key="(_, index) => `time-${index}`"
        size="small"
        class="mb-6"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'action'">
            <Space v-if="canEdit">
              <Button
                size="small"
                type="link"
                @click="openEditTime(record as TimeRow, index)"
              >
                编辑
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="removeTime(index)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div class="mb-2 flex items-center justify-between">
        <span class="font-medium">游戏设置</span>
        <Button v-if="canEdit" size="small" type="primary" @click="openAddGame">
          添加游戏
        </Button>
      </div>
      <Table
        :columns="gameColumns"
        :data-source="gameRows"
        :pagination="false"
        :row-key="(_, index) => `game-${index}`"
        size="small"
        class="mb-4"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'action'">
            <Space v-if="canEdit">
              <Button
                size="small"
                type="link"
                @click="openEditGame(record as GameRow, index)"
              >
                编辑
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="removeGame(index)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <Button
        v-if="canEdit"
        :loading="saving"
        type="primary"
        @click="handleSaveWinning"
      >
        保存连中设置
      </Button>
    </div>

    <Modal
      v-model:open="timeDialogOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="editTimeIndex >= 0 ? '编辑中奖时间' : '添加中奖时间'"
      @ok="submitTimeDraft"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="中奖时间" required>
          <TimePicker.RangePicker
            v-model:value="timeDraft.TimeRange"
            format="HH:mm"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="间隔(秒)" required>
          <InputNumber
            v-model:value="timeDraft.IntervalTime"
            :min="30"
            class="!w-full"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="gameDialogOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="editGameIndex >= 0 ? '编辑游戏' : '添加游戏'"
      @ok="submitGameDraft"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="热门游戏" required>
          <Select
            v-model:value="gameDraft.HotSubGameId"
            :options="hotGameOptions"
            option-filter-prop="label"
            placeholder="选择热门游戏"
            show-search
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="金额区间" required>
          <div class="flex items-center gap-2">
            <InputNumber
              v-model:value="gameDraft.BonusMin"
              :min="1"
              class="!w-28"
            />
            <span>~</span>
            <InputNumber
              v-model:value="gameDraft.BonusMax"
              :min="1"
              class="!w-28"
            />
          </div>
        </Form.Item>
        <Form.Item label="连中次数" required>
          <InputNumber
            v-model:value="gameDraft.ContinuousCount"
            :min="1"
            class="!w-full"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Spin>
</template>
