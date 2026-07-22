<script lang="ts" setup>
import type {
  PackageIdentityConfig,
  PackageSiteConfig,
  WelcomeEmailLangText,
} from '#/api/gameManage/package-settings';
import type { PackageFormPayload, PackageId } from '#/types/package-config';

import { computed, nextTick, reactive, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Checkbox,
  Divider,
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
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  fetchAdTemplateListApi,
  fetchBackWaterSchemeListApi,
  fetchPackageActivityListApi,
  fetchPackageDetailApi,
  fetchPackageListApi,
  fetchPackageLogoGroupListApi,
  updatePackageApi,
  updatePackageDescriptionApi,
} from '#/api/gameManage/package';
import {
  createPackageSiteConfigApi,
  deletePackageSiteConfigApi,
  fetchPackageIdentityConfigApi,
  fetchPackagePaymentWithdrawBindConfigApi,
  fetchPackageRegisterLoginConfigApi,
  fetchPackageSeoConfigApi,
  fetchPackageSiteConfigsApi,
  fetchWelcomeEmailConfigApi,
  reorderPackageSiteConfigApi,
  updatePackageIdentityConfigApi,
  updatePackagePaymentWithdrawBindConfigApi,
  updatePackageRegisterLoginConfigApi,
  updatePackageSeoConfigApi,
  updatePackageTransactionLogsApi,
  updateWelcomeEmailConfigApi,
} from '#/api/gameManage/package-settings';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';

import PackageAnalyticsPanel from './package-analytics-panel.vue';
import PackageGameSupportPanel from './package-game-support-panel.vue';
import PackageVenuePanel from './package-venue-panel.vue';

defineOptions({ name: 'PackageSettingsModal' });

const props = withDefaults(
  defineProps<{
    initialTab?: TabKey;
    open: boolean;
    packageId: PackageId;
    packageName: string;
  }>(),
  { initialTab: 'general' },
);

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

type TabKey =
  | 'analytics'
  | 'appearance'
  | 'company'
  | 'game-support'
  | 'general'
  | 'growth'
  | 'login'
  | 'payment'
  | 'promotion'
  | 'push'
  | 'records'
  | 'support'
  | 'venue';

interface Option {
  label: string;
  value: number | string;
}

interface LangTextItem {
  CompanyProfile?: string;
  LangGrouopId?: PackageId;
  LangGroupId?: PackageId;
  LoadingPictureUrl?: string;
  [key: string]: unknown;
}

interface RegisterLoginForm extends Record<string, unknown> {
  AbnormalLoginVerification?: boolean;
  AutoLogoutTime?: number;
  AutoRegistration?: boolean;
  DefaultMode?: number;
  Id?: PackageId;
  PackageId?: PackageId;
  RegistrationAdsSwitch?: boolean;
}

interface AgentContact extends Record<string, unknown> {
  Contact: string;
  CsType: boolean;
  Image: string;
  Name: string;
  Url: string;
}

interface BetWaterMode extends Record<string, unknown> {
  DayOfWeeks: number;
  DaysDelay: number;
  DaysOfCycle: number;
  Mode: number;
}

const { checkPermission, projectConfig } = useCloudPermission();

const activeTab = ref<TabKey>('general');
const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const detail = ref<Record<string, unknown>>({});
const loadedTabs = new Set<TabKey>();
let loadGeneration = 0;

const analyticsPanel = ref<{
  load: () => Promise<void>;
  save: () => Promise<void>;
}>();
const venuePanel = ref<{
  buildPatch: () => Record<string, unknown>;
  hydrate: (detail: Record<string, unknown>) => Promise<void>;
}>();
const gameSupportPanel = ref<{
  buildPatch: () => Record<string, unknown>;
  hydrate: (detail: Record<string, unknown>) => void;
}>();

function setAnalyticsPanel(value: unknown) {
  analyticsPanel.value = value as typeof analyticsPanel.value;
}

function setVenuePanel(value: unknown) {
  venuePanel.value = value as typeof venuePanel.value;
}

function setGameSupportPanel(value: unknown) {
  gameSupportPanel.value = value as typeof gameSupportPanel.value;
}

const generalForm = reactive({
  Description: '',
  Languages: [] as string[],
});

const appearanceForm = reactive({
  AppBannerId: 0 as PackageId,
  AppHomeAdTmpId: 0 as PackageId,
  BannerId: 0 as PackageId,
  FloatingWindowId: 0 as PackageId,
  LivestreamFloatingTmpId: 0 as PackageId,
  LogoGroupId: 0 as PackageId,
  MainImgId: 0 as PackageId,
  OtherImgId: 0 as PackageId,
  PayForAdId: 0 as PackageId,
  PcHomeSettingId: 0 as PackageId,
  SteamingBannerId: 0 as PackageId,
});
const loadingPictures = reactive<Record<string, string[]>>({});
const loadingCountdown = ref(5);
const activeLangGroup = ref<string>('');
const logoOptions = ref<Option[]>([]);
const adOptions = reactive<Record<number, Option[]>>({});

const pushForm = reactive({
  FirebaseAndroidConfig: '',
  FirebaseIosConfig: '',
  FirebaseSecret: '',
  FirebaseWebConfig: '',
  ThirdNoticeEnable: false,
});

const promotionForm = reactive({
  BetWaterTemplateIdV2: 0 as PackageId,
  BetWaterMode: {
    DayOfWeeks: 3,
    DaysDelay: 0,
    DaysOfCycle: 1,
    Mode: 0,
  } as BetWaterMode,
  GamePromotionChannel: '' as '' | PackageId,
  GamePromotionModel: 0,
  Uid: '' as '' | PackageId,
});
const rebateOptions = ref<Option[]>([]);
const activityOptions = ref<Option[]>([]);
const initialUidLocked = ref(false);

const registerConfig = ref<RegisterLoginForm>({});
const identityForms = reactive<Record<1 | 2, PackageIdentityConfig>>({
  1: { LoginPlatformType: 1, PackageId: 0 },
  2: { LoginPlatformType: 2, PackageId: 0 },
});

const paymentForm = reactive({
  BindBypassEnabled: false,
  BindBypassTimeInPayment: 10,
  BindingType: [1] as number[],
  Id: 0 as PackageId,
  OTPReceiver: [1] as number[],
});

const supportForm = reactive({
  CsAgentAddrApp: '',
  CsAgentAddrPC: '',
  CsAgentType: 0,
  CsLiveAddress: '',
  CsLiveType: 0,
});
const agentContacts = reactive<Record<string, AgentContact[]>>({});

const companyProfiles = reactive<Record<string, string>>({});
const welcomeForm = reactive({
  Id: undefined as PackageId | undefined,
  IsOpen: false,
  LangText: {} as Record<string, WelcomeEmailLangText>,
});

const seoForm = reactive({ Content: '', Title: '' });
const siteConfigs = ref<PackageSiteConfig[]>([]);
const newSiteName = ref('');
const siteSaving = ref(false);

const recordsForm = reactive({
  TransactionLog: [] as number[],
  VIPBadgeGroupID: 0 as PackageId,
});
const vipBadgeOptions = ref<Option[]>([]);

const tabDefinitions: Array<{
  allPermissions?: boolean;
  key: TabKey;
  label: string;
  permissions: number[];
}> = [
  { key: 'general', label: '基础与语言', permissions: [11_853, 12_607] },
  {
    key: 'appearance',
    label: 'Logo / Loading / 广告',
    permissions: [10_775, 11_105, 11_109],
  },
  { key: 'push', label: '推送 / Firebase', permissions: [11_106] },
  { key: 'promotion', label: '推广与返水', permissions: [11_107, 11_108] },
  { key: 'login', label: '登录与注册', permissions: [11_110, 12_935] },
  { key: 'payment', label: '充值 / 提现绑定', permissions: [13_010] },
  { key: 'support', label: '客服设置', permissions: [11_409, 11_966] },
  { key: 'company', label: '官方资料与邮件', permissions: [10_775, 12_909] },
  { key: 'growth', label: 'SEO 与邀请站点', permissions: [10_775, 13_178] },
  { key: 'records', label: 'VIP 与交易记录', permissions: [13_203, 13_250] },
  { key: 'analytics', label: '数据统计', permissions: [13_179] },
  { key: 'venue', label: '场馆设置', permissions: [11_669] },
  {
    allPermissions: true,
    key: 'game-support',
    label: '游戏客服',
    permissions: [11_408, 11_411],
  },
];

const visibleTabs = computed(() =>
  tabDefinitions.filter((tab) =>
    tab.allPermissions
      ? tab.permissions.every((permission) => checkPermission(permission))
      : tab.permissions.some((permission) => checkPermission(permission)),
  ),
);

const langGroups = computed(() =>
  (projectConfig.value?.LangGroup ?? []).filter((group) => group.Id),
);

const languageOptions = computed<Option[]>(() => {
  const values = new Set<string>();
  langGroups.value.forEach((group) => {
    const languages = Array.isArray(group.Languages)
      ? group.Languages
      : String(group.Languages || '').split(/\s*,\s*/);
    languages.filter(Boolean).forEach((language) => values.add(language));
  });
  generalForm.Languages.forEach((language) => values.add(language));
  return [...values].map((value) => ({ label: value, value }));
});

const transactionOptions: Option[] = [
  { label: '存款', value: 1 },
  { label: '提款', value: 2 },
  { label: '调整', value: 3 },
  { label: '红利', value: 4 },
  { label: '返水', value: 5 },
];
const accountTemplateCode = '{{.Account}}';

const vipLevelOptions = computed(() => {
  const levels = projectConfig.value?.VIPLevelMap;
  if (!Array.isArray(levels)) return [];
  return levels.map((item, index) => {
    const level = asRecord(item);
    return {
      label: String(level.VipLevelName ?? level.Name ?? `VIP ${index}`),
      value: Number(level.VipLevelId ?? level.Level ?? index),
    };
  });
});

const adFields: Array<{
  field: keyof typeof appearanceForm;
  label: string;
  type: number;
}> = [
  { field: 'BannerId', label: '轮播方案', type: 1 },
  { field: 'AppBannerId', label: 'APP 启动页', type: 2 },
  { field: 'MainImgId', label: '首页弹窗', type: 3 },
  { field: 'OtherImgId', label: '其他广告', type: 4 },
  { field: 'SteamingBannerId', label: '直播轮播广告', type: 5 },
  { field: 'PayForAdId', label: '支付广告', type: 6 },
  { field: 'FloatingWindowId', label: '悬浮窗口', type: 7 },
  { field: 'PcHomeSettingId', label: 'PC 首页设置', type: 9 },
  { field: 'AppHomeAdTmpId', label: 'APP 首页设置', type: 10 },
  { field: 'LivestreamFloatingTmpId', label: '直播间悬浮窗口', type: 11 },
];

const registerFields = [
  { key: 'Account', label: '账号' },
  { key: 'Mobile', label: '手机' },
  { key: 'Email', label: '邮箱' },
];
const extraRegisterFields = [
  { key: 'Email', label: '邮箱' },
  { key: 'Mobile', label: '手机' },
  { key: 'Birthday', label: '生日' },
  { key: 'InviteCode', label: '邀请码' },
  { key: 'Realname', label: '真实姓名' },
  { key: 'NationalId', label: '身份证号' },
  { key: 'Telegram', label: 'Telegram' },
  { key: 'Facebook', label: 'Facebook' },
  { key: 'Gender', label: '性别' },
  { key: 'IdPhoto1', label: '身份证照片' },
  { key: 'IdPhoto2', label: '手持身份证照片' },
  { key: 'InviteSite', label: '邀请站点' },
];
const weekOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const canSaveActiveTab = computed(() => {
  if (activeTab.value === 'growth') return checkPermission(13_178);
  return true;
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseLangText(value: unknown): Record<string, LangTextItem> {
  const parsed = parseJson<unknown>(value, value);
  if (Array.isArray(parsed)) {
    return Object.fromEntries(
      parsed.map((item) => {
        const row = asRecord(item) as LangTextItem;
        const id = row.LangGroupId ?? row.LangGrouopId;
        return [String(id), row];
      }),
    );
  }
  return asRecord(parsed) as Record<string, LangTextItem>;
}

function serializeLangText(map: Record<string, LangTextItem>) {
  return JSON.stringify(Object.values(map));
}

function mergeLangTextField(
  latestValue: unknown,
  editedValue: unknown,
  field: string,
) {
  const latest = parseLangText(latestValue);
  const edited = parseLangText(editedValue);
  Object.entries(edited).forEach(([langId, row]) => {
    latest[langId] ??= {
      LangGroupId:
        row.LangGroupId ?? row.LangGrouopId ?? (Number(langId) || langId),
    };
    if (Object.hasOwn(row, field)) latest[langId][field] = row[field];
  });
  return serializeLangText(latest);
}

function parseLanguages(value: unknown): string[] {
  const parsed = parseJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) =>
      typeof item === 'string' ? item : String(asRecord(item).value || ''),
    )
    .filter(Boolean);
}

function listItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.map((item) => asRecord(item));
  const record = asRecord(value);
  const items = record.Items ?? record.Item;
  return Array.isArray(items) ? items.map((item) => asRecord(item)) : [];
}

function toOptions(
  value: unknown,
  valueField = 'Id',
  labelField = 'TemplateName',
): Option[] {
  return listItems(value).map((item) => ({
    label: String(item[labelField] ?? item.Name ?? item[valueField] ?? ''),
    value: (item[valueField] ?? item.Id ?? 0) as PackageId,
  }));
}

function csvToNumbers(value: unknown) {
  return String(value ?? '')
    .split(',')
    .filter(Boolean)
    .map(Number);
}

function registrationField(key: string) {
  const current = asRecord(registerConfig.value[key]);
  registerConfig.value[key] = current;
  return current as {
    EnableForLogin?: boolean;
    EnableForReg?: boolean;
  };
}

function isDefaultAuthField(key: string) {
  return (
    ['Account', 'Mobile', 'Email'][
      Number(registerConfig.value.DefaultMode) - 1
    ] === key
  );
}

function enforceDefaultAuth() {
  const field = ['Account', 'Mobile', 'Email'][
    Number(registerConfig.value.DefaultMode) - 1
  ];
  if (!field) return;
  const config = registrationField(field);
  config.EnableForReg = true;
  config.EnableForLogin = true;
}

function extraRegistrationField(key: string) {
  const current = asRecord(registerConfig.value[key]);
  registerConfig.value[key] = current;
  return current as {
    AgeLimit?: number;
    ExtraInfoLevel?: number;
    ExtraInfoOptions?: string[];
  };
}

function registrationAds() {
  const value = registerConfig.value.RegistrationAds;
  const parsed = parseJson<unknown>(value, value);
  const map = Array.isArray(parsed)
    ? Object.fromEntries(
        parsed.map((item, index) => {
          const row = asRecord(item);
          return [String(row.LangGroupId ?? row.LangGrouopId ?? index), row];
        }),
      )
    : asRecord(parsed);
  registerConfig.value.RegistrationAds = map;
  langGroups.value.forEach((group) => {
    const id = String(group.Id);
    map[id] ??= { Description: '', LangGroupId: group.Id };
  });
  return map;
}

function registrationAdFor(groupId: PackageId | undefined) {
  const id = String(groupId ?? '');
  return registrationAds()[id] as {
    [key: string]: unknown;
    Description?: string;
  };
}

function loginBanConfig() {
  return registerConfig.value.LoginBanConfig as {
    LoginCount?: number;
    LoginLockIsOpen?: boolean;
    ResetTime?: number;
  };
}

function emptyAgentContact(): AgentContact {
  return { Contact: '', CsType: false, Image: '', Name: '', Url: '' };
}

function contactsFor(groupId: PackageId | undefined) {
  const id = String(groupId ?? '');
  agentContacts[id] ??= Array.from({ length: 6 }, emptyAgentContact);
  while (agentContacts[id].length < 6) {
    agentContacts[id].push(emptyAgentContact());
  }
  return agentContacts[id];
}

function splitCountdown(value: string) {
  if (!value) return { countdown: undefined, path: '' };
  const [path, query = ''] = value.split('?');
  const params = new URLSearchParams(query);
  const countdown = params.get('countdown');
  return {
    countdown: countdown === null ? undefined : Number(countdown),
    path: path || '',
  };
}

function loadingPicturesFor(groupId: PackageId | undefined) {
  const id = String(groupId ?? '');
  loadingPictures[id] ??= ['', '', '', ''];
  return loadingPictures[id];
}

function welcomeLangTextFor(groupId: PackageId | undefined) {
  const id = String(groupId ?? '');
  welcomeForm.LangText[id] ??= {
    Content: '',
    LangGroupId: groupId ?? id,
    Title: '',
  };
  return welcomeForm.LangText[id];
}

function resetState() {
  loadedTabs.clear();
  detail.value = {};
  loadError.value = '';
  generalForm.Description = '';
  generalForm.Languages = [];
  Object.keys(loadingPictures).forEach((key) => delete loadingPictures[key]);
  Object.keys(agentContacts).forEach((key) => delete agentContacts[key]);
  loadingCountdown.value = 5;
  Object.keys(companyProfiles).forEach((key) => delete companyProfiles[key]);
  welcomeForm.Id = undefined;
  welcomeForm.IsOpen = false;
  welcomeForm.LangText = {};
  langGroups.value.forEach((group) => {
    const id = String(group.Id);
    loadingPictures[id] = ['', '', '', ''];
    companyProfiles[id] = '';
    welcomeForm.LangText[id] = {
      LangGroupId: group.Id,
      Title: '',
      Content: '',
    };
  });
  activeLangGroup.value = String(langGroups.value[0]?.Id ?? '');
  siteConfigs.value = [];
  newSiteName.value = '';
  registerConfig.value = {};
}

async function ensureDetail() {
  if (detail.value.Id === props.packageId) return;
  detail.value = (await fetchPackageDetailApi(props.packageId)) as Record<
    string,
    unknown
  >;
}

function hydrateDetailForms() {
  generalForm.Description = String(detail.value.Description ?? '');
  generalForm.Languages = parseLanguages(detail.value.Languages);

  Object.keys(appearanceForm).forEach((key) => {
    appearanceForm[key as keyof typeof appearanceForm] = (detail.value[key] ??
      0) as never;
  });
  const langText = parseLangText(detail.value.LangText);
  const ids = new Set([
    ...langGroups.value.map((group) => String(group.Id)),
    ...Object.keys(langText),
  ]);
  ids.forEach((id) => {
    const row = langText[id] ?? { LangGroupId: Number(id) || id };
    loadingPictures[id] = parseJson<string[]>(row.LoadingPictureUrl, [
      '',
      '',
      '',
      '',
    ]);
    while (loadingPictures[id].length < 4) loadingPictures[id].push('');
    const background = splitCountdown(loadingPictures[id][2] || '');
    loadingPictures[id][2] = background.path;
    if (background.countdown !== undefined) {
      loadingCountdown.value = background.countdown;
    }
    companyProfiles[id] = String(row.CompanyProfile ?? '');
    const parsedContacts = parseJson<unknown>(row.CsAgentConfig, []);
    agentContacts[id] = Array.isArray(parsedContacts)
      ? (parsedContacts.map((item) => ({
          ...emptyAgentContact(),
          ...asRecord(item),
        })) as AgentContact[])
      : [];
    contactsFor(id);
  });
  activeLangGroup.value ||= [...ids][0] ?? '';

  Object.assign(pushForm, {
    FirebaseAndroidConfig: String(detail.value.FirebaseAndroidConfig ?? ''),
    FirebaseIosConfig: String(detail.value.FirebaseIosConfig ?? ''),
    FirebaseSecret: String(detail.value.FirebaseSecret ?? ''),
    FirebaseWebConfig: String(detail.value.FirebaseWebConfig ?? ''),
    ThirdNoticeEnable: Boolean(detail.value.ThirdNoticeEnable),
  });
  Object.assign(promotionForm, {
    BetWaterTemplateIdV2: (detail.value.BetWaterTemplateIdV2 ?? 0) as PackageId,
    BetWaterMode: {
      DayOfWeeks: 3,
      DaysDelay: 0,
      DaysOfCycle: 1,
      Mode: 0,
      ...parseJson<Record<string, unknown>>(detail.value.BetWaterMode, {}),
    },
    GamePromotionChannel: (detail.value.GamePromotionChannel ?? '') as
      | ''
      | PackageId,
    GamePromotionModel: Number(detail.value.GamePromotionModel ?? 0),
    Uid: (Number(detail.value.Uid) === 0 ? '' : (detail.value.Uid ?? '')) as
      | ''
      | PackageId,
  });
  initialUidLocked.value = Number(detail.value.Uid) > 0;
  Object.assign(supportForm, {
    CsAgentAddrApp: String(detail.value.CsAgentAddrApp ?? ''),
    CsAgentAddrPC: String(detail.value.CsAgentAddrPC ?? ''),
    CsAgentType: Number(detail.value.CsAgentType ?? 0),
    CsLiveAddress: String(detail.value.CsLiveAddress ?? ''),
    CsLiveType: Number(detail.value.CsLiveType ?? 0),
  });
  recordsForm.VIPBadgeGroupID = (detail.value.VIPBadgeGroupID ??
    0) as PackageId;
  recordsForm.TransactionLog = String(detail.value.TransactionLogConfig ?? '')
    ? csvToNumbers(detail.value.TransactionLogConfig)
    : [1, 2, 3, 4, 5];
}

async function loadAppearance() {
  await ensureDetail();
  hydrateDetailForms();
  const tasks: Promise<unknown>[] = [];
  if (checkPermission(11_105)) {
    tasks.push(
      fetchPackageLogoGroupListApi().then((result) => {
        logoOptions.value = listItems(result).map((item) => ({
          label: String(
            item.TemplateName ?? item.Name ?? item.LogoGroupId ?? '',
          ),
          value: (item.LogoGroupId ?? item.Id ?? 0) as PackageId,
        }));
        const current = appearanceForm.LogoGroupId;
        if (
          current &&
          Number(current) !== 0 &&
          !logoOptions.value.some(
            (item) => String(item.value) === String(current),
          )
        ) {
          logoOptions.value.unshift({
            label: `方案 ${current}`,
            value: current,
          });
        }
      }),
    );
  }
  if (checkPermission(11_109)) {
    adFields.forEach(({ type }) => {
      tasks.push(
        fetchAdTemplateListApi({ Type: type }).then((result) => {
          adOptions[type] = [{ label: '无', value: 0 }, ...toOptions(result)];
        }),
      );
    });
  }
  await Promise.all(tasks);
}

async function loadLogin() {
  const tasks: Promise<unknown>[] = [];
  if (checkPermission(11_110)) {
    tasks.push(
      fetchPackageRegisterLoginConfigApi(props.packageId).then((result) => {
        registerConfig.value = {
          AbnormalLoginVerification: false,
          Account: { EnableForLogin: true, EnableForReg: true },
          AutoLogoutTime: 0,
          AutoRegistration: false,
          Captcha: { EnableForLogin: false, EnableForReg: false },
          DefaultMode: 1,
          Email: { EnableForLogin: false, EnableForReg: false },
          Mobile: { EnableForLogin: true, EnableForReg: true },
          OTP: { EnableForLogin: false },
          ...result,
        };
        extraRegisterFields.forEach(({ key }) => {
          const field = extraRegistrationField(key);
          field.ExtraInfoLevel ??= key === 'InviteCode' ? 1 : 0;
          if (key === 'Birthday') field.AgeLimit ??= 21;
          if (key === 'InviteSite') field.ExtraInfoOptions ??= [];
        });
        registerConfig.value.LoginBanConfig = {
          LoginCount: 0,
          LoginLockIsOpen: false,
          ResetTime: 0,
          ...asRecord(registerConfig.value.LoginBanConfig),
        };
        registerConfig.value.RegistrationAdsSwitch ??= true;
        registrationAds();
      }),
    );
  }
  if (checkPermission(12_935)) {
    ([1, 2] as const).forEach((type) => {
      tasks.push(
        fetchPackageIdentityConfigApi(props.packageId, type).then((result) => {
          Object.assign(identityForms[type], {
            LoginPlatformType: type,
            PackageAppId: result.PackageAppId ?? '',
            PackageId: props.packageId,
            ...result.LoginConfig?.[0],
          });
        }),
      );
    });
  }
  await Promise.all(tasks);
}

async function loadCompany() {
  await ensureDetail();
  hydrateDetailForms();
  if (!checkPermission(12_909)) return;
  const result = await fetchWelcomeEmailConfigApi(props.packageId);
  welcomeForm.Id = result.Id;
  welcomeForm.IsOpen = Boolean(result.IsOpen);
  const parsed = parseJson<unknown>(result.LangText, []);
  const rows = Array.isArray(parsed)
    ? (parsed as WelcomeEmailLangText[])
    : (Object.values(asRecord(parsed)) as WelcomeEmailLangText[]);
  welcomeForm.LangText = Object.fromEntries(
    rows.map((row) => [String(row.LangGroupId), row]),
  );
  langGroups.value.forEach((group) => {
    welcomeForm.LangText[String(group.Id)] ??= {
      LangGroupId: group.Id,
      Title: '',
      Content: '',
    };
  });
}

async function loadTab(tab: TabKey) {
  if (loadedTabs.has(tab)) return;
  const generation = loadGeneration;
  loading.value = true;
  loadError.value = '';
  try {
    await nextTick();
    if (['general', 'push', 'support'].includes(tab)) {
      await ensureDetail();
      hydrateDetailForms();
    } else
      switch (tab) {
        case 'analytics': {
          if (!analyticsPanel.value) throw new Error('数据统计面板初始化失败');
          await analyticsPanel.value.load();

          break;
        }
        case 'appearance': {
          await loadAppearance();

          break;
        }
        case 'company': {
          await loadCompany();

          break;
        }
        case 'game-support': {
          await ensureDetail();
          if (!gameSupportPanel.value)
            throw new Error('游戏客服面板初始化失败');
          gameSupportPanel.value.hydrate(detail.value);

          break;
        }
        case 'growth': {
          const tasks: Promise<unknown>[] = [];
          if (checkPermission(13_178)) {
            tasks.push(
              fetchPackageSeoConfigApi(props.packageId).then((result) => {
                seoForm.Title = String(result.Title ?? '');
                seoForm.Content = String(result.Content ?? '');
              }),
            );
          }
          if (checkPermission(10_775)) {
            tasks.push(
              fetchPackageSiteConfigsApi(props.packageId).then((result) => {
                siteConfigs.value = listItems(
                  result,
                ) as unknown as PackageSiteConfig[];
              }),
            );
          }
          await Promise.all(tasks);

          break;
        }
        case 'login': {
          await loadLogin();

          break;
        }
        case 'payment': {
          const result = await fetchPackagePaymentWithdrawBindConfigApi(
            props.packageId,
          );
          paymentForm.Id = result.Id ?? 0;
          paymentForm.BindingType = csvToNumbers(result.BindingType);
          paymentForm.OTPReceiver = csvToNumbers(result.OTPReceiver);
          const timeout = Number(result.BindBypassTimeInPayment ?? -1);
          paymentForm.BindBypassEnabled = timeout > 0;
          paymentForm.BindBypassTimeInPayment = timeout > 0 ? timeout : 10;

          break;
        }
        case 'promotion': {
          await ensureDetail();
          hydrateDetailForms();
          const tasks: Promise<unknown>[] = [];
          if (checkPermission(11_107)) {
            tasks.push(
              fetchPackageActivityListApi({ IsShowAll: 1 }).then((result) => {
                activityOptions.value = listItems(result)
                  .filter((item) =>
                    [10_014, 10_018].includes(Number(item.Type)),
                  )
                  .map((item) => ({
                    label: String(item.Name ?? item.Id ?? ''),
                    value: (item.Id ?? '') as PackageId,
                  }));
              }),
            );
          }
          if (checkPermission(11_108)) {
            tasks.push(
              fetchBackWaterSchemeListApi({}).then((result) => {
                rebateOptions.value = toOptions(result, 'Id', 'Name');
              }),
            );
          }
          await Promise.all(tasks);

          break;
        }
        case 'records': {
          await ensureDetail();
          hydrateDetailForms();
          if (checkPermission(13_203)) {
            const result = await fetchPackageListApi({ Page: 1, PageSize: 1 });
            vipBadgeOptions.value = listItems(result.VIPBadgeGroups).map(
              (item) => ({
                label: String(item.TemplateName ?? item.TemplateId ?? ''),
                value: (item.TemplateId ?? 0) as PackageId,
              }),
            );
          }

          break;
        }
        case 'venue': {
          await ensureDetail();
          if (!venuePanel.value) throw new Error('场馆设置面板初始化失败');
          await venuePanel.value.hydrate(detail.value);

          break;
        }
        // No default
      }
    if (generation === loadGeneration) loadedTabs.add(tab);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '配置加载失败';
  } finally {
    if (generation === loadGeneration) loading.value = false;
  }
}

async function updateDetail(patch: Record<string, unknown>) {
  const latest = (await fetchPackageDetailApi(props.packageId)) as Record<
    string,
    unknown
  >;
  const payload = { ...latest, ...patch } as unknown as PackageFormPayload;
  await updatePackageApi(payload);
  detail.value = { ...latest, ...patch };
}

function langTextWithChanges(
  updater: (langText: Record<string, LangTextItem>) => void,
) {
  const langText = parseLangText(detail.value.LangText);
  updater(langText);
  return serializeLangText(langText);
}

async function saveGeneral() {
  const Description = generalForm.Description.trim();
  if (checkPermission(12_607)) {
    const current = parseJson<Array<Record<string, unknown>>>(
      detail.value.Languages,
      [],
    );
    const byValue = new Map(current.map((item) => [String(item.value), item]));
    const Languages = JSON.stringify(
      generalForm.Languages.map(
        (value) => byValue.get(value) ?? { label: value, value },
      ),
    );
    await updateDetail({
      Languages,
      ...(checkPermission(11_853) ? { Description } : {}),
    });
  }
  if (checkPermission(11_853)) {
    await updatePackageDescriptionApi({
      Description,
      Id: props.packageId,
    });
    detail.value.Description = Description;
  }
}

async function saveAppearance() {
  const patch: Record<string, unknown> = {};
  if (checkPermission(11_105)) {
    patch.LogoGroupId = appearanceForm.LogoGroupId;
  }
  if (checkPermission(10_775)) {
    patch.LangText = langTextWithChanges((langText) => {
      Object.entries(loadingPictures).forEach(([id, pictures]) => {
        langText[id] ??= { LangGroupId: Number(id) || id };
        const serialized = [...pictures];
        serialized[2] = serialized[2]
          ? `${splitCountdown(serialized[2]).path}?countdown=${loadingCountdown.value}`
          : '';
        langText[id].LoadingPictureUrl = JSON.stringify(serialized);
      });
    });
  }
  if (checkPermission(11_109)) {
    adFields.forEach(({ field }) => {
      patch[String(field)] = appearanceForm[field];
    });
  }
  await updateDetail(patch);
}

async function savePush() {
  if (
    !pushForm.FirebaseSecret.trim() ||
    ![
      pushForm.FirebaseAndroidConfig,
      pushForm.FirebaseIosConfig,
      pushForm.FirebaseWebConfig,
    ].some((value) => value.trim())
  ) {
    throw new Error('Firebase Admin 私钥及至少一个平台配置为必填');
  }
  if (pushForm.FirebaseWebConfig) {
    parseJson<Record<string, unknown>>(pushForm.FirebaseWebConfig, {});
    try {
      JSON.parse(pushForm.FirebaseWebConfig);
    } catch {
      throw new Error('Web PWA 配置必须是有效 JSON');
    }
  }
  await updateDetail({ ...pushForm });
}

async function savePromotion() {
  const patch: Record<string, unknown> = {};
  if (checkPermission(11_107)) {
    patch.GamePromotionModel = promotionForm.GamePromotionModel;
    patch.GamePromotionChannel =
      promotionForm.GamePromotionModel === 0
        ? ''
        : promotionForm.GamePromotionChannel;
    if (promotionForm.GamePromotionModel === 3 && !promotionForm.Uid) {
      throw new Error('好友 + 会员代理推广必须选择玩家代理方案');
    }
    patch.Uid = promotionForm.GamePromotionModel === 3 ? promotionForm.Uid : '';
  }
  if (checkPermission(11_108)) {
    patch.BetWaterTemplateIdV2 = promotionForm.BetWaterTemplateIdV2 || 0;
    const mode = Number(promotionForm.BetWaterMode.Mode);
    if (![0, 1, 2].includes(mode)) throw new Error('请选择返水结算模式');
    if (
      mode === 1 &&
      (!Number.isInteger(Number(promotionForm.BetWaterMode.DaysOfCycle)) ||
        Number(promotionForm.BetWaterMode.DaysOfCycle) < 1 ||
        Number(promotionForm.BetWaterMode.DaysOfCycle) > 20)
    ) {
      throw new Error('注单统计周期必须为 1 至 20 天');
    }
    if (
      mode === 1 &&
      ![0, 1, 2].includes(Number(promotionForm.BetWaterMode.DaysDelay))
    ) {
      throw new Error('返水延后天数必须为 0、1 或 2 天');
    }
    if (
      mode === 2 &&
      !weekOptions.some(
        (item) => item.value === Number(promotionForm.BetWaterMode.DayOfWeeks),
      )
    ) {
      throw new Error('请选择每周发放日期');
    }
    patch.BetWaterMode = JSON.stringify({
      ...promotionForm.BetWaterMode,
      Mode: mode,
    });
  }
  await updateDetail(patch);
}

async function saveLogin() {
  const tasks: Promise<unknown>[] = [];
  if (checkPermission(11_110)) {
    const source = { ...registerConfig.value };
    const Id = source.Id as PackageId;
    if (!Id) throw new Error('登录注册配置缺少 Id');
    const AutoLogoutTime = Number(source.AutoLogoutTime ?? 0);
    delete source.Id;
    delete source.PackageId;
    delete source.AutoLogoutTime;
    const defaultField = ['Account', 'Mobile', 'Email'][
      Number(source.DefaultMode) - 1
    ];
    if (defaultField) {
      const auth = asRecord(source[defaultField]);
      auth.EnableForReg = true;
      auth.EnableForLogin = true;
      source[defaultField] = auth;
    }
    const birthday = asRecord(source.Birthday);
    if (
      Number(birthday.ExtraInfoLevel) === 2 &&
      (!Number.isInteger(Number(birthday.AgeLimit)) ||
        Number(birthday.AgeLimit) < 1 ||
        Number(birthday.AgeLimit) > 99)
    ) {
      throw new Error('最低注册年龄必须为 1 至 99');
    }
    const loginBan = asRecord(source.LoginBanConfig);
    if (
      loginBan.LoginLockIsOpen &&
      (Number(loginBan.LoginCount) < 1 || Number(loginBan.ResetTime) < 1)
    ) {
      throw new Error('登录锁定次数和重置时间必须大于 0');
    }
    source.RegistrationAds = Object.values(asRecord(source.RegistrationAds));
    tasks.push(
      updatePackageRegisterLoginConfigApi({
        Id,
        PackageId: props.packageId,
        Params: JSON.stringify({ ...source, AutoLogoutTime }),
      }),
    );
  }
  if (checkPermission(12_935)) {
    ([1, 2] as const).forEach((type) => {
      const form = identityForms[type];
      const required =
        type === 1
          ? [form.AppId, form.AppSecret]
          : [form.AppId, form.AppSecret, form.IosAppId, form.AndroidAppId];
      if (
        form.Status &&
        required.some((value) => !String(value ?? '').trim())
      ) {
        throw new Error(
          `${type === 1 ? 'Facebook' : 'Google'} 启用前必须填写完整`,
        );
      }
      tasks.push(
        updatePackageIdentityConfigApi({ ...form, PackageId: props.packageId }),
      );
    });
  }
  await Promise.all(tasks);
}

async function savePayment() {
  if (paymentForm.BindingType.length === 0)
    throw new Error('至少选择一种绑定类型');
  await updatePackagePaymentWithdrawBindConfigApi({
    Id: paymentForm.Id,
    PackageId: props.packageId,
    Params: JSON.stringify({
      BindingType: paymentForm.BindingType.join(','),
      OTPReceiver: paymentForm.OTPReceiver.join(','),
      BindBypassTimeInPayment: paymentForm.BindBypassEnabled
        ? paymentForm.BindBypassTimeInPayment
        : -1,
    }),
  });
}

async function saveSupport() {
  const patch: Record<string, unknown> = {};
  if (
    checkPermission(11_409) &&
    supportForm.CsAgentType === 1 &&
    (!supportForm.CsAgentAddrApp.trim() || !supportForm.CsAgentAddrPC.trim())
  ) {
    throw new Error('第三方代理客服的 APP 与 PC 地址为必填');
  }
  if (checkPermission(11_409)) {
    patch.CsAgentType = supportForm.CsAgentType;
    patch.CsAgentAddrApp = supportForm.CsAgentAddrApp;
    patch.CsAgentAddrPC = supportForm.CsAgentAddrPC;
    const LangText = langTextWithChanges((langText) => {
      langGroups.value.forEach((group) => {
        const id = String(group.Id);
        const contacts = contactsFor(group.Id);
        contacts.forEach((contact, index) => {
          if (contact.Name.length > 20)
            throw new Error(
              `语言组 ${group.Name || id} 联系方式 ${index + 1} 名称不能超过 20 字`,
            );
          if (contact.Contact.length > 30)
            throw new Error(
              `语言组 ${group.Name || id} 联系方式 ${index + 1} 联系内容不能超过 30 字`,
            );
          if (contact.Url && !/^(https?|ftp):\/\//i.test(contact.Url))
            throw new Error(
              `语言组 ${group.Name || id} 联系方式 ${index + 1} 链接格式错误`,
            );
        });
        langText[id] ??= { LangGroupId: group.Id };
        langText[id].CsAgentConfig = JSON.stringify(contacts);
      });
    });
    patch.LangText = LangText;
  }
  if (
    checkPermission(11_966) &&
    supportForm.CsLiveType === 1 &&
    !supportForm.CsLiveAddress.trim()
  ) {
    throw new Error('第三方直播客服地址为必填');
  }
  if (checkPermission(11_966)) {
    patch.CsLiveType = supportForm.CsLiveType;
    patch.CsLiveAddress = supportForm.CsLiveAddress;
  }
  await updateDetail(patch);
}

async function saveCompany() {
  const tasks: Promise<unknown>[] = [];
  if (checkPermission(10_775)) {
    const LangText = langTextWithChanges((langText) => {
      Object.entries(companyProfiles).forEach(([id, CompanyProfile]) => {
        langText[id] ??= { LangGroupId: Number(id) || id };
        langText[id].CompanyProfile = CompanyProfile;
      });
    });
    tasks.push(updateDetail({ LangText }));
  }
  if (checkPermission(12_909)) {
    tasks.push(
      updateWelcomeEmailConfigApi({
        Id: welcomeForm.Id,
        IsOpen: welcomeForm.IsOpen,
        LangText: JSON.stringify(Object.values(welcomeForm.LangText)),
        PackageIds: props.packageId,
      }),
    );
  }
  await Promise.all(tasks);
}

async function saveGrowth() {
  if (!seoForm.Title.trim() || !seoForm.Content.trim()) {
    throw new Error('SEO 标题和描述为必填');
  }
  await updatePackageSeoConfigApi({
    Content: seoForm.Content.trim(),
    PackageId: props.packageId,
    Title: seoForm.Title.trim(),
  });
}

async function saveRecords() {
  const tasks: Promise<unknown>[] = [];
  if (checkPermission(13_203)) {
    tasks.push(updateDetail({ VIPBadgeGroupID: recordsForm.VIPBadgeGroupID }));
  }
  if (checkPermission(13_250)) {
    if (recordsForm.TransactionLog.length === 0)
      throw new Error('至少选择一种交易记录');
    tasks.push(
      updatePackageTransactionLogsApi({
        PackageId: props.packageId,
        TransactionLog: recordsForm.TransactionLog,
      }),
    );
  }
  await Promise.all(tasks);
}

async function saveAnalytics() {
  if (!analyticsPanel.value) throw new Error('数据统计面板未就绪');
  await analyticsPanel.value.save();
}

async function saveVenue() {
  if (!venuePanel.value) throw new Error('场馆设置面板未就绪');
  const patch = venuePanel.value.buildPatch();
  const latest = (await fetchPackageDetailApi(props.packageId)) as Record<
    string,
    unknown
  >;
  patch.LangText = mergeLangTextField(
    latest.LangText,
    patch.LangText,
    'VenueSetting',
  );
  await updateDetail(patch);
}

async function saveGameSupport() {
  if (!gameSupportPanel.value) throw new Error('游戏客服面板未就绪');
  const patch = gameSupportPanel.value.buildPatch();
  const latest = (await fetchPackageDetailApi(props.packageId)) as Record<
    string,
    unknown
  >;
  patch.LangText = mergeLangTextField(
    latest.LangText,
    patch.LangText,
    'CsLineConfig',
  );
  await updateDetail(patch);
}

async function handleSave() {
  saving.value = true;
  try {
    const handlers: Record<TabKey, () => Promise<void>> = {
      analytics: saveAnalytics,
      appearance: saveAppearance,
      company: saveCompany,
      general: saveGeneral,
      'game-support': saveGameSupport,
      growth: saveGrowth,
      login: saveLogin,
      payment: savePayment,
      promotion: savePromotion,
      push: savePush,
      records: saveRecords,
      support: saveSupport,
      venue: saveVenue,
    };
    await handlers[activeTab.value]();
    message.success('保存成功');
    emit('success');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存失败');
  } finally {
    saving.value = false;
  }
}

async function addSite() {
  if (!checkPermission(10_775)) return;
  const SiteName = newSiteName.value.trim();
  if (!SiteName) return message.warning('请输入站点名称');
  siteSaving.value = true;
  try {
    await createPackageSiteConfigApi({ PackageId: props.packageId, SiteName });
    newSiteName.value = '';
    siteConfigs.value = listItems(
      await fetchPackageSiteConfigsApi(props.packageId),
    ) as unknown as PackageSiteConfig[];
    message.success('添加成功');
    emit('success');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '添加失败');
  } finally {
    siteSaving.value = false;
  }
}

async function deleteSite(item: PackageSiteConfig) {
  if (!checkPermission(10_775)) return;
  Modal.confirm({
    title: `确认删除邀请站点“${item.SiteName || item.Id}”？`,
    async onOk() {
      await deletePackageSiteConfigApi({
        ConfigId: item.Id,
        PackageId: props.packageId,
      });
      siteConfigs.value = siteConfigs.value.filter((row) => row.Id !== item.Id);
      message.success('删除成功');
      emit('success');
    },
  });
}

async function moveSite(index: number, offset: -1 | 1) {
  if (!checkPermission(10_775)) return;
  const current = siteConfigs.value[index];
  const target = siteConfigs.value[index + offset];
  if (!current || !target) return;
  await reorderPackageSiteConfigApi({
    ConfigId: current.Id,
    ConfigId2: target.Id,
    PackageId: props.packageId,
  });
  siteConfigs.value.splice(index, 1);
  siteConfigs.value.splice(index + offset, 0, current);
  emit('success');
}

function moveLanguage(index: number, offset: -1 | 1) {
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= generalForm.Languages.length) return;
  const [language] = generalForm.Languages.splice(index, 1);
  if (language) generalForm.Languages.splice(targetIndex, 0, language);
}

watch(
  () => [props.open, props.packageId] as const,
  async ([open]) => {
    if (!open) return;
    loadGeneration += 1;
    resetState();
    const requested = visibleTabs.value.some(
      (tab) => tab.key === props.initialTab,
    )
      ? props.initialTab
      : visibleTabs.value[0]?.key;
    if (!requested) {
      loadError.value = '当前账号没有可用的包体配置权限';
      return;
    }
    const tabChanged = activeTab.value !== requested;
    activeTab.value = requested;
    if (!tabChanged) {
      await nextTick();
      await loadTab(requested);
    }
  },
);

watch(
  activeTab,
  async (tab) => {
    if (!props.open) return;
    await nextTick();
    await loadTab(tab);
  },
  { flush: 'post' },
);
</script>

<template>
  <Modal
    :open="open"
    :title="`包体配置 · ${packageName || packageId}`"
    :width="1120"
    :mask-closable="false"
    destroy-on-close
    @cancel="emit('update:open', false)"
  >
    <Alert
      v-if="loadError"
      class="mb-3"
      closable
      :message="loadError"
      show-icon
      type="error"
      @close="loadError = ''"
    />

    <Tabs v-model:active-key="activeTab" size="small" type="line">
      <Tabs.TabPane v-for="tab in visibleTabs" :key="tab.key" :tab="tab.label">
        <Spin :spinning="loading">
          <div class="settings-body">
            <template v-if="tab.key === 'general'">
              <Form layout="vertical">
                <Form.Item
                  v-if="checkPermission(11853)"
                  label="游戏备注"
                  required
                >
                  <Input.TextArea
                    v-model:value="generalForm.Description"
                    :maxlength="500"
                    :rows="4"
                    show-count
                  />
                </Form.Item>
                <Form.Item
                  v-if="checkPermission(12607)"
                  label="包体语言与顺序"
                  required
                >
                  <Select
                    v-model:value="generalForm.Languages"
                    :options="languageOptions"
                    mode="multiple"
                    placeholder="按选择顺序保存；可移除后重新添加以调整顺序"
                  />
                  <div class="language-order">
                    <div
                      v-for="(language, index) in generalForm.Languages"
                      :key="language"
                      class="language-row"
                    >
                      <span>{{ Number(index) + 1 }}. {{ language }}</span>
                      <Space>
                        <Button
                          size="small"
                          :disabled="index === 0"
                          @click="moveLanguage(index, -1)"
                        >
                          上移
                        </Button>
                        <Button
                          size="small"
                          :disabled="index === generalForm.Languages.length - 1"
                          @click="moveLanguage(index, 1)"
                        >
                          下移
                        </Button>
                      </Space>
                    </div>
                  </div>
                </Form.Item>
              </Form>
            </template>

            <template v-else-if="tab.key === 'appearance'">
              <Form layout="vertical">
                <Form.Item v-if="checkPermission(11105)" label="Logo 方案">
                  <Select
                    v-model:value="appearanceForm.LogoGroupId"
                    :options="logoOptions"
                    allow-clear
                    class="field"
                  />
                </Form.Item>
                <template v-if="checkPermission(10775)">
                  <Divider orientation="left">Loading 图片路径</Divider>
                  <Tabs
                    v-model:active-key="activeLangGroup"
                    size="small"
                    type="line"
                  >
                    <Tabs.TabPane
                      v-for="group in langGroups"
                      :key="String(group.Id)"
                      :tab="String(group.Name || `语言组 ${group.Id}`)"
                    >
                      <div class="grid-2">
                        <Form.Item
                          v-for="(item, index) in [
                            { label: 'Android 启动图', hint: '建议 1080×2340' },
                            {
                              label: 'iOS 刘海屏启动图',
                              hint: '建议 1080×2340',
                            },
                            { label: '游戏加载背景图', hint: '图片不超过 1M' },
                            { label: '游戏加载素材图', hint: '图片不超过 1M' },
                          ]"
                          :key="item.label"
                          :label="item.label"
                        >
                          <VoucherImageField
                            v-model="loadingPicturesFor(group.Id)[index]"
                            :dimension-hint="item.hint"
                            :max-size-kb="1024"
                            :preview-height="96"
                            :preview-width="72"
                          />
                        </Form.Item>
                      </div>
                    </Tabs.TabPane>
                  </Tabs>
                  <Form.Item label="游戏加载背景图倒计时">
                    <Select
                      v-model:value="loadingCountdown"
                      :options="[
                        { label: '关闭', value: 0 },
                        { label: '1 秒', value: 1 },
                        { label: '2 秒', value: 2 },
                        { label: '3 秒', value: 3 },
                        { label: '4 秒', value: 4 },
                        { label: '5 秒', value: 5 },
                      ]"
                      class="field"
                    />
                  </Form.Item>
                </template>
                <template v-if="checkPermission(11109)">
                  <Divider orientation="left">广告模板绑定</Divider>
                  <div class="grid-2">
                    <Form.Item
                      v-for="item in adFields"
                      :key="item.field"
                      :label="item.label"
                    >
                      <Select
                        v-model:value="appearanceForm[item.field]"
                        :options="adOptions[item.type]"
                        show-search
                      />
                    </Form.Item>
                  </div>
                </template>
              </Form>
            </template>

            <template v-else-if="tab.key === 'push'">
              <Alert
                class="mb-4"
                message="配置内容按旧接口原样保存；Web PWA 配置须为 JSON，iOS 配置可粘贴 plist 内容。"
                show-icon
                type="info"
              />
              <Form layout="vertical">
                <div class="grid-2">
                  <Form.Item label="Android Firebase 配置">
                    <Input.TextArea
                      v-model:value="pushForm.FirebaseAndroidConfig"
                      :rows="8"
                    />
                  </Form.Item>
                  <Form.Item label="iOS Firebase 配置">
                    <Input.TextArea
                      v-model:value="pushForm.FirebaseIosConfig"
                      :rows="8"
                    />
                  </Form.Item>
                  <Form.Item label="Web PWA 配置（JSON）">
                    <Input.TextArea
                      v-model:value="pushForm.FirebaseWebConfig"
                      :rows="8"
                    />
                  </Form.Item>
                  <Form.Item label="Firebase Admin 私钥（JSON）" required>
                    <Input.TextArea
                      v-model:value="pushForm.FirebaseSecret"
                      :rows="8"
                    />
                  </Form.Item>
                </div>
                <Form.Item label="推送用户提醒">
                  <Switch v-model:checked="pushForm.ThirdNoticeEnable" />
                </Form.Item>
              </Form>
            </template>

            <template v-else-if="tab.key === 'promotion'">
              <Form layout="vertical">
                <template v-if="checkPermission(11107)">
                  <Form.Item label="内置推广模式">
                    <Radio.Group
                      v-model:value="promotionForm.GamePromotionModel"
                    >
                      <Radio :value="0">不使用</Radio>
                      <Radio :value="2">好友推广</Radio>
                      <Radio :value="3">好友 + 会员代理推广</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    v-if="[2, 3].includes(promotionForm.GamePromotionModel)"
                    label="指定新用户归属渠道 ID（留空表示上级渠道）"
                  >
                    <Input v-model:value="promotionForm.GamePromotionChannel" />
                  </Form.Item>
                  <Form.Item
                    v-if="promotionForm.GamePromotionModel === 3"
                    label="玩家代理方案"
                    required
                  >
                    <Select
                      v-model:value="promotionForm.Uid"
                      :disabled="initialUidLocked"
                      :options="activityOptions"
                      allow-clear
                      class="field"
                      show-search
                    />
                    <div class="hint">方案保存后不可修改。</div>
                  </Form.Item>
                </template>
                <Form.Item v-if="checkPermission(11108)" label="返水方案">
                  <Select
                    v-model:value="promotionForm.BetWaterTemplateIdV2"
                    :options="[
                      { label: '不启用返水', value: 0 },
                      ...rebateOptions,
                    ]"
                    show-search
                  />
                </Form.Item>
                <template
                  v-if="
                    checkPermission(11108) &&
                    Number(promotionForm.BetWaterTemplateIdV2) !== 0
                  "
                >
                  <Form.Item label="返水结算模式" required>
                    <Radio.Group
                      v-model:value="promotionForm.BetWaterMode.Mode"
                    >
                      <Radio :value="0">日结</Radio>
                      <Radio :value="1">按周期结算</Radio>
                      <Radio :value="2">周结</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <div
                    v-if="promotionForm.BetWaterMode.Mode === 1"
                    class="grid-2"
                  >
                    <Form.Item label="注单统计周期（天）" required>
                      <Select
                        v-model:value="promotionForm.BetWaterMode.DaysOfCycle"
                        :options="
                          Array.from({ length: 20 }, (_, index) => ({
                            label: `${index + 1} 天`,
                            value: index + 1,
                          }))
                        "
                      />
                    </Form.Item>
                    <Form.Item label="返水延后天数" required>
                      <Select
                        v-model:value="promotionForm.BetWaterMode.DaysDelay"
                        :options="
                          [0, 1, 2].map((value) => ({
                            label: `${value} 天`,
                            value,
                          }))
                        "
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    v-if="promotionForm.BetWaterMode.Mode === 2"
                    label="每周发放日期"
                    required
                  >
                    <Select
                      v-model:value="promotionForm.BetWaterMode.DayOfWeeks"
                      :options="weekOptions"
                      class="field"
                    />
                  </Form.Item>
                </template>
              </Form>
            </template>

            <template v-else-if="tab.key === 'login'">
              <template v-if="checkPermission(11110)">
                <Divider orientation="left">注册 / 登录设置</Divider>
                <Form layout="vertical">
                  <Form.Item label="默认显示方式">
                    <Radio.Group
                      v-model:value="registerConfig.DefaultMode"
                      @change="enforceDefaultAuth"
                    >
                      <Radio :value="1">账号</Radio>
                      <Radio :value="2">手机</Radio>
                      <Radio :value="3">邮箱</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="新账号 OTP 自动注册">
                    <Switch v-model:checked="registerConfig.AutoRegistration" />
                  </Form.Item>
                  <div class="auth-table">
                    <div class="auth-head">方式</div>
                    <div class="auth-head">开放注册</div>
                    <div class="auth-head">开放登录</div>
                    <template v-for="field in registerFields" :key="field.key">
                      <div>{{ field.label }}</div>
                      <Switch
                        v-model:checked="
                          registrationField(field.key).EnableForReg
                        "
                        :disabled="isDefaultAuthField(field.key)"
                      />
                      <Switch
                        v-model:checked="
                          registrationField(field.key).EnableForLogin
                        "
                        :disabled="isDefaultAuthField(field.key)"
                      />
                    </template>
                  </div>
                  <div class="grid-2 mt-4">
                    <Form.Item label="自动登出（分钟，0 表示不自动登出）">
                      <InputNumber
                        v-model:value="registerConfig.AutoLogoutTime"
                        :min="0"
                        class="field"
                      />
                    </Form.Item>
                    <Form.Item label="异常登录验证">
                      <Switch
                        v-model:checked="
                          registerConfig.AbnormalLoginVerification
                        "
                      />
                    </Form.Item>
                    <Form.Item label="注册验证码">
                      <Switch
                        v-model:checked="
                          registrationField('Captcha').EnableForReg
                        "
                      />
                    </Form.Item>
                    <Form.Item label="登录验证码">
                      <Switch
                        v-model:checked="
                          registrationField('Captcha').EnableForLogin
                        "
                      />
                    </Form.Item>
                    <Form.Item label="账号登录 OTP">
                      <Switch
                        v-model:checked="
                          registrationField('OTP').EnableForLogin
                        "
                      />
                    </Form.Item>
                  </div>
                  <Divider orientation="left">注册额外信息</Divider>
                  <div class="extra-field-list">
                    <div
                      v-for="field in extraRegisterFields"
                      :key="field.key"
                      class="extra-field-row"
                    >
                      <span>{{ field.label }}</span>
                      <Radio.Group
                        v-model:value="
                          extraRegistrationField(field.key).ExtraInfoLevel
                        "
                        :disabled="Boolean(registerConfig.AutoRegistration)"
                        button-style="solid"
                        size="small"
                      >
                        <Radio.Button :value="0">不显示</Radio.Button>
                        <Radio.Button
                          :disabled="field.key === 'InviteSite'"
                          :value="1"
                        >
                          选填
                        </Radio.Button>
                        <Radio.Button
                          :disabled="field.key === 'InviteCode'"
                          :value="2"
                        >
                          必填
                        </Radio.Button>
                      </Radio.Group>
                      <InputNumber
                        v-if="
                          field.key === 'Birthday' &&
                          extraRegistrationField(field.key).ExtraInfoLevel === 2
                        "
                        v-model:value="
                          extraRegistrationField(field.key).AgeLimit
                        "
                        :max="99"
                        :min="1"
                        addon-before="最低年龄"
                      />
                    </div>
                  </div>
                  <Form.Item
                    v-if="
                      extraRegistrationField('InviteSite').ExtraInfoLevel === 2
                    "
                    label="邀请站点选项"
                    required
                  >
                    <Select
                      v-model:value="
                        extraRegistrationField('InviteSite').ExtraInfoOptions
                      "
                      mode="tags"
                      placeholder="输入站点名称后回车"
                    />
                  </Form.Item>

                  <Divider orientation="left">注册广告</Divider>
                  <Form.Item label="启用注册广告">
                    <Switch
                      v-model:checked="registerConfig.RegistrationAdsSwitch"
                    />
                  </Form.Item>
                  <Tabs
                    v-model:active-key="activeLangGroup"
                    size="small"
                    type="line"
                  >
                    <Tabs.TabPane
                      v-for="group in langGroups"
                      :key="String(group.Id)"
                      :tab="String(group.Name || `语言组 ${group.Id}`)"
                    >
                      <Form.Item label="广告内容">
                        <Input.TextArea
                          v-model:value="
                            registrationAdFor(group.Id).Description
                          "
                          :maxlength="35"
                          :rows="3"
                          show-count
                        />
                      </Form.Item>
                    </Tabs.TabPane>
                  </Tabs>

                  <Divider orientation="left">登录锁定</Divider>
                  <Form.Item label="启用登录锁定">
                    <Switch
                      v-model:checked="loginBanConfig().LoginLockIsOpen"
                    />
                  </Form.Item>
                  <div class="grid-2">
                    <Form.Item label="连续错误次数" required>
                      <InputNumber
                        v-model:value="loginBanConfig().LoginCount"
                        :disabled="!loginBanConfig().LoginLockIsOpen"
                        :min="1"
                        class="field"
                      />
                    </Form.Item>
                    <Form.Item label="计数重置时间（分钟）" required>
                      <InputNumber
                        v-model:value="loginBanConfig().ResetTime"
                        :disabled="!loginBanConfig().LoginLockIsOpen"
                        :min="1"
                        class="field"
                      />
                    </Form.Item>
                  </div>
                </Form>
              </template>
              <template v-if="checkPermission(12935)">
                <Divider orientation="left">第三方身份登录</Divider>
                <div class="grid-2">
                  <div
                    v-for="type in [1, 2] as const"
                    :key="type"
                    class="identity-card"
                  >
                    <h3>{{ type === 1 ? 'Facebook' : 'Google' }}</h3>
                    <Form layout="vertical">
                      <Form.Item label="Package App ID">
                        <Input
                          :value="identityForms[type].PackageAppId"
                          disabled
                        />
                      </Form.Item>
                      <Form.Item label="App ID" required>
                        <Input v-model:value="identityForms[type].AppId" />
                      </Form.Item>
                      <Form.Item
                        :label="type === 1 ? 'App Secret' : 'App Key'"
                        required
                      >
                        <Input.Password
                          v-model:value="identityForms[type].AppSecret"
                        />
                      </Form.Item>
                      <template v-if="type === 2">
                        <Form.Item label="iOS App ID" required>
                          <Input v-model:value="identityForms[type].IosAppId" />
                        </Form.Item>
                        <Form.Item label="Android App ID" required>
                          <Input
                            v-model:value="identityForms[type].AndroidAppId"
                          />
                        </Form.Item>
                      </template>
                      <Form.Item label="入口开关">
                        <Switch v-model:checked="identityForms[type].Status" />
                      </Form.Item>
                    </Form>
                  </div>
                </div>
              </template>
            </template>

            <template v-else-if="tab.key === 'payment'">
              <Form layout="vertical">
                <Form.Item label="导航前允许的绑定类型" required>
                  <Checkbox.Group v-model:value="paymentForm.BindingType">
                    <Checkbox :value="1">手机</Checkbox>
                    <Checkbox :value="2">邮箱</Checkbox>
                  </Checkbox.Group>
                </Form.Item>
                <Form.Item label="允许注册后延迟绑定">
                  <Switch v-model:checked="paymentForm.BindBypassEnabled" />
                </Form.Item>
                <Form.Item
                  v-if="paymentForm.BindBypassEnabled"
                  label="延迟绑定时间（小时）"
                >
                  <InputNumber
                    v-model:value="paymentForm.BindBypassTimeInPayment"
                    :min="1"
                  />
                </Form.Item>
                <Form.Item label="提现页 OTP 接收方式（不选表示关闭 OTP）">
                  <Checkbox.Group v-model:value="paymentForm.OTPReceiver">
                    <Checkbox :value="1">手机</Checkbox>
                    <Checkbox :value="2">邮箱</Checkbox>
                  </Checkbox.Group>
                </Form.Item>
              </Form>
            </template>

            <template v-else-if="tab.key === 'support'">
              <Form layout="vertical">
                <template v-if="checkPermission(11409)">
                  <Divider orientation="left">代理客服</Divider>
                  <Form.Item label="客服类型">
                    <Radio.Group v-model:value="supportForm.CsAgentType">
                      <Radio :value="0">官方客服</Radio>
                      <Radio :value="1">第三方客服</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <div v-if="supportForm.CsAgentType === 1" class="grid-2">
                    <Form.Item label="APP 地址" required>
                      <Input v-model:value="supportForm.CsAgentAddrApp" />
                    </Form.Item>
                    <Form.Item label="PC 地址" required>
                      <Input v-model:value="supportForm.CsAgentAddrPC" />
                    </Form.Item>
                  </div>
                  <Divider orientation="left">多语言代理客服联系方式</Divider>
                  <Tabs
                    v-model:active-key="activeLangGroup"
                    size="small"
                    type="line"
                  >
                    <Tabs.TabPane
                      v-for="group in langGroups"
                      :key="String(group.Id)"
                      :tab="String(group.Name || `语言组 ${group.Id}`)"
                    >
                      <div class="contact-grid">
                        <div
                          v-for="(contact, index) in contactsFor(group.Id)"
                          :key="index"
                          class="contact-card"
                        >
                          <div class="contact-title">
                            <strong>联系方式 {{ index + 1 }}</strong>
                            <Switch
                              v-model:checked="contact.CsType"
                              checked-children="启用"
                              un-checked-children="停用"
                            />
                          </div>
                          <Form.Item label="头像">
                            <VoucherImageField
                              v-model="contact.Image"
                              dimension-hint="PNG/JPG/JPEG，不超过 1M"
                              :max-size-kb="1024"
                              :preview-height="80"
                              :preview-width="80"
                            />
                          </Form.Item>
                          <Form.Item label="方式名称（最多 20 字）">
                            <Input
                              v-model:value="contact.Name"
                              :maxlength="20"
                            />
                          </Form.Item>
                          <Form.Item label="联系方式（最多 30 字）">
                            <Input
                              v-model:value="contact.Contact"
                              :maxlength="30"
                            />
                          </Form.Item>
                          <Form.Item label="跳转链接">
                            <Input v-model:value="contact.Url" />
                          </Form.Item>
                        </div>
                      </div>
                    </Tabs.TabPane>
                  </Tabs>
                </template>
                <template v-if="checkPermission(11966)">
                  <Divider orientation="left">直播客服</Divider>
                  <Form.Item label="客服类型">
                    <Radio.Group v-model:value="supportForm.CsLiveType">
                      <Radio :value="0">官方客服</Radio>
                      <Radio :value="1">第三方客服</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    v-if="supportForm.CsLiveType === 1"
                    label="第三方客服地址"
                    required
                  >
                    <Input v-model:value="supportForm.CsLiveAddress" />
                  </Form.Item>
                </template>
              </Form>
            </template>

            <template v-else-if="tab.key === 'company'">
              <Tabs
                v-model:active-key="activeLangGroup"
                size="small"
                type="line"
              >
                <Tabs.TabPane
                  v-for="group in langGroups"
                  :key="String(group.Id)"
                  :tab="String(group.Name || `语言组 ${group.Id}`)"
                >
                  <Form layout="vertical">
                    <Form.Item v-if="checkPermission(10775)" label="公司简介">
                      <RichTextEditor
                        v-model="companyProfiles[String(group.Id)]"
                        :min-height="180"
                      />
                    </Form.Item>
                    <template v-if="checkPermission(12909)">
                      <Divider orientation="left">新手欢迎邮件</Divider>
                      <Form.Item label="启用欢迎邮件">
                        <Switch v-model:checked="welcomeForm.IsOpen" />
                      </Form.Item>
                      <Form.Item label="邮件标题">
                        <Input
                          v-model:value="welcomeLangTextFor(group.Id).Title"
                        />
                      </Form.Item>
                      <Form.Item label="邮件内容">
                        <RichTextEditor
                          v-model="welcomeLangTextFor(group.Id).Content"
                          :min-height="180"
                        />
                        <div class="hint">
                          可使用账号模板代码：<Tag>
                            {{ accountTemplateCode }}
                          </Tag>
                        </div>
                      </Form.Item>
                    </template>
                  </Form>
                </Tabs.TabPane>
              </Tabs>
            </template>

            <template v-else-if="tab.key === 'growth'">
              <template v-if="checkPermission(13178)">
                <Divider orientation="left">SEO 搜索优化</Divider>
                <Form layout="vertical">
                  <Form.Item label="标题" required>
                    <Input v-model:value="seoForm.Title" />
                  </Form.Item>
                  <Form.Item label="描述" required>
                    <Input.TextArea
                      v-model:value="seoForm.Content"
                      :maxlength="255"
                      :rows="4"
                      show-count
                    />
                  </Form.Item>
                </Form>
              </template>
              <template v-if="checkPermission(10775)">
                <Divider orientation="left">邀请站点</Divider>
                <Space.Compact block>
                  <Input
                    v-model:value="newSiteName"
                    placeholder="站点名称"
                    @press-enter="addSite"
                  />
                  <Button type="primary" :loading="siteSaving" @click="addSite">
                    添加
                  </Button>
                </Space.Compact>
                <div class="site-list">
                  <div
                    v-for="(site, index) in siteConfigs"
                    :key="site.Id"
                    class="site-row"
                  >
                    <span>
                      {{ site.SiteName }}
                      <Tag v-if="index === 0" color="blue">默认</Tag>
                    </span>
                    <Space>
                      <Button
                        size="small"
                        :disabled="index === 0"
                        @click="moveSite(index, -1)"
                      >
                        上移
                      </Button>
                      <Button
                        size="small"
                        :disabled="index === siteConfigs.length - 1"
                        @click="moveSite(index, 1)"
                      >
                        下移
                      </Button>
                      <Button danger size="small" @click="deleteSite(site)">
                        删除
                      </Button>
                    </Space>
                  </div>
                </div>
              </template>
            </template>

            <template v-else-if="tab.key === 'records'">
              <Form layout="vertical">
                <Form.Item v-if="checkPermission(13203)" label="VIP 图标方案">
                  <Select
                    v-model:value="recordsForm.VIPBadgeGroupID"
                    :options="vipBadgeOptions"
                    show-search
                  />
                </Form.Item>
                <Form.Item
                  v-if="checkPermission(13250)"
                  label="交易记录类型"
                  required
                >
                  <Checkbox.Group
                    v-model:value="recordsForm.TransactionLog"
                    :options="transactionOptions"
                  />
                </Form.Item>
              </Form>
            </template>

            <template v-else-if="tab.key === 'analytics'">
              <PackageAnalyticsPanel
                :ref="setAnalyticsPanel"
                :package-id="packageId"
              />
            </template>

            <template v-else-if="tab.key === 'venue'">
              <PackageVenuePanel
                :ref="setVenuePanel"
                :lang-groups="langGroups"
              />
            </template>

            <template v-else-if="tab.key === 'game-support'">
              <PackageGameSupportPanel
                :ref="setGameSupportPanel"
                :lang-groups="langGroups"
                :vip-levels="vipLevelOptions"
              />
            </template>
          </div>
        </Spin>
      </Tabs.TabPane>
    </Tabs>

    <template #footer>
      <Button @click="emit('update:open', false)">关闭</Button>
      <Button
        v-if="canSaveActiveTab && visibleTabs.length > 0"
        type="primary"
        :loading="saving"
        :disabled="loading || !!loadError"
        @click="handleSave"
      >
        保存当前页
      </Button>
    </template>
  </Modal>
</template>

<style scoped>
.settings-body {
  min-height: 470px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  padding: 4px 12px 4px 4px;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.field {
  width: 100%;
}

.hint {
  margin-top: 6px;
  color: #8c8c8c;
  font-size: 12px;
}

.auth-table {
  display: grid;
  grid-template-columns: 1fr 140px 140px;
  align-items: center;
  gap: 1px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #f0f0f0;
}

.auth-table > * {
  min-height: 42px;
  padding: 10px 14px;
  background: white;
}

.auth-head {
  background: #fafafa;
  font-weight: 600;
}

.extra-field-list {
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.extra-field-row {
  display: grid;
  grid-template-columns: 140px minmax(280px, 1fr) minmax(180px, auto);
  align-items: center;
  gap: 16px;
  min-height: 54px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.extra-field-row:last-child {
  border-bottom: 0;
}

.identity-card {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.contact-card {
  padding: 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.contact-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.identity-card h3 {
  margin-bottom: 16px;
  font-weight: 600;
}

.site-list {
  margin-top: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.language-order {
  margin-top: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.language-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 6px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.language-row:last-child {
  border-bottom: 0;
}

.site-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.site-row:last-child {
  border-bottom: 0;
}

@media (max-width: 900px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .extra-field-row {
    grid-template-columns: 1fr;
  }
}
</style>
