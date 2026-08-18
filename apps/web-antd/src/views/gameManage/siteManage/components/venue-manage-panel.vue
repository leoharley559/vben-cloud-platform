<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { preferences } from '@vben/preferences';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Tabs,
  Tag,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchSiteFeeSwitchListApi,
  updateSiteFeeSwitchApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { findGameIdByApiFee, formatVenueName } from '#/utils/game-config';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'VenueManagePanel' });

type SwitchMode = 'switch' | 'walletLock';

interface VenueRow {
  ApiFee?: number | string;
  ApiFeeName?: string;
  EndTime?: number;
  GameId?: number | string;
  GameMerchant?: string;
  Id: number | string;
  Info?: string;
  LangText?: string;
  LoginEnableEndTime?: number;
  LoginEnableStartTime?: number;
  LoginStatus?: number;
  OperateName?: string;
  StartTime?: number;
  Switch?: number;
  UpdateTime?: number | string;
  VipLevel?: number | string;
  WalletLock?: number;
  WalletLockEndTime?: number;
  WalletLockStartTime?: number;
  WalletStatus?: number;
}

interface LangEntry {
  Info: string;
  LangGroupId: number | string;
  [key: string]: unknown;
}

const { checkPermission, projectConfig } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const filterName = ref('');
const saving = ref(false);
const switchVisible = ref(false);
const switchMode = ref<SwitchMode>('switch');
const switchRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const maintainVisible = ref(false);
const maintainRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const langVisible = ref(false);
const langActiveKey = ref('');
const langRows = reactive<Record<string, LangEntry>>({});
const langSourceRow = ref<VenueRow>();

const switchForm = reactive({
  GameId: '' as number | string,
  Id: '' as number | string,
  LangText: '',
  LoginEnableEndTime: 0,
  LoginEnableStartTime: 0,
  Switch: 1,
  VipLevel: '' as number | string,
  WalletLock: 0,
  WalletLockEndTime: 0,
  WalletLockStartTime: 0,
});
const maintainForm = reactive({
  EndTime: 0,
  GameId: '' as number | string,
  Id: '' as number | string,
  Info: '',
  LangText: '',
  StartTime: 0,
  Switch: 2,
  VipLevel: '' as number | string,
  WalletLock: 0,
});

const canMaintain = computed(() => checkPermission(10_951));
const langGroups = computed(() =>
  (projectConfig.value?.LangGroup || []).filter((group) => {
    const item = group as Record<string, unknown>;
    return item.IsActive !== false && item.IsOpen !== false;
  }),
);
const defaultLangGroupId = computed(
  () =>
    langGroups.value.find((group) => group.Default)?.Id ??
    langGroups.value[0]?.Id ??
    1,
);
const currentLangGroupId = computed(() => {
  const locale = String(preferences.app.locale || '')
    .replaceAll('_', '-')
    .toLowerCase();
  const matched = langGroups.value.find((group) => {
    const languages = Array.isArray(group.Languages)
      ? group.Languages
      : String(group.Languages || '').split(',');
    return languages.some(
      (language) =>
        String(language).replaceAll('_', '-').toLowerCase() === locale,
    );
  });
  return matched?.Id ?? defaultLangGroupId.value;
});
const vipOptions = computed(() => {
  const config = projectConfig.value as
    | null
    | {
        VIPLevelMap?: Array<{
          VipLevelId: number | string;
          VipLevelName: string;
        }>;
      };
  return config?.VIPLevelMap || [];
});
const showTimedPicker = computed(() =>
  switchMode.value === 'switch'
    ? switchForm.Switch === 3
    : switchForm.WalletLock === 3,
);
const switchTitle = computed(() =>
  switchMode.value === 'switch' ? '场馆状态开关' : '钱包状态开关',
);

function parseLangMap(raw?: string) {
  const map: Record<string, LangEntry> = {};
  if (raw && raw !== 'null') {
    try {
      const parsed = JSON.parse(raw) as
        | Array<Record<string, unknown>>
        | Record<string, Record<string, unknown>>;
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const id = item.LangGroupId ?? item.Id;
          if (id !== undefined) {
            map[String(id)] = {
              ...item,
              Info: String(item.Info || ''),
              LangGroupId: id as number | string,
            };
          }
        });
      } else {
        Object.entries(parsed).forEach(([key, item]) => {
          const id = item.LangGroupId ?? item.Id ?? key;
          map[String(id)] = {
            ...item,
            Info: String(item.Info || ''),
            LangGroupId: id as number | string,
          };
        });
      }
    } catch {
      // Invalid legacy content is replaced by active language groups below.
    }
  }
  langGroups.value.forEach((group) => {
    map[String(group.Id)] ||= { Info: '', LangGroupId: group.Id };
  });
  if (Object.keys(map).length === 0) {
    map[String(defaultLangGroupId.value)] = {
      Info: '',
      LangGroupId: defaultLangGroupId.value,
    };
  }
  return map;
}

function serializeLangMap(map: Record<string, LangEntry>) {
  return JSON.stringify(Object.values(map));
}

function venueName(row: VenueRow) {
  return (
    row.ApiFeeName || formatVenueName(row.ApiFee, gameConfig.value)
  );
}

/** 本环境 list 常无 LoginStatus，回退 Switch（1开/2关/3定时）。 */
function effectiveLoginStatus(row: VenueRow) {
  if (row.LoginStatus !== undefined && row.LoginStatus !== null) {
    return Number(row.LoginStatus);
  }
  return Number(row.Switch || 0);
}

/** 本环境 list 常无 WalletStatus，回退 WalletLock（0开/1关/3定时）。 */
function effectiveWalletStatus(row: VenueRow) {
  if (row.WalletStatus !== undefined && row.WalletStatus !== null) {
    return Number(row.WalletStatus);
  }
  const lock = Number(row.WalletLock);
  if (lock === 0) return 0;
  return 1;
}

function isVenueOpen(row: VenueRow) {
  return effectiveLoginStatus(row) === 1;
}

function displayInfo(row: VenueRow) {
  if (row.Info) return row.Info;
  return parseLangMap(row.LangText)[String(currentLangGroupId.value)]?.Info || '';
}

function venueStatusText(row: VenueRow) {
  const status = effectiveLoginStatus(row);
  if (status === 1) return '开启';
  if (status === 2 || status === 3) return '关闭';
  return String(row.LoginStatus ?? row.Switch ?? '-');
}

function walletStatusText(row: VenueRow) {
  const status = effectiveWalletStatus(row);
  if (status === 0) return '开启';
  if (status === 1) return '关闭';
  return String(row.WalletStatus ?? row.WalletLock ?? '-');
}

function timeRangeText(start?: number, end?: number) {
  if (!start || !end) return '-';
  return `${formatOperationDateTime(start)} - ${formatOperationDateTime(end)}`;
}

const columns: VxeTableGridOptions<VenueRow>['columns'] = [
  { type: 'seq', title: '序号', width: 60 },
  {
    field: 'LoginStatus',
    slots: { default: 'venueStatus' },
    title: '场馆状态',
    width: 150,
  },
  {
    field: 'WalletStatus',
    slots: { default: 'walletStatus' },
    title: '钱包状态',
    width: 150,
  },
  { field: 'VipLevel', minWidth: 90, title: 'VIP' },
  {
    field: 'ApiFee',
    minWidth: 150,
    slots: { default: 'venueName' },
    title: '场馆名称',
  },
  { field: 'GameMerchant', minWidth: 120, title: '游戏商' },
  {
    field: 'maintenanceTime',
    minWidth: 280,
    slots: { default: 'maintenanceTime' },
    title: '维护显示时间',
  },
  {
    field: 'Info',
    minWidth: 220,
    showOverflow: 'tooltip',
    slots: { default: 'maintenanceContent' },
    title: '维护显示内容',
  },
  {
    field: 'UpdateTime',
    formatter: ({ cellValue }) => formatOperationDateTime(cellValue as string),
    minWidth: 170,
    title: '操作时间',
  },
  { field: 'OperateName', minWidth: 110, title: '操作人' },
  {
    field: 'language',
    slots: { default: 'language' },
    title: '多语言设置',
    visible: langGroups.value.length > 1,
    width: 120,
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    visible: canMaintain.value,
    width: 90,
  },
];

const gridOptions: VxeTableGridOptions<VenueRow> = {
  columns,
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        await ensureGameConfig();
        const result = await fetchSiteFeeSwitchListApi({
          ApiFeeName: filterName.value,
          Page: 1,
          PageSize: 9999,
        });
        const items = (result.Items || []) as unknown as VenueRow[];
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function gameIdFor(row: VenueRow) {
  return row.GameId || findGameIdByApiFee(row.ApiFee, gameConfig.value) || '';
}

function openSwitch(row: VenueRow, mode: SwitchMode) {
  const gameId = gameIdFor(row);
  if (!gameId) {
    message.error('无法解析场馆游戏 ID，请刷新后重试');
    return;
  }
  const langMap = parseLangMap(row.LangText);
  Object.assign(switchForm, {
    GameId: gameId,
    Id: row.Id,
    LangText: serializeLangMap(langMap),
    LoginEnableEndTime: Number(row.LoginEnableEndTime || 0),
    LoginEnableStartTime: Number(row.LoginEnableStartTime || 0),
    Switch: Number(row.Switch || row.LoginStatus || 1),
    VipLevel: row.VipLevel ?? '',
    WalletLock: Number(
      row.WalletLock ?? (Number(row.WalletStatus) === 0 ? 0 : 1),
    ),
    WalletLockEndTime: Number(row.WalletLockEndTime || 0),
    WalletLockStartTime: Number(row.WalletLockStartTime || 0),
  });
  switchMode.value = mode;
  const start =
    mode === 'switch'
      ? switchForm.LoginEnableStartTime
      : switchForm.WalletLockStartTime;
  const end =
    mode === 'switch'
      ? switchForm.LoginEnableEndTime
      : switchForm.WalletLockEndTime;
  switchRange.value = start && end ? [dayjs.unix(start), dayjs.unix(end)] : undefined;
  switchVisible.value = true;
}

function resetSwitchTime() {
  switchRange.value = undefined;
  if (switchMode.value === 'switch') {
    switchForm.LoginEnableStartTime = 0;
    switchForm.LoginEnableEndTime = 0;
  } else {
    switchForm.WalletLockStartTime = 0;
    switchForm.WalletLockEndTime = 0;
  }
}

function changeSwitchRange(
  value: [dayjs.Dayjs, dayjs.Dayjs] | [string, string] | null,
) {
  if (!value?.[0] || !value[1]) {
    resetSwitchTime();
    return;
  }
  const start = dayjs(value[0]);
  const end = dayjs(value[1]);
  switchRange.value = [start, end];
  if (switchMode.value === 'switch') {
    switchForm.LoginEnableStartTime = start.unix();
    switchForm.LoginEnableEndTime = end.unix();
  } else {
    switchForm.WalletLockStartTime = start.unix();
    switchForm.WalletLockEndTime = end.unix();
  }
}

async function submitSwitch() {
  if (showTimedPicker.value && !switchRange.value) {
    message.warning('请选择定时关闭时间');
    return;
  }
  saving.value = true;
  try {
    await updateSiteFeeSwitchApi({ ...switchForm, IsEdit: 0 });
    message.success('操作成功');
    switchVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function openMaintain(row: VenueRow) {
  if (isVenueOpen(row)) {
    message.warning('场馆开启状态下不可编辑维护信息');
    return;
  }
  const gameId = gameIdFor(row);
  if (!gameId) {
    message.error('无法解析场馆游戏 ID，请刷新后重试');
    return;
  }
  const langMap = parseLangMap(row.LangText);
  const current = langMap[String(currentLangGroupId.value)];
  Object.assign(maintainForm, {
    EndTime: Number(row.EndTime || 0),
    GameId: gameId,
    Id: row.Id,
    Info: String(current?.Info || row.Info || ''),
    LangText: serializeLangMap(langMap),
    StartTime: Number(row.StartTime || 0),
    Switch: Number(row.Switch || row.LoginStatus || 2),
    VipLevel: row.VipLevel ?? '',
    WalletLock: Number(
      row.WalletLock ?? (Number(row.WalletStatus) === 0 ? 0 : 1),
    ),
  });
  maintainRange.value =
    maintainForm.StartTime && maintainForm.EndTime
      ? [
          dayjs.unix(maintainForm.StartTime),
          dayjs.unix(maintainForm.EndTime),
        ]
      : undefined;
  maintainVisible.value = true;
}

function changeMaintainRange(
  value: [dayjs.Dayjs, dayjs.Dayjs] | [string, string] | null,
) {
  if (!value?.[0] || !value[1]) {
    maintainRange.value = undefined;
    maintainForm.StartTime = 0;
    maintainForm.EndTime = 0;
    return;
  }
  const start = dayjs(value[0]);
  const end = dayjs(value[1]);
  maintainRange.value = [start, end];
  maintainForm.StartTime = start.unix();
  maintainForm.EndTime = end.unix();
}

async function submitMaintain() {
  const map = parseLangMap(maintainForm.LangText);
  const key = String(currentLangGroupId.value);
  map[key] = {
    ...(map[key] || { LangGroupId: currentLangGroupId.value }),
    Info: maintainForm.Info,
  };
  saving.value = true;
  try {
    await updateSiteFeeSwitchApi({
      ...maintainForm,
      IsEdit: 1,
      LangText: serializeLangMap(map),
    });
    message.success('维护信息已保存');
    maintainVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function openLanguage(row: VenueRow) {
  if (isVenueOpen(row)) {
    message.warning('场馆开启状态下不可编辑多语言维护信息');
    return;
  }
  Object.keys(langRows).forEach((key) => delete langRows[key]);
  Object.assign(langRows, parseLangMap(row.LangText));
  langSourceRow.value = row;
  langActiveKey.value = String(
    langGroups.value[0]?.Id ?? defaultLangGroupId.value,
  );
  langVisible.value = true;
}

function languageLabel(group: Record<string, unknown>) {
  return String(group.Name || `语言组 ${group.Id}`);
}

async function submitLanguage() {
  if (!langSourceRow.value) return;
  const gameId = gameIdFor(langSourceRow.value);
  if (!gameId) {
    message.error('无法解析场馆游戏 ID');
    return;
  }
  saving.value = true;
  try {
    await updateSiteFeeSwitchApi({
      ...langSourceRow.value,
      GameId: gameId,
      IsEdit: 1,
      LangText: serializeLangMap(langRows),
    });
    message.success('多语言维护信息已保存');
    langVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleSearch() {
  void gridApi.reload();
}

function handleReset() {
  filterName.value = '';
  void gridApi.reload();
}
</script>

<template>
  <div>
    <div class="query-panel">
      <div class="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterName"
            allow-clear
            class="!w-[280px]"
            @press-enter="handleSearch"
            style="width: 220px"
            placeholder="请输入场馆名称"
          >
            <template #addonBefore>场馆名称</template>
          </Input>
        </div>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>
    </div>

    <div class="venue-grid">
      <Grid>
        <template #venueStatus="{ row }">
          <Space :size="4">
            <Tag :color="isVenueOpen(row) ? 'green' : 'red'">
              {{ venueStatusText(row) }}
            </Tag>
            <Tag v-if="Number(row.Switch) === 3" color="blue">定时</Tag>
            <Button size="small" type="link" @click="openSwitch(row, 'switch')">
              设置
            </Button>
          </Space>
        </template>
        <template #walletStatus="{ row }">
          <Space :size="4">
            <Tag :color="effectiveWalletStatus(row) === 0 ? 'green' : 'red'">
              {{ walletStatusText(row) }}
            </Tag>
            <Tag v-if="Number(row.WalletLock) === 3" color="blue">定时</Tag>
            <Button
              size="small"
              type="link"
              @click="openSwitch(row, 'walletLock')"
            >
              设置
            </Button>
          </Space>
        </template>
        <template #venueName="{ row }">{{ venueName(row) }}</template>
        <template #maintenanceTime="{ row }">
          {{ timeRangeText(row.StartTime, row.EndTime) }}
        </template>
        <template #maintenanceContent="{ row }">
          {{ displayInfo(row) || '-' }}
        </template>
        <template #language="{ row }">
          <Button
            size="small"
            type="link"
            :disabled="isVenueOpen(row)"
            @click="openLanguage(row)"
          >
            设置
          </Button>
        </template>
        <template #action="{ row }">
          <Button
            v-if="canMaintain"
            size="small"
            type="link"
            :disabled="isVenueOpen(row)"
            @click="openMaintain(row)"
          >
            编辑
          </Button>
        </template>
      </Grid>
    </div>

    <Modal
      v-model:open="switchVisible"
      :confirm-loading="saving"
      destroy-on-close
      :title="switchTitle"
      @ok="submitSwitch"
    >
      <Form class="pt-3" layout="vertical">
        <Form.Item label="开关状态">
          <Radio.Group
            v-if="switchMode === 'switch'"
            v-model:value="switchForm.Switch"
            @change="resetSwitchTime"
          >
            <Radio :value="1">开启</Radio>
            <Radio :value="2">立即关闭</Radio>
            <Radio :value="3">定时关闭</Radio>
          </Radio.Group>
          <Radio.Group
            v-else
            v-model:value="switchForm.WalletLock"
            @change="resetSwitchTime"
          >
            <Radio :value="0">开启</Radio>
            <Radio :value="1">立即关闭</Radio>
            <Radio :value="3">定时关闭</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item v-if="showTimedPicker" label="定时关闭时间" required>
          <QueryDatetimeRangePicker v-model="switchRange" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="maintainVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑场馆维护信息"
      @ok="submitMaintain"
    >
      <Form class="pt-3" layout="vertical">
        <Form.Item label="VIP 等级">
          <Select
            v-model:value="maintainForm.VipLevel"
            allow-clear
            :field-names="{ label: 'VipLevelName', value: 'VipLevelId' }"
            :options="vipOptions"
            placeholder="请选择 VIP 等级"
          />
        </Form.Item>
        <Form.Item label="维护显示时间">
          <QueryDatetimeRangePicker v-model="maintainRange" />
        </Form.Item>
        <Form.Item label="维护显示内容">
          <Input.TextArea
            v-model:value="maintainForm.Info"
            :maxlength="500"
            placeholder="请输入维护提示"
            :rows="5"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="langVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="多语言设置"
      width="680px"
      @ok="submitLanguage"
    >
      <Tabs v-model:active-key="langActiveKey" class="pt-3">
        <Tabs.TabPane
          v-for="group in langGroups"
          :key="String(group.Id)"
          :tab="languageLabel(group)"
        >
          <Form layout="vertical">
            <Form.Item label="维护显示内容">
              <Input.TextArea
                v-if="langRows[String(group.Id)]"
                v-model:value="langRows[String(group.Id)]!.Info"
                :maxlength="500"
                :rows="5"
                show-count
              />
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  </div>
</template>

<style scoped>
.query-panel {
  padding: 18px;
  margin-bottom: 18px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.venue-grid {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}
</style>
