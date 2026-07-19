<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Switch,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createLeaderboardApi,
  fetchLeaderboardByIdApi,
  updateLeaderboardApi,
} from '#/api/operationManage/leaderboard';
import { useCloudPlatformStore } from '#/store/cloud-platform';

import {
  LEADERBOARD_TYPE,
  LEADERBOARD_TYPE_OPTIONS,
  parseJsonField,
  parseLangTextMap,
  resolveLeaderboardTitle,
} from './leaderboard-shared';

defineOptions({ name: 'LeaderboardUpsertModal' });

type UpsertMode = 'add' | 'clone' | 'edit';

const props = defineProps<{
  leaderboardId?: number | string;
  mode?: UpsertMode;
}>();

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const cloudStore = useCloudPlatformStore();
const loading = ref(false);
const saving = ref(false);
const rawDetail = ref<Record<string, unknown>>({});

const form = reactive({
  ActivityEndTime: undefined as dayjs.Dayjs | undefined,
  ActivityStartTime: undefined as dayjs.Dayjs | undefined,
  ActivityType: LEADERBOARD_TYPE.BET as number,
  MinimumBet: 0,
  MinimumDeposit: 0,
  MinimumFriendsInvited: 0,
  MinimumProfit: 0,
  NumParticipants: 50,
  Title: '',
  VipLevel: 0,
});

const requirementEnabled = reactive({
  bet: false,
  depo: false,
  invites: false,
  profit: false,
});

const typeOptions = computed(() =>
  LEADERBOARD_TYPE_OPTIONS.filter((item) => item.value !== ''),
);

const modalTitle = computed(() => {
  if (props.mode === 'clone') {
    return '克隆排行榜活动';
  }
  if (props.mode === 'edit') {
    return '编辑排行榜活动';
  }
  return '新增排行榜活动';
});

function defaultLangTextArray(title = '') {
  const groups = cloudStore.projectConfig?.LangGroup || [];
  if (!groups.length) {
    return [{ Icon: '', IsActive: true, LangGroupId: 1, Title: title }];
  }
  return groups.map((group) => ({
    Icon: '',
    IsActive: true,
    LangGroupId: group.Id,
    Title: title,
  }));
}

function buildDefaultPayload() {
  const participants = Number(form.NumParticipants) || 50;
  return {
    ActivityEndTime: form.ActivityEndTime?.format('YYYY-MM-DD') || '',
    ActivityStartTime: form.ActivityStartTime?.format('YYYY-MM-DD') || '',
    ActivityType: form.ActivityType,
    DrawWaterSrctp: JSON.stringify({
      WithdrawWaterGameType: 0,
      WithdrawWaterGames: [],
      WithdrawWaterGamesPlatform: [],
    }),
    ExInfo: JSON.stringify({ LeaderBoardRules: [] }),
    InvalidChannels: '',
    InvalidPackages: '',
    InvalidPlayerTagIds: '',
    InviteRequireBindAccount: false,
    InviteRequireMinDeposit: false,
    LangText: JSON.stringify(defaultLangTextArray(form.Title.trim())),
    LeaderBoardRewards: JSON.stringify([
      {
        DrawWater: 1,
        Gold: 100,
        LangText: defaultLangTextArray(''),
        Points: 0,
        RankingEnd: participants,
        RankingStart: 1,
        RewardType: 0,
        VoucherUid: 0,
      },
    ]),
    MinimumBet: requirementEnabled.bet ? Number(form.MinimumBet) || 0 : 0,
    MinimumDeposit: requirementEnabled.depo
      ? Number(form.MinimumDeposit) || 0
      : 0,
    MinimumFriendsInvited: requirementEnabled.invites
      ? Number(form.MinimumFriendsInvited) || 0
      : 0,
    MinimumProfit: requirementEnabled.profit
      ? Number(form.MinimumProfit) || 0
      : 0,
    NumParticipants: participants,
    ValidChannels: '',
    ValidPackages: '',
    ValidPlayerTagIds: '',
    VenueParticipation: '',
    VenueParticipationSelection: 0,
    VenueParticipationType: '',
    VipLevel: Number(form.VipLevel) || 0,
  };
}

function resetForm() {
  form.ActivityType = LEADERBOARD_TYPE.BET;
  form.ActivityStartTime = dayjs().startOf('day');
  form.ActivityEndTime = dayjs().add(7, 'day').startOf('day');
  form.NumParticipants = 50;
  form.Title = '';
  form.VipLevel = 0;
  form.MinimumBet = 0;
  form.MinimumDeposit = 0;
  form.MinimumProfit = 0;
  form.MinimumFriendsInvited = 0;
  requirementEnabled.bet = false;
  requirementEnabled.depo = false;
  requirementEnabled.profit = false;
  requirementEnabled.invites = false;
  rawDetail.value = {};
}

function applyDetail(data: Record<string, unknown>) {
  rawDetail.value = { ...data };
  form.ActivityType = Number(data.ActivityType || LEADERBOARD_TYPE.BET);
  form.ActivityStartTime = data.ActivityStartTime
    ? dayjs(String(data.ActivityStartTime))
    : undefined;
  form.ActivityEndTime = data.ActivityEndTime
    ? dayjs(String(data.ActivityEndTime))
    : undefined;
  form.NumParticipants = Number(data.NumParticipants || 50);
  form.VipLevel = Number(data.VipLevel || 0);
  form.Title =
    resolveLeaderboardTitle(data.LangText) || String(data.Title || '');
  form.MinimumBet = Number(data.MinimumBet || 0);
  form.MinimumDeposit = Number(data.MinimumDeposit || 0);
  form.MinimumProfit = Number(data.MinimumProfit || 0);
  form.MinimumFriendsInvited = Number(data.MinimumFriendsInvited || 0);
  requirementEnabled.bet = form.MinimumBet > 0;
  requirementEnabled.depo = form.MinimumDeposit > 0;
  requirementEnabled.profit = form.MinimumProfit > 0;
  requirementEnabled.invites = form.MinimumFriendsInvited > 0;
}

async function loadDetail() {
  if (!props.leaderboardId) {
    resetForm();
    return;
  }
  loading.value = true;
  try {
    const data = await fetchLeaderboardByIdApi(props.leaderboardId);
    if (data) {
      applyDetail(data);
    }
  } finally {
    loading.value = false;
  }
}

function buildSubmitPayload() {
  const participants = Number(form.NumParticipants) || 50;
  const langTextMap = parseLangTextMap(rawDetail.value.LangText);
  const langTextArray = Object.keys(langTextMap).length
    ? Object.entries(langTextMap).map(([langGroupId, item]) => ({
        ...item,
        LangGroupId: Number(langGroupId),
        Title: form.Title.trim() || item.Title || '',
      }))
    : defaultLangTextArray(form.Title.trim());

  const rewards = parseJsonField<Record<string, unknown>[]>(
    rawDetail.value.LeaderBoardRewards,
    [
      {
        DrawWater: 1,
        Gold: 100,
        Points: 0,
        RankingEnd: participants,
        RankingStart: 1,
        RewardType: 0,
        VoucherUid: 0,
      },
    ],
  );
  if (rewards.length) {
    rewards[rewards.length - 1] = {
      ...rewards[rewards.length - 1],
      RankingEnd: participants,
    };
  }

  const payload: Record<string, unknown> = {
    ...rawDetail.value,
    ActivityEndTime: form.ActivityEndTime?.format('YYYY-MM-DD') || '',
    ActivityStartTime: form.ActivityStartTime?.format('YYYY-MM-DD') || '',
    ActivityType: form.ActivityType,
    DrawWaterSrctp: JSON.stringify(
      parseJsonField(rawDetail.value.DrawWaterSrctp, {
        WithdrawWaterGameType: 0,
        WithdrawWaterGames: [],
        WithdrawWaterGamesPlatform: [],
      }),
    ),
    ExInfo: JSON.stringify(
      parseJsonField(rawDetail.value.ExInfo, { LeaderBoardRules: [] }),
    ),
    LangText: JSON.stringify(langTextArray),
    LeaderBoardRewards: JSON.stringify(rewards),
    MinimumBet: requirementEnabled.bet ? Number(form.MinimumBet) || 0 : 0,
    MinimumDeposit: requirementEnabled.depo
      ? Number(form.MinimumDeposit) || 0
      : 0,
    MinimumFriendsInvited: requirementEnabled.invites
      ? Number(form.MinimumFriendsInvited) || 0
      : 0,
    MinimumProfit: requirementEnabled.profit
      ? Number(form.MinimumProfit) || 0
      : 0,
    NumParticipants: participants,
    VipLevel: Number(form.VipLevel) || 0,
  };

  if (props.mode === 'add' || props.mode === 'clone') {
    delete payload.Id;
  } else if (rawDetail.value.Id !== undefined) {
    payload.Id = rawDetail.value.Id;
  }
  return payload;
}

async function handleSubmit() {
  if (!form.Title.trim()) {
    message.warning('请输入活动标题');
    return;
  }
  if (!form.ActivityStartTime || !form.ActivityEndTime) {
    message.warning('请选择活动时间');
    return;
  }
  if (!form.NumParticipants || form.NumParticipants < 1) {
    message.warning('请输入参与人数');
    return;
  }

  saving.value = true;
  try {
    const payload =
      props.mode === 'add' && !props.leaderboardId
        ? buildDefaultPayload()
        : buildSubmitPayload();
    if (props.mode === 'edit') {
      await updateLeaderboardApi(payload);
    } else {
      await createLeaderboardApi(payload);
    }
    message.success('保存成功');
    open.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

watch(
  () => [open.value, props.leaderboardId, props.mode],
  ([visible]) => {
    if (!visible) {
      return;
    }
    if (props.mode === 'add' && !props.leaderboardId) {
      resetForm();
      return;
    }
    void loadDetail();
  },
);
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="saving"
    :title="modalTitle"
    destroy-on-close
    width="720px"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <Form class="mt-2" layout="vertical">
        <Form.Item label="活动类型" required>
          <Select
            v-model:value="form.ActivityType"
            :disabled="mode === 'edit'"
            :options="typeOptions"
          />
        </Form.Item>
        <Form.Item label="活动标题" required>
          <Input
            v-model:value="form.Title"
            allow-clear
            placeholder="默认语言标题"
          />
        </Form.Item>
        <div class="grid grid-cols-2 gap-3">
          <Form.Item label="开始时间" required>
            <DatePicker v-model:value="form.ActivityStartTime" class="w-full" />
          </Form.Item>
          <Form.Item label="结束时间" required>
            <DatePicker v-model:value="form.ActivityEndTime" class="w-full" />
          </Form.Item>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <Form.Item label="排行榜人数" required>
            <InputNumber
              v-model:value="form.NumParticipants"
              :min="1"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="最低参与 VIP">
            <InputNumber
              v-model:value="form.VipLevel"
              :min="0"
              class="w-full"
            />
          </Form.Item>
        </div>

        <Form.Item
          v-if="form.ActivityType === LEADERBOARD_TYPE.BET"
          label="最低有效投注"
        >
          <div class="flex items-center gap-3">
            <Switch v-model:checked="requirementEnabled.bet" />
            <InputNumber
              v-model:value="form.MinimumBet"
              :disabled="!requirementEnabled.bet"
              :min="0"
              class="w-full"
            />
          </div>
        </Form.Item>
        <Form.Item
          v-if="form.ActivityType === LEADERBOARD_TYPE.DEPO"
          label="最低存款"
        >
          <div class="flex items-center gap-3">
            <Switch v-model:checked="requirementEnabled.depo" />
            <InputNumber
              v-model:value="form.MinimumDeposit"
              :disabled="!requirementEnabled.depo"
              :min="0"
              class="w-full"
            />
          </div>
        </Form.Item>
        <Form.Item
          v-if="form.ActivityType === LEADERBOARD_TYPE.PROFIT"
          label="最低盈利"
        >
          <div class="flex items-center gap-3">
            <Switch v-model:checked="requirementEnabled.profit" />
            <InputNumber
              v-model:value="form.MinimumProfit"
              :disabled="!requirementEnabled.profit"
              :min="0"
              class="w-full"
            />
          </div>
        </Form.Item>
        <Form.Item
          v-if="form.ActivityType === LEADERBOARD_TYPE.INVITES"
          label="最低邀请人数"
        >
          <div class="flex items-center gap-3">
            <Switch v-model:checked="requirementEnabled.invites" />
            <InputNumber
              v-model:value="form.MinimumFriendsInvited"
              :disabled="!requirementEnabled.invites"
              :min="0"
              class="w-full"
            />
          </div>
        </Form.Item>

        <p class="text-xs text-gray-400">
          简化版仅编辑基础信息与门槛；奖励分段、规则说明、渠道包体等高级配置仍沿用原活动数据（编辑/克隆时保留）。
        </p>
      </Form>
    </Spin>
  </Modal>
</template>
