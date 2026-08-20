<script lang="ts" setup>
import type { FormInstance, UploadChangeParam } from 'ant-design-vue';

import type {
  ChannelAdminOption,
  ChannelAppPackageOption,
  ChannelCountryOption,
  ChannelDetail,
  ChannelDomainOption,
  ChannelFormPayload,
  ChannelId,
  ChannelIosPackageOption,
  ChannelPackageOption,
  ChannelResource,
  DefaultTagVenueOption,
} from '#/types/channel-config';

import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Carousel,
  Checkbox,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Radio,
  Result,
  Select,
  Space,
  Spin,
  Steps,
  Switch,
  Tabs,
  Tag,
  Upload,
} from 'ant-design-vue';
import md5 from 'crypto-js/md5';

import { getProjectConfigApi } from '#/api/core/project';
import {
  CHANNEL_UPLOAD_URL,
  createChannelApi,
  fetchChannelAndroidAppPackagesApi,
  fetchChannelCountriesApi,
  fetchChannelDetailApi,
  fetchChannelDomainOptionsApi,
  fetchChannelHierarchyApi,
  fetchChannelIosAppPackagesApi,
  fetchChannelIosEnterprisePackagesApi,
  fetchChannelLandingResourcesApi,
  fetchChannelPackageOptionsApi,
  fetchDefaultTagVenuesApi,
  updateChannelApi,
} from '#/api/gameManage/channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useProjectConfig } from '#/composables/use-project-config';
import { findGameIdByApiFee } from '#/utils/game-config';

defineOptions({ name: 'ChannelFormModal' });

const props = defineProps<{
  channelId?: ChannelId;
  /** 创建时写入的渠道类型；网赚代理渠道固定传 2 */
  channelType?: number;
  dataFlag?: 0 | 1;
  initialPackageId?: ChannelId;
  open: boolean;
  promoterAdminId?: ChannelId;
  quickCreate?: boolean;
}>();

const emit = defineEmits<{
  created: [value: ChannelDetail];
  success: [value: ChannelDetail];
  'update:open': [value: boolean];
}>();

type LangCaption = {
  [key: string]: unknown;
  Caption: string;
  LangGroupId: ChannelId;
};
type VenueRow = DefaultTagVenueOption & { Enabled: boolean };

const { adminInfo } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const { ensureGameConfig } = useGameConfig();

const formRef = ref<FormInstance>();
const activeStep = ref(0);
const loading = ref(false);
const saving = ref(false);
const fatalError = ref('');
const quickConfirming = ref(false);
const initialized = ref(false);
const initialSnapshot = ref('');
const preservedDetail = ref<ChannelDetail>();
const ownerPath = ref<ChannelAdminOption[]>([]);
const packageOptions = ref<ChannelPackageOption[]>([]);
const enterpriseOptions = ref<ChannelIosPackageOption[]>([]);
const iosShelfOptions = ref<ChannelIosPackageOption[]>([]);
const androidShelfOptions = ref<ChannelAppPackageOption[]>([]);
const countryOptions = ref<ChannelCountryOption[]>([]);
const appDomains = ref<ChannelDomainOption[]>([]);
const h5Domains = ref<ChannelDomainOption[]>([]);
const allAppDomains = ref<ChannelDomainOption[]>([]);
const landingResources = ref<ChannelResource[]>([]);
const landingPage = ref(1);
const landingTotal = ref(0);
const landingStyle = ref<string>('');
const venues = ref<VenueRow[]>([]);
const languageCaptions = ref<Record<string, LangCaption>>({});
const activeLanguageId = ref('');
const iconUploading = ref(false);
const h5ImageUploading = ref(false);
const resultMode = ref(false);
const packingDetail = ref<ChannelDetail>();
const packingSeconds = ref(60);
const packingTimedOut = ref(false);
let packingTimer: ReturnType<typeof setInterval> | undefined;
let packingBusy = false;
let initializationGeneration = 0;
let packageDependencyGeneration = 0;

const model = reactive<ChannelFormPayload & { BackgroundStyle?: string }>({});

const isEdit = computed(
  () => props.channelId !== undefined && props.channelId !== null,
);
const quickMode = computed(
  () =>
    !isEdit.value &&
    props.quickCreate === true &&
    props.initialPackageId != null,
);
const resourceBase = computed(() =>
  String(projectConfig.value?.CommonResourceDomainUrl || ''),
);
const currentOwnerId = computed<'' | ChannelId>(
  () => props.promoterAdminId ?? resolveSessionAdminId() ?? '',
);
const selectedLanding = computed(() =>
  landingResources.value.find(
    (item) => String(item.Id) === String(model.BackgroundId),
  ),
);
const carouselParts = computed(() => {
  const details = Array.isArray(selectedLanding.value?.CarouselDetail)
    ? (selectedLanding.value?.CarouselDetail as Array<Record<string, unknown>>)
    : [];
  return {
    footer: details.find((item) => Number(item.CarouselType) === 2),
    logo: details.find((item) => Number(item.CarouselType) === 1),
    slides: details
      .filter((item) => Number(item.CarouselType) === 3)
      .toSorted((a, b) => Number(a.Sort || 0) - Number(b.Sort || 0)),
  };
});
const isCarouselLanding = computed(
  () => String(selectedLanding.value?.PictureStyle) === '108',
);
const enabledVenueCount = computed(
  () => venues.value.filter((item) => item.Enabled).length,
);
const dirty = computed(
  () =>
    initialized.value &&
    !resultMode.value &&
    serializeSnapshot() !== initialSnapshot.value,
);
const currentPackage = computed(() =>
  packageOptions.value.find(
    (item) => String(item.Id) === String(model.PackageConfigId),
  ),
);
const packingStatus = computed(() =>
  Number(packingDetail.value?.PackStatus ?? 0),
);
const packingPending = computed(() => [0, 1, 4].includes(packingStatus.value));
const iosShelfId = computed<ChannelId | undefined>({
  get: () => model.IosPkgConfigId as ChannelId | undefined,
  set: (value) => {
    model.IosPkgConfigId = value;
  },
});
const androidShelfId = computed<ChannelId | undefined>({
  get: () => model.AndroidPkgConfigId as ChannelId | undefined,
  set: (value) => {
    model.AndroidPkgConfigId = value;
  },
});

const stepItems = [
  { title: '推广归属' },
  { title: '渠道与包体' },
  { title: '落地页设置' },
  { title: '域名与下载' },
];
const pushTypes = [
  { label: '纯娱乐', value: 0 },
  { label: '娱乐 + 专属', value: 1 },
  { label: '纯专属场馆', value: 2 },
  { label: '游戏 + 直播', value: 3 },
  { label: '直播 + 游戏', value: 4 },
];
const landingStyles = [
  { label: '全部', value: '' },
  { label: '通用', value: '1' },
  { label: '简约', value: '2' },
  { label: '轮播', value: '108' },
];

const rules = computed(() => ({
  AndroidAppPkgType: [{ required: true, message: '请选择 Android 包体类型' }],
  AndroidPkgConfigId:
    model.AndroidAppPkgType === 1
      ? [{ required: true, message: '请选择 Android 上架包' }]
      : [],
  BackgroundId: [{ required: true, message: '请选择落地页资源' }],
  ChannelName: [
    { required: true, message: '请输入渠道名称' },
    { max: 20, message: '渠道名称最多 20 个字符' },
  ],
  CustomApkName: [
    {
      pattern: /^[a-zA-Z0-9]*$/,
      message: '自定义 APK 名称只能包含英文字母和数字',
    },
  ],
  Domain: [{ required: true, message: '请选择 APP 域名' }],
  H5Domain1: [{ required: true, message: '请选择 H5 推广域名' }],
  H5DownloadType: [{ required: true, message: '请选择下载推荐类型' }],
  IosPackageId:
    model.IosType === 2
      ? [{ required: true, message: '请选择 iOS 企业包' }]
      : [],
  IosPkgConfigId:
    model.IosType === 4
      ? [{ required: true, message: '请选择 iOS 上架包' }]
      : [],
  IosType: [{ required: true, message: '请选择 iOS 包体类型' }],
  KeFuThirdUrl:
    model.IsOpenKeFu && model.KeFuRadio === 2
      ? [
          { required: true, message: '请输入第三方客服地址' },
          {
            pattern: /^https?:\/\/[^\s]+$/i,
            message: '请输入有效的 http(s) URL',
          },
        ]
      : [],
  PackageConfigId: [{ required: true, message: '请选择包体' }],
  PageAutoDownTime: [
    {
      validator: async (_rule: unknown, value: unknown) => {
        if (
          model.PageAutoDown &&
          (!Number.isFinite(Number(value)) || Number(value) < 0)
        ) {
          throw new Error('延迟秒数必须是非负数');
        }
      },
    },
  ],
  PushType: [{ required: true, message: '请选择推广模式' }],
  Remark: [{ max: 400, message: '备注最多 400 个字符' }],
}));

watch(
  () => props.open,
  (open) => {
    if (open) void initialize();
    else {
      initializationGeneration += 1;
      packageDependencyGeneration += 1;
      stopPackingPoll();
    }
  },
  { immediate: true },
);

watch(
  () => model.PackageConfigId,
  async (next, previous) => {
    if (!initialized.value || String(next || '') === String(previous || ''))
      return;
    clearPackageDependencies(true);
    if (!next) return;
    await loadPackageDependencies(next);
  },
);

watch(
  () => model.PushType,
  (value) => {
    if (value === 2) model.DefaultTagSelected = 2;
  },
);

watch(landingStyle, () => {
  landingPage.value = 1;
  void loadLandingResources();
});

onBeforeUnmount(() => {
  initializationGeneration += 1;
  packageDependencyGeneration += 1;
  stopPackingPoll();
});

function resolveSessionAdminId() {
  const info = adminInfo.value as null | Record<string, unknown>;
  const account = info?.Account;
  if (account && typeof account === 'object') {
    return ((account as Record<string, unknown>).AdminId ??
      (account as Record<string, unknown>).Id) as ChannelId | undefined;
  }
  const admin = info?.Admin as Record<string, unknown> | undefined;
  return (admin?.AdminId ??
    admin?.Id ??
    projectConfig.value?.AccountTeamInfo?.AgentId) as ChannelId | undefined;
}

function createDefaults(): ChannelFormPayload {
  return {
    AndroidAppPkgType: 2,
    BackgroundId: '',
    ChannelName: '',
    ...(props.channelType === undefined
      ? {}
      : { ChannelType: props.channelType }),
    CnnzCode: '',
    CustomApkName: '',
    DefaultTagSelected: 1,
    DefaultTagVenueSetting: '',
    Domain: '',
    DomainRange: '',
    GameTabSelected: 0,
    H5Domain1: '',
    H5DownloadType: 'app',
    H5DownloadUserTarget: 2,
    H5LandingImg: '',
    H5LandingPage: 1,
    H5Version: 2,
    IosPackageId: '',
    IosType: 5,
    IsHidden: 1,
    IsOpenH5Download: false,
    IsOpenH5RecommendDownload: true,
    IsOpenH5Site: 0,
    IsOpenKeFu: 0,
    IsPureWebMode: false,
    KeFuRadio: 1,
    KeFuThirdUrl: '',
    LandId: '',
    PackageConfigId: props.initialPackageId ?? '',
    PackPlatformType: 'uniapp2',
    PageAutoDown: 0,
    PageAutoDownTime: 0,
    PrecautionActive: 0,
    PrecautionFirst: 0,
    PromoterAdminId: currentOwnerId.value,
    PushType: 0,
    Remark: '',
    SetIconUrl: '',
    SetPackageName: '',
    TempValue: [],
    Version: 1,
  };
}

function replaceModel(value: ChannelFormPayload) {
  for (const key of Object.keys(model)) delete model[key];
  Object.assign(model, value);
}

async function initialize() {
  const initialization = ++initializationGeneration;
  packageDependencyGeneration += 1;
  clearPackageDependencies();
  loading.value = true;
  fatalError.value = '';
  initialized.value = false;
  resultMode.value = false;
  packingDetail.value = undefined;
  packingTimedOut.value = false;
  activeStep.value = 0;
  try {
    replaceModel(createDefaults());
    languageCaptions.value = {};
    const [packages, countries, rawVenues, gameConfig] = await Promise.all([
      fetchChannelPackageOptionsApi(),
      fetchChannelCountriesApi({ Page: 1, PageSize: 9999 }),
      fetchDefaultTagVenuesApi(),
      ensureGameConfig(),
    ]);
    if (initialization !== initializationGeneration || !props.open) return;
    packageOptions.value = packages;
    countryOptions.value = countries.Items ?? [];
    const parsedVenues = parseArray<DefaultTagVenueOption>(rawVenues);
    venues.value = parsedVenues
      .map((venue) => ({
        ...venue,
        Enabled: false,
        GameId: venue.GameId || findGameIdByApiFee(venue.ApiFee, gameConfig),
      }))
      .filter((venue) => Boolean(venue.GameId));

    if (isEdit.value) {
      const detail = await fetchChannelDetailApi(props.channelId!);
      if (initialization !== initializationGeneration || !props.open) return;
      preservedDetail.value = detail;
      hydrateDetail(detail);
    } else {
      preservedDetail.value = undefined;
      initializeLanguageCaptions([]);
      initializeVenueSelection([]);
    }

    if (currentOwnerId.value && props.promoterAdminId != null) {
      const hierarchy = await fetchChannelHierarchyApi({
        AdminId: currentOwnerId.value,
      });
      if (initialization !== initializationGeneration || !props.open) return;
      ownerPath.value = hierarchy.Parents?.length
        ? hierarchy.Parents
        : (hierarchy.ItemsAdmin
          ? [hierarchy.ItemsAdmin]
          : []);
    } else {
      ownerPath.value = [sessionOwner()].filter(
        Boolean,
      ) as ChannelAdminOption[];
    }

    await Promise.all([
      loadLandingResources(true),
      model.PackageConfigId
        ? loadPackageDependencies(model.PackageConfigId, initialization)
        : Promise.resolve(),
    ]);
    if (initialization !== initializationGeneration || !props.open) return;

    if (!model.BackgroundId && landingResources.value[0]) {
      model.BackgroundId = landingResources.value[0].Id;
    }
    initialized.value = true;
    await nextTick();
    initialSnapshot.value = serializeSnapshot();
    formRef.value?.clearValidate();
  } catch (error) {
    if (initialization === initializationGeneration) {
      fatalError.value =
        error instanceof Error ? error.message : '渠道配置加载失败';
    }
  } finally {
    if (initialization === initializationGeneration) loading.value = false;
  }
}

function sessionOwner(): ChannelAdminOption {
  const info = adminInfo.value as null | Record<string, unknown>;
  const admin = info?.Admin as Record<string, unknown> | undefined;
  return {
    Id: currentOwnerId.value,
    Name: String(info?.AdminName || admin?.Name || '当前账号'),
    Username: String(
      admin?.Username ||
        (typeof info?.Account === 'string' ? info.Account : ''),
    ),
  };
}

function hydrateDetail(detail: ChannelDetail) {
  const base = createDefaults();
  const zeroAsEmpty = (value: unknown) =>
    value === 0 || value === '0' ? undefined : value;
  replaceModel({
    ...base,
    ...detail,
    AndroidPkgConfigId: zeroAsEmpty(detail.AndroidPkgConfigId) as
      | ChannelId
      | undefined,
    H5Version: 2,
    IosPackageId:
      (zeroAsEmpty(detail.IosPackageId) as ChannelId | undefined) || '',
    IosPkgConfigId: zeroAsEmpty(detail.IosPkgConfigId) as ChannelId | undefined,
    PackageConfigId: detail.PackageConfigId ?? base.PackageConfigId,
  });
  const langs = parseArray<LangCaption>(detail.H5DownloadDialogLangText);
  initializeLanguageCaptions(langs);
  initializeVenueSelection(
    parseArray<DefaultTagVenueOption>(detail.DefaultTagVenueSetting),
  );
}

function initializeLanguageCaptions(existing: LangCaption[]) {
  const map: Record<string, LangCaption> = {};
  for (const item of existing) {
    if (item?.LangGroupId != null) map[String(item.LangGroupId)] = { ...item };
  }
  for (const group of projectConfig.value?.LangGroup ?? []) {
    const key = String(group.Id);
    map[key] ||= { Caption: '', LangGroupId: group.Id };
  }
  languageCaptions.value = map;
  activeLanguageId.value = Object.keys(map)[0] || '';
}

function initializeVenueSelection(existing: DefaultTagVenueOption[]) {
  const order = new Map(
    existing.map((item, index) => [String(item.GameId), index]),
  );
  venues.value = venues.value
    .map((item) => ({ ...item, Enabled: order.has(String(item.GameId)) }))
    .toSorted((a, b) => {
      const ai = order.get(String(a.GameId));
      const bi = order.get(String(b.GameId));
      if (ai == null && bi == null) return 0;
      if (ai == null) return 1;
      if (bi == null) return -1;
      return ai - bi;
    });
  if (!venues.value.some((item) => item.Enabled) && venues.value[0]) {
    venues.value[0].Enabled = true;
  }
}

function clearPackageDependencies(clearValues = false) {
  allAppDomains.value = [];
  appDomains.value = [];
  h5Domains.value = [];
  enterpriseOptions.value = [];
  iosShelfOptions.value = [];
  androidShelfOptions.value = [];
  if (clearValues) {
    model.Domain = '';
    model.H5Domain1 = '';
    model.IosPackageId = '';
    model.IosPkgConfigId = undefined;
    model.AndroidPkgConfigId = undefined;
  }
}

async function loadPackageDependencies(
  packageId: ChannelId,
  initialization?: number,
) {
  if (initialization != null && initialization !== initializationGeneration)
    return;
  const generation = ++packageDependencyGeneration;
  clearPackageDependencies();
  const [domains, friendDomains, enterprise, iosShelf, androidShelf] =
    await Promise.all([
      fetchChannelDomainOptionsApi({
        InUsed: 1,
        IsAll: 1,
        OnlyUnused: true,
        PackageId: packageId,
        PageSize: 100_000_000,
      }),
      fetchChannelDomainOptionsApi({
        InUsed: 1,
        IsAll: 1,
        PackageId: packageId,
        PageSize: 999,
      }),
      fetchChannelIosEnterprisePackagesApi(packageId),
      fetchChannelIosAppPackagesApi(packageId),
      fetchChannelAndroidAppPackagesApi(),
    ]);
  if (
    generation !== packageDependencyGeneration ||
    (initialization != null && initialization !== initializationGeneration) ||
    String(model.PackageConfigId || '') !== String(packageId) ||
    !props.open
  ) {
    return;
  }
  allAppDomains.value = domains.Items ?? [];
  enterpriseOptions.value = enterprise.Items ?? [];
  iosShelfOptions.value = iosShelf;
  androidShelfOptions.value = androidShelf;
  h5Domains.value = (friendDomains.Items ?? []).filter(
    (item) => [3, 9].includes(Number(item.Type)) && Number(item.InUsed) === 1,
  );
  applyDomainRangeFilter();
}

function applyDomainRangeFilter() {
  const selected = String(model.DomainRange || '')
    .split(',')
    .filter(Boolean);
  const source = allAppDomains.value.filter(
    (item) => Number(item.Type) === 1 && Number(item.InUsed) === 1,
  );
  if (selected.includes('2') || selected.length === 0) {
    appDomains.value = source;
  } else if (selected.includes('0')) {
    appDomains.value = source.filter((item) =>
      [1, 3].includes(Number(item.State)),
    );
  } else if (selected.includes('1')) {
    appDomains.value = source.filter((item) =>
      [2, 3].includes(Number(item.State)),
    );
  } else {
    appDomains.value = source;
  }
}

async function loadLandingResources(selectFirst = false) {
  const agentId = resolveSessionAdminId();
  if (agentId == null || agentId === '') {
    landingResources.value = [];
    landingTotal.value = 0;
    throw new Error('缺少 AgentId，无法加载落地页资源');
  }
  const result = await fetchChannelLandingResourcesApi({
    AgentId: agentId,
    Page: landingPage.value,
    PageSize: 4,
    PictureStyle: landingStyle.value,
    PictureType: 1,
  });
  landingResources.value = result.Items ?? [];
  landingTotal.value = Number(
    result.Pagination?.MaxCount ??
      result.Pagination?.PageSize ??
      landingResources.value.length,
  );
  if (
    (selectFirst ||
      !landingResources.value.some(
        (item) => String(item.Id) === String(model.BackgroundId),
      )) &&
    !isEdit.value
  ) {
    model.BackgroundId = landingResources.value[0]?.Id ?? '';
  }
}

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string' || !value || value === 'null') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? (parsed as T[])
      : (Object.values(parsed || {}) as T[]);
  } catch {
    return [];
  }
}

function serializeSnapshot() {
  return JSON.stringify({
    captions: languageCaptions.value,
    model,
    venues: venues.value.map((item) => ({
      Enabled: item.Enabled,
      GameId: item.GameId,
    })),
  });
}

function absoluteResource(path?: unknown) {
  const value = String(path || '');
  if (!value) return '';
  if (/^(?:blob:|data:|https?:\/\/)/i.test(value)) return value;
  return `${resourceBase.value}${value}`;
}

function resourceUrl(item: ChannelResource, large = false) {
  return absoluteResource(
    large
      ? item.PictureIp || item.SmallPictureIp
      : item.SmallPictureIp || item.PictureIp,
  );
}

function carouselUrl(item?: Record<string, unknown>) {
  return absoluteResource(item?.Url || item?.PictureIp || item?.PictureUrl);
}

function domainValue(item: ChannelDomainOption) {
  const raw = String(item.Domain || item.Name || '');
  if (/^https?:\/\//i.test(raw)) return raw;
  const record = item as Record<string, unknown>;
  const protocol = String(record.Crt || '').toLowerCase();
  const scheme =
    protocol === 'http' || protocol === 'https' ? `${protocol}://` : '';
  const key = record.Key ? `${String(record.Key)}.` : '';
  return `${scheme}${key}${raw}`;
}

function packageLabel(item: ChannelPackageOption) {
  return item.PackageName || item.PackageAlias || String(item.Id || '');
}

function venueLabel(item: VenueRow) {
  return item.Name || item.I18nKey || String(item.GameId || item.ApiFee || '');
}

function countryLabel(item: ChannelCountryOption) {
  return (
    item.CountryName || item.Name || item.CountryCode || String(item.Id || '')
  );
}

function languageLabel(id: string) {
  const group = projectConfig.value?.LangGroup?.find(
    (item) => String(item.Id) === id,
  );
  const languages = group?.Languages;
  return Array.isArray(languages)
    ? languages.join(', ')
    : String(languages || id);
}

function moveVenue(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= venues.value.length) return;
  const copy = [...venues.value];
  const [item] = copy.splice(index, 1);
  if (item) copy.splice(target, 0, item);
  venues.value = copy;
}

function toggleVenue(row: VenueRow, enabled: boolean) {
  if (!enabled && row.Enabled && enabledVenueCount.value === 1) {
    message.warning('至少保留一个专属场馆');
    return;
  }
  row.Enabled = enabled;
}

function setDomainRange(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  model.DomainRange = values.map(String).join(',');
  applyDomainRangeFilter();
  if (!appDomains.value.some((item) => domainValue(item) === model.Domain)) {
    model.Domain = '';
  }
}

function domainRangeValues() {
  return String(model.DomainRange || '')
    .split(',')
    .filter(Boolean);
}

function selectLanding(id?: ChannelId) {
  model.BackgroundId = id ?? '';
}

function changeLandingPage(page: number) {
  landingPage.value = page;
  void loadLandingResources();
}

function uploadBefore(file: File) {
  if (file.type !== 'image/png' && !/\.png$/i.test(file.name)) {
    message.error('仅支持 PNG 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size / 1024 / 1024 >= 5) {
    message.error('图片大小不能超过 5MB');
    return Upload.LIST_IGNORE;
  }
  return true;
}

function uploadResponse(
  info: UploadChangeParam,
  field: 'H5LandingImg' | 'SetIconUrl',
) {
  const response = info.file.response as
    | undefined
    | {
        Code?: number | string;
        Data?: { url?: string };
        FileName?: string;
        Path?: string;
        Url?: string;
      };
  const loadingRef = field === 'SetIconUrl' ? iconUploading : h5ImageUploading;
  loadingRef.value = info.file.status === 'uploading';
  if (info.file.status === 'done') {
    const url =
      response?.Data?.url ||
      response?.Url ||
      response?.Path ||
      response?.FileName;
    if (url) {
      model[field] = url;
      message.success('图片上传成功');
    } else {
      message.error('上传响应中没有图片地址');
    }
  } else if (info.file.status === 'error') {
    message.error('图片上传失败');
  }
}

async function nextStep() {
  if (saving.value) return;
  const fields: string[][] = [
    [],
    [
      'ChannelName',
      'Remark',
      'PackageConfigId',
      'PushType',
      'IosType',
      'AndroidAppPkgType',
      ...(model.IosType === 2 ? ['IosPackageId'] : []),
      ...(model.IosType === 4 ? ['IosPkgConfigId'] : []),
      ...(model.AndroidAppPkgType === 1 ? ['AndroidPkgConfigId'] : []),
    ],
    [
      'BackgroundId',
      ...(model.IsOpenKeFu && model.KeFuRadio === 2 ? ['KeFuThirdUrl'] : []),
      'PageAutoDownTime',
    ],
  ];
  try {
    await formRef.value?.validateFields(fields[activeStep.value] || []);
    activeStep.value = Math.min(3, activeStep.value + 1);
  } catch {
    message.warning('请先修正当前步骤的表单错误');
  }
}

function previousStep() {
  activeStep.value = Math.max(0, activeStep.value - 1);
}

async function submit() {
  if (quickMode.value) return handleQuickCreate();
  try {
    await formRef.value?.validate();
  } catch {
    message.warning('请修正表单错误后再提交');
    return;
  }
  await mutateChannel();
}

function buildVenueSetting() {
  return JSON.stringify(
    venues.value
      .filter((item) => item.Enabled)
      .map((item) => ({ GameId: item.GameId, I18nKey: item.I18nKey })),
  );
}

function buildPayload(): ChannelFormPayload {
  const payload: ChannelFormPayload = {
    ...preservedDetail.value,
    ...model,
    DefaultTagVenueSetting: buildVenueSetting(),
    DomainRange: String(model.DomainRange || ''),
    H5DownloadDialogLangText: JSON.stringify(
      Object.values(languageCaptions.value),
    ),
    PackPlatformType: 'uniapp2',
    ...(props.dataFlag === undefined ? {} : { DataFlag: props.dataFlag }),
    ...(props.channelType === undefined
      ? {}
      : { ChannelType: props.channelType }),
  };
  if (payload.PushType === 2) payload.DefaultTagSelected = 2;
  if (isEdit.value) {
    payload.Id = preservedDetail.value?.Id ?? props.channelId;
    payload.PackageConfigId = preservedDetail.value?.PackageConfigId;
    payload.PromoterAdminId = preservedDetail.value?.AdminId ?? payload.AdminId;
    payload.ReqPathType = 1;
  } else {
    payload.Hash = md5(String(Date.now())).toString();
    payload.IsHidden = 1;
    payload.PromoterAdminId = props.promoterAdminId ?? currentOwnerId.value;
  }
  return payload;
}

async function handleQuickCreate() {
  if (!props.initialPackageId || quickConfirming.value) return;
  quickConfirming.value = true;
  try {
    model.PackageConfigId = props.initialPackageId;
    (model as Record<string, unknown>).IsUseDefault = true;
    await mutateChannel();
  } finally {
    quickConfirming.value = false;
  }
}

async function mutateChannel() {
  saving.value = true;
  try {
    const response = isEdit.value
      ? await updateChannelApi(buildPayload())
      : await createChannelApi(buildPayload());
    await getProjectConfigApi();
    message.success(isEdit.value ? '渠道编辑成功' : '渠道创建成功');
    emit('success', response);
    if (isEdit.value) {
      initialized.value = false;
      emit('update:open', false);
    } else {
      emit('created', response);
      beginPackingResult(response);
    }
  } finally {
    saving.value = false;
  }
}

function beginPackingResult(response: ChannelDetail) {
  resultMode.value = true;
  packingDetail.value = response;
  packingSeconds.value = 60;
  packingTimedOut.value = false;
  startPackingPoll();
}

function packingId() {
  return packingDetail.value?.Id ?? packingDetail.value?.ChannelId;
}

function startPackingPoll() {
  stopPackingPoll();
  void refreshPackingDetail();
  packingTimer = setInterval(() => {
    packingSeconds.value -= 1;
    if (packingSeconds.value <= 0) {
      packingTimedOut.value = true;
      stopPackingPoll();
      return;
    }
    if (packingSeconds.value % 3 === 0) void refreshPackingDetail();
  }, 1000);
}

function stopPackingPoll() {
  if (packingTimer) clearInterval(packingTimer);
  packingTimer = undefined;
}

async function refreshPackingDetail() {
  const id = packingId();
  if (!id || packingBusy) return;
  packingBusy = true;
  try {
    packingDetail.value = await fetchChannelDetailApi(id);
    if (![0, 1, 4].includes(Number(packingDetail.value.PackStatus))) {
      stopPackingPoll();
    }
  } catch {
    // A transient detail failure is retried by the countdown poll.
  } finally {
    packingBusy = false;
  }
}

function retryPackingPoll() {
  packingSeconds.value = 60;
  packingTimedOut.value = false;
  startPackingPoll();
}

function closeResult() {
  stopPackingPoll();
  initialized.value = false;
  emit('update:open', false);
}

function requestClose() {
  if (saving.value) return;
  if (!dirty.value) {
    emit('update:open', false);
    return;
  }
  Modal.confirm({
    cancelText: '继续编辑',
    content: '关闭后未保存的修改将丢失。',
    okText: '放弃修改',
    title: '确认关闭？',
    onOk: () => emit('update:open', false),
  });
}
</script>

<template>
  <Modal
    :closable="!saving"
    :footer="null"
    :keyboard="!saving"
    :mask-closable="false"
    :open="open"
    :title="isEdit ? '编辑渠道' : quickMode ? '一键创建渠道' : '创建渠道'"
    width="min(1080px, 96vw)"
    wrap-class-name="channel-form-modal"
    @cancel="requestClose"
  >
    <div class="wizard-body">
      <Spin
        v-if="loading"
        class="loading-state"
        size="large"
        tip="正在加载渠道配置..."
      />

      <Result
        v-else-if="fatalError"
        status="error"
        sub-title="请检查网络或配置服务后重试。"
        :title="fatalError"
      >
        <template #extra>
          <Space>
            <Button type="primary" @click="initialize">重试</Button>
            <Button @click="requestClose">关闭</Button>
          </Space>
        </template>
      </Result>

      <Result
        v-else-if="resultMode"
        :status="
          packingStatus === 2
            ? 'success'
            : packingStatus === 3
              ? 'error'
              : 'info'
        "
        :title="
          packingStatus === 2
            ? '渠道打包成功'
            : packingStatus === 3
              ? '渠道打包失败'
              : '渠道已创建，正在打包'
        "
      >
        <template #subTitle>
          <div class="result-details">
            <div>
              渠道：{{
                packingDetail?.ChannelName || packingDetail?.ChannelId || '-'
              }}
            </div>
            <div>安装地址：{{ packingDetail?.ApkUrl || '-' }}</div>
            <div>推广地址：{{ packingDetail?.Domain || '-' }}</div>
            <div v-if="packingPending && !packingTimedOut">
              正在刷新打包结果，剩余 {{ packingSeconds }} 秒
            </div>
            <Alert
              v-if="packingTimedOut"
              class="mt-3"
              message="60 秒内尚未取得最终打包结果，可继续重试或稍后在渠道列表查看。"
              show-icon
              type="warning"
            />
          </div>
        </template>
        <template #extra>
          <Space>
            <Button
              v-if="packingPending"
              :loading="packingBusy"
              @click="
                packingTimedOut ? retryPackingPoll() : refreshPackingDetail()
              "
            >
              {{ packingTimedOut ? '再等待 60 秒' : '立即刷新' }}
            </Button>
            <Button type="primary" @click="closeResult">完成</Button>
          </Space>
        </template>
      </Result>

      <template v-else-if="quickMode">
        <Alert
          description="将按旧版一键创建规则提交包体默认配置。该操作会立即创建真实渠道并触发打包，不会跳过接口或模拟成功。"
          message="请确认一键创建"
          show-icon
          type="warning"
        />
        <div class="quick-summary">
          <div>
            <b>所属推广：</b>{{ ownerPath.at(-1)?.Name || currentOwnerId }}
          </div>
          <div>
            <b>包体：</b>{{ packageLabel(currentPackage || { Id: initialPackageId }) }}
          </div>
          <div><b>创建方式：</b>使用包体默认配置（IsUseDefault）</div>
        </div>
        <div class="wizard-actions">
          <Button :disabled="saving" @click="requestClose">取消</Button>
          <Button
            danger
            type="primary"
            :loading="saving || quickConfirming"
            @click="handleQuickCreate"
          >
            确认并创建
          </Button>
        </div>
      </template>

      <template v-else>
        <Steps :current="activeStep" :items="stepItems" size="small" />

        <Form
          ref="formRef"
          class="channel-form"
          :label-col="{ xs: 24, sm: 7 }"
          :model="model"
          :rules="rules"
          :wrapper-col="{ xs: 24, sm: 17 }"
        >
          <section v-show="activeStep === 0" class="step-panel ownership-panel">
            <Alert
              message="新渠道将创建在以下推广账号下"
              show-icon
              type="info"
            />
            <div class="owner-card">
              <div class="owner-name">
                {{ ownerPath.at(-1)?.Name || '当前推广账号' }}
              </div>
              <div class="owner-account">
                {{ ownerPath.at(-1)?.Username || currentOwnerId }}
              </div>
              <div v-if="ownerPath.length > 0" class="owner-path">
                <Tag
                  v-for="owner in ownerPath"
                  :key="String(owner.Id)"
                  color="blue"
                >
                  {{ owner.Name || owner.Username || owner.Id }}
                </Tag>
              </div>
            </div>
          </section>

          <section v-show="activeStep === 1" class="step-panel">
            <div class="section-title">渠道信息</div>
            <Form.Item label="渠道名称" name="ChannelName">
              <Input
                v-model:value="model.ChannelName"
                :maxlength="20"
                placeholder="请输入渠道名称"
                show-count
              />
            </Form.Item>
            <Form.Item label="备注" name="Remark">
              <Input.TextArea
                v-model:value="model.Remark"
                :maxlength="400"
                :rows="3"
                placeholder="请输入备注"
                show-count
              />
            </Form.Item>
            <Form.Item label="包体" name="PackageConfigId">
              <Select
                v-model:value="model.PackageConfigId"
                :disabled="isEdit"
                :options="
                  packageOptions.map((item) => ({
                    label: packageLabel(item),
                    value: item.Id,
                  }))
                "
                placeholder="请选择包体"
                show-search
                :filter-option="
                  (input, option) =>
                    String(option?.label || '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                "
              />
            </Form.Item>
            <Form.Item label="推广模式" name="PushType">
              <Radio.Group
                v-model:value="model.PushType"
                :options="pushTypes"
              />
            </Form.Item>

            <template v-if="[1, 2, 3, 4].includes(Number(model.PushType))">
              <Form.Item
                v-if="[1, 3, 4].includes(Number(model.PushType))"
                label="游戏默认标签"
              >
                <Radio.Group v-model:value="model.DefaultTagSelected">
                  <Radio :value="1">娱乐</Radio>
                  <Radio :value="2">专属场馆</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="专属场馆排序">
                <div class="venue-list">
                  <div
                    v-for="(venue, index) in venues"
                    :key="String(venue.GameId)"
                    class="venue-row"
                  >
                    <Space>
                      <Button
                        size="small"
                        :disabled="index === 0"
                        @click="moveVenue(index, -1)"
                      >
                        ↑
                      </Button>
                      <Button
                        size="small"
                        :disabled="index === venues.length - 1"
                        @click="moveVenue(index, 1)"
                      >
                        ↓
                      </Button>
                    </Space>
                    <Switch
                      :checked="venue.Enabled"
                      size="small"
                      @change="
                        (checked) => toggleVenue(venue, Boolean(checked))
                      "
                    />
                    <span>{{ venueLabel(venue) }}</span>
                  </div>
                </div>
              </Form.Item>
            </template>
            <Form.Item
              v-if="[3, 4].includes(Number(model.PushType))"
              label="纯净 Web 模式"
            >
              <Checkbox v-model:checked="model.IsPureWebMode">启用</Checkbox>
            </Form.Item>

            <div class="section-title">马甲包设置</div>
            <Form.Item label="APP 名称">
              <Input v-model:value="model.SetPackageName" :maxlength="20" />
            </Form.Item>
            <Form.Item label="APP 图标">
              <Space align="start">
                <Upload
                  :action="CHANNEL_UPLOAD_URL"
                  accept=".png,image/png"
                  :before-upload="uploadBefore"
                  name="upfile"
                  :show-upload-list="false"
                  @change="(info) => uploadResponse(info, 'SetIconUrl')"
                >
                  <Button :loading="iconUploading">上传 PNG</Button>
                </Upload>
                <Image
                  v-if="model.SetIconUrl"
                  :src="absoluteResource(model.SetIconUrl)"
                  :width="64"
                />
                <Button
                  v-if="model.SetIconUrl"
                  danger
                  size="small"
                  @click="model.SetIconUrl = ''"
                >
                  清除
                </Button>
              </Space>
              <div class="field-hint">PNG 格式，最大 5MB</div>
            </Form.Item>

            <div class="section-title">包体平台</div>
            <Form.Item label="iOS 类型" name="IosType">
              <Radio.Group v-model:value="model.IosType">
                <Radio
                  :value="2"
                  :disabled="isEdit && enterpriseOptions.length === 0"
                >
                  企业包
                </Radio>
                <Radio :value="3">第三方超级签</Radio>
                <Radio :value="4">上架包</Radio>
                <Radio :value="5">WebApp</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              v-if="model.IosType === 2"
              label="iOS 企业包"
              name="IosPackageId"
            >
              <Select
                v-model:value="model.IosPackageId"
                :options="
                  enterpriseOptions.map((item) => ({
                    label: item.IosName || item.PackageName || item.Id,
                    value: item.Id,
                  }))
                "
                placeholder="请选择企业包"
              />
            </Form.Item>
            <Form.Item
              v-if="model.IosType === 4"
              label="iOS 上架包"
              name="IosPkgConfigId"
            >
              <Select
                v-model:value="iosShelfId"
                :options="
                  iosShelfOptions.map((item) => ({
                    label: item.IosName || item.PackageName || item.Id,
                    value: item.Id,
                  }))
                "
                placeholder="请选择 iOS 上架包"
              />
            </Form.Item>
            <Form.Item label="Android 类型" name="AndroidAppPkgType">
              <Radio.Group v-model:value="model.AndroidAppPkgType">
                <Radio :value="1">上架包</Radio>
                <Radio :value="2">原生 APK</Radio>
                <Radio :value="3">H5 APK</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              v-if="model.AndroidAppPkgType === 1"
              label="Android 上架包"
              name="AndroidPkgConfigId"
            >
              <Select
                v-model:value="androidShelfId"
                :options="
                  androidShelfOptions.map((item) => ({
                    label: item.AppName || item.PackageName || item.Id,
                    value: item.Id,
                  }))
                "
                placeholder="请选择 Android 上架包"
              />
            </Form.Item>
          </section>

          <section v-show="activeStep === 2" class="step-panel landing-step">
            <Tabs v-model:active-key="landingStyle" type="line" size="small">
              <Tabs.TabPane
                v-for="style in landingStyles"
                :key="style.value"
                :tab="style.label"
              />
            </Tabs>
            <Form.Item label="落地页资源" name="BackgroundId">
              <div v-if="landingResources.length > 0" class="resource-grid">
                <label
                  v-for="item in landingResources"
                  :key="String(item.Id)"
                  class="resource-card"
                  :class="[
                    {
                      selected: String(model.BackgroundId) === String(item.Id),
                    },
                  ]"
                >
                  <Radio
                    :checked="String(model.BackgroundId) === String(item.Id)"
                    :value="item.Id"
                    @click="selectLanding(item.Id)"
                  />
                  <Image :preview="false" :src="resourceUrl(item)" />
                  <span>{{ item.PictureName || `资源 ${item.Id}` }}</span>
                </label>
              </div>
              <Empty v-else description="当前分类暂无落地页资源" />
              <Pagination
                v-if="landingTotal > 4"
                v-model:current="landingPage"
                class="resource-pagination"
                :page-size="4"
                :show-size-changer="false"
                :total="landingTotal"
                @change="changeLandingPage"
              />
            </Form.Item>

            <div v-if="selectedLanding" class="landing-preview">
              <template v-if="isCarouselLanding">
                <Image
                  v-if="carouselParts.logo"
                  :preview="false"
                  :src="carouselUrl(carouselParts.logo)"
                />
                <Carousel
                  v-if="carouselParts.slides.length > 0"
                  autoplay
                  arrows
                >
                  <div
                    v-for="(slide, index) in carouselParts.slides"
                    :key="index"
                  >
                    <img :src="carouselUrl(slide)" alt="轮播预览" />
                  </div>
                </Carousel>
                <Image
                  v-if="carouselParts.footer"
                  :preview="false"
                  :src="carouselUrl(carouselParts.footer)"
                />
              </template>
              <Image v-else :src="resourceUrl(selectedLanding, true)" />
            </div>

            <Form.Item label="客服入口">
              <Space wrap>
                <Switch
                  v-model:checked="model.IsOpenKeFu"
                  :checked-value="1"
                  :un-checked-value="0"
                />
                <Radio.Group v-model:value="model.KeFuRadio">
                  <Radio :value="1">官方客服</Radio>
                  <Radio :value="2">第三方客服</Radio>
                </Radio.Group>
              </Space>
            </Form.Item>
            <Form.Item
              v-if="model.IsOpenKeFu && model.KeFuRadio === 2"
              label="第三方客服 URL"
              name="KeFuThirdUrl"
            >
              <Input
                v-model:value="model.KeFuThirdUrl"
                placeholder="https://..."
              />
            </Form.Item>
            <Form.Item label="H5 入口">
              <Space wrap>
                <Switch
                  v-model:checked="model.IsOpenH5Site"
                  :checked-value="1"
                  :un-checked-value="0"
                />
                <Radio.Group v-model:value="model.H5LandingPage">
                  <Radio :value="1">首页</Radio>
                  <Radio :value="2">注册页</Radio>
                  <Radio :value="3">登录页</Radio>
                </Radio.Group>
              </Space>
            </Form.Item>
            <Form.Item v-if="model.IsOpenH5Site" label="自定义 H5 入口图">
              <Space align="start">
                <Upload
                  :action="CHANNEL_UPLOAD_URL"
                  accept=".png,image/png"
                  :before-upload="uploadBefore"
                  name="upfile"
                  :show-upload-list="false"
                  @change="(info) => uploadResponse(info, 'H5LandingImg')"
                >
                  <Button :loading="h5ImageUploading">上传 PNG</Button>
                </Upload>
                <Image
                  v-if="model.H5LandingImg"
                  :src="absoluteResource(model.H5LandingImg)"
                  :width="160"
                />
                <Button
                  v-if="model.H5LandingImg"
                  danger
                  size="small"
                  @click="model.H5LandingImg = ''"
                >
                  清除
                </Button>
              </Space>
              <div class="field-hint">建议 750 × 145，PNG，最大 5MB</div>
            </Form.Item>
            <Form.Item label="自动下载">
              <Switch
                v-model:checked="model.PageAutoDown"
                :checked-value="1"
                :un-checked-value="0"
              />
            </Form.Item>
            <Form.Item
              v-if="model.PageAutoDown"
              label="下载延迟"
              name="PageAutoDownTime"
            >
              <InputNumber
                v-model:value="model.PageAutoDownTime"
                :min="0"
                addon-after="秒"
                style="width: 220px"
              />
            </Form.Item>
          </section>

          <section v-show="activeStep === 3" class="step-panel">
            <div class="section-title">域名与推广范围</div>
            <Form.Item label="推广国家/地区">
              <Select
                mode="multiple"
                :options="
                  countryOptions.map((item) => ({
                    label: countryLabel(item),
                    value: String(item.Id ?? item.CountryCode ?? ''),
                  }))
                "
                placeholder="不选表示不限制"
                :value="domainRangeValues()"
                @change="setDomainRange"
              />
            </Form.Item>
            <Form.Item label="APP 域名" name="Domain">
              <Select
                v-model:value="model.Domain"
                :options="
                  appDomains.map((item) => ({
                    label: domainValue(item),
                    value: domainValue(item),
                  }))
                "
                placeholder="请选择 APP 域名"
                show-search
              />
            </Form.Item>
            <Form.Item label="H5 推广域名" name="H5Domain1">
              <Select
                v-model:value="model.H5Domain1"
                :options="
                  h5Domains.map((item) => ({
                    label: `${Number(item.PublicType) === -1 ? '【公共】' : ''}${domainValue(item)}`,
                    value: domainValue(item),
                  }))
                "
                placeholder="请选择 H5 推广域名"
                show-search
              />
            </Form.Item>

            <div class="section-title">H5 下载设置</div>
            <Form.Item label="下载推荐" name="H5DownloadType">
              <Space wrap>
                <Radio.Group v-model:value="model.H5DownloadType">
                  <Radio value="app">APP</Radio>
                  <Radio value="pwa">PWA</Radio>
                </Radio.Group>
                <span>显示推荐</span>
                <Switch v-model:checked="model.IsOpenH5RecommendDownload" />
              </Space>
            </Form.Item>
            <Form.Item label="下载弹窗">
              <Space wrap>
                <Switch v-model:checked="model.IsOpenH5Download" />
                <Radio.Group v-model:value="model.H5DownloadUserTarget">
                  <Radio :value="0">游客</Radio>
                  <Radio :value="1">会员</Radio>
                  <Radio :value="2">全部</Radio>
                </Radio.Group>
              </Space>
            </Form.Item>
            <Form.Item v-if="model.IsOpenH5Download" label="多语言弹窗文案">
              <Tabs
                v-model:active-key="activeLanguageId"
                type="line"
                size="small"
              >
                <Tabs.TabPane
                  v-for="(_caption, id) in languageCaptions"
                  :key="id"
                  :tab="languageLabel(id)"
                >
                  <Input.TextArea
                    v-model:value="languageCaptions[id]!.Caption"
                    :rows="4"
                    placeholder="请输入下载弹窗内容"
                  />
                </Tabs.TabPane>
              </Tabs>
            </Form.Item>
            <Form.Item label="自定义 APK 名称" name="CustomApkName">
              <Input
                v-model:value="model.CustomApkName"
                placeholder="仅限英文字母和数字"
              />
            </Form.Item>
            <Form.Item label="统计代码">
              <Input.TextArea
                v-model:value="model.CnnzCode"
                :maxlength="2000"
                :rows="5"
                show-count
              />
            </Form.Item>
          </section>
        </Form>

        <div class="wizard-actions">
          <Button :disabled="saving" @click="requestClose">关闭</Button>
          <Button
            v-if="activeStep > 0"
            :disabled="saving"
            @click="previousStep"
          >
            上一步
          </Button>
          <Button
            v-if="activeStep < 3"
            :disabled="saving"
            type="primary"
            @click="nextStep"
          >
            下一步
          </Button>
          <Button v-else :loading="saving" type="primary" @click="submit">
            {{ isEdit ? '保存修改' : '创建渠道' }}
          </Button>
        </div>
      </template>
    </div>
  </Modal>
</template>

<style scoped>
.wizard-body {
  min-height: 360px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
}

.channel-form {
  margin-top: 24px;
}

.step-panel {
  min-height: 420px;
  padding: 4px 18px 12px;
}

.ownership-panel {
  padding-top: 36px;
}

.owner-card,
.quick-summary {
  max-width: 620px;
  padding: 28px;
  margin: 28px auto;
  background: hsl(var(--accent));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.owner-name {
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}

.owner-account {
  margin-top: 6px;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.owner-path {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}

.quick-summary > div + div {
  margin-top: 14px;
}

.section-title {
  padding: 7px 12px;
  margin: 8px 0 22px;
  font-weight: 600;
  background: hsl(var(--accent));
  border-left: 3px solid hsl(var(--primary));
}

.field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.venue-list {
  max-width: 560px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.venue-row {
  display: grid;
  grid-template-columns: 92px 48px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 44px;
  padding: 6px 10px;
  border-bottom: 1px solid hsl(var(--border));
}

.venue-row:last-child {
  border-bottom: 0;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.resource-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 140px;
  overflow: hidden;
  cursor: pointer;
  background: hsl(var(--muted));
  border: 2px solid transparent;
  border-radius: 8px;
}

.resource-card.selected {
  border-color: hsl(var(--primary));
}

.resource-card :deep(.ant-radio-wrapper) {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
}

.resource-card :deep(.ant-image) {
  width: 100%;
}

.resource-card :deep(img) {
  width: 100%;
  height: 112px;
  object-fit: cover;
}

.resource-card > span {
  padding: 6px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-pagination {
  margin-top: 16px;
  text-align: right;
}

.landing-preview {
  width: min(360px, 100%);
  margin: 0 auto 24px;
  overflow: hidden;
  background: #fff;
  border: 8px solid #202124;
  border-radius: 22px;
}

.landing-preview :deep(.ant-image),
.landing-preview :deep(.ant-image-img) {
  display: block;
  width: 100%;
}

.landing-preview :deep(.slick-slide img) {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
}

.wizard-actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 14px 0 2px;
  background: hsl(var(--card));
  border-top: 1px solid hsl(var(--border));
}

.result-details {
  line-height: 1.9;
}

@media (max-width: 720px) {
  .step-panel {
    padding-inline: 0;
  }

  .resource-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<style>
.channel-form-modal .ant-modal-body {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}
</style>
