<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Switch,
  Tabs,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import {
  createGameNoticeApi,
  fetchAdNoticeJumpListApi,
  fetchGameNoticeDetailApi,
  updateGameNoticeApi,
} from '#/api/operationManage/game-notice';
import ChannelSelect from '#/components/global/channel-select.vue';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'GameNoticeFormModal' });

const props = defineProps<{
  open: boolean;
  rowId?: number | string | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

interface LangItem {
  LangGroupId: number | string;
  NoticeRaw: string;
  NoticeRpc?: string;
  Title: string;
}

const { packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const submitting = ref(false);
const loading = ref(false);
/** 旧站编辑时推送开关/标题/内容禁用 */
const disablePush = ref(false);

const langGroups = computed(
  () => projectConfig.value?.LangGroup?.filter((item) => item.Id) || [],
);

const activeLangTab = ref('');

const showStageOptions = [
  { label: '普通', value: 2 },
  { label: '重要', value: 102 },
  { label: '停机', value: 1000 },
  { label: '充值', value: 1001 },
  { label: '紧急', value: 1002 },
];

/** 旧站 openTypeList 当前仅开放 网址 / 公告 */
const openTypeOptions = [
  { label: '网址', value: 1 },
  { label: '公告', value: 4 },
];

const packageModeOptions = [
  { label: '全部产品可见', value: '' },
  { label: '指定产品可见', value: 1 },
];

const shieldPackageModeOptions = [
  { label: '不屏蔽', value: '' },
  { label: '屏蔽指定产品', value: 1 },
];

const channelModeOptions = [
  { label: '全部渠道可见', value: '' },
  { label: '指定渠道可见', value: 1 },
];

const shieldChannelModeOptions = [
  { label: '不屏蔽', value: '' },
  { label: '屏蔽指定渠道', value: 1 },
];

const vipOptions = computed(() => {
  const map = (
    projectConfig.value as {
      VIPLevelMap?: Array<{ VipLevelId: number; VipLevelName: string }>;
    }
  )?.VIPLevelMap;
  if (Array.isArray(map) && map.length) {
    return map.map((item) => ({
      label: item.VipLevelName || `VIP${item.VipLevelId}`,
      value: item.VipLevelId,
    }));
  }
  return Array.from({ length: 11 }, (_, i) => ({
    label: `VIP${i}`,
    value: i,
  }));
});

const deviceOptions = computed(() => {
  const cfg = projectConfig.value as {
    DevicePlatformMy?:
      | Record<string, string>
      | Array<{ device: string; name: string }>;
    DevicePlatformAll?: Record<string, string>;
  };
  const my = cfg?.DevicePlatformMy;
  if (Array.isArray(my)) {
    return my.map((item) => ({
      label: item.name || item.device,
      value: item.device,
    }));
  }
  if (my && typeof my === 'object') {
    return Object.entries(my).map(([value, label]) => ({
      label: String(label || value),
      value,
    }));
  }
  const all = cfg?.DevicePlatformAll || {};
  return Object.entries(all).map(([value, label]) => ({
    label: String(label || value),
    value,
  }));
});

const isEdit = computed(() => !!props.rowId);
const isEmergent = computed(() => form.ShowStage === 1002);
const isShutdown = computed(() => form.ShowStage === 1000);
const isDeposit = computed(() => form.ShowStage === 1001);
const showVipAndPush = computed(() => !isShutdown.value);

const noticeJumpOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);

const form = reactive({
  AppStoreKey: '' as number | string,
  ChannelIdMode: '' as number | string,
  ChannelIds: [] as Array<number | string>,
  DailyCount: 0,
  DailyCountValue: 0,
  DisplayPage: 0,
  EndTime: undefined as Dayjs | undefined,
  GamePackages: [] as Array<number | string>,
  Id: undefined as number | string | undefined,
  IsNoFirstDeposit: false,
  IsPush: 2,
  IsTotalCount: false,
  Jump: '' as number | string,
  Jump2: '' as number | string,
  LangText: [] as LangItem[],
  OpenType: 1,
  OpenType2: 1,
  PackageMode: '' as number | string,
  Packages: [] as Array<number | string>,
  PushContent: '',
  PushTitle: '',
  ShieldAppStoreKey: '' as number | string,
  ShieldChannelIdMode: '' as number | string,
  ShieldChannelIds: [] as Array<number | string>,
  ShieldPackageMode: '' as number | string,
  ShieldPackages: [] as Array<number | string>,
  ShowIdx: 1,
  ShowStage: 2,
  StartTime: undefined as Dayjs | undefined,
  TotalCount: 0,
  VipLevels: [] as number[],
  VisibleDevice: [] as string[],
});

function buildEmptyLangText(): LangItem[] {
  const groups = langGroups.value;
  if (!groups.length) {
    return [{ LangGroupId: 1, NoticeRaw: '', Title: '' }];
  }
  return groups.map((group) => ({
    LangGroupId: group.Id,
    NoticeRaw: '',
    Title: '',
  }));
}

function resetForm() {
  form.Id = undefined;
  form.ShowStage = 2;
  form.GamePackages = [];
  form.PackageMode = '';
  form.Packages = [];
  form.ShieldPackageMode = '';
  form.ShieldPackages = [];
  form.AppStoreKey = '';
  form.ShieldAppStoreKey = '';
  form.ChannelIdMode = '';
  form.ChannelIds = [];
  form.ShieldChannelIdMode = '';
  form.ShieldChannelIds = [];
  form.VipLevels = [];
  form.IsPush = 2;
  form.PushTitle = '';
  form.PushContent = '';
  form.OpenType = 1;
  form.Jump = '';
  form.OpenType2 = 1;
  form.Jump2 = '';
  form.ShowIdx = 1;
  form.StartTime = dayjs().startOf('day');
  form.EndTime = undefined;
  form.DisplayPage = 0;
  form.VisibleDevice = deviceOptions.value.map((item) => String(item.value));
  form.DailyCount = 0;
  form.DailyCountValue = 0;
  form.IsTotalCount = false;
  form.TotalCount = 0;
  form.IsNoFirstDeposit = false;
  form.LangText = buildEmptyLangText();
  activeLangTab.value = String(form.LangText[0]?.LangGroupId ?? '');
  disablePush.value = false;
}

function parseLangText(raw: unknown): LangItem[] {
  const groups = langGroups.value;
  const fallback = buildEmptyLangText();
  if (!raw) {
    return fallback;
  }
  let obj: Record<string, Record<string, unknown>> = {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return groups.length
          ? groups.map((group, index) => {
              const hit =
                parsed.find(
                  (item) =>
                    Number((item as LangItem).LangGroupId) === Number(group.Id),
                ) || parsed[index];
              const row = (hit || {}) as Record<string, unknown>;
              return {
                LangGroupId: group.Id,
                NoticeRaw: String(row.NoticeRaw || row.Notice || ''),
                Title: String(row.Title || ''),
              };
            })
          : (parsed as LangItem[]);
      }
      obj = parsed as Record<string, Record<string, unknown>>;
    } catch {
      return fallback;
    }
  } else if (typeof raw === 'object' && !Array.isArray(raw)) {
    obj = raw as Record<string, Record<string, unknown>>;
  }
  if (!groups.length) {
    const first = Object.values(obj)[0];
    return [
      {
        LangGroupId: Number(first?.LangGroupId || 1),
        NoticeRaw: String(first?.NoticeRaw || first?.Notice || ''),
        Title: String(first?.Title || ''),
      },
    ];
  }
  return groups.map((group) => {
    const hit = obj[String(group.Id)] || obj[group.Id as string];
    return {
      LangGroupId: group.Id,
      NoticeRaw: String(hit?.NoticeRaw || hit?.Notice || ''),
      Title: String(hit?.Title || ''),
    };
  });
}

function splitCsv(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toNumberArray(value: unknown): number[] {
  return splitCsv(value)
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
}

function hrefToClick(html: string) {
  return html.replace(/href="/g, 'onclick="openURL(\'');
}

function isRichTextEmpty(html: string) {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return !text;
}

watch(
  () => form.ShowStage,
  (stage) => {
    if (stage === 1000) {
      form.VipLevels = [];
      form.IsPush = 2;
      form.PushTitle = '';
      form.PushContent = '';
      form.Jump = '';
    }
  },
);

async function loadJumpOptions() {
  try {
    const result = await fetchAdNoticeJumpListApi();
    const list = Array.isArray(result)
      ? result
      : (result as { Items?: unknown[] })?.Items || [];
    noticeJumpOptions.value = (list as Array<Record<string, unknown>>).map(
      (item) => {
        let title = String(item.Title || item.Id);
        if (item.LangText) {
          try {
            const lang =
              typeof item.LangText === 'string'
                ? JSON.parse(item.LangText)
                : item.LangText;
            const first = Object.values(
              lang as Record<string, { Title?: string }>,
            )[0];
            if (first?.Title) {
              title = first.Title;
            }
          } catch {
            /* ignore */
          }
        }
        return {
          label: `${title} (${item.Id})`,
          value: item.Id as number | string,
        };
      },
    );
  } catch {
    noticeJumpOptions.value = [];
  }
}

async function loadDetail(id: number | string) {
  loading.value = true;
  try {
    const detail = await fetchGameNoticeDetailApi(id);
    form.Id = detail.Id as number | string;
    form.ShowStage = Number(detail.ShowStage || 2);
    form.ShowIdx = Number(detail.ShowIdx || 1);
    form.LangText = parseLangText(detail.LangText);
    activeLangTab.value = String(form.LangText[0]?.LangGroupId ?? '');
    form.IsPush = Number(detail.IsPush) === 0 ? 2 : Number(detail.IsPush || 2);
    form.PushTitle = String(detail.PushTitle || '');
    form.PushContent = String(detail.PushContent || '');
    form.OpenType = Number(detail.OpenType || 1);
    form.Jump = (detail.Jump as number | string) || '';
    form.OpenType2 = Number(detail.OpenType2 || 1);
    form.Jump2 = (detail.Jump2 as number | string) || '';
    form.VipLevels = toNumberArray(detail.VipLevel);
    form.DisplayPage = Number(detail.DisplayPage || 0);
    form.DailyCount = Number(detail.DailyCount || 0);
    form.DailyCountValue = Number(detail.DailyCountValue || 0);
    form.IsTotalCount = Boolean(detail.IsTotalCount);
    form.TotalCount = Number(detail.TotalCount || 0);
    form.IsNoFirstDeposit = Boolean(detail.IsNoFirstDeposit);
    form.StartTime = detail.StartTime
      ? dayjs.unix(Number(detail.StartTime))
      : dayjs().startOf('day');
    form.EndTime =
      detail.EndTime && Number(detail.EndTime) > 0
        ? dayjs.unix(Number(detail.EndTime))
        : undefined;

    const packages = splitCsv(detail.Packages).map((item) =>
      Number.isNaN(Number(item)) ? item : Number(item),
    );
    if (form.ShowStage === 1002) {
      form.PackageMode = packages.length ? 1 : '';
      form.Packages = packages;
      form.GamePackages = [];
      const shield = splitCsv(detail.ShieldPackages).map((item) =>
        Number.isNaN(Number(item)) ? item : Number(item),
      );
      form.ShieldPackageMode = shield.length ? 1 : '';
      form.ShieldPackages = shield;
      const channels = splitCsv(detail.ChannelId);
      form.ChannelIdMode = channels.length ? 1 : '';
      form.ChannelIds = channels;
      const shieldChannels = splitCsv(detail.ShieldChannelId);
      form.ShieldChannelIdMode = shieldChannels.length ? 1 : '';
      form.ShieldChannelIds = shieldChannels;
      form.VisibleDevice = splitCsv(detail.VisibleDevice);
    } else {
      form.GamePackages = packages;
      form.PackageMode = '';
      form.Packages = [];
      form.VisibleDevice = deviceOptions.value.map((item) =>
        String(item.value),
      );
    }
    disablePush.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.rowId] as const,
  async ([open]) => {
    if (!open) {
      return;
    }
    resetForm();
    await loadJumpOptions();
    if (props.rowId) {
      await loadDetail(props.rowId);
    }
  },
);

onMounted(() => {
  if (!form.LangText.length) {
    form.LangText = buildEmptyLangText();
  }
});

function closeModal() {
  emit('update:open', false);
}

function formatModeField(
  mode: number | string,
  selected: Array<number | string>,
) {
  if (mode && selected.length) {
    return selected.join(',');
  }
  return '';
}

function buildPayload() {
  const langText = form.LangText.map((item) => ({
    LangGroupId: item.LangGroupId,
    NoticeRaw: item.NoticeRaw,
    NoticeRpc: hrefToClick(item.NoticeRaw),
    Title: item.Title.trim(),
  }));

  const payload: Record<string, unknown> = {
    DailyCount: form.DailyCount,
    DailyCountValue: form.DailyCount === 1 ? form.DailyCountValue : 0,
    DisplayPage: form.DisplayPage,
    EndTime: form.EndTime ? form.EndTime.unix() : 0,
    IsNoFirstDeposit: form.IsNoFirstDeposit,
    IsPush: form.IsPush,
    IsTotalCount: form.IsTotalCount,
    Jump: form.Jump,
    Jump2: form.Jump2,
    LangText: JSON.stringify(langText),
    OpenType: form.OpenType,
    OpenType2: form.OpenType2,
    PushContent: form.PushContent,
    PushTitle: form.PushTitle,
    ShowIdx: form.ShowIdx,
    ShowStage: form.ShowStage,
    StartTime: form.StartTime ? form.StartTime.unix() : 0,
    TotalCount: form.IsTotalCount ? form.TotalCount : 0,
    Type: 1,
    VipLevel: form.VipLevels.join(','),
  };

  if (form.ShowStage === 1002) {
    payload.Packages = formatModeField(form.PackageMode, form.Packages);
    payload.ShieldPackages = formatModeField(
      form.ShieldPackageMode,
      form.ShieldPackages,
    );
    payload.AppStoreKey = '';
    payload.ShieldAppStoreKey = '';
    payload.ChannelId = form.ChannelIdMode ? form.ChannelIds : [];
    payload.ShieldChannelId = form.ShieldChannelIdMode
      ? form.ShieldChannelIds
      : [];
    payload.VisibleDevice = form.VisibleDevice;
  } else {
    payload.Packages = form.GamePackages;
    payload.ShieldPackages = '';
    payload.AppStoreKey = '';
    payload.ShieldAppStoreKey = '';
    payload.ChannelId = '';
    payload.ShieldChannelId = '';
    payload.VisibleDevice = deviceOptions.value.map((item) =>
      String(item.value),
    );
  }

  if (isEdit.value && form.Id) {
    payload.Id = form.Id;
  } else {
    payload.Hash = createRequestHash();
  }
  return payload;
}

function validateForm() {
  for (const lang of form.LangText) {
    if (!lang.Title.trim()) {
      message.warning('请填写公告标题');
      activeLangTab.value = String(lang.LangGroupId);
      return false;
    }
    if (isRichTextEmpty(lang.NoticeRaw)) {
      message.warning('请填写公告内容');
      activeLangTab.value = String(lang.LangGroupId);
      return false;
    }
    if (
      form.ShowStage === 1002 &&
      lang.NoticeRaw.replace(/<[^>]+>/g, '').length > 500
    ) {
      message.warning('紧急公告内容不能超过 500 字');
      return false;
    }
  }
  if (form.ShowStage !== 1002 && !form.GamePackages.length) {
    message.warning('请选择生效游戏包');
    return false;
  }
  if (!form.StartTime) {
    message.warning('请选择开始时间');
    return false;
  }
  if (
    form.EndTime &&
    form.StartTime &&
    form.EndTime.valueOf() < form.StartTime.valueOf()
  ) {
    message.warning('结束时间不能早于开始时间');
    return false;
  }
  if (form.ShowStage === 1002 && !form.VisibleDevice.length) {
    message.warning('请选择展示设备');
    return false;
  }
  if (form.DailyCount === 1 && !form.DailyCountValue) {
    message.warning('请填写每日首次登录次数');
    return false;
  }
  if (form.IsTotalCount && !form.TotalCount) {
    message.warning('请填写展示总次数');
    return false;
  }
  if (form.IsPush === 1 && !disablePush.value) {
    if (!form.PushTitle.trim() || !form.PushContent.trim()) {
      message.warning('开启推送时请填写推送标题和内容');
      return false;
    }
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  submitting.value = true;
  try {
    const payload = buildPayload();
    if (isEdit.value) {
      await updateGameNoticeApi(payload);
      message.success('公告已更新');
    } else {
      await createGameNoticeApi(payload);
      message.success('公告已创建');
    }
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    :title="isEdit ? '编辑公告' : '新增公告'"
    :width="860"
    destroy-on-close
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form
      :label-col="{ span: 5 }"
      class="mt-2 max-h-[70vh] overflow-y-auto pr-2"
      layout="horizontal"
    >
      <!-- 多语言标题/内容 -->
      <template v-if="form.LangText.length <= 1 && form.LangText[0]">
        <Form.Item label="公告标题" required>
          <Input
            v-model:value="form.LangText[0]!.Title"
            allow-clear
            placeholder="请输入公告标题"
          />
        </Form.Item>
        <Form.Item label="公告内容" required>
          <RichTextEditor
            v-model="form.LangText[0]!.NoticeRaw"
            placeholder="请输入公告内容"
          />
        </Form.Item>
      </template>
      <Tabs
        v-else
        v-model:active-key="activeLangTab"
        class="mb-3"
        type="line"
        size="small"
      >
        <Tabs.TabPane
          v-for="lang in form.LangText"
          :key="String(lang.LangGroupId)"
          :tab="`语言组 ${lang.LangGroupId}`"
        >
          <Form.Item label="公告标题" required>
            <Input
              v-model:value="lang.Title"
              allow-clear
              placeholder="请输入公告标题"
            />
          </Form.Item>
          <Form.Item label="公告内容" required>
            <RichTextEditor
              v-model="lang.NoticeRaw"
              placeholder="请输入公告内容"
            />
          </Form.Item>
        </Tabs.TabPane>
      </Tabs>

      <Form.Item label="公告类型" required>
        <Radio.Group
          v-model:value="form.ShowStage"
          :options="showStageOptions"
        />
      </Form.Item>

      <!-- 普通/重要/停机/充值：生效游戏包 -->
      <Form.Item v-if="!isEmergent" label="生效游戏包" required>
        <Select
          v-model:value="form.GamePackages"
          :loading="loading"
          :options="
            packageOptions.map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            }))
          "
          allow-clear
          mode="multiple"
          placeholder="请选择产品包"
          show-search
          style="width: 100%"
        />
      </Form.Item>

      <!-- 紧急：生效/屏蔽产品、渠道、设备 -->
      <template v-if="isEmergent">
        <Form.Item label="生效产品">
          <div class="flex flex-col gap-2">
            <Select
              v-model:value="form.PackageMode"
              :options="packageModeOptions"
              style="width: 220px"
            />
            <Select
              v-if="form.PackageMode === 1"
              v-model:value="form.Packages"
              :options="
                packageOptions.map((item) => ({
                  label: item.PackageName,
                  value: item.PackageId,
                }))
              "
              mode="multiple"
              placeholder="指定产品"
              style="width: 100%"
            />
          </div>
        </Form.Item>
        <Form.Item label="屏蔽产品">
          <div class="flex flex-col gap-2">
            <Select
              v-model:value="form.ShieldPackageMode"
              :options="shieldPackageModeOptions"
              style="width: 220px"
            />
            <Select
              v-if="form.ShieldPackageMode === 1"
              v-model:value="form.ShieldPackages"
              :options="
                packageOptions.map((item) => ({
                  label: item.PackageName,
                  value: item.PackageId,
                }))
              "
              mode="multiple"
              placeholder="屏蔽产品"
              style="width: 100%"
            />
          </div>
        </Form.Item>
        <Form.Item label="生效渠道">
          <div class="flex flex-col gap-2">
            <Select
              v-model:value="form.ChannelIdMode"
              :options="channelModeOptions"
              style="width: 220px"
            />
            <ChannelSelect
              v-if="form.ChannelIdMode === 1"
              v-model="form.ChannelIds"
              style="width: 100%"
            />
          </div>
        </Form.Item>
        <Form.Item label="屏蔽渠道">
          <div class="flex flex-col gap-2">
            <Select
              v-model:value="form.ShieldChannelIdMode"
              :options="shieldChannelModeOptions"
              style="width: 220px"
            />
            <ChannelSelect
              v-if="form.ShieldChannelIdMode === 1"
              v-model="form.ShieldChannelIds"
              style="width: 100%"
            />
          </div>
        </Form.Item>
        <Form.Item label="显示页面">
          <Radio.Group v-model:value="form.DisplayPage">
            <Radio :value="0">全页面</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="展示设备" required>
          <Checkbox.Group
            v-model:value="form.VisibleDevice"
            :options="deviceOptions"
          />
        </Form.Item>
        <Form.Item label="极光跳转类型">
          <Select
            v-model:value="form.OpenType2"
            :options="openTypeOptions"
            style="width: 220px"
            @change="form.Jump2 = ''"
          />
        </Form.Item>
        <Form.Item v-if="form.OpenType2 === 1" label="跳转参数">
          <Input v-model:value="form.Jump2 as string" placeholder="网址" />
        </Form.Item>
        <Form.Item v-else-if="form.OpenType2 === 4" label="跳转参数">
          <Select
            v-model:value="form.Jump2"
            :options="noticeJumpOptions"
            allow-clear
            placeholder="选择公告"
            style="width: 100%"
          />
        </Form.Item>
      </template>

      <Form.Item v-if="showVipAndPush" label="生效VIP等级">
        <Select
          v-model:value="form.VipLevels"
          :options="vipOptions"
          allow-clear
          mode="multiple"
          placeholder="不选=不限；可多选"
          style="width: 100%"
        />
      </Form.Item>

      <Form.Item v-if="showVipAndPush" label="是否推送">
        <Radio.Group v-model:value="form.IsPush" :disabled="disablePush">
          <Radio :value="1">是</Radio>
          <Radio :value="2">否</Radio>
        </Radio.Group>
      </Form.Item>

      <template v-if="showVipAndPush && form.IsPush === 1">
        <Form.Item label="推送标题">
          <Input
            v-model:value="form.PushTitle"
            :disabled="disablePush"
            allow-clear
          />
        </Form.Item>
        <Form.Item label="推送内容">
          <Input
            v-model:value="form.PushContent"
            :disabled="disablePush"
            allow-clear
          />
        </Form.Item>
        <Form.Item label="跳转类型">
          <Select
            v-model:value="form.OpenType"
            :options="openTypeOptions"
            style="width: 220px"
            @change="form.Jump = ''"
          />
        </Form.Item>
        <Form.Item v-if="form.OpenType === 1" label="跳转参数">
          <Input v-model:value="form.Jump as string" placeholder="网址" />
        </Form.Item>
        <Form.Item v-else-if="form.OpenType === 4" label="跳转参数">
          <Select
            v-model:value="form.Jump"
            :options="noticeJumpOptions"
            allow-clear
            placeholder="选择公告"
            style="width: 100%"
          />
        </Form.Item>
      </template>

      <Form.Item label="排序" required>
        <InputNumber
          v-model:value="form.ShowIdx"
          :max="10000"
          :min="1"
          class="w-40"
        />
        <span class="ml-2 text-xs text-red-500">数值越大越靠前</span>
      </Form.Item>

      <Form.Item label="生效时间" required>
        <div class="flex items-center gap-2">
          <DatePicker
            v-model:value="form.StartTime"
            placeholder="开始时间"
            show-time
            style="width: 100%"
          />
          <span>至</span>
          <DatePicker
            v-model:value="form.EndTime"
            allow-clear
            placeholder="结束时间(可空=长期)"
            show-time
            style="width: 100%"
          />
        </div>
      </Form.Item>

      <!-- 充值公告展示机制 -->
      <template v-if="isDeposit">
        <Form.Item label="展示机制">
          <Radio.Group v-model:value="form.DailyCount">
            <Radio :value="0">每次登录</Radio>
            <Radio :value="1">每日首次登录</Radio>
          </Radio.Group>
          <InputNumber
            v-if="form.DailyCount === 1"
            v-model:value="form.DailyCountValue"
            :max="99999"
            :min="1"
            class="ml-2 w-28"
            placeholder="次数"
          />
        </Form.Item>
        <Form.Item label="展示总次">
          <div class="flex items-center gap-2">
            <Switch v-model:checked="form.IsTotalCount" />
            <InputNumber
              v-model:value="form.TotalCount"
              :disabled="!form.IsTotalCount"
              :min="1"
              class="w-28"
            />
          </div>
        </Form.Item>
        <Form.Item label="首存后不展示">
          <Switch v-model:checked="form.IsNoFirstDeposit" />
        </Form.Item>
      </template>
    </Form>
  </Modal>
</template>
