<script lang="ts" setup>
import type { FormProps } from 'ant-design-vue';

import type {
  PackageColorThemeItem,
  PackageDetail,
  PackageFormPayload,
  PackageId,
  PackageLanguage,
  PackageResourceItem,
} from '#/types/package-config';
import type { GameInfo } from '#/utils/game-config';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
} from 'vue-router';

import { Page } from '@vben/common-ui';
import { preferences } from '@vben/preferences';

import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  List,
  message,
  Modal,
  Pagination,
  Radio,
  Result,
  Row,
  Space,
  Spin,
  Steps,
  Tabs,
  Tag,
  Typography,
} from 'ant-design-vue';

import { getProjectConfigApi } from '#/api/core/project';
import {
  createPackageApi,
  fetchPackageColorThemeDetailListApi,
  fetchPackageColorThemeListApi,
  fetchPackageDetailApi,
  fetchPackageResourceListApi,
  updateNoviceGuidanceApi,
  updatePackageApi,
} from '#/api/gameManage/package';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useProjectConfig } from '#/composables/use-project-config';
import { useAuthStore } from '#/store/auth';
import { createRequestHash } from '#/utils/crypto';
import { createPackagePreviewUrl } from '#/utils/package-preview';

defineOptions({ name: 'AddPackage' });

type DeviceKind = 'app' | 'pc';
type EditorGame = GameInfo & {
  classifications: string[];
  id: string;
  isNoLobby: boolean;
  layout: number;
  name: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  'en-US': 'English',
  'fil-PH': 'Tagalog',
  'id-ID': 'Bahasa Indonesia',
  'th-TH': 'ภาษาไทย',
  'vi-VN': 'Tiếng Việt',
  'zh-CN': '简体中文',
  'zh-HK': '繁體中文',
};
const DEFAULT_SORT_ORDER = ['5', '6', '2', '1', '4', '7', '8'];
const EMPTY_CS_LINE_CONFIG = {
  normalLine: {
    csType: 1,
    customerServiceName2: '',
    enable: true,
    vipBegin: 0,
    vipEnd: 0,
  },
  specialLine: {
    csType: 1,
    customerServiceName1: '',
    enable: true,
    vipBegin: 0,
    vipEnd: 0,
  },
};
const STEP_ITEMS = [
  { title: '支持语言' },
  { title: '产品风格' },
  { title: 'APP / H5 皮肤' },
  { title: 'PC 皮肤' },
  { title: '产品信息' },
  { title: '场馆游戏' },
  { title: '预览确认' },
];

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { adminInfo, checkPermission } = useCloudPermission();
const { ensureGameConfig } = useGameConfig();
const { projectConfig } = useProjectConfig();

const packageId = computed(() => {
  const value = route.query.id;
  return Array.isArray(value) ? value[0] : value;
});
const isEdit = computed(
  () => packageId.value !== undefined && packageId.value !== 'undefined',
);
const canAccess = computed(() =>
  isEdit.value ? checkPermission(10_778) : checkPermission(10_776),
);
const pageTitle = computed(() => (isEdit.value ? '编辑产品' : '创建产品'));
const pageDescription = computed(() =>
  isEdit.value
    ? '修改产品语言、皮肤、基础信息与场馆配置'
    : '按步骤完成产品语言、皮肤、基础信息与场馆配置',
);

const activeStep = ref(0);
const loading = ref(false);
const saving = ref(false);
const resourcesLoading = ref(false);
const validationMessage = ref('');
const fatalInitError = ref('');
const initialized = ref(false);
const initialSignature = ref('');
const resourceRequestId = ref(0);
const initializationRequestId = ref(0);
const rawDetail = ref<null | PackageDetail>(null);
const appResources = ref<PackageResourceItem[]>([]);
const pcResources = ref<PackageResourceItem[]>([]);
const iconResources = ref<PackageResourceItem[]>([]);
const allGames = ref<EditorGame[]>([]);
const selectedGameIds = ref<string[]>([]);
const selectedNoLobbyIds = ref<string[]>([]);
const categoryOrder = ref<string[]>([]);
const gameMenuStyle = reactive<Record<string, number>>({});
const themeModalOpen = ref(false);
const themeLoading = ref(false);
const themeDevice = ref<DeviceKind>('app');
const colorThemeFamilies = ref<PackageColorThemeItem[]>([]);
const colorThemeDetails = ref<PackageColorThemeItem[]>([]);
const activeThemeId = ref<'' | PackageId>('');
const previewColorId = ref<'' | PackageId>('');
const appColorByStyle = reactive<Record<string, PackageId>>({});
const pcColorByStyle = reactive<Record<string, PackageId>>({});
const appPage = ref(1);
const pcPage = ref(1);
const appTotal = ref(0);
const pcTotal = ref(0);
const activeIconStyle = ref('');
const activeGameCategory = ref('0');
const fixedTemplateStyle = ref(2);
const samePcName = ref(true);

const form = reactive({
  CsLineConfig: structuredClone(EMPTY_CS_LINE_CONFIG) as Record<
    string,
    unknown
  >,
  Description: '',
  GameTemplate: 0,
  Icon: '' as '' | PackageId,
  Languages: [] as string[],
  PackageAlias: '',
  PackageName: '',
  StyleSetting: 1,
  StyleType: '' as number | string,
  StyleTypePc: '' as number | string,
  appColorId: '' as '' | PackageId,
  appColorValue: '' as '' | PackageId,
  pcColorId: '' as '' | PackageId,
  pcColorValue: '' as '' | PackageId,
});
const productRules: FormProps['rules'] = {
  Icon: [{ message: '请选择产品图标', required: true, trigger: 'change' }],
  PackageName: [
    { message: '请填写 APP 名称', required: true, trigger: 'blur' },
    { max: 255, message: 'APP 名称不能超过 255 个字符', trigger: 'blur' },
  ],
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseComma(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function compareIds(left: string, right: string) {
  const a = Number(left);
  const b = Number(right);
  if (Number.isFinite(a) && Number.isFinite(b)) return a - b;
  return left.localeCompare(right, undefined, { numeric: true });
}

function resolveUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(projectConfig.value?.CommonResourceDomainUrl || '');
  if (!base) return path;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function getAdminRecord() {
  return (adminInfo.value?.Admin || {}) as Record<string, unknown>;
}

function getAdminId() {
  const account = adminInfo.value?.Account;
  if (account && typeof account === 'object' && account.AdminId != null) {
    return account.AdminId;
  }
  const accountInfo = projectConfig.value?.AccountInfo as
    | Record<string, unknown>
    | undefined;
  const admin = getAdminRecord();
  return (accountInfo?.AdminId ?? admin.AdminId ?? admin.Id) as
    | PackageId
    | undefined;
}

function configuredLanguageCodes() {
  const admin = getAdminRecord();
  return parseComma(admin.Languages);
}

const languageOptions = computed(() => {
  const values = new Set(configuredLanguageCodes());
  // An edited package may contain a language removed from the administrator.
  form.Languages.forEach((code) => values.add(code));
  return [...values].toSorted().map((value) => ({
    label: LANGUAGE_NAMES[value] || value,
    value,
  }));
});

const skinFamilies = computed(() => {
  const configured = projectConfig.value?.AvailablePackageSkin;
  const values = Array.isArray(configured)
    ? configured.map(Number).filter((value) => Number.isFinite(value))
    : parseComma(configured)
        .map(Number)
        .filter((value) => Number.isFinite(value));
  return [...new Set(values)].toSorted((a, b) => a - b);
});

const skinConfigurationMissing = computed(
  () => skinFamilies.value.length === 0,
);

const normalGames = computed(() =>
  allGames.value.filter((game) => !game.isNoLobby),
);
const noLobbyGames = computed(() =>
  allGames.value.filter((game) => game.isNoLobby),
);
const selectedGames = computed(() =>
  selectedGameIds.value.flatMap((id) => {
    const game = allGames.value.find((item) => item.id === id);
    return game ? [game] : [];
  }),
);
const selectedNoLobbyGames = computed(() =>
  selectedNoLobbyIds.value.flatMap((id) => {
    const game = allGames.value.find((item) => item.id === id);
    return game ? [game] : [];
  }),
);
const categoryOptions = computed(() => {
  const config = gameConfigSnapshot.value?.GroupPlatformGameType || {};
  const translations = gameConfigSnapshot.value?.GameTypeLangGroup || {};
  const locale = String(preferences.app.locale || '');
  return categoryOrder.value.map((id) => ({
    id,
    name: String(
      translations[id]?.Langs?.find((item) => item.Lang === locale)?.Name ||
        config[id]?.name ||
        `分类 ${id}`,
    ),
  }));
});
const gameCategoryTabs = computed(() => [
  { id: '0', name: '全部' },
  ...categoryOptions.value,
]);
const filteredNormalGames = computed(() =>
  activeGameCategory.value === '0'
    ? normalGames.value
    : normalGames.value.filter(
        (game) => game.classifications[0] === activeGameCategory.value,
      ),
);
const activeCategoryGameCount = computed(() =>
  activeGameCategory.value === '0'
    ? selectedGames.value.length
    : gameCategoryCount(activeGameCategory.value),
);
const canUseShortFixedTemplate = computed(
  () => activeCategoryGameCount.value > 2 && activeCategoryGameCount.value < 5,
);
const iconStyles = computed(() =>
  [
    ...new Set(
      iconResources.value.map((item) => String(item.PictureStyle ?? '')),
    ),
  ]
    .filter(Boolean)
    .toSorted(compareIds),
);
const visibleIcons = computed(() =>
  activeIconStyle.value
    ? iconResources.value.filter(
        (item) => String(item.PictureStyle ?? '') === activeIconStyle.value,
      )
    : iconResources.value,
);
const visibleAppResources = computed(() =>
  appResources.value.slice((appPage.value - 1) * 5, appPage.value * 5),
);
const visiblePcResources = computed(() =>
  pcResources.value.slice((pcPage.value - 1) * 3, pcPage.value * 3),
);
const selectedIcon = computed(() =>
  iconResources.value.find((item) => String(item.Id) === String(form.Icon)),
);
const previewUrl = computed(() => {
  const payload = buildPayload();
  return createPackagePreviewUrl(
    projectConfig.value?.GameTestPreviewUrl,
    {
      ...payload,
      MusicData: rawDetail.value?.MusicData,
      SkinColor: form.appColorValue,
      SkinColorPc: form.pcColorValue,
    },
    (projectConfig.value?.AgentAccount as Record<string, unknown> | undefined)
      ?.Id,
  );
});
const themePreviewUrl = computed(() => {
  const base = String(projectConfig.value?.GameTestPreviewUrl || '');
  if (!base) return '';
  const color = Number(previewColorId.value) === 1 ? 0 : previewColorId.value;
  if (themeDevice.value === 'app') {
    const root = base.endsWith('/') ? base : `${base}/`;
    return `${root}mobile/100_${color}/?type=3&StyleType=100_${color}&hide_scroll=1`;
  }
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}pc/?type=3&StyleTypePc=${color}&hide_scroll=1`;
});
const currentColorDetails = computed(() =>
  colorThemeDetails.value.filter(
    (item) => String(item.ThemeId) === String(activeThemeId.value),
  ),
);

const gameConfigSnapshot = ref<Awaited<ReturnType<typeof ensureGameConfig>>>();

function normalizeClassifications(game: GameInfo) {
  const value = game.ClientClassify;
  if (Array.isArray(value)) return value.map(String);
  return parseComma(value);
}

function gameCategoryCount(categoryId: string) {
  return selectedGames.value.filter(
    (game) =>
      categoryId === '0' || game.classifications.includes(String(categoryId)),
  ).length;
}

function initializeCategoryOrder(detailOrder: unknown) {
  const config = gameConfigSnapshot.value?.GroupPlatformGameType || {};
  const ids = Object.values(config)
    .map((item) => String(item.id ?? ''))
    .filter(Boolean);
  const uniqueIds = [...new Set(ids)];
  const fallback = uniqueIds.toSorted((a, b) => {
    const ai = DEFAULT_SORT_ORDER.indexOf(a);
    const bi = DEFAULT_SORT_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return compareIds(a, b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const loaded = parseComma(detailOrder);
  categoryOrder.value = [
    ...loaded,
    ...fallback.filter((id) => !loaded.includes(id)),
  ];
}

function initializeGames(detail?: PackageDetail) {
  const config = gameConfigSnapshot.value;
  const loadedIds = parseComma(detail?.Games);
  const platformKeys = parseComma(projectConfig.value?.MyPlatformGameType);
  const allowedPlatformNames = new Set(
    platformKeys
      .map((key) => config?.platformGameType[String(key)])
      .filter(Boolean),
  );
  const normalized = Object.entries(config?.games || {})
    .filter(
      ([id, game]) =>
        Number(game.resType) !== 9 &&
        (Number(game.resType) !== 8 ||
          allowedPlatformNames.has(String(game.gameName || '')) ||
          loadedIds.includes(id)),
    )
    .map(([id, game]) => ({
      ...game,
      classifications: normalizeClassifications(game),
      id,
      isNoLobby: Number(game.LobbyType) === 13,
      layout: 2,
      name: String(game.gameName || id),
    }))
    .toSorted((a, b) => compareIds(a.id, b.id));

  for (const id of loadedIds) {
    if (!normalized.some((game) => game.id === id)) {
      normalized.push({
        classifications: [],
        id,
        isNoLobby: false,
        layout: 2,
        name: `游戏 ${id}`,
      });
    }
  }
  allGames.value = normalized;

  const layouts = parseComma(detail?.GamesLayoutType);
  loadedIds.forEach((id, index) => {
    const game = allGames.value.find((item) => item.id === id);
    if (game) game.layout = Number(layouts[index]) === 1 ? 1 : 2;
  });
  selectedGameIds.value = loadedIds.filter(
    (id) => !allGames.value.find((game) => game.id === id)?.isNoLobby,
  );
  selectedNoLobbyIds.value = loadedIds.filter(
    (id) => allGames.value.find((game) => game.id === id)?.isNoLobby,
  );
}

async function fetchResources() {
  const requestId = ++resourceRequestId.value;
  const family = form.StyleSetting;
  resourcesLoading.value = true;
  const common = { AgentId: getAdminId(), Page: 1, PageSize: 1000 };
  const [appState, pcState, iconState] = await Promise.allSettled([
    fetchPackageResourceListApi({
      ...common,
      PictureTheme: family,
      PictureType: 12,
    }),
    fetchPackageResourceListApi({
      ...common,
      PictureTheme: family,
      PictureType: 15,
    }),
    fetchPackageResourceListApi({ ...common, PictureType: 3 }),
  ]);
  if (requestId !== resourceRequestId.value || family !== form.StyleSetting)
    return;
  try {
    if (appState.status === 'fulfilled') {
      const appResult = appState.value;
      appResources.value = [...(appResult?.Items || [])].toSorted((a, b) =>
        compareIds(
          String(a.PictureStyle ?? a.Id ?? ''),
          String(b.PictureStyle ?? b.Id ?? ''),
        ),
      );
      appTotal.value = appResources.value.length;
    } else {
      appResources.value = [];
      appTotal.value = 0;
      message.error('APP / H5 皮肤加载失败');
    }
    if (pcState.status === 'fulfilled') {
      const pcResult = pcState.value;
      pcResources.value = [...(pcResult?.Items || [])].toSorted((a, b) =>
        compareIds(
          String(a.PictureStyle ?? a.Id ?? ''),
          String(b.PictureStyle ?? b.Id ?? ''),
        ),
      );
      pcTotal.value = pcResources.value.length;
    } else {
      pcResources.value = [];
      pcTotal.value = 0;
      message.error('PC 皮肤加载失败');
    }
    if (iconState.status === 'fulfilled') {
      const iconResult = iconState.value;
      iconResources.value = [...(iconResult?.Items || [])].toSorted((a, b) =>
        compareIds(String(a.Id ?? ''), String(b.Id ?? '')),
      );
      activeIconStyle.value = String(
        iconResources.value.find(
          (item) => String(item.Id) === String(form.Icon),
        )?.PictureStyle ??
          iconResources.value[0]?.PictureStyle ??
          '',
      );
    } else {
      iconResources.value = [];
      message.error('产品图标加载失败');
    }
    if (!form.StyleType && appResources.value[0]) {
      form.StyleType = String(
        appResources.value[0].PictureStyle ?? appResources.value[0].Id ?? '',
      );
    }
    if (!form.StyleTypePc && pcResources.value[0]) {
      form.StyleTypePc = String(
        pcResources.value[0].PictureStyle ?? pcResources.value[0].Id ?? '',
      );
    }
    if (
      !form.Icon &&
      !isEdit.value &&
      iconResources.value[0]?.Id !== undefined
    ) {
      form.Icon = iconResources.value[0].Id;
    }
  } finally {
    if (requestId === resourceRequestId.value) resourcesLoading.value = false;
  }
}

function applyDetail(detail: PackageDetail) {
  rawDetail.value = { ...detail };
  form.PackageName = String(detail.PackageName || '');
  form.PackageAlias = String(detail.PackageAlias || '');
  samePcName.value = !form.PackageAlias;
  form.Description = String(detail.Description || '');
  form.Icon = detail.Icon ?? '';
  form.StyleSetting = Number(detail.StyleSetting || skinFamilies.value[0] || 0);
  form.StyleType =
    detail.StyleType === undefined || detail.StyleType === null
      ? ''
      : String(detail.StyleType);
  form.StyleTypePc =
    detail.StyleTypePc === undefined || detail.StyleTypePc === null
      ? ''
      : String(detail.StyleTypePc);
  form.GameTemplate = Number(detail.GameTemplate) === 1 ? 1 : 0;
  form.Languages = parseJson<PackageLanguage[]>(detail.Languages, [])
    .map((item) => String(item?.value || ''))
    .filter(Boolean);
  form.CsLineConfig = parseJson<Record<string, unknown>>(
    detail.CsLineConfig,
    structuredClone(EMPTY_CS_LINE_CONFIG),
  );
  const appColorId =
    detail.SkinColor ?? detail.PackageColorStyleId ?? detail.PackageColorStyle;
  form.appColorId =
    typeof appColorId === 'string' || typeof appColorId === 'number'
      ? appColorId
      : '';
  form.appColorValue = form.appColorId;
  const pcColorId = detail.SkinColorPc ?? detail.PackageColorStylePc;
  form.pcColorId =
    typeof pcColorId === 'string' || typeof pcColorId === 'number'
      ? pcColorId
      : '';
  form.pcColorValue = form.pcColorId;
  if (form.appColorId !== '')
    appColorByStyle[String(form.StyleType)] = form.appColorId;
  if (form.pcColorId !== '')
    pcColorByStyle[String(form.StyleTypePc)] = form.pcColorId;

  Object.assign(
    gameMenuStyle,
    parseJson<Record<string, number>>(detail.GameMenuStyle, {}),
  );
  fixedTemplateStyle.value =
    Number(Object.values(gameMenuStyle).at(-1)) === 1 ? 1 : 2;
  initializeCategoryOrder(detail.SortIds);
  initializeGames(detail);
}

function serializeLangText(value: unknown) {
  if (value === undefined || value === null || value === '') return value;
  if (typeof value !== 'string') {
    return JSON.stringify(Array.isArray(value) ? value : Object.values(value));
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return JSON.stringify(parsed);
    if (parsed && typeof parsed === 'object') {
      return JSON.stringify(Object.values(parsed));
    }
    return JSON.stringify(parsed);
  } catch {
    return value;
  }
}

function buildPayload(): PackageFormPayload {
  const orderedMain = selectedGames.value;
  const orderedNoLobby = selectedNoLobbyGames.value;
  const orderedGames = [...orderedMain, ...orderedNoLobby];
  const mainLayouts =
    form.GameTemplate === 1
      ? orderedMain.map((game) => game.layout).join(',')
      : '';
  const noLobbyLayouts = orderedNoLobby.map(() => 1).join(',');
  const fixedMenuStyle = Object.fromEntries(
    categoryOrder.value.map((_, index) => [
      String(index + 1),
      fixedTemplateStyle.value,
    ]),
  );
  const original = rawDetail.value ? { ...rawDetail.value } : {};
  const payload: PackageFormPayload = {
    ...original,
    CsLineConfig: JSON.stringify(form.CsLineConfig),
    Description: form.Description.trim(),
    GameMenuStyle: JSON.stringify(
      form.GameTemplate === 0 ? fixedMenuStyle : {},
    ),
    Games: orderedGames.map((game) => game.id).join(','),
    // The old endpoint appends no-lobby layouts to the main layout string.
    // For a fixed template this intentionally preserves its leading comma.
    GamesLayoutType: noLobbyLayouts
      ? `${mainLayouts},${noLobbyLayouts}`
      : mainLayouts,
    GameTemplate: form.GameTemplate,
    Icon: form.Icon as PackageId,
    Languages: JSON.stringify(
      form.Languages.map((value) => ({
        label: LANGUAGE_NAMES[value] || value,
        value,
      })),
    ),
    LogoSetting: isEdit.value ? original.LogoSetting : '',
    PackageAlias: samePcName.value ? '' : form.PackageAlias.trim(),
    PackageName: form.PackageName.trim(),
    PackageType: Number(original.PackageType || 2),
    SortIds: [...categoryOrder.value],
    StyleSetting: form.StyleSetting,
    StyleType: form.StyleType,
    StyleTypePc: form.StyleTypePc,
  };
  delete payload.SkinColor;
  delete payload.SkinColorPc;
  delete payload.PackageColorStyle;
  delete payload.PackageColorStyleId;
  delete payload.PackageColorStylePc;
  if (form.appColorValue !== '') {
    payload.PackageColorStyle = form.appColorValue;
    payload.PackageColorStyleId = form.appColorId;
  }
  if (form.pcColorValue !== '') payload.PackageColorStylePc = form.pcColorValue;
  if (isEdit.value) {
    payload.Id = packageId.value as PackageId;
    if (original.LangText !== undefined) {
      payload.LangText = serializeLangText(original.LangText) as string;
    }
  } else {
    payload.Hash = createRequestHash();
  }
  return payload;
}

function validateStep(step = activeStep.value) {
  validationMessage.value = '';
  if (step === 0 && form.Languages.length === 0) {
    validationMessage.value = '请至少选择一种支持语言';
  } else if (step === 2 && !form.StyleType) {
    validationMessage.value = '请选择 APP / H5 皮肤';
  } else if (step === 4) {
    if (!form.PackageName.trim()) validationMessage.value = '请填写 APP 名称';
    else if (form.PackageName.trim().length > 255)
      validationMessage.value = 'APP 名称不能超过 255 个字符';
    else if (!samePcName.value && !form.PackageAlias.trim())
      validationMessage.value = '请填写 PC 名称';
    else if (form.PackageAlias.trim().length > 255)
      validationMessage.value = 'PC 名称不能超过 255 个字符';
    else if (!form.Icon) validationMessage.value = '请选择产品图标';
  } else if (step === 5 && selectedGameIds.value.length === 0) {
    validationMessage.value = '请至少选择一个常规场馆游戏';
  }
  return !validationMessage.value;
}

function nextStep() {
  if (!validateStep()) return;
  activeStep.value = Math.min(activeStep.value + 1, STEP_ITEMS.length - 1);
}

function previousStep() {
  validationMessage.value = '';
  activeStep.value = Math.max(activeStep.value - 1, 0);
}

function moveItem(list: string[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target]!, next[index]!];
  list.splice(0, list.length, ...next);
}

function toggleGame(game: EditorGame, checked: boolean) {
  const list = game.isNoLobby
    ? selectedNoLobbyIds.value
    : selectedGameIds.value;
  if (checked && !list.includes(game.id)) list.push(game.id);
  if (!checked) {
    const index = list.indexOf(game.id);
    if (index !== -1) list.splice(index, 1);
  }
}

function joinAllEligibleGames() {
  selectedGameIds.value = normalGames.value
    .filter((game) => Number(game.resType) === 8)
    .map((game) => game.id);
}

function chooseFamily(value: number) {
  if (form.StyleSetting === value) return;
  form.StyleSetting = value;
  appPage.value = 1;
  pcPage.value = 1;
  form.StyleType = '';
  form.StyleTypePc = '';
  form.appColorId = '';
  form.appColorValue = '';
  form.pcColorId = '';
  form.pcColorValue = '';
  void fetchResources();
}

function selectSkin(device: DeviceKind, value: number | string) {
  const normalizedValue = String(value);
  if (device === 'app') {
    form.StyleType = normalizedValue;
    const color = appColorByStyle[normalizedValue] ?? '';
    form.appColorId = color;
    form.appColorValue = color;
  } else {
    form.StyleTypePc = normalizedValue;
    const color = pcColorByStyle[normalizedValue] ?? '';
    form.pcColorId = color;
    form.pcColorValue = color;
  }
}

async function openThemePicker(device: DeviceKind) {
  themeDevice.value = device;
  themeModalOpen.value = true;
  themeLoading.value = true;
  try {
    const DeviceType = device === 'app' ? 0 : 1;
    const familyResult = await fetchPackageColorThemeListApi({ DeviceType });
    colorThemeFamilies.value = familyResult?.Items || [];
    const result = await fetchPackageColorThemeDetailListApi({
      DeviceType,
      ThemeId: '',
      Page: 1,
      PageSize: 999,
    });
    colorThemeDetails.value = (result?.Items || []).map((item) => ({
      ...item,
      Color: parseJson<Record<string, string>>(item.Color, {}),
    }));
    const selected =
      device === 'app'
        ? appColorByStyle[String(form.StyleType)]
        : pcColorByStyle[String(form.StyleTypePc)];
    activeThemeId.value =
      colorThemeDetails.value.find(
        (item) => String(item.Id) === String(selected),
      )?.ThemeId ??
      colorThemeFamilies.value[0]?.Id ??
      '';
    previewColorId.value = selected ?? currentColorDetails.value[0]?.Id ?? '';
  } catch {
    colorThemeFamilies.value = [];
    colorThemeDetails.value = [];
    message.error('配色模板加载失败');
  } finally {
    themeLoading.value = false;
  }
}

function selectColorTheme(theme: PackageColorThemeItem) {
  const id = theme.Id ?? '';
  if (themeDevice.value === 'app') {
    form.appColorId = id;
    form.appColorValue = id;
    if (id !== '') appColorByStyle[String(form.StyleType)] = id;
  } else {
    form.pcColorId = id;
    form.pcColorValue = id;
    if (id !== '') pcColorByStyle[String(form.StyleTypePc)] = id;
  }
  themeModalOpen.value = false;
}

function changeColorThemeFamily(id: PackageId) {
  activeThemeId.value = id;
  previewColorId.value =
    colorThemeDetails.value.find((item) => String(item.ThemeId) === String(id))
      ?.Id ?? '';
}

function saveSelectedColorTheme() {
  const selected = colorThemeDetails.value.find(
    (item) => String(item.Id) === String(previewColorId.value),
  );
  if (selected) selectColorTheme(selected);
}

function colorSwatches(theme: PackageColorThemeItem) {
  const colors = parseJson<Record<string, string>>(theme.Color, {});
  return [1, 2, 3, 4, 5].map(
    (index) => colors[`Color${index}`] || 'transparent',
  );
}

function resetEditorState() {
  rawDetail.value = null;
  Object.assign(form, {
    CsLineConfig: structuredClone(EMPTY_CS_LINE_CONFIG),
    Description: '',
    GameTemplate: 0,
    Icon: '',
    Languages: [],
    PackageAlias: '',
    PackageName: '',
    StyleSetting: 0,
    StyleType: '',
    StyleTypePc: '',
    appColorId: '',
    appColorValue: '',
    pcColorId: '',
    pcColorValue: '',
  });
  selectedGameIds.value = [];
  selectedNoLobbyIds.value = [];
  categoryOrder.value = [];
  appResources.value = [];
  pcResources.value = [];
  iconResources.value = [];
  Object.keys(gameMenuStyle).forEach((key) => delete gameMenuStyle[key]);
  Object.keys(appColorByStyle).forEach((key) => delete appColorByStyle[key]);
  Object.keys(pcColorByStyle).forEach((key) => delete pcColorByStyle[key]);
  samePcName.value = true;
  fixedTemplateStyle.value = 2;
  appPage.value = 1;
  pcPage.value = 1;
  activeGameCategory.value = '0';
  activeIconStyle.value = '';
}

async function submit() {
  if (fatalInitError.value || skinConfigurationMissing.value) return;
  if (![0, 2, 4, 5].every((step) => validateStep(step))) {
    message.error(validationMessage.value);
    return;
  }
  saving.value = true;
  try {
    const payload = buildPayload();
    const result = await (isEdit.value
      ? updatePackageApi(payload)
      : createPackageApi(payload));
    message.success(isEdit.value ? '产品编辑成功' : '产品创建成功');
    initialSignature.value = editorSignature.value;
    if (!isEdit.value) {
      const agent = projectConfig.value?.AgentAccount as
        | Record<string, unknown>
        | undefined;
      if (
        Number(agent?.NoviceGuidanceState) === 2 &&
        Number(adminInfo.value?.Admin?.AdminType) === 1 &&
        result?.Id != null
      ) {
        try {
          await updateNoviceGuidanceApi({
            NoviceGuidanceState: agent?.NoviceGuidanceState as number | string,
            PackageId: result.Id,
          });
          await Promise.all([authStore.fetchUserInfo(), getProjectConfigApi()]);
        } catch {
          message.warning('产品已创建，但新手引导状态刷新失败');
        }
      }
    }
    await router.push('/gameManage/inclusionDeploy');
  } finally {
    saving.value = false;
  }
}

async function initialize() {
  if (!canAccess.value) return;
  const initializationId = ++initializationRequestId.value;
  loading.value = true;
  initialized.value = false;
  fatalInitError.value = '';
  activeStep.value = 0;
  resetEditorState();
  try {
    gameConfigSnapshot.value = await ensureGameConfig();
    if (initializationId !== initializationRequestId.value) return;
    if (skinConfigurationMissing.value) {
      throw new Error('项目未配置 AvailablePackageSkin，无法创建或编辑产品');
    }
    initializeCategoryOrder(undefined);
    initializeGames();
    if (isEdit.value) {
      const detail = await fetchPackageDetailApi(packageId.value as PackageId);
      if (initializationId !== initializationRequestId.value) return;
      applyDetail(detail);
    } else {
      rawDetail.value = null;
      form.Languages = [];
      form.StyleSetting = skinFamilies.value[0]!;
      const vipLevels = projectConfig.value?.VIPLevelMap;
      const maxVip = Array.isArray(vipLevels)
        ? Math.max(vipLevels.length - 1, 0)
        : 0;
      (form.CsLineConfig.normalLine as Record<string, unknown>).vipEnd = maxVip;
      (form.CsLineConfig.specialLine as Record<string, unknown>).vipEnd =
        maxVip;
    }
    await fetchResources();
    if (initializationId !== initializationRequestId.value) return;
    initialized.value = true;
    initialSignature.value = editorSignature.value;
  } catch (error) {
    if (initializationId !== initializationRequestId.value) return;
    if (error instanceof Error) {
      fatalInitError.value = error.message;
    } else {
      fatalInitError.value = isEdit.value
        ? '产品详情加载失败'
        : '创建向导初始化失败';
    }
  } finally {
    if (initializationId === initializationRequestId.value) {
      loading.value = false;
    }
  }
}

const editorSignature = computed(() =>
  JSON.stringify({
    categoryOrder: categoryOrder.value,
    fixedTemplateStyle: fixedTemplateStyle.value,
    form,
    gameLayouts: selectedGames.value.map((game) => [game.id, game.layout]),
    samePcName: samePcName.value,
    selectedGameIds: selectedGameIds.value,
    selectedNoLobbyIds: selectedNoLobbyIds.value,
  }),
);
const isDirty = computed(
  () =>
    initialized.value &&
    initialSignature.value !== '' &&
    editorSignature.value !== initialSignature.value,
);

function handleStepChange(next: number) {
  if (next <= activeStep.value) {
    activeStep.value = next;
    return;
  }
  for (let step = activeStep.value; step < next; step += 1) {
    if (!validateStep(step)) return;
  }
  activeStep.value = next;
}

function leaveEditor() {
  if (saving.value) return;
  if (!isDirty.value) {
    void router.push('/gameManage/inclusionDeploy');
    return;
  }
  Modal.confirm({
    content: '当前修改尚未保存，确认离开？',
    onOk: () => {
      initialized.value = false;
      return router.push('/gameManage/inclusionDeploy');
    },
    title: '放弃修改',
  });
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value || saving.value) return;
  event.preventDefault();
  event.returnValue = '';
}

onBeforeRouteLeave(() => {
  if (saving.value) return false;
  if (!isDirty.value || !initialized.value) return true;
  return window.confirm('当前修改尚未保存，确认离开？');
});
onBeforeRouteUpdate((to, from) => {
  if (saving.value) return false;
  if (to.query.id !== from.query.id && isDirty.value && initialized.value) {
    return window.confirm('当前修改尚未保存，确认切换产品？');
  }
  return true;
});
watch(
  () => [route.path, packageId.value] as const,
  ([path]) => {
    if (path.endsWith('/packageCreate')) {
      void router.replace({
        path: '/gameManage/addPackage',
        query: route.query,
      });
      return;
    }
    void initialize();
  },
  { immediate: true },
);
onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onBeforeUnmount(() =>
  window.removeEventListener('beforeunload', handleBeforeUnload),
);
</script>

<template>
  <Page v-if="canAccess" :description="pageDescription" :title="pageTitle">
    <Card :bordered="false">
      <Spin :spinning="loading" tip="正在加载产品配置…">
        <Alert
          v-if="fatalInitError || skinConfigurationMissing"
          class="mb-4"
          :message="fatalInitError || '项目未配置 AvailablePackageSkin'"
          show-icon
          type="error"
        >
          <template #description>
            <Space wrap>
              <span>无法安全初始化产品皮肤，请修复项目配置后重试。</span>
              <Button size="small" @click="initialize">重试</Button>
              <Button size="small" @click="leaveEditor">返回产品列表</Button>
            </Space>
          </template>
        </Alert>
        <Steps
          :current="activeStep"
          class="wizard-steps"
          :items="STEP_ITEMS"
          size="small"
          @change="handleStepChange"
        />

        <Alert
          v-if="validationMessage"
          class="mt-4"
          closable
          :message="validationMessage"
          show-icon
          type="error"
          @close="validationMessage = ''"
        />

        <div
          v-if="!fatalInitError && !skinConfigurationMissing"
          class="wizard-content"
        >
          <section v-if="activeStep === 0">
            <Typography.Title :level="5">选择支持语言</Typography.Title>
            <Typography.Paragraph type="secondary">
              可选语言严格来自当前管理员配置；创建产品时不预选。
            </Typography.Paragraph>
            <Checkbox.Group v-model:value="form.Languages">
              <Space wrap>
                <Checkbox
                  v-for="language in languageOptions"
                  :key="language.value"
                  :value="language.value"
                >
                  {{ language.label }}（{{ language.value }}）
                </Checkbox>
              </Space>
            </Checkbox.Group>
          </section>

          <section v-else-if="activeStep === 1">
            <Typography.Title :level="5">选择产品风格系列</Typography.Title>
            <Typography.Paragraph type="secondary">
              可用系列严格来自项目 AvailablePackageSkin。
            </Typography.Paragraph>
            <Row :gutter="[12, 12]">
              <Col
                v-for="family in skinFamilies"
                :key="family"
                :lg="8"
                :md="12"
                :xs="24"
              >
                <button
                  class="choice-card"
                  :class="{ selected: form.StyleSetting === family }"
                  type="button"
                  @click="chooseFamily(family)"
                >
                  <span class="choice-number">{{ family }}</span>
                  <span>
                    <strong>风格系列 {{ family }}</strong>
                    <small>
                      {{
                        family === 1
                          ? '综合风格'
                          : family === 2
                            ? '体育风格'
                            : '扩展风格'
                      }}
                    </small>
                  </span>
                </button>
              </Col>
            </Row>
          </section>

          <section v-else-if="activeStep === 2">
            <div class="section-heading">
              <div>
                <Typography.Title :level="5">APP / H5 皮肤</Typography.Title>
                <Typography.Text type="secondary">
                  资源类型 PictureType 12
                </Typography.Text>
              </div>
              <Button
                v-if="
                  checkPermission(12287) && String(form.StyleType) === '100'
                "
                @click="openThemePicker('app')"
              >
                快速配色
              </Button>
            </div>
            <Spin :spinning="resourcesLoading">
              <Radio.Group
                :value="form.StyleType"
                class="resource-grid"
                @change="selectSkin('app', $event.target.value)"
              >
                <Radio
                  v-for="item in visibleAppResources"
                  :key="String(item.Id)"
                  class="resource-option"
                  :value="item.PictureStyle ?? item.Id"
                >
                  <Image
                    :fallback="undefined"
                    :preview="false"
                    :src="resolveUrl(item.PictureIp || item.SmallPictureIp)"
                  />
                  <span
                    >皮肤
                    {{ item.PictureStyle ?? item.PictureName ?? item.Id }}</span
                  >
                </Radio>
              </Radio.Group>
              <Pagination
                v-if="appTotal > 5"
                v-model:current="appPage"
                class="mt-4"
                :page-size="5"
                :show-size-changer="false"
                :total="appTotal"
              />
              <Empty
                v-if="!resourcesLoading && appResources.length === 0"
                description="暂无 APP / H5 皮肤资源"
              />
            </Spin>
          </section>

          <section v-else-if="activeStep === 3">
            <div class="section-heading">
              <div>
                <Typography.Title :level="5">PC 皮肤</Typography.Title>
                <Typography.Text type="secondary">
                  资源类型 PictureType 15
                </Typography.Text>
              </div>
              <Button
                v-if="
                  checkPermission(12287) && String(form.StyleTypePc) === '100'
                "
                @click="openThemePicker('pc')"
              >
                快速配色
              </Button>
            </div>
            <Spin :spinning="resourcesLoading">
              <Radio.Group
                :value="form.StyleTypePc"
                class="resource-grid pc"
                @change="selectSkin('pc', $event.target.value)"
              >
                <Radio
                  v-for="item in visiblePcResources"
                  :key="String(item.Id)"
                  class="resource-option"
                  :value="item.PictureStyle ?? item.Id"
                >
                  <Image
                    :preview="false"
                    :src="resolveUrl(item.PictureIp || item.SmallPictureIp)"
                  />
                  <span
                    >皮肤
                    {{ item.PictureStyle ?? item.PictureName ?? item.Id }}</span
                  >
                </Radio>
              </Radio.Group>
              <Pagination
                v-if="pcTotal > 3"
                v-model:current="pcPage"
                class="mt-4"
                :page-size="3"
                :show-size-changer="false"
                :total="pcTotal"
              />
              <Empty
                v-if="!resourcesLoading && pcResources.length === 0"
                description="暂无 PC 皮肤资源"
              />
            </Spin>
          </section>

          <section v-else-if="activeStep === 4">
            <Typography.Title :level="5">产品基础信息</Typography.Title>
            <Form
              class="compact-form"
              layout="vertical"
              :model="form"
              :rules="productRules"
            >
              <Row :gutter="16">
                <Col :md="12" :xs="24">
                  <Form.Item label="APP 名称" name="PackageName" required>
                    <Input
                      v-model:value="form.PackageName"
                      :maxlength="255"
                      placeholder="请输入 APP 产品名称"
                      show-count
                    />
                  </Form.Item>
                </Col>
                <Col :md="12" :xs="24">
                  <Form.Item
                    label="PC 名称"
                    name="PackageAlias"
                    :required="!samePcName"
                    :rules="
                      samePcName
                        ? []
                        : [
                            { required: true, message: '请填写 PC 名称' },
                            { max: 255, message: 'PC 名称不能超过 255 个字符' },
                          ]
                    "
                  >
                    <Checkbox v-model:checked="samePcName" class="mb-2">
                      PC 使用相同名称
                    </Checkbox>
                    <Input
                      v-if="!samePcName"
                      v-model:value="form.PackageAlias"
                      :maxlength="255"
                      placeholder="请输入 PC 产品名称"
                      show-count
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="产品图标" name="Icon" required>
                <Tabs
                  v-if="iconStyles.length > 0"
                  v-model:active-key="activeIconStyle"
                  size="small"
                  type="line"
                >
                  <Tabs.TabPane
                    v-for="style in iconStyles"
                    :key="style"
                    :tab="`分类 ${style}`"
                  />
                </Tabs>
                <Radio.Group v-model:value="form.Icon" class="icon-grid">
                  <Radio
                    v-for="item in visibleIcons"
                    :key="String(item.Id)"
                    class="icon-option"
                    :value="item.Id"
                  >
                    <Avatar
                      :size="48"
                      shape="square"
                      :src="resolveUrl(item.SmallPictureIp || item.PictureIp)"
                    />
                    <span>{{ item.PictureName || `图标 ${item.Id}` }}</span>
                  </Radio>
                </Radio.Group>
                <Empty
                  v-if="!resourcesLoading && iconResources.length === 0"
                  description="暂无图标资源"
                />
              </Form.Item>
              <Form.Item label="备注">
                <Input.TextArea
                  v-model:value="form.Description"
                  :maxlength="500"
                  :rows="3"
                  show-count
                />
              </Form.Item>
            </Form>
          </section>

          <section v-else-if="activeStep === 5">
            <div class="section-heading">
              <div>
                <Typography.Title :level="5">场馆与游戏</Typography.Title>
                <Typography.Text type="secondary">
                  已选
                  {{ selectedGameIds.length + selectedNoLobbyIds.length }}
                  项；提交顺序与下方顺序一致
                </Typography.Text>
              </div>
              <Tag :color="form.GameTemplate === 1 ? 'orange' : 'blue'">
                {{
                  form.GameTemplate === 1 ? '沿用已有自定义版型' : '固定版型'
                }}
              </Tag>
            </div>
            <Alert
              v-if="form.GameTemplate === 1"
              class="mb-4"
              message="此产品包含旧自定义版型数据；本页会原样保留，不提供已停用的版型切换。"
              show-icon
              type="warning"
            />

            <Row :gutter="[16, 16]">
              <Col :lg="8" :xs="24">
                <div class="panel-box">
                  <strong>分类 / 菜单顺序</strong>
                  <List :data-source="categoryOptions" size="small">
                    <template #renderItem="{ item, index }">
                      <List.Item>
                        <span
                          >{{ item.name }}（{{
                            gameCategoryCount(item.id)
                          }}）</span
                        >
                        <Space>
                          <Button
                            :disabled="index === 0"
                            size="small"
                            @click="moveItem(categoryOrder, index, -1)"
                          >
                            ↑
                          </Button>
                          <Button
                            :disabled="index === categoryOrder.length - 1"
                            size="small"
                            @click="moveItem(categoryOrder, index, 1)"
                          >
                            ↓
                          </Button>
                        </Space>
                      </List.Item>
                    </template>
                  </List>
                </div>
              </Col>
              <Col :lg="16" :xs="24">
                <div class="panel-box">
                  <div class="panel-title">
                    <strong>可用游戏</strong>
                    <Space>
                      <Button size="small" @click="joinAllEligibleGames">
                        全部加入（仅场馆）
                      </Button>
                      <Button size="small" @click="selectedGameIds = []">
                        清空
                      </Button>
                    </Space>
                  </div>
                  <Tabs
                    v-model:active-key="activeGameCategory"
                    size="small"
                    type="line"
                  >
                    <Tabs.TabPane
                      v-for="category in gameCategoryTabs"
                      :key="category.id"
                      :tab="category.name"
                    />
                  </Tabs>
                  <Checkbox
                    v-for="game in filteredNormalGames"
                    :key="game.id"
                    class="game-checkbox"
                    :checked="selectedGameIds.includes(game.id)"
                    @change="toggleGame(game, $event.target.checked)"
                  >
                    {{ game.name }}
                    <Tag v-if="game.classifications[0]" class="ml-1">
                      {{ game.classifications.join('/') }}
                    </Tag>
                  </Checkbox>
                  <Empty
                    v-if="filteredNormalGames.length === 0"
                    description="暂无可用游戏"
                  />
                </div>

                <div v-if="noLobbyGames.length > 0" class="panel-box mt-3">
                  <div class="panel-title">
                    <strong>无大厅场馆</strong>
                    <Space>
                      <Button
                        size="small"
                        @click="
                          selectedNoLobbyIds = noLobbyGames.map(
                            (game) => game.id,
                          )
                        "
                      >
                        全选
                      </Button>
                      <Button size="small" @click="selectedNoLobbyIds = []">
                        清空
                      </Button>
                    </Space>
                  </div>
                  <div class="mt-3">
                    <Checkbox
                      v-for="game in noLobbyGames"
                      :key="game.id"
                      class="game-checkbox"
                      :checked="selectedNoLobbyIds.includes(game.id)"
                      @change="toggleGame(game, $event.target.checked)"
                    >
                      {{ game.name }}
                    </Checkbox>
                  </div>
                </div>

                <div class="panel-box mt-3">
                  <div class="panel-title">
                    <strong>已选游戏与序列</strong>
                    <Radio.Group
                      v-if="form.GameTemplate === 0"
                      v-model:value="fixedTemplateStyle"
                      button-style="solid"
                      size="small"
                    >
                      <Radio.Button :value="2">长版</Radio.Button>
                      <Radio.Button v-if="canUseShortFixedTemplate" :value="1">
                        短版（当前分类 3–4 项）
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                  <List :data-source="selectedGames" size="small">
                    <template #renderItem="{ item, index }">
                      <List.Item>
                        <Space>
                          <Tag>{{ index + 1 }}</Tag>
                          <span>{{ item.name }}</span>
                          <Radio.Group
                            v-if="form.GameTemplate === 1"
                            v-model:value="item.layout"
                            size="small"
                          >
                            <Radio.Button :value="1">短版</Radio.Button>
                            <Radio.Button :value="2">长版</Radio.Button>
                          </Radio.Group>
                        </Space>
                        <Space>
                          <Button
                            :disabled="index === 0"
                            size="small"
                            @click="moveItem(selectedGameIds, index, -1)"
                          >
                            ↑
                          </Button>
                          <Button
                            :disabled="index === selectedGames.length - 1"
                            size="small"
                            @click="moveItem(selectedGameIds, index, 1)"
                          >
                            ↓
                          </Button>
                          <Button
                            danger
                            size="small"
                            @click="toggleGame(item, false)"
                          >
                            移除
                          </Button>
                        </Space>
                      </List.Item>
                    </template>
                  </List>
                  <strong v-if="selectedNoLobbyGames.length > 0"
                    >无大厅提交顺序</strong
                  >
                  <List :data-source="selectedNoLobbyGames" size="small">
                    <template #renderItem="{ item, index }">
                      <List.Item>
                        <Space>
                          <Tag>{{ selectedGames.length + index + 1 }}</Tag
                          >{{ item.name }}
                        </Space>
                        <Space>
                          <Button
                            :disabled="index === 0"
                            size="small"
                            @click="moveItem(selectedNoLobbyIds, index, -1)"
                          >
                            ↑
                          </Button>
                          <Button
                            :disabled="
                              index === selectedNoLobbyGames.length - 1
                            "
                            size="small"
                            @click="moveItem(selectedNoLobbyIds, index, 1)"
                          >
                            ↓
                          </Button>
                          <Button
                            danger
                            size="small"
                            @click="toggleGame(item, false)"
                          >
                            移除
                          </Button>
                        </Space>
                      </List.Item>
                    </template>
                  </List>
                </div>
              </Col>
            </Row>
          </section>

          <section v-else>
            <Typography.Title :level="5">预览与确认</Typography.Title>
            <Row :gutter="[20, 20]">
              <Col :lg="previewUrl ? 14 : 24" :xs="24">
                <Descriptions
                  bordered
                  :column="{ xs: 1, sm: 1, md: 2 }"
                  size="small"
                >
                  <Descriptions.Item label="产品">
                    <Space>
                      <Avatar
                        shape="square"
                        :src="
                          resolveUrl(
                            selectedIcon?.SmallPictureIp ||
                              selectedIcon?.PictureIp,
                          )
                        "
                      />
                      <strong>{{ form.PackageName }}</strong>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="PC 名称">
                    {{ form.PackageAlias || form.PackageName }}
                  </Descriptions.Item>
                  <Descriptions.Item label="风格系列">
                    系列 {{ form.StyleSetting }}
                  </Descriptions.Item>
                  <Descriptions.Item label="皮肤">
                    APP {{ form.StyleType || '-' }} / PC
                    {{ form.StyleTypePc || '-' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="语言" :span="2">
                    <Tag v-for="code in form.Languages" :key="code">
                      {{ LANGUAGE_NAMES[code] || code }}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="场馆版型">
                    {{ form.GameTemplate === 0 ? '固定版型' : '自定义版型' }}
                  </Descriptions.Item>
                  <Descriptions.Item label="游戏数">
                    {{ selectedGameIds.length + selectedNoLobbyIds.length }}
                  </Descriptions.Item>
                  <Descriptions.Item label="游戏顺序" :span="2">
                    <Space wrap>
                      <Tag
                        v-for="(game, index) in [
                          ...selectedGames,
                          ...selectedNoLobbyGames,
                        ]"
                        :key="game.id"
                      >
                        {{ index + 1 }}. {{ game.name }}
                      </Tag>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item
                    v-if="form.Description"
                    label="备注"
                    :span="2"
                  >
                    {{ form.Description }}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col v-if="previewUrl" :lg="10" :xs="24">
                <div class="preview-frame">
                  <iframe :src="previewUrl" title="产品预览"></iframe>
                </div>
              </Col>
            </Row>
          </section>
        </div>

        <div class="wizard-actions">
          <Button :disabled="saving" @click="leaveEditor">
            {{ activeStep === 0 ? '返回' : '取消' }}
          </Button>
          <Button v-if="activeStep > 0" @click="previousStep">上一步</Button>
          <Button
            v-if="activeStep < STEP_ITEMS.length - 1"
            :disabled="saving"
            type="primary"
            @click="nextStep"
          >
            下一步
          </Button>
          <Button v-else :loading="saving" type="primary" @click="submit">
            {{ isEdit ? '保存修改' : '创建产品' }}
          </Button>
        </div>
      </Spin>
    </Card>

    <Modal
      v-model:open="themeModalOpen"
      title="选择快速配色模板"
      width="min(1180px, calc(100vw - 32px))"
    >
      <Spin :spinning="themeLoading">
        <div class="theme-layout">
          <div class="theme-family-list">
            <Button
              v-for="theme in colorThemeFamilies"
              :key="String(theme.Id)"
              block
              :type="
                String(activeThemeId) === String(theme.Id)
                  ? 'primary'
                  : 'default'
              "
              @click="changeColorThemeFamily(theme.Id!)"
            >
              {{ theme.ThemeDescription || `风格 ${theme.Id}` }}
            </Button>
          </div>
          <div class="theme-detail-grid">
            <button
              v-for="detail in currentColorDetails"
              :key="String(detail.Id)"
              class="theme-card"
              :class="{
                selected: String(previewColorId) === String(detail.Id),
              }"
              type="button"
              @click="previewColorId = detail.Id ?? ''"
            >
              <strong>{{ detail.ColorName || `配色 ${detail.Id}` }}</strong>
              <span class="swatch-row">
                <i
                  v-for="(color, index) in colorSwatches(detail)"
                  :key="index"
                  class="color-swatch"
                  :style="{ backgroundColor: color }"
                ></i>
              </span>
            </button>
            <Empty
              v-if="!themeLoading && currentColorDetails.length === 0"
              description="该风格暂无配色"
            />
          </div>
          <iframe
            v-if="themePreviewUrl"
            class="theme-preview"
            :src="themePreviewUrl"
            :title="themeDevice === 'app' ? 'APP 配色预览' : 'PC 配色预览'"
          ></iframe>
        </div>
      </Spin>
      <template #footer>
        <Button @click="themeModalOpen = false">取消</Button>
        <Button
          :disabled="previewColorId === ''"
          type="primary"
          @click="saveSelectedColorTheme"
        >
          保存模板
        </Button>
      </template>
    </Modal>
  </Page>
  <Result
    v-else
    status="403"
    :sub-title="isEdit ? '无编辑产品权限（10778）' : '无创建产品权限（10776）'"
    title="403"
  >
    <template #extra>
      <Button
        type="primary"
        @click="router.push('/gameManage/inclusionDeploy')"
      >
        返回产品列表
      </Button>
    </template>
  </Result>
</template>

<style scoped>
.wizard-steps {
  margin: 4px auto 0;
  max-width: 1100px;
}

.wizard-content {
  min-height: 420px;
  padding: 28px 8px 20px;
}

.wizard-actions {
  align-items: center;
  border-top: 1px solid hsl(var(--border));
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 16px;
}

.section-heading,
.panel-title {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.choice-card,
.theme-card {
  align-items: center;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 18px;
  text-align: left;
  transition: 0.2s ease;
  width: 100%;
}

.choice-card:hover,
.choice-card.selected,
.theme-card:hover,
.theme-card.selected {
  border-color: #1677ff;
  box-shadow: 0 4px 16px rgb(22 119 255 / 12%);
}

.choice-card.selected {
  background: rgb(22 119 255 / 5%);
}

.choice-number {
  align-items: center;
  background: #1677ff;
  border-radius: 50%;
  color: white;
  display: flex;
  font-size: 18px;
  height: 40px;
  justify-content: center;
  width: 40px;
}

.choice-card small,
.theme-card small {
  color: #8c8c8c;
  display: block;
  margin-top: 4px;
}

.theme-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(150px, 0.7fr) minmax(240px, 1.2fr) minmax(
      320px,
      2fr
    );
  min-height: 520px;
}

.theme-family-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-detail-grid {
  align-content: start;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.swatch-row {
  display: flex;
  margin-top: 10px;
}

.color-swatch {
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 50%;
  height: 32px;
  margin-left: -5px;
  width: 32px;
}

.theme-preview {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  height: 520px;
  width: 100%;
}

.resource-grid,
.icon-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  width: 100%;
}

.resource-grid.pc {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.resource-option,
.icon-option {
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  margin-inline-start: 0;
  padding: 10px;
}

.resource-option :deep(.ant-radio + span),
.icon-option :deep(.ant-radio + span) {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: calc(100% - 18px);
}

.resource-option :deep(.ant-image) {
  width: 100%;
}

.resource-option :deep(img) {
  aspect-ratio: 16 / 9;
  object-fit: contain;
  width: 100%;
}

.compact-form {
  max-width: 920px;
}

.panel-box {
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 14px;
}

.game-checkbox {
  margin: 0 12px 12px 0;
}

.preview-frame {
  background: #f5f5f5;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  height: 520px;
  overflow: hidden;
}

.preview-frame iframe {
  border: 0;
  height: 100%;
  width: 100%;
}

@media (max-width: 768px) {
  .wizard-content {
    padding-inline: 0;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .theme-layout {
    grid-template-columns: 1fr;
  }

  .theme-preview {
    height: 65vh;
    min-height: 420px;
  }
}
</style>
