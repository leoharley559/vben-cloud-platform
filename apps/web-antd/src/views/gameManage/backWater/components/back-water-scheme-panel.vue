<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  createBackWaterSchemeApi,
  deleteBackWaterSchemeApi,
  fetchBackWaterSchemeApi,
  fetchBackWaterSchemesApi,
  updateBackWaterSchemeApi,
  updateBackWaterSchemeConfigApi,
  updateBackWaterSchemeNameApi,
  updateBackWaterSchemeRuleApi,
} from '#/api/gameManage/back-water';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  formatGameName,
  formatPercentFromStorage,
  formatPercentToStorage,
} from '#/utils/game-config';
import { getServiceImageUrl } from '#/utils/media';

import VoucherImageField from '../../../operationalManage/voucher/components/voucher-image-field.vue';

defineOptions({ name: 'BackWaterSchemePanel' });

const props = defineProps<{
  initialSchemeId?: number | string;
}>();

interface SchemeOption {
  Id: number | string;
  Name?: string;
}
interface ConfigRow {
  DefaultWater?: number;
  Games?: Array<{ Id: number | string; Ratio: number }>;
  MaxWater?: number;
  MinTurnover?: number;
  MinTurnoverMultiple?: number;
  VipLevel?: number;
  WaterAvg?: number;
  WaterMax?: number;
  WaterMin?: number;
}
interface RuleRow {
  Id?: number | string;
  Name?: string;
  [key: string]: number | string | undefined;
}
interface LangItem {
  ActName?: string;
  Banner2?: string;
  Banner3?: string;
  BannerParam2?: number;
  BannerParam3?: number;
  Image2?: string;
  Image3?: string;
  IsActive?: number;
  LangGroupId?: number | string;
  MultiDesc?: unknown;
  MultiRule?: unknown;
  Param2?: number;
  Param3?: number;
  Rule: RuleRow[];
  [key: string]: unknown;
}

const MAX_REBATE_ID = 999;
const router = useRouter();
const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const { ensureGameConfig, gameConfig } = useGameConfig();
const listLoading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const creating = ref(false);
const searchName = ref('');
const schemes = ref<SchemeOption[]>([]);
const currentId = ref<number | string>('');
const detail = reactive<Record<string, unknown>>({});
const configRows = ref<ConfigRow[]>([]);
const ruleRows = ref<RuleRow[]>([]);
const langItems = ref<LangItem[]>([]);
const activeLang = ref('0');
const renameVisible = ref(false);
const renameName = ref('');
const configVisible = ref(false);
const configIndex = ref(-1);
const configForm = reactive<ConfigRow>({});
const gameRatios = ref<
  Array<{ Checked?: boolean; GameId: number | string; Percent?: number }>
>([]);
const gamesToAdd = ref<Array<number | string>>([]);
const batchRatio = ref(0);
const ruleVisible = ref(false);
const ruleMode = ref<'add' | 'edit'>('add');
const ruleIndex = ref(-1);
const ruleForm = reactive<Record<string, number | string>>({
  Id: '',
  Name: '',
});
const multiDescText = ref('');
const multiRuleText = ref('');
const activityTypeOptions = [
  { label: '日常活动', value: 1 },
  { label: '限时活动', value: 2 },
  { label: '体育活动', value: 3 },
  { label: '新手活动', value: 4 },
];
const activityTagOptions = [
  { label: '热门', value: 1 },
  { label: '最新', value: 2 },
  { label: '日常', value: 3 },
  { label: '限时', value: 4 },
];
const redDotOptions = [
  { label: '不提示', value: 1 },
  { label: '活动开始时', value: 2 },
  { label: '活动开始及每周一', value: 3 },
  { label: '活动开始及每日', value: 4 },
];

const canView = computed(() => checkPermission(11_091));
const canSave = computed(() => checkPermission(11_093));
const canViewRules = computed(() => checkPermission(11_094));
const canEditRules = computed(() => checkPermission(11_095));
const canAddRule = computed(() => checkPermission(11_092));
const canLoadSchemes = computed(() => checkPermission(11_096));
const canCreate = computed(() => checkPermission(11_097));
const canRename = computed(() => checkPermission(11_098));
const canEditConfig = computed(() => checkPermission(11_100));

const languageGroups = computed(() => {
  const groups = (projectConfig.value?.LangGroup || []) as Array<{
    Default?: boolean;
    Id?: number | string;
    Name?: string;
  }>;
  if (groups.length > 0) return groups;
  return langItems.value.map((item, index) => ({
    Default: index === 0,
    Id: item.LangGroupId ?? index,
    Name: `语言 ${item.LangGroupId ?? index}`,
  }));
});
const vipLevels = computed(() => {
  const levels = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId: number;
    VipLevelName: string;
  }>;
  return levels.length > 0
    ? levels
    : Array.from({ length: 11 }, (_, index) => ({
        VipLevelId: index,
        VipLevelName: `VIP${index}`,
      }));
});
const filteredSchemes = computed(() => {
  const keyword = searchName.value.trim().toLowerCase();
  return keyword
    ? schemes.value.filter((item) =>
        String(item.Name || '').toLowerCase().includes(keyword),
      )
    : schemes.value;
});
const currentLangIndex = computed(() => Number(activeLang.value || 0));
const currentLang = computed(() => langItems.value[currentLangIndex.value]);
const awardType = computed({
  get: () => Number(detail.AwardType ?? 1),
  set: (value: number) => {
    detail.AwardType = value;
  },
});
const gameOptions = computed(() =>
  Object.entries(gameConfig.value.games).map(([value, item]) => ({
    label: formatGameName(value, gameConfig.value.games),
    value: (item as { gameId?: number | string })?.gameId ?? value,
  })),
);
const addableGameOptions = computed(() => {
  const used = new Set(gameRatios.value.map((item) => String(item.GameId)));
  return gameOptions.value.filter((item) => !used.has(String(item.value)));
});
const ratioStats = computed(() => {
  const values = gameRatios.value.map((item) => Number(item.Percent || 0));
  return {
    average: values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0,
    maximum: values.length > 0 ? Math.max(...values) : 0,
    minimum: values.length > 0 ? Math.min(...values) : 0,
    notSet: Math.max(gameOptions.value.length - gameRatios.value.length, 0),
    set: values.filter((value) => value > 0).length,
    zero: values.filter((value) => value === 0).length,
  };
});

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseLanguages(raw: unknown, rules: RuleRow[]) {
  const source = parseJson<LangItem[] | Record<string, LangItem>>(raw, []);
  const byId = new Map<string, LangItem>();
  if (Array.isArray(source)) {
    source.forEach((item) => byId.set(String(item.LangGroupId), item));
  } else {
    Object.entries(source).forEach(([id, item]) => byId.set(id, item));
  }
  const groups = languageGroups.value;
  const result = groups.map((group, index) => {
    const id = group.Id ?? index;
    const sourceItem = byId.get(String(id));
    const langRules = parseJson<RuleRow[]>(sourceItem?.Rule, []);
    return {
      ...sourceItem,
      ActName: sourceItem?.ActName || '',
      IsActive: index === 0 ? 1 : Number(sourceItem?.IsActive || 0),
      LangGroupId: id,
      MultiDesc: parseJson(sourceItem?.MultiDesc, []),
      MultiRule: parseJson(sourceItem?.MultiRule, []),
      Rule: rules.map((rule, ruleIndex) => ({
        ...rule,
        Name: langRules[ruleIndex]?.Name ?? (index === 0 ? rule.Name : ''),
      })),
    } as LangItem;
  });
  return result.length > 0
    ? result
    : [
        {
          ActName: '',
          IsActive: 1,
          LangGroupId: 0,
          MultiDesc: [],
          MultiRule: [],
          Rule: rules,
        },
      ];
}

function serializeLanguages() {
  return langItems.value.map((item) => ({
    ...item,
    MultiDesc: JSON.stringify(item.MultiDesc || []),
    MultiRule: JSON.stringify(item.MultiRule || []),
    Rule: JSON.stringify(item.Rule || []),
  }));
}

async function loadList(preferredId?: number | string) {
  if (!canLoadSchemes.value) return;
  listLoading.value = true;
  try {
    schemes.value = ((await fetchBackWaterSchemesApi()) ||
      []) as unknown as SchemeOption[];
    const nextId =
      preferredId &&
      schemes.value.some((item) => String(item.Id) === String(preferredId))
        ? preferredId
        : schemes.value[0]?.Id;
    if (nextId !== undefined) await selectScheme(nextId);
  } finally {
    listLoading.value = false;
  }
}

async function selectScheme(id: number | string) {
  currentId.value = id;
  detailLoading.value = true;
  try {
    const result = await fetchBackWaterSchemeApi(id);
    Object.keys(detail).forEach((key) => delete detail[key]);
    Object.assign(detail, result || {});
    configRows.value = parseJson<ConfigRow[]>(result.Config, []);
    ruleRows.value = parseJson<RuleRow[]>(result.Rule, []);
    langItems.value = parseLanguages(result.LangText, ruleRows.value);
    activeLang.value = '0';
    syncRichText();
  } finally {
    detailLoading.value = false;
  }
}

function syncRichText() {
  multiDescText.value = JSON.stringify(currentLang.value?.MultiDesc || [], null, 2);
  multiRuleText.value = JSON.stringify(currentLang.value?.MultiRule || [], null, 2);
}

function changeLanguage(key: number | string) {
  activeLang.value = String(key);
  syncRichText();
}

function updateStructuredContent(field: 'MultiDesc' | 'MultiRule', value: string) {
  try {
    if (currentLang.value) currentLang.value[field] = JSON.parse(value || '[]');
  } catch {
    message.error('结构化内容不是合法 JSON，请修正后再保存');
  }
}

function updateMediaHeight(param: string, path: string) {
  if (!currentLang.value) return;
  if (!path) {
    currentLang.value[param] = 0;
    return;
  }
  const image = new Image();
  image.addEventListener('load', () => {
    if (currentLang.value) currentLang.value[param] = image.height;
  });
  image.src = getServiceImageUrl(path);
}

function awardSwitchDisabled() {
  const now = new Date();
  const start = new Date();
  const end = new Date();
  start.setHours(7, 50, 0, 0);
  end.setHours(13, 0, 0, 0);
  return now >= start && now <= end;
}

async function createScheme() {
  const langGroupId = languageGroups.value[0]?.Id;
  if (langGroupId === undefined) {
    message.warning('未配置语言群组');
    return;
  }
  creating.value = true;
  try {
    await createBackWaterSchemeApi(langGroupId);
    message.success('新增方案成功');
    await loadList();
  } finally {
    creating.value = false;
  }
}

function deleteScheme() {
  if (schemes.value.length <= 1) {
    message.warning('至少保留一个返水方案');
    return;
  }
  Modal.confirm({
    content: `确认删除方案「${detail.Name || currentId.value}」？`,
    title: '删除方案',
    onOk: async () => {
      await deleteBackWaterSchemeApi(currentId.value);
      message.success('删除成功');
      await loadList();
    },
  });
}

function openRename() {
  renameName.value = String(detail.Name || '');
  renameVisible.value = true;
}

async function saveRename() {
  if (!renameName.value.trim()) {
    message.warning('方案名称不能为空');
    return;
  }
  saving.value = true;
  try {
    await updateBackWaterSchemeNameApi({
      Id: currentId.value,
      Name: renameName.value.trim(),
    });
    renameVisible.value = false;
    message.success('方案名称已修改');
    await loadList(currentId.value);
  } finally {
    saving.value = false;
  }
}

function openConfig(row: ConfigRow, index: number) {
  sessionStorage.setItem(
    'backWaterAddConfigContext',
    JSON.stringify({
      index,
      schemeId: currentId.value,
      vipLevel: row.VipLevel,
    }),
  );
  void router.push({
    path: '/gameManage/backWater/addConfig',
    query: {
      index,
      schemeId: currentId.value,
      vipLevel: row.VipLevel,
    },
  });
}

function addGameRatio() {
  gameRatios.value.push({ Checked: false, GameId: '', Percent: 0 });
}

function addSelectedGames() {
  const existing = new Set(gameRatios.value.map((item) => String(item.GameId)));
  for (const id of gamesToAdd.value) {
    if (!existing.has(String(id))) {
      gameRatios.value.push({ Checked: false, GameId: id, Percent: 0 });
    }
  }
  gamesToAdd.value = [];
}

function selectAllRatios(checked: boolean) {
  gameRatios.value.forEach((item) => {
    item.Checked = checked;
  });
}

function updateSelectedRatios(mode: 'decrease' | 'increase' | 'set') {
  const selected = gameRatios.value.filter((item) => item.Checked);
  if (selected.length === 0) {
    message.warning('请先勾选游戏');
    return;
  }
  selected.forEach((item) => {
    const current = Number(item.Percent || 0);
    const next =
      mode === 'set'
        ? batchRatio.value
        : current + (mode === 'increase' ? batchRatio.value : -batchRatio.value);
    item.Percent = Math.min(100, Math.max(0, Number(next.toFixed(2))));
  });
}

async function saveConfig() {
  const required = [
    configForm.MaxWater,
    configForm.MinTurnover,
    configForm.DefaultWater,
    configForm.MinTurnoverMultiple,
  ];
  if (required.some((value) => value === undefined || value === null)) {
    message.warning('请完整填写 VIP 返水配置');
    return;
  }
  if (Number(configForm.DefaultWater) < 0 || Number(configForm.DefaultWater) > 100) {
    message.warning('默认返水比例范围为 0~100%');
    return;
  }
  const next = {
    ...configForm,
    DefaultWater: formatPercentToStorage(Number(configForm.DefaultWater)),
    Games: gameRatios.value
      .filter((item) => item.GameId !== '' && item.Percent !== undefined)
      .map((item) => {
        const numericId = Number(item.GameId);
        return {
          Id: Number.isFinite(numericId) ? numericId : item.GameId,
          Ratio: formatPercentToStorage(Number(item.Percent || 0)),
        };
      }),
    MaxWater: Math.round(Number(configForm.MaxWater) * 100),
    MinTurnover: Math.round(Number(configForm.MinTurnover) * 100),
    WaterAvg: formatPercentToStorage(Number(configForm.WaterAvg || 0)),
    WaterMax: formatPercentToStorage(Number(configForm.WaterMax || 0)),
    WaterMin: formatPercentToStorage(Number(configForm.WaterMin || 0)),
  };
  const rows = [...configRows.value];
  rows[configIndex.value] = next;
  saving.value = true;
  try {
    await updateBackWaterSchemeConfigApi({
      Config: JSON.stringify(rows),
      Id: currentId.value,
    });
    message.success('VIP 返水配置已保存');
    configVisible.value = false;
    await selectScheme(currentId.value);
  } finally {
    saving.value = false;
  }
}

function openRule(row?: RuleRow, index = -1) {
  ruleMode.value = row ? 'edit' : 'add';
  ruleIndex.value = index;
  Object.keys(ruleForm).forEach((key) => delete ruleForm[key]);
  ruleForm.Id = row?.Id || '';
  ruleForm.Name = row?.Name || '';
  vipLevels.value.forEach((level) => {
    const raw = row?.[`Level${level.VipLevelId}`];
    ruleForm[`Level${level.VipLevelId}`] =
      Number(row?.Id) === MAX_REBATE_ID
        ? Number(raw || 0) / 100
        : Number(formatPercentFromStorage(raw || 0));
  });
  ruleVisible.value = true;
}

function buildRule() {
  const isLimit = Number(ruleForm.Id) === MAX_REBATE_ID;
  const next: RuleRow = {
    Id:
      ruleMode.value === 'add'
        ? Math.floor(Math.random() * 100) + 100
        : ruleForm.Id,
    Name: String(ruleForm.Name || '').trim(),
  };
  vipLevels.value.forEach((level) => {
    const value = Number(ruleForm[`Level${level.VipLevelId}`] || 0);
    next[`Level${level.VipLevelId}`] = isLimit
      ? Math.round(value * 100)
      : formatPercentToStorage(value);
  });
  return next;
}

async function saveRule() {
  if (!String(ruleForm.Name || '').trim()) {
    message.warning('请输入返水配置类型');
    return;
  }
  if (ruleMode.value === 'edit' && currentLangIndex.value > 0) {
    const current = langItems.value[currentLangIndex.value];
    if (current?.Rule[ruleIndex.value]) {
      current.Rule[ruleIndex.value] = {
        ...current.Rule[ruleIndex.value],
        Name: String(ruleForm.Name).trim(),
      };
      await persistRules('多语言规则名称已保存');
      ruleVisible.value = false;
    }
    return;
  }
  const next = buildRule();
  const rules = [...ruleRows.value];
  if (ruleMode.value === 'add') rules.push(next);
  else rules[ruleIndex.value] = next;
  ruleRows.value = rules;
  langItems.value.forEach((lang, langIndex) => {
    const langRules = [...lang.Rule];
    if (ruleMode.value === 'add') {
      langRules.push({ ...next, Name: langIndex === 0 ? next.Name : '' });
    } else {
      langRules[ruleIndex.value] = {
        ...next,
        Name:
          langIndex === currentLangIndex.value
            ? next.Name
            : langRules[ruleIndex.value]?.Name || '',
      };
    }
    lang.Rule = langRules;
  });
  await persistRules('规则已保存');
  ruleVisible.value = false;
}

function deleteRule(index: number) {
  Modal.confirm({
    content: '确认删除该返水规则？',
    title: '删除规则',
    onOk: async () => {
      ruleRows.value.splice(index, 1);
      langItems.value.forEach((item) => item.Rule.splice(index, 1));
      await persistRules('规则已删除');
    },
  });
}

async function moveRule(index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= ruleRows.value.length) return;
  [ruleRows.value[index], ruleRows.value[target]] = [
    ruleRows.value[target]!,
    ruleRows.value[index]!,
  ];
  langItems.value.forEach((item) => {
    [item.Rule[index], item.Rule[target]] = [
      item.Rule[target]!,
      item.Rule[index]!,
    ];
  });
  await persistRules('排序已保存');
}

async function persistRules(success: string) {
  saving.value = true;
  try {
    await updateBackWaterSchemeRuleApi({
      Id: currentId.value,
      LangText: JSON.stringify(serializeLanguages()),
      Rule: JSON.stringify(ruleRows.value),
    });
    message.success(success);
  } finally {
    saving.value = false;
  }
}

async function saveAll() {
  if (!currentLang.value) return;
  for (const item of langItems.value) {
    if (Number(item.IsActive) === 1 && !String(item.ActName || '').trim()) {
      message.warning('已启用语言的活动名称不能为空');
      return;
    }
  }
  if (
    detail.ActType === '' ||
    detail.ActSign === '' ||
    detail.RankSort === '' ||
    detail.RedDotNotification === ''
  ) {
    message.warning('请完整填写基础配置');
    return;
  }
  saving.value = true;
  try {
    await updateBackWaterSchemeApi({
      ...detail,
      Config: JSON.stringify(configRows.value),
      LangText: JSON.stringify(serializeLanguages()),
      Rule: JSON.stringify(ruleRows.value),
    });
    message.success('返水方案已保存');
    await selectScheme(currentId.value);
  } finally {
    saving.value = false;
  }
}

const configColumns = [
  {
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'index',
    title: '序号',
    width: 60,
  },
  {
    customRender: ({ record }: { record: ConfigRow }) =>
      `VIP ${record.VipLevel ?? '-'}`,
    key: 'VipLevel',
    title: 'VIP 等级',
  },
  {
    customRender: ({ record }: { record: ConfigRow }) =>
      formatAmountFromCent(record.MaxWater),
    key: 'MaxWater',
    title: '周期最高返水',
  },
  {
    customRender: ({ record }: { record: ConfigRow }) =>
      formatAmountFromCent(record.MinTurnover),
    key: 'MinTurnover',
    title: '最低流水要求',
  },
  {
    customRender: ({ record }: { record: ConfigRow }) =>
      `${formatPercentFromStorage(record.WaterMin || record.DefaultWater)}% - ${formatPercentFromStorage(record.WaterMax || record.DefaultWater)}%`,
    key: 'range',
    title: '返水比例区间',
  },
  {
    customRender: ({ record }: { record: ConfigRow }) =>
      `${formatPercentFromStorage(record.WaterAvg)}%`,
    key: 'WaterAvg',
    title: '平均返水比例',
  },
  { key: 'action', title: '操作', width: 90 },
];

const ruleColumns = computed(() => [
  { key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'Name', key: 'Name', title: '返水配置类型', width: 150 },
  ...vipLevels.value.map((level) => ({
    customRender: ({ record }: { record: RuleRow }) =>
      Number(record.Id) === MAX_REBATE_ID
        ? formatAmountFromCent(record[`Level${level.VipLevelId}`])
        : `${formatPercentFromStorage(record[`Level${level.VipLevelId}`])}%`,
    key: `Level${level.VipLevelId}`,
    title: level.VipLevelName,
    width: 90,
  })),
  { key: 'action', title: '操作', width: 130 },
]);

onMounted(async () => {
  await ensureGameConfig();
  await loadList(props.initialSchemeId);
});
</script>

<template>
  <div v-if="canView">
    <div class="query-panel">
      <Input
        v-model:value="searchName"
        allow-clear
        placeholder="搜索方案名称"
        class="max-w-sm"
        style="width: 240px"
      >
        <template #addonBefore>方案名称</template>
      </Input>
      <Space>
        <Button
          v-if="canCreate"
          :loading="creating"
          type="primary"
          @click="createScheme"
        >
          新增自定义方案
        </Button>
        <Button
          danger
          :disabled="schemes.length <= 1 || !currentId"
          @click="deleteScheme"
        >
          删除方案
        </Button>
      </Space>
    </div>

    <Spin :spinning="listLoading || detailLoading">
      <div v-if="schemes.length > 0" class="scheme-layout">
        <Card class="scheme-nav" size="small" title="方案列表">
          <Radio.Group
            :value="currentId"
            class="flex w-full flex-col gap-2"
            @change="(event) => selectScheme(event.target.value)"
          >
            <Radio.Button
              v-for="item in filteredSchemes"
              :key="item.Id"
              :value="item.Id"
              class="!rounded-md"
            >
              {{ item.Name || `方案 ${item.Id}` }}
            </Radio.Button>
          </Radio.Group>
        </Card>

        <div class="min-w-0 flex-1">
          <Card size="small" class="mb-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <Space>
                <span class="text-base font-semibold">
                  {{ detail.Name || `方案 ${currentId}` }}
                </span>
                <Button v-if="canRename" type="link" @click="openRename">
                  修改名称
                </Button>
              </Space>
              <div class="flex items-center gap-3">
                <span>自动派奖</span>
                <Switch
                  v-model:checked="awardType"
                  :checked-value="0"
                  :un-checked-value="1"
                  :disabled="awardSwitchDisabled()"
                />
                <Tag v-if="awardSwitchDisabled()" color="red">
                  07:50-13:00 禁止切换
                </Tag>
              </div>
            </div>
          </Card>

          <Tabs
            :active-key="activeLang"
            type="line"
            size="small"
            @change="changeLanguage"
          >
            <Tabs.TabPane
              v-for="(group, index) in languageGroups"
              :key="String(index)"
              :tab="group.Name || `语言 ${group.Id}`"
            />
          </Tabs>

          <template v-if="currentLang">
            <Card size="small" class="section-card" title="基础配置">
              <Form layout="vertical">
                <div
                  v-if="currentLangIndex > 0"
                  class="mb-4 flex items-center gap-3"
                >
                  <span>多语言开关</span>
                  <Switch
                    v-model:checked="currentLang.IsActive"
                    :checked-value="1"
                    :un-checked-value="0"
                  />
                  <span class="text-xs text-red-500">
                    开启后活动名称和多语言内容必须完整
                  </span>
                </div>
                <div class="form-grid">
                  <Form.Item label="活动名称" required>
                    <Input
                      v-model:value="currentLang.ActName"
                      :maxlength="16"
                      show-count
                    />
                  </Form.Item>
                  <Form.Item label="活动类型" required>
                    <Select
                      v-model:value="detail.ActType as number"
                      :disabled="currentLangIndex !== 0"
                      :options="activityTypeOptions"
                      class="!w-full"
                    />
                  </Form.Item>
                  <Form.Item label="活动标签" required>
                    <Select
                      v-model:value="detail.ActSign as number"
                      :disabled="currentLangIndex !== 0"
                      :options="activityTagOptions"
                      class="!w-full"
                    />
                  </Form.Item>
                  <Form.Item label="排序（0~999）" required>
                    <InputNumber
                      v-model:value="detail.RankSort as number"
                      :disabled="currentLangIndex !== 0"
                      :min="0"
                      :max="999"
                      class="!w-full"
                    />
                  </Form.Item>
                  <Form.Item label="红点提示" required>
                    <Select
                      v-model:value="detail.RedDotNotification as number"
                      :disabled="currentLangIndex !== 0"
                      :options="redDotOptions"
                      class="!w-full"
                    />
                  </Form.Item>
                </div>
              </Form>
            </Card>

            <Card size="small" class="section-card" title="VIP 返水配置">
              <Table
                :columns="configColumns"
                :data-source="configRows"
                :pagination="false"
                :scroll="{ x: 900 }"
                :row-key="(row) => String(row.VipLevel)"
                size="small"
              >
                <template #bodyCell="{ column, record, index }">
                  <Button
                    v-if="column.key === 'action' && canEditConfig"
                    :disabled="currentLangIndex !== 0"
                    type="link"
                    @click="openConfig(record, index)"
                  >
                    设置
                  </Button>
                </template>
              </Table>
            </Card>

            <Card
              v-if="canViewRules || canAddRule"
              size="small"
              class="section-card"
            >
              <template #title>游戏显示配置</template>
              <template #extra>
                <Button
                  v-if="canAddRule"
                  :disabled="currentLangIndex !== 0"
                  type="primary"
                  @click="openRule()"
                >
                  新增
                </Button>
              </template>
              <Table
                v-if="canViewRules"
                :columns="ruleColumns"
                :data-source="currentLang.Rule"
                :pagination="false"
                :scroll="{ x: 900 }"
                :row-key="(row) => String(row.Id ?? row.VipLevel ?? '')"
                size="small"
              >
                <template #bodyCell="{ column, record, index }">
                  <Space v-if="column.key === 'sort'" :size="0">
                    <Button
                      type="link"
                      :disabled="index === 0 || currentLangIndex !== 0"
                      @click="moveRule(index, -1)"
                    >
                      ↑
                    </Button>
                    <Button
                      type="link"
                      :disabled="
                        index === currentLang.Rule.length - 1 ||
                        currentLangIndex !== 0
                      "
                      @click="moveRule(index, 1)"
                    >
                      ↓
                    </Button>
                  </Space>
                  <Space v-if="column.key === 'action'" :size="0">
                    <Button
                      v-if="canEditRules"
                      type="link"
                      @click="openRule(record, index)"
                    >
                      编辑
                    </Button>
                    <Button
                      v-if="
                        canEditRules &&
                        Number(record.Id) !== MAX_REBATE_ID
                      "
                      danger
                      :disabled="currentLangIndex !== 0"
                      type="link"
                      @click="deleteRule(index)"
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </Table>
            </Card>

            <Card size="small" class="section-card" title="活动配置">
              <div class="image-grid">
                <Form.Item label="活动主题图 · 原生">
                  <VoucherImageField
                    v-model="currentLang.Banner2 as string"
                    dimension-hint="PNG，建议 1500×1784，500K 内"
                    :disabled="Number(currentLang.IsActive) !== 1"
                    @update:model-value="
                      (value) => updateMediaHeight('BannerParam2', value)
                    "
                  />
                </Form.Item>
                <Form.Item label="活动主题图 · PC">
                  <VoucherImageField
                    v-model="currentLang.Banner3 as string"
                    dimension-hint="PNG，建议 3840×1200，1M 内"
                    :disabled="Number(currentLang.IsActive) !== 1"
                    :max-size-kb="1024"
                    @update:model-value="
                      (value) => updateMediaHeight('BannerParam3', value)
                    "
                  />
                </Form.Item>
                <Form.Item label="活动列表图 · 原生">
                  <VoucherImageField
                    v-model="currentLang.Image2 as string"
                    dimension-hint="PNG，建议 1404×560，500K 内"
                    :disabled="Number(currentLang.IsActive) !== 1"
                    @update:model-value="
                      (value) => updateMediaHeight('Param2', value)
                    "
                  />
                </Form.Item>
                <Form.Item label="活动列表图 · PC">
                  <VoucherImageField
                    v-model="currentLang.Image3 as string"
                    dimension-hint="PNG，建议 1910×284，1M 内"
                    :disabled="Number(currentLang.IsActive) !== 1"
                    :max-size-kb="1024"
                    @update:model-value="
                      (value) => updateMediaHeight('Param3', value)
                    "
                  />
                </Form.Item>
              </div>
              <Form layout="vertical">
                <Form.Item label="活动内容（结构化 JSON）">
                  <Input.TextArea
                    v-model:value="multiDescText"
                    :rows="7"
                    @blur="
                      updateStructuredContent('MultiDesc', multiDescText)
                    "
                  />
                </Form.Item>
                <Form.Item label="活动规则（结构化 JSON）">
                  <Input.TextArea
                    v-model:value="multiRuleText"
                    :rows="7"
                    @blur="
                      updateStructuredContent('MultiRule', multiRuleText)
                    "
                  />
                </Form.Item>
              </Form>
            </Card>

            <div class="sticky-save">
              <Button
                v-if="canSave"
                :loading="saving"
                type="primary"
                size="large"
                @click="saveAll"
              >
                保存返水方案
              </Button>
            </div>
          </template>
        </div>
      </div>
      <div v-else class="py-16 text-center text-gray-400">暂无返水方案</div>
    </Spin>

    <Modal
      v-model:open="renameVisible"
      :confirm-loading="saving"
      title="修改方案名称"
      @ok="saveRename"
    >
      <Form layout="vertical" class="pt-3">
        <Form.Item label="方案名称" required>
          <Input v-model:value="renameName" :maxlength="50" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="configVisible"
      :confirm-loading="saving"
      title="设置 VIP 返水配置"
      width="900px"
      @ok="saveConfig"
    >
      <Form layout="vertical" class="pt-3">
        <div class="form-grid">
          <Form.Item label="周期最高返水（元）" required>
            <InputNumber
              v-model:value="configForm.MaxWater"
              :min="0"
              :max="2_100_000_000"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="最低流水要求（元）" required>
            <InputNumber
              v-model:value="configForm.MinTurnover"
              :min="0"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="默认返水比例" required>
            <InputNumber
              v-model:value="configForm.DefaultWater"
              :min="0"
              :max="100"
              :precision="2"
              addon-after="%"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="领取流水倍数" required>
            <InputNumber
              v-model:value="configForm.MinTurnoverMultiple"
              :min="0"
              addon-after="倍"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="最低返水比例">
            <InputNumber
              v-model:value="configForm.WaterMin"
              :min="0"
              :max="100"
              :precision="2"
              addon-after="%"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="最高返水比例">
            <InputNumber
              v-model:value="configForm.WaterMax"
              :min="0"
              :max="100"
              :precision="2"
              addon-after="%"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="平均返水比例">
            <InputNumber
              v-model:value="configForm.WaterAvg"
              :min="0"
              :max="100"
              :precision="2"
              addon-after="%"
              class="!w-full"
            />
          </Form.Item>
        </div>
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span class="font-medium">游戏返水比例</span>
          <Space wrap>
            <Select
              v-model:value="gamesToAdd"
              :options="addableGameOptions"
              mode="multiple"
              show-search
              placeholder="批量选择游戏"
              class="!w-72"
            />
            <Button :disabled="gamesToAdd.length === 0" @click="addSelectedGames">
              批量添加
            </Button>
            <Button @click="addGameRatio">添加一行</Button>
          </Space>
        </div>
        <div class="mb-3 flex flex-wrap items-center gap-2 rounded bg-gray-50 p-3">
          <Checkbox
            :checked="
              gameRatios.length > 0 &&
              gameRatios.every((item) => item.Checked)
            "
            @change="(event) => selectAllRatios(event.target.checked)"
          >
            全选
          </Checkbox>
          <InputNumber
            v-model:value="batchRatio"
            :min="0"
            :max="100"
            :precision="2"
            addon-after="%"
            class="!w-40"
          />
          <Button @click="updateSelectedRatios('set')">批量设定</Button>
          <Button @click="updateSelectedRatios('increase')">批量上调</Button>
          <Button @click="updateSelectedRatios('decrease')">批量下调</Button>
        </div>
        <div class="mb-3 grid grid-cols-3 gap-2 text-xs md:grid-cols-6">
          <Tag>已设置：{{ ratioStats.set }}</Tag>
          <Tag>值为 0：{{ ratioStats.zero }}</Tag>
          <Tag>未设置：{{ ratioStats.notSet }}</Tag>
          <Tag>最小：{{ ratioStats.minimum.toFixed(2) }}%</Tag>
          <Tag>最大：{{ ratioStats.maximum.toFixed(2) }}%</Tag>
          <Tag>平均：{{ ratioStats.average.toFixed(2) }}%</Tag>
        </div>
        <div
          v-for="(item, index) in gameRatios"
          :key="index"
          class="mb-2 flex gap-2"
        >
          <Checkbox v-model:checked="item.Checked" />
          <Select
            v-model:value="item.GameId"
            :options="gameOptions"
            show-search
            class="flex-1"
            placeholder="选择游戏"
          />
          <InputNumber
            v-model:value="item.Percent"
            :min="0"
            :max="100"
            :precision="2"
            addon-after="%"
            class="!w-44"
          />
          <Button danger @click="gameRatios.splice(index, 1)">删除</Button>
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="ruleVisible"
      :confirm-loading="saving"
      :title="ruleMode === 'add' ? '新增返水规则' : '编辑返水规则'"
      width="620px"
      @ok="saveRule"
    >
      <Form layout="vertical" class="pt-3">
        <Form.Item
          :label="
            Number(ruleForm.Id) === MAX_REBATE_ID
              ? '最大返水'
              : '返水配置类型'
          "
          required
        >
          <Input v-model:value="ruleForm.Name as string" :maxlength="32" />
        </Form.Item>
        <div class="form-grid">
          <Form.Item
            v-for="level in vipLevels"
            :key="level.VipLevelId"
            :label="level.VipLevelName"
            required
          >
            <InputNumber
              v-model:value="
                ruleForm[`Level${level.VipLevelId}`] as number
              "
              :min="0"
              :max="
                Number(ruleForm.Id) === MAX_REBATE_ID
                  ? 2_100_000_000
                  : 100
              "
              :precision="Number(ruleForm.Id) === MAX_REBATE_ID ? 2 : 2"
              :addon-after="
                Number(ruleForm.Id) === MAX_REBATE_ID ? '元' : '%'
              "
              :disabled="currentLangIndex !== 0"
              class="!w-full"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  </div>
  <div v-else class="py-16 text-center text-gray-400">
    无返水配置查看权限
  </div>
</template>

<style scoped>
.query-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  margin-bottom: 14px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.scheme-layout {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.scheme-nav {
  position: sticky;
  top: 12px;
  width: 220px;
  max-height: calc(100vh - 220px);
  overflow: auto;
}

.section-card {
  margin-bottom: 16px;
  border-radius: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 0 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 12px 20px;
}

.sticky-save {
  position: sticky;
  bottom: 0;
  z-index: 5;
  padding: 14px;
  text-align: center;
  background: hsl(var(--background) / 92%);
  border-top: 1px solid hsl(var(--border));
  backdrop-filter: blur(8px);
}

@media (max-width: 1100px) {
  .scheme-layout {
    flex-direction: column;
  }

  .scheme-nav {
    position: static;
    width: 100%;
  }

  .form-grid,
  .image-grid {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}
</style>
