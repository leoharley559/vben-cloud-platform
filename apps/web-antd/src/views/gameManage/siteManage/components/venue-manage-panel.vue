<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchSiteFeeSwitchListApi,
  updateSiteFeeSwitchApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { findGameIdByApiFee } from '#/utils/game-config';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'VenueManagePanel' });

type SwitchMode = 'switch' | 'walletLock';

interface VenueRow {
  ApiFee?: number | string;
  ApiFeeName?: string;
  GameId?: number | string;
  GameMerchant?: string;
  Id: number | string;
  Info?: string;
  LangText?: string;
  LoginEnableEndTime?: number;
  LoginEnableStartTime?: number;
  LoginStatus?: number;
  OperateName?: string;
  Switch?: number;
  UpdateTime?: string;
  VipLevel?: number | string;
  WalletLock?: number;
  WalletLockEndTime?: number;
  WalletLockStartTime?: number;
  WalletStatus?: number;
}

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const filterName = ref('');
const dialogVisible = ref(false);
const dialogMode = ref<SwitchMode>('switch');
const saving = ref(false);
const timedRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const maintainVisible = ref(false);
const maintainRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const maintainForm = reactive({
  EndTime: 0,
  GameId: '' as number | string,
  Id: '' as number | string,
  Info: '',
  LangText: '',
  StartTime: 0,
  VipLevel: '' as number | string,
  rawSwitch: 1,
  rawWalletLock: 0,
});

const formModel = reactive({
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

const canEdit = computed(() => checkPermission(10951));

const dialogTitle = computed(() =>
  dialogMode.value === 'switch' ? '场馆状态开关' : '钱包状态开关',
);

const showTimedPicker = computed(() =>
  dialogMode.value === 'switch'
    ? formModel.Switch === 3
    : formModel.WalletLock === 3,
);

function venueStatusText(row: VenueRow) {
  if (Number(row.LoginStatus) === 1) {
    return '开启';
  }
  if (Number(row.LoginStatus) === 2) {
    return '关闭';
  }
  return String(row.LoginStatus ?? '-');
}

function walletStatusText(row: VenueRow) {
  // 旧站：0 开 / 1 关
  if (Number(row.WalletStatus) === 0) {
    return '开启';
  }
  if (Number(row.WalletStatus) === 1) {
    return '关闭';
  }
  return String(row.WalletStatus ?? '-');
}

const gridOptions: VxeTableGridOptions<VenueRow> = {
  columns: [
    {
      field: 'LoginStatus',
      slots: { default: 'venueStatus' },
      title: '场馆状态',
      width: 160,
    },
    {
      field: 'WalletStatus',
      slots: { default: 'walletStatus' },
      title: '钱包状态',
      width: 160,
    },
    { field: 'VipLevel', minWidth: 90, title: 'VIP' },
    { field: 'ApiFeeName', minWidth: 140, title: '场馆名称' },
    { field: 'GameMerchant', minWidth: 120, title: '游戏商' },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '操作时间',
    },
    { field: 'OperateName', minWidth: 100, title: '操作人' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '维护',
      width: 100,
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchSiteFeeSwitchListApi({
          ApiFeeName: filterName.value,
          Page: 1,
          PageSize: 200,
        });
        const items = (result.Items || []) as unknown as VenueRow[];
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function buildLangText(row: VenueRow) {
  if (!row.LangText || row.LangText === 'null') {
    return '';
  }
  try {
    const parsed = JSON.parse(row.LangText) as Record<string, unknown>;
    return JSON.stringify(Object.values(parsed));
  } catch {
    return row.LangText;
  }
}

function openSwitch(row: VenueRow, mode: SwitchMode) {
  const gameId =
    row.GameId || findGameIdByApiFee(row.ApiFee, gameConfig.value) || '';
  if (!gameId) {
    message.error('无法解析场馆游戏 ID，请刷新后重试');
    return;
  }

  dialogMode.value = mode;
  formModel.Id = row.Id;
  formModel.GameId = gameId;
  formModel.VipLevel = row.VipLevel ?? '';
  formModel.LangText = buildLangText(row);
  formModel.Switch = Number(row.Switch || row.LoginStatus || 1);
  formModel.WalletLock = Number(
    row.WalletLock ?? (Number(row.WalletStatus) === 0 ? 0 : 1),
  );
  formModel.LoginEnableStartTime = Number(row.LoginEnableStartTime || 0);
  formModel.LoginEnableEndTime = Number(row.LoginEnableEndTime || 0);
  formModel.WalletLockStartTime = Number(row.WalletLockStartTime || 0);
  formModel.WalletLockEndTime = Number(row.WalletLockEndTime || 0);

  if (mode === 'switch' && formModel.Switch === 3) {
    timedRange.value = [
      dayjs.unix(formModel.LoginEnableStartTime),
      dayjs.unix(formModel.LoginEnableEndTime),
    ];
  } else if (mode === 'walletLock' && formModel.WalletLock === 3) {
    timedRange.value = [
      dayjs.unix(formModel.WalletLockStartTime),
      dayjs.unix(formModel.WalletLockEndTime),
    ];
  } else {
    timedRange.value = undefined;
  }

  dialogVisible.value = true;
}

function onSwitchTypeChange() {
  timedRange.value = undefined;
  formModel.LoginEnableStartTime = 0;
  formModel.LoginEnableEndTime = 0;
  formModel.WalletLockStartTime = 0;
  formModel.WalletLockEndTime = 0;
}

function onTimedRangeChange(
  value: [dayjs.Dayjs, dayjs.Dayjs] | [string, string] | null,
) {
  if (!value || !value[0] || !value[1]) {
    timedRange.value = undefined;
    formModel.LoginEnableStartTime = 0;
    formModel.LoginEnableEndTime = 0;
    formModel.WalletLockStartTime = 0;
    formModel.WalletLockEndTime = 0;
    return;
  }
  const start = dayjs(value[0]);
  const end = dayjs(value[1]);
  timedRange.value = [start, end];
  if (dialogMode.value === 'switch') {
    formModel.LoginEnableStartTime = start.unix();
    formModel.LoginEnableEndTime = end.unix();
  } else {
    formModel.WalletLockStartTime = start.unix();
    formModel.WalletLockEndTime = end.unix();
  }
}

async function submitSwitch() {
  if (
    showTimedPicker.value &&
    (!formModel.LoginEnableStartTime || !formModel.LoginEnableEndTime) &&
    dialogMode.value === 'switch'
  ) {
    message.error('请选择定时关闭时间');
    return;
  }
  if (
    showTimedPicker.value &&
    dialogMode.value === 'walletLock' &&
    (!formModel.WalletLockStartTime || !formModel.WalletLockEndTime)
  ) {
    message.error('请选择定时关闭时间');
    return;
  }

  saving.value = true;
  try {
    await updateSiteFeeSwitchApi({
      GameId: formModel.GameId,
      Id: formModel.Id,
      IsEdit: 0,
      LangText: formModel.LangText,
      LoginEnableEndTime: formModel.LoginEnableEndTime,
      LoginEnableStartTime: formModel.LoginEnableStartTime,
      Switch: formModel.Switch,
      VipLevel: formModel.VipLevel,
      WalletLock: formModel.WalletLock,
      WalletLockEndTime: formModel.WalletLockEndTime,
      WalletLockStartTime: formModel.WalletLockStartTime,
    });
    message.success('操作成功');
    dialogVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function openMaintain(row: VenueRow) {
  if (Number(row.LoginStatus) === 1) {
    message.warning('场馆开启状态下不可编辑维护信息');
    return;
  }
  const gameId =
    row.GameId || findGameIdByApiFee(row.ApiFee, gameConfig.value) || '';
  if (!gameId) {
    message.error('无法解析场馆游戏 ID，请刷新后重试');
    return;
  }
  maintainForm.Id = row.Id;
  maintainForm.GameId = gameId;
  maintainForm.VipLevel = row.VipLevel ?? '';
  maintainForm.Info = String(row.Info || '');
  maintainForm.LangText = buildLangText(row);
  maintainForm.rawSwitch = Number(row.Switch || row.LoginStatus || 2);
  maintainForm.rawWalletLock = Number(
    row.WalletLock ?? (Number(row.WalletStatus) === 0 ? 0 : 1),
  );
  const start = Number(
    (row as VenueRow & { StartTime?: number }).StartTime || 0,
  );
  const end = Number((row as VenueRow & { EndTime?: number }).EndTime || 0);
  maintainForm.StartTime = start;
  maintainForm.EndTime = end;
  maintainRange.value =
    start && end ? [dayjs.unix(start), dayjs.unix(end)] : undefined;
  maintainVisible.value = true;
}

function onMaintainRangeChange(
  value: [dayjs.Dayjs, dayjs.Dayjs] | [string, string] | null,
) {
  if (!value || !value[0] || !value[1]) {
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
  saving.value = true;
  try {
    let langText = maintainForm.LangText;
    try {
      const parsed = langText ? JSON.parse(langText) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed[0] = { ...parsed[0], Info: maintainForm.Info };
        langText = JSON.stringify(parsed);
      }
    } catch {
      // keep original
    }
    await updateSiteFeeSwitchApi({
      EndTime: maintainForm.EndTime,
      GameId: maintainForm.GameId,
      Id: maintainForm.Id,
      Info: maintainForm.Info,
      IsEdit: 1,
      LangText: langText,
      StartTime: maintainForm.StartTime,
      Switch: maintainForm.rawSwitch,
      VipLevel: maintainForm.VipLevel,
      WalletLock: maintainForm.rawWalletLock,
    });
    message.success('维护信息已保存');
    maintainVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterName.value = '';
  gridApi.reload();
}

onMounted(async () => {
  await ensureGameConfig();
});
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="filterName"
        allow-clear
        class="!w-[240px]"
        placeholder="场馆名称"
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
    </div>

    <Grid>
      <template #venueStatus="{ row }">
        <div class="flex items-center justify-center gap-2">
          <Tag :color="Number(row.LoginStatus) === 1 ? 'success' : 'error'">
            {{ venueStatusText(row) }}
          </Tag>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openSwitch(row, 'switch')"
          >
            设置
          </Button>
        </div>
      </template>
      <template #walletStatus="{ row }">
        <div class="flex items-center justify-center gap-2">
          <Tag :color="Number(row.WalletStatus) === 0 ? 'success' : 'error'">
            {{ walletStatusText(row) }}
          </Tag>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openSwitch(row, 'walletLock')"
          >
            设置
          </Button>
        </div>
      </template>
      <template #action="{ row }">
        <Button
          v-if="canEdit"
          size="small"
          :disabled="Number(row.LoginStatus) === 1"
          @click="openMaintain(row)"
        >
          维护
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="dialogVisible"
      :confirm-loading="saving"
      :title="dialogTitle"
      destroy-on-close
      @ok="submitSwitch"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item v-if="dialogMode === 'switch'" label="开关状态">
          <Radio.Group
            v-model:value="formModel.Switch"
            @change="onSwitchTypeChange"
          >
            <Radio :value="1">开启</Radio>
            <Radio :value="2">立即关闭</Radio>
            <Radio :value="3">定时关闭</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item v-else label="开关状态">
          <Radio.Group
            v-model:value="formModel.WalletLock"
            @change="onSwitchTypeChange"
          >
            <Radio :value="0">开启</Radio>
            <Radio :value="1">立即关闭</Radio>
            <Radio :value="3">定时关闭</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item v-if="showTimedPicker" label="定时关闭时间">
          <DatePicker.RangePicker
            v-model:value="timedRange"
            show-time
            class="w-full"
            @change="onTimedRangeChange"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="maintainVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="维护信息"
      @ok="submitMaintain"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="VIP 等级">
          <Input
            :value="String(maintainForm.VipLevel ?? '')"
            placeholder="VIP 等级"
            @update:value="(v) => (maintainForm.VipLevel = v)"
          />
        </Form.Item>
        <Form.Item label="维护显示时间">
          <DatePicker.RangePicker
            v-model:value="maintainRange"
            show-time
            class="w-full"
            @change="onMaintainRangeChange"
          />
        </Form.Item>
        <Form.Item label="维护显示内容">
          <Input.TextArea
            v-model:value="maintainForm.Info"
            :rows="4"
            placeholder="请输入维护提示"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
