<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  TimePicker,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createAdvertisementApi,
  createAdvertisementProgrammeApi,
  deleteAdvertisementApi,
  deleteAdvertisementProgrammeApi,
  fetchAdvertisementActivityListApi,
  fetchAdvertisementImagesApi,
  fetchAdvertisementListApi,
  fetchAdvertisementNoticeListApi,
  fetchAdvertisementProgrammesApi,
  recoverAdvertisementProgrammeApi,
  registerAdvertisementImageApi,
  switchAdvertisementApi,
  switchAdvertisementSortApi,
  updateAdvertisementApi,
  updateAdvertisementProgrammeApi,
} from '#/api/gameManage/advertisement-manage';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useProjectConfig } from '#/composables/use-project-config';
import { getServiceImageUrl } from '#/utils/media';

import VoucherImageField from '../../../operationalManage/voucher/components/voucher-image-field.vue';

defineOptions({ name: 'AdvertisementProgrammePanel' });

const props = defineProps<{
  adType: number;
}>();

interface ProgrammeRow {
  Id: number | string;
  SPDisplayMode?: number;
  TemplateName?: string;
  [key: string]: unknown;
}

interface LanguageContent {
  CrossImageId?: number | string;
  CrossImageUrl?: string;
  ImageId?: number | string;
  ImageUrl?: string;
  LangGroupId: number | string;
  NarrowImageId?: number | string;
  NarrowImageUrl?: string;
  Title?: string;
}

interface AdvertisementRow {
  BeginTime?: number;
  CrossImageUrl?: string;
  DailyCount?: number;
  DailyCountValue?: number;
  DisplayDevices?: string;
  EndTime?: number;
  Id: number | string;
  ImageUrl?: string;
  IsInvite?: boolean;
  IsNoFirstDeposit?: boolean;
  IsRegTime?: boolean;
  IsShowForGuest?: number;
  IsShowTime?: boolean;
  IsTotalCount?: boolean;
  Jump?: number | string;
  LangText?: string;
  NarrowImageUrl?: string;
  OpenType?: number;
  OperateName?: string;
  RegEndDate?: number;
  RegStartDate?: number;
  RegTime?: number;
  ShowEndTime?: string;
  ShowStartTime?: string;
  Status?: number;
  Title?: string;
  TotalCount?: number;
  UpdateTime?: number;
  ValidAppUrl?: string;
  ValidChannels?: string;
  Vip?: string;
  [key: string]: unknown;
}

interface PermissionSet {
  addAd: number;
  addProgramme: number;
  deleteAd: number;
  deleteProgramme: number;
  editAd: number;
  editProgramme: number;
  list: number;
  preview: number;
  programmeList: number;
  recover: number;
  sort: number;
  switch: number;
}

interface SelectSource {
  Id?: number | string;
  LangText?: string;
  Name?: string;
  Title?: string;
  Type?: number | string;
  [key: string]: unknown;
}

const PERMISSIONS: Record<number, PermissionSet> = {
  1: {
    addAd: 11_039,
    addProgramme: 11_033,
    deleteAd: 11_041,
    deleteProgramme: 11_035,
    editAd: 11_040,
    editProgramme: 11_034,
    list: 11_038,
    preview: 11_070,
    programmeList: 11_032,
    recover: 11_036,
    sort: 11_042,
    switch: 11_043,
  },
  3: {
    addAd: 11_065,
    addProgramme: 11_059,
    deleteAd: 11_067,
    deleteProgramme: 11_061,
    editAd: 11_066,
    editProgramme: 11_060,
    list: 11_064,
    preview: 11_072,
    programmeList: 11_058,
    recover: 11_062,
    sort: 11_068,
    switch: 11_069,
  },
  6: {
    addAd: 12_069,
    addProgramme: 12_063,
    deleteAd: 12_071,
    deleteProgramme: 12_065,
    editAd: 12_070,
    editProgramme: 12_064,
    list: 12_068,
    preview: 12_074,
    programmeList: 12_062,
    recover: 12_066,
    sort: 12_072,
    switch: 12_073,
  },
};

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const { ensureGameConfig, gameConfig } = useGameConfig();
const permission = computed(() => PERMISSIONS[props.adType]!);
const isCarousel = computed(() => props.adType === 1);
const isHomeDialog = computed(() => props.adType === 3);
const isPayment = computed(() => props.adType === 6);
const loading = ref(false);
const saving = ref(false);
const programmes = ref<ProgrammeRow[]>([]);
const activeProgrammeId = ref<number | string>('');
const rows = ref<AdvertisementRow[]>([]);
const programmeVisible = ref(false);
const programmeEditing = ref(false);
const programmeName = ref('');
const formVisible = ref(false);
const editing = ref(false);
const previewVisible = ref(false);
const previewMode = ref(1);
const sportsDisplayMode = ref(0);
const libraryVisible = ref(false);
const libraryField = ref<'CrossImage' | 'Image' | 'NarrowImage'>('Image');
const imageLibrary = ref<Record<string, unknown>[]>([]);
const activeLanguage = ref('');
const activities = ref<SelectSource[]>([]);
const notices = ref<SelectSource[]>([]);
const filters = reactive({
  Status: '' as number | string,
  Time: [] as Dayjs[],
  Title: '',
});

const form = reactive<Record<string, unknown>>({});
const languageContent = reactive<Record<string, LanguageContent>>({});

const languageGroups = computed(() => {
  const groups = projectConfig.value?.LangGroup || [];
  return groups.length > 0
    ? groups
    : [{ Default: true, Id: 0, Languages: ['zh-CN'], Name: '默认语言' }];
});
const defaultLanguageId = computed(
  () =>
    languageGroups.value.find((item) => item.Default)?.Id ??
    languageGroups.value[0]?.Id ??
    0,
);
const currentLanguage = computed(
  () => languageContent[activeLanguage.value],
);
const currentProgramme = computed(() =>
  programmes.value.find(
    (item) => String(item.Id) === String(activeProgrammeId.value),
  ),
);
const vipOptions = computed(() =>
  (
    (projectConfig.value?.VIPLevelMap || []) as Array<{
      VipLevelId?: number | string;
      VipLevelName?: string;
    }>
  ).map((item) => ({
    label: item.VipLevelName || `VIP${item.VipLevelId}`,
    value: String(item.VipLevelId),
  })),
);
const deviceOptions = computed(() =>
  Object.entries(projectConfig.value?.DevicePlatformAll || {}).map(
    ([value, label]) => ({ label, value }),
  ),
);
const packageOptions = computed(() =>
  (
    (projectConfig.value?.IosAppStoreItems || []) as Array<{
      AppName?: string;
      AppUrl?: string;
    }>
  ).map((item) => ({
    label: item.AppName,
    value: item.AppUrl,
  })),
);
const channelNameMap = computed(
  () =>
    new Map(
      (
        (projectConfig.value?.ChildChannelInfo || []) as Array<{
          ChannelId?: number | string;
          ChannelName?: string;
        }>
      ).map((item) => [String(item.ChannelId), item.ChannelName || '']),
    ),
);
const gameOptions = computed(() =>
  Object.entries(gameConfig.value.games)
    .filter(([, item]) => Number(item.ParentId || 0) === 0)
    .map(([value, item]) => ({ label: item.gameName || value, value })),
);
const openTypeOptions = [
  { label: '网址', value: 1 },
  { label: '内嵌网页', value: 8 },
  { label: '活动界面', value: 2 },
  { label: '功能界面', value: 3 },
  { label: '公告界面', value: 4 },
  { label: '游戏界面', value: 5 },
  { label: '安装应用', value: 12 },
];

const columns = computed(() => {
  const result: Array<Record<string, unknown>> = [
    { key: 'index', title: '序号', width: 60 },
    { dataIndex: 'Title', key: 'Title', title: '标题', width: 130 },
    { key: 'Status', title: '状态', width: 90 },
  ];
  if (isCarousel.value) {
    result.push(
      { key: 'time', title: '有效时间', width: 230 },
      { key: 'ImageUrl', title: '手机版竖版', width: 190 },
      { key: 'CrossImageUrl', title: 'Web 横版', width: 190 },
      { key: 'NarrowImageUrl', title: '手机窄版', width: 190 },
      { key: 'OpenType', title: '跳转类型', width: 110 },
      { dataIndex: 'Jump', key: 'Jump', title: '跳转参数', width: 130 },
      { key: 'guest', title: '游客展示', width: 100 },
      { dataIndex: 'Vip', key: 'Vip', title: 'VIP 等级', width: 140 },
      { key: 'registerDays', title: '注册时间限制(天)', width: 140 },
    );
  } else if (isHomeDialog.value) {
    result.push(
      { key: 'ImageUrl', title: '首页弹窗竖版', width: 190 },
      { key: 'CrossImageUrl', title: '首页弹窗横版', width: 190 },
      { key: 'OpenType', title: '跳转类型', width: 110 },
      { dataIndex: 'Jump', key: 'Jump', title: '跳转参数', width: 130 },
      { key: 'guest', title: '游客展示', width: 100 },
      { key: 'daily', title: '展示机制', width: 130 },
      { key: 'total', title: '总展示数', width: 110 },
      { dataIndex: 'Vip', key: 'Vip', title: 'VIP 等级', width: 140 },
    );
  } else {
    result.push(
      { key: 'ImageUrl', title: '手机版竖版', width: 320 },
      { key: 'firstDeposit', title: '首存后不展示', width: 130 },
      { dataIndex: 'Vip', key: 'Vip', title: 'VIP 等级', width: 160 },
    );
  }
  result.push(
    { dataIndex: 'OperateName', key: 'OperateName', title: '操作人', width: 120 },
    { key: 'UpdateTime', title: '操作时间', width: 170 },
    { fixed: 'right', key: 'action', title: '操作', width: 190 },
  );
  return result;
});

function toItems(data: unknown) {
  if (data == null) return [] as Record<string, unknown>[];
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const result = data as {
    Data?: null | Record<string, unknown>[];
    Items?: null | Record<string, unknown>[];
  };
  if (Array.isArray(result.Items)) return result.Items;
  if (Array.isArray(result.Data)) return result.Data;
  return [];
}

function parseLanguageText(value: unknown) {
  if (!value) return {};
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed.map((item) => [String(item.LangGroupId), item]),
      );
    }
    return parsed as Record<string, LanguageContent>;
  } catch {
    return {};
  }
}

function displayLanguage(row: AdvertisementRow) {
  const all = parseLanguageText(row.LangText);
  return (
    all[String(defaultLanguageId.value)] ||
    Object.values(all)[0] ||
    ({} as LanguageContent)
  );
}

function normalizeRows(data: unknown) {
  return toItems(data).map((item) => {
    const row = item as AdvertisementRow;
    const lang = displayLanguage(row);
    return {
      ...row,
      CrossImageUrl: lang.CrossImageUrl || row.CrossImageUrl,
      ImageUrl: lang.ImageUrl || row.ImageUrl,
      NarrowImageUrl: lang.NarrowImageUrl || row.NarrowImageUrl,
      Title: lang.Title || row.Title,
    };
  });
}

async function loadProgrammes(preferredId?: number | string) {
  if (!checkPermission(permission.value.programmeList)) return;
  loading.value = true;
  try {
    programmes.value = toItems(
      await fetchAdvertisementProgrammesApi({ Type: props.adType }),
    ) as ProgrammeRow[];
    const preferred = programmes.value.find(
      (item) => String(item.Id) === String(preferredId),
    );
    activeProgrammeId.value = preferred?.Id || programmes.value[0]?.Id || '';
    sportsDisplayMode.value = Number(
      (preferred || programmes.value[0])?.SPDisplayMode || 0,
    );
    await loadRows();
  } finally {
    loading.value = false;
  }
}

async function loadRows() {
  if (!activeProgrammeId.value || !checkPermission(permission.value.list)) {
    rows.value = [];
    return;
  }
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      TemplateId: activeProgrammeId.value,
      Type: props.adType,
    };
    // 旧站：弹窗仅 TemplateId+Type；轮播/支付带 Title/Status；仅轮播带日期（空串）
    if (!isHomeDialog.value) {
      params.Title = filters.Title;
      params.Status = filters.Status;
    }
    if (isCarousel.value) {
      params.BeginTime = filters.Time[0]?.unix() ?? '';
      params.EndTime = filters.Time[1]?.unix() ?? '';
    }
    rows.value = normalizeRows(
      await fetchAdvertisementListApi(params),
    ) as AdvertisementRow[];
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.Title = '';
  filters.Status = '';
  filters.Time = [];
  void loadRows();
}

function selectProgramme(id: number | string) {
  activeProgrammeId.value = id;
  sportsDisplayMode.value = Number(currentProgramme.value?.SPDisplayMode || 0);
  void loadRows();
}

async function updateSportsDisplayMode() {
  if (!currentProgramme.value) return;
  await updateAdvertisementProgrammeApi({
    ...currentProgramme.value,
    SPDisplayMode: sportsDisplayMode.value,
    Type: props.adType,
  });
  message.success('操作成功');
  await loadProgrammes(activeProgrammeId.value);
}

function openProgramme(edit = false) {
  programmeEditing.value = edit;
  programmeName.value = edit ? String(currentProgramme.value?.TemplateName || '') : '';
  programmeVisible.value = true;
}

async function saveProgramme() {
  if (!programmeName.value.trim()) {
    message.warning('请输入方案名称');
    return;
  }
  saving.value = true;
  try {
    const data = {
      Id: programmeEditing.value ? activeProgrammeId.value : '',
      SPDisplayMode: Number(currentProgramme.value?.SPDisplayMode || 0),
      TemplateName: programmeName.value.trim(),
      Type: props.adType,
    };
    await (programmeEditing.value ? updateAdvertisementProgrammeApi(data) : createAdvertisementProgrammeApi(data));
    programmeVisible.value = false;
    message.success(programmeEditing.value ? '编辑成功' : '新增成功');
    await loadProgrammes(programmeEditing.value ? activeProgrammeId.value : undefined);
  } finally {
    saving.value = false;
  }
}

function removeProgramme() {
  Modal.confirm({
    content: `确认删除方案「${currentProgramme.value?.TemplateName || ''}」？`,
    title: '提示',
    onOk: async () => {
      await deleteAdvertisementProgrammeApi(activeProgrammeId.value);
      message.success('删除成功');
      await loadProgrammes();
    },
  });
}

function initializeLanguages(source?: Record<string, LanguageContent>) {
  Object.keys(languageContent).forEach((key) => delete languageContent[key]);
  languageGroups.value.forEach((group) => {
    const key = String(group.Id);
    languageContent[key] = {
      CrossImageId: '',
      CrossImageUrl: '',
      ImageId: '',
      ImageUrl: '',
      LangGroupId: group.Id,
      NarrowImageId: '',
      NarrowImageUrl: '',
      Title: '',
      ...source?.[key],
    };
  });
  activeLanguage.value = String(defaultLanguageId.value);
}

function defaultForm() {
  return {
    BeginTime: '',
    DailyCount: 0,
    DailyCountValue: '',
    DisplayDevices: deviceOptions.value.map((item) => item.value),
    EndTime: '',
    Id: '',
    IsInvite: false,
    IsNoFirstDeposit: false,
    IsRegTime: false,
    IsShowForGuest: 0,
    IsShowTime: false,
    IsTotalCount: false,
    Jump: '',
    OpenType: 1,
    RegEndDate: '',
    RegStartDate: '',
    // 轮播：2=不限；弹窗：0=关闭 / 1=开启
    RegStartEndDate: props.adType === 1 ? 2 : 0,
    RegTime: undefined,
    ShieldAppUrl: [],
    ShieldChannels: [],
    ShowTime: [] as Dayjs[],
    SourceType: 1,
    Status: 1,
    Time: [] as Dayjs[],
    TotalCount: '',
    ValidAppUrl: [],
    ValidChannels: [],
    Vip: vipOptions.value.map((item) => item.value),
  };
}

function decodeJsonSelection(value: unknown, key: string) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed)
      ? parsed.map((item: Record<string, unknown>) => String(item[key]))
      : [];
  } catch {
    return [];
  }
}

function openForm(source?: AdvertisementRow | Record<string, unknown>) {
  const row = source as AdvertisementRow | undefined;
  editing.value = !!row;
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, defaultForm(), row ? structuredClone(row) : {});
  initializeLanguages(row ? parseLanguageText(row.LangText) : undefined);
  form.Vip = String(row?.Vip || '')
    .split(',')
    .filter(Boolean);
  form.DisplayDevices = String(row?.DisplayDevices || '')
    .split(',')
    .filter(Boolean);
  form.Time =
    row?.BeginTime && row?.EndTime
      ? [dayjs.unix(row.BeginTime), dayjs.unix(row.EndTime)]
      : [];
  form.ShowTime =
    row?.ShowStartTime && row?.ShowEndTime
      ? [
          dayjs(row.ShowStartTime, 'HH:mm:ss'),
          dayjs(row.ShowEndTime, 'HH:mm:ss'),
        ]
      : [];
  form.RegTime = row?.RegTime ? dayjs.unix(row.RegTime) : undefined;
  form.ValidChannels = decodeJsonSelection(row?.ValidChannels, 'ChannelId');
  form.ShieldChannels = decodeJsonSelection(row?.ShieldChannels, 'ChannelId');
  form.ValidAppUrl = decodeJsonSelection(row?.ValidAppUrl, 'AppUrl');
  form.ShieldAppUrl = decodeJsonSelection(row?.ShieldAppUrl, 'AppUrl');
  if (row) {
    const start = Number(row.RegStartDate || 0);
    const end = Number(row.RegEndDate || 0);
    if (isCarousel.value) {
      form.RegStartEndDate =
        Number(row.RegStartEndDate) === 1 || (start > 0 && end > 0) ? 1 : 2;
      if (Number(form.RegStartEndDate) === 2) {
        form.RegStartDate = '';
        form.RegEndDate = '';
      }
    } else if (isHomeDialog.value) {
      form.RegStartEndDate =
        Number(row.RegStartEndDate) === 1 || (start > 0 && end > 0) ? 1 : 0;
      if (Number(form.RegStartEndDate) === 0) {
        form.RegStartDate = '';
        form.RegEndDate = '';
      }
    }
  }
  formVisible.value = true;
}

function imageType(field: 'CrossImage' | 'Image' | 'NarrowImage') {
  return field === 'Image' ? 1 : (field === 'CrossImage' ? 2 : 4);
}

async function chooseSystemImage(
  field: 'CrossImage' | 'Image' | 'NarrowImage',
) {
  libraryField.value = field;
  imageLibrary.value =
    (await fetchAdvertisementImagesApi({
      ImageType: imageType(field),
      Type: props.adType,
    })) || [];
  libraryVisible.value = true;
}

function selectSystemImage(item: Record<string, unknown>) {
  if (!currentLanguage.value) return;
  currentLanguage.value[`${libraryField.value}Id`] = item.Id as number | string;
  currentLanguage.value[`${libraryField.value}Url`] = String(item.Path || '');
  libraryVisible.value = false;
}

async function registerImages() {
  for (const content of Object.values(languageContent)) {
    for (const field of ['Image', 'CrossImage', 'NarrowImage'] as const) {
      const path = String(content[`${field}Url`] || '');
      if (!path || content[`${field}Id`]) continue;
      const image = await registerAdvertisementImageApi({
        ImageType: imageType(field),
        Path: path,
        Type: props.adType,
      });
      content[`${field}Id`] = image.Id as number | string;
    }
  }
}

function serializeSelection(values: unknown, key: string, nameKey: string) {
  if (!Array.isArray(values) || values.length === 0) return '';
  return JSON.stringify(
    values.map((value) => ({
      [key]: value,
      [nameKey]:
        key === 'ChannelId'
          ? channelNameMap.value.get(String(value)) || String(value)
          : packageOptions.value.find(
                (item) => String(item.value) === String(value),
              )?.label || String(value),
    })),
  );
}

async function saveAdvertisement() {
  const defaultContent = languageContent[String(defaultLanguageId.value)];
  if (!defaultContent?.Title) {
    message.warning('请填写默认语言标题');
    return;
  }
  if (
    isHomeDialog.value &&
    Object.values(languageContent).some(
      (content) =>
        !content.Title || (!content.ImageUrl && !content.CrossImageUrl),
    )
  ) {
    message.warning('请完整填写每个语言的标题，并至少上传一张横版或竖版图片');
    return;
  }
  if (!isHomeDialog.value && !defaultContent.ImageUrl) {
    message.warning('请上传默认语言竖版图片');
    return;
  }
  if (isCarousel.value && !defaultContent.CrossImageUrl) {
    message.warning('请上传默认语言 Web 横版图片');
    return;
  }
  if (isCarousel.value && Number(form.RegStartEndDate) === 1) {
    const start = Number(form.RegStartDate || 0);
    const end = Number(form.RegEndDate || 0);
    if (start < 1 || end < 1 || start > 365 || end > 365 || start > end) {
      message.warning('注册天数须为 1~365，且开始天数不能大于结束天数');
      return;
    }
  }
  if (isHomeDialog.value) {
    if (Number(form.RegStartEndDate) === 1) {
      const start = Number(form.RegStartDate || 0);
      const end = Number(form.RegEndDate || 0);
      if (start < 1 || end < 1 || start > 365 || end > 365 || start > end) {
        message.warning('注册天数须为 1~365，且开始天数不能大于结束天数');
        return;
      }
    }
    if (Number(form.DailyCount) === 1 && Number(form.DailyCountValue) < 1) {
      message.warning('请输入正确的每日展示次数');
      return;
    }
    if (form.IsTotalCount && Number(form.TotalCount) < 1) {
      message.warning('请输入正确的总展示次数');
      return;
    }
  }
  saving.value = true;
  try {
    await registerImages();
    const time = form.Time as Dayjs[];
    const showTime = form.ShowTime as Dayjs[];
    // 轮播：RegStartEndDate=2 不限；弹窗：0=关闭。关闭时清空天数（对齐旧站）
    let regStartDate: number | string = (form.RegStartDate as number | string) || '';
    let regEndDate: number | string = (form.RegEndDate as number | string) || '';
    let regStartEndDate = Number(form.RegStartEndDate);
    if (isCarousel.value) {
      if (regStartEndDate !== 1) {
        regStartEndDate = 2;
        regStartDate = '';
        regEndDate = '';
      }
    } else if (isHomeDialog.value) {
      if (regStartEndDate !== 1) {
        regStartEndDate = 0;
        regStartDate = '';
        regEndDate = '';
      }
    }
    const payload: Record<string, unknown> = {
      ...form,
      BeginTime: time?.[0]?.unix() || '',
      DisplayDevices: (form.DisplayDevices as string[])?.join(',') || '',
      EndTime: time?.[1]?.unix() || '',
      LangText: JSON.stringify(Object.values(languageContent)),
      RegEndDate: regEndDate,
      RegStartDate: regStartDate,
      RegStartEndDate: regStartEndDate,
      RegTime: form.IsRegTime
        ? (form.RegTime as Dayjs | undefined)?.unix() || ''
        : '',
      ShieldAppUrl: serializeSelection(form.ShieldAppUrl, 'AppUrl', 'AppName'),
      ShieldChannels: serializeSelection(
        form.ShieldChannels,
        'ChannelId',
        'ChannelName',
      ),
      ShowEndTime:
        form.IsShowTime && showTime?.[1]
          ? showTime[1].format('HH:mm:ss')
          : '',
      ShowStartTime:
        form.IsShowTime && showTime?.[0]
          ? showTime[0].format('HH:mm:ss')
          : '',
      TemplateId: activeProgrammeId.value,
      TotalCount: form.IsTotalCount ? form.TotalCount : '',
      DailyCountValue:
        Number(form.DailyCount) === 1 ? form.DailyCountValue : '',
      Type: props.adType,
      ValidAppUrl: serializeSelection(form.ValidAppUrl, 'AppUrl', 'AppName'),
      ValidChannels: serializeSelection(
        form.ValidChannels,
        'ChannelId',
        'ChannelName',
      ),
      Vip: (form.Vip as string[])?.join(',') || '',
    };
    delete payload.Time;
    delete payload.ShowTime;
    await (editing.value ? updateAdvertisementApi(payload) : createAdvertisementApi(payload));
    formVisible.value = false;
    message.success(editing.value ? '编辑成功' : '新增成功');
    await loadRows();
  } finally {
    saving.value = false;
  }
}

async function changeStatus(source: AdvertisementRow | Record<string, unknown>) {
  const row = source as AdvertisementRow;
  await switchAdvertisementApi({
    Id: row.Id,
    Status: Number(row.Status),
  });
  message.success('编辑成功');
  await loadRows();
}

async function move(index: number, offset: -1 | 1) {
  const target = rows.value[index + offset];
  const current = rows.value[index];
  if (!target || !current) return;
  await switchAdvertisementSortApi({ Id1: current.Id, Id2: target.Id });
  await loadRows();
}

function removeRow(source: AdvertisementRow | Record<string, unknown>) {
  const row = source as AdvertisementRow;
  Modal.confirm({
    content: '确认删除该广告？',
    title: '提示',
    onOk: async () => {
      await deleteAdvertisementApi(row.Id);
      message.success('删除成功');
      await loadRows();
    },
  });
}

function recoverDefault() {
  Modal.confirm({
    content: '确认恢复系统预设？',
    title: '提示',
    onOk: async () => {
      await recoverAdvertisementProgrammeApi({
        Id: programmes.value[0]?.Id,
      });
      message.success('操作成功');
      await loadRows();
    },
  });
}

function formatTime(value?: number) {
  return value ? dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss') : '长期有效';
}

function openTypeName(value?: number) {
  return openTypeOptions.find((item) => item.value === value)?.label || '无';
}

function rowImage(
  row: Record<string, unknown>,
  key: number | string | undefined,
) {
  return getServiceImageUrl(key ? String(row[key]) : '');
}

function libraryImage(item: Record<string, unknown>) {
  return getServiceImageUrl(String(item.Path || ''));
}

const previewImages = computed(() =>
  rows.value
    .map((row) =>
      previewMode.value === 1
        ? row.CrossImageUrl
        : (previewMode.value === 2
          ? row.ImageUrl
          : row.NarrowImageUrl),
    )
    .filter(Boolean) as string[],
);

onMounted(async () => {
  await Promise.all([
    ensureGameConfig(),
    fetchAdvertisementActivityListApi().then((data) => {
      activities.value = Array.isArray(data) ? data : [];
    }),
    fetchAdvertisementNoticeListApi().then((data) => {
      const list = Array.isArray(data) ? data : [];
      const langId = String(defaultLanguageId.value);
      notices.value = list.map((item) => {
        let title = String(item.Title || '');
        if (!title && item.LangText) {
          try {
            const parsed =
              typeof item.LangText === 'string'
                ? JSON.parse(item.LangText)
                : item.LangText;
            const map = (parsed || {}) as Record<string, { Title?: string }>;
            title = String(
              map[langId]?.Title ||
                Object.values(map)[0]?.Title ||
                '',
            );
          } catch {
            title = '';
          }
        }
        return {
          ...item,
          Title: title || item.Id,
        };
      });
    }),
  ]);
  await loadProgrammes();
});
</script>

<template>
  <div>
    <div class="programme-bar">
      <Space wrap>
        <Button
          v-for="item in programmes"
          v-show="checkPermission(permission.programmeList)"
          :key="item.Id"
          :type="
            String(activeProgrammeId) === String(item.Id) ? 'primary' : 'default'
          "
          @click="selectProgramme(item.Id)"
        >
          {{ item.TemplateName }}
        </Button>
        <Button
          v-if="checkPermission(permission.addProgramme)"
          type="dashed"
          @click="openProgramme(false)"
        >
          新增自定义方案
        </Button>
      </Space>
    </div>

    <Card class="scheme-card" size="small">
      <div class="scheme-header">
        <Descriptions bordered size="small">
          <Descriptions.Item label="方案名称">
            {{ currentProgramme?.TemplateName || '-' }}
          </Descriptions.Item>
        </Descriptions>
        <Space>
          <Button
            v-if="checkPermission(permission.editProgramme)"
            :disabled="!activeProgrammeId"
            @click="openProgramme(true)"
          >
            改名
          </Button>
          <Button
            v-if="checkPermission(permission.deleteProgramme)"
            danger
            :disabled="
              !activeProgrammeId ||
              String(activeProgrammeId) === String(programmes[0]?.Id)
            "
            @click="removeProgramme"
          >
            删除
          </Button>
          <Button
            v-if="checkPermission(permission.preview)"
            @click="previewVisible = true"
          >
            预览
          </Button>
          <Select
            v-if="isCarousel"
            v-model:value="sportsDisplayMode"
            :options="[
              { label: '体育页竖版模式', value: 0 },
              { label: '体育页窄版模式', value: 1 },
              { label: '体育页不显示', value: 2 },
            ]"
            style="width: 170px"
          />
          <Button v-if="isCarousel" @click="updateSportsDisplayMode">
            更换体育页模式
          </Button>
          <Button
            v-if="checkPermission(permission.addAd)"
            type="primary"
            @click="openForm()"
          >
            {{ isHomeDialog ? '新增首页弹窗' : '新增广告图' }}
          </Button>
          <Button
            v-if="checkPermission(permission.recover)"
            :disabled="
              String(activeProgrammeId) !== String(programmes[0]?.Id)
            "
            @click="recoverDefault"
          >
            恢复系统预设
          </Button>
        </Space>
      </div>
    </Card>

    <Card v-if="!isHomeDialog" class="query-card" size="small">
      <div class="query-grid">
        <Input
          v-model:value="filters.Title"
          allow-clear
          addon-before="标题"
          placeholder="请输入"
          @press-enter="loadRows"
        />
        <Select
          v-model:value="filters.Status"
          :options="[
            { label: '全部状态', value: '' },
            { label: '开启', value: 1 },
            { label: '关闭', value: 2 },
          ]"
        />
        <DatePicker.RangePicker
          v-if="isCarousel"
          v-model:value="filters.Time as [Dayjs, Dayjs]"
          show-time
        />
        <Space>
          <Button type="primary" @click="loadRows">查询</Button>
          <Button @click="resetFilters">重置</Button>
        </Space>
      </div>
    </Card>

    <Card class="table-card" :bordered="false">
      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        :scroll="{ x: 1700 }"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <Switch
            v-else-if="column.key === 'Status'"
            v-model:checked="record.Status"
            :checked-value="1"
            :disabled="
              !isHomeDialog && !checkPermission(permission.switch)
            "
            :un-checked-value="2"
            @change="changeStatus(record)"
          />
          <span v-else-if="column.key === 'time'">
            {{ formatTime(record.BeginTime) }} ~
            {{ formatTime(record.EndTime) }}
          </span>
          <Image
            v-else-if="
              ['ImageUrl', 'CrossImageUrl', 'NarrowImageUrl'].includes(
                String(column.key),
              )
            "
            :height="70"
            :src="rowImage(record, column.key)"
            :width="150"
          />
          <Tag v-else-if="column.key === 'OpenType'">
            {{ openTypeName(record.OpenType) }}
          </Tag>
          <span v-else-if="column.key === 'guest'">
            {{
              Number(record.IsShowForGuest) === 0
                ? '是'
                : Number(record.IsShowForGuest) === 1
                  ? '否'
                  : '仅游客'
            }}
          </span>
          <span v-else-if="column.key === 'registerDays'">
            {{
              Number(record.RegStartDate) === 0 &&
              Number(record.RegEndDate) === 0
                ? '不限'
                : `${record.RegStartDate}-${record.RegEndDate}`
            }}
          </span>
          <span v-else-if="column.key === 'daily'">
            {{
              Number(record.DailyCount) === 0
                ? '每次登录'
                : `每日前 ${record.DailyCountValue} 次`
            }}
          </span>
          <span v-else-if="column.key === 'total'">
            {{ record.IsTotalCount ? record.TotalCount : '-' }}
          </span>
          <span v-else-if="column.key === 'firstDeposit'">
            {{ record.IsNoFirstDeposit ? '是' : '-' }}
          </span>
          <span v-else-if="column.key === 'UpdateTime'">
            {{ formatTime(record.UpdateTime) }}
          </span>
          <Space v-else-if="column.key === 'action'" size="small">
            <Button
              v-if="checkPermission(permission.sort)"
              :disabled="index === 0 || Number(record.Status) === 2"
              size="small"
              @click="move(index, -1)"
            >
              上移
            </Button>
            <Button
              v-if="checkPermission(permission.sort)"
              :disabled="
                index === rows.length - 1 ||
                Number(record.Status) === 2 ||
                Number(rows[index + 1]?.Status) === 2
              "
              size="small"
              @click="move(index, 1)"
            >
              下移
            </Button>
            <Button
              v-if="checkPermission(permission.editAd)"
              size="small"
              type="primary"
              @click="openForm(record)"
            >
              编辑
            </Button>
            <Button
              v-if="checkPermission(permission.deleteAd)"
              danger
              size="small"
              @click="removeRow(record)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="programmeVisible"
      :confirm-loading="saving"
      :title="programmeEditing ? '编辑自定义方案' : '新增自定义方案'"
      @ok="saveProgramme"
    >
      <Form layout="vertical">
        <Form.Item label="方案名称" required>
          <Input v-model:value="programmeName" :maxlength="50" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="formVisible"
      :confirm-loading="saving"
      :title="
        editing
          ? isHomeDialog
            ? '编辑首页弹窗'
            : '编辑广告图'
          : isHomeDialog
            ? '新增首页弹窗'
            : '新增广告图'
      "
      width="900px"
      @ok="saveAdvertisement"
    >
      <div class="form-scroll">
        <Tabs v-model:active-key="activeLanguage">
          <Tabs.TabPane
            v-for="group in languageGroups"
            :key="String(group.Id)"
            :tab="group.Name || `语言 ${group.Id}`"
          />
        </Tabs>
        <Form v-if="currentLanguage" :label-col="{ span: 6 }">
          <Form.Item label="类型">
            <Radio.Group v-model:value="form.SourceType">
              <Radio :value="1">系统广告图</Radio>
              <Radio :value="2">本地上传</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="标题" required>
            <Input v-model:value="currentLanguage.Title" :maxlength="100" />
          </Form.Item>
          <Form.Item label="手机版竖版" required>
            <Space align="start">
              <VoucherImageField
                v-model="currentLanguage.ImageUrl"
                :dimension-hint="
                  isHomeDialog
                    ? '推荐 1340×1340，PNG，≤500K'
                    : isPayment
                      ? '推荐 1500×864，PNG，≤500K'
                      : '推荐 1404×576，PNG，≤500K'
                "
                :max-size-kb="500"
                :preview-height="100"
                :preview-width="180"
              />
              <Button
                v-if="Number(form.SourceType) === 1"
                @click="chooseSystemImage('Image')"
              >
                选择系统图片
              </Button>
            </Space>
          </Form.Item>
          <Form.Item v-if="!isPayment" :label="isHomeDialog ? '首页弹窗横版' : 'Web 横版'">
            <Space align="start">
              <VoucherImageField
                v-model="currentLanguage.CrossImageUrl"
                :dimension-hint="
                  isHomeDialog
                    ? '推荐 2400×1130，PNG，≤1M'
                    : '推荐 3840×1200，PNG，≤1M'
                "
                :max-size-kb="1000"
                :preview-height="90"
                :preview-width="220"
              />
              <Button
                v-if="Number(form.SourceType) === 1"
                @click="chooseSystemImage('CrossImage')"
              >
                选择系统图片
              </Button>
            </Space>
          </Form.Item>
          <Form.Item v-if="isCarousel" label="手机窄版">
            <Space align="start">
              <VoucherImageField
                v-model="currentLanguage.NarrowImageUrl"
                dimension-hint="推荐 1404×192，PNG，≤500K"
                :max-size-kb="500"
                :preview-height="65"
                :preview-width="220"
              />
              <Button
                v-if="Number(form.SourceType) === 1"
                @click="chooseSystemImage('NarrowImage')"
              >
                选择系统图片
              </Button>
            </Space>
          </Form.Item>

          <template v-if="!isPayment">
            <Form.Item label="跳转类型">
              <Select
                v-model:value="form.OpenType as number"
                :disabled="String(activeLanguage) !== String(defaultLanguageId)"
                :options="openTypeOptions"
                @change="form.Jump = ''"
              />
            </Form.Item>
            <Form.Item label="跳转参数">
              <Select
                v-if="Number(form.OpenType) === 2"
                v-model:value="form.Jump as string"
                :options="
                  activities.map((item) => ({
                    label: String(item.Name || item.Id || ''),
                    value: `${item.Id}-${item.Type}`,
                  }))
                "
                show-search
              />
              <Select
                v-else-if="Number(form.OpenType) === 4"
                v-model:value="form.Jump as string | number"
                :options="
                  notices.map((item) => ({
                    label: String(item.Title || item.Id || ''),
                    value: item.Id || '',
                  }))
                "
                show-search
              />
              <Select
                v-else-if="Number(form.OpenType) === 5"
                v-model:value="form.Jump as string | number"
                :options="gameOptions"
                show-search
              />
              <Input v-else v-model:value="form.Jump as string" />
            </Form.Item>
          </template>

          <Form.Item v-if="isCarousel" label="选择日期">
            <DatePicker.RangePicker
              v-model:value="form.Time as [Dayjs, Dayjs]"
              show-time
              value-format=""
            />
          </Form.Item>
          <Form.Item v-if="isCarousel" label="展示设备">
            <Checkbox.Group
              v-model:value="form.DisplayDevices as string[]"
              :options="deviceOptions"
            />
          </Form.Item>
          <Form.Item v-if="isCarousel" label="注册天数">
            <Space>
              <Switch
                :checked="Number(form.RegStartEndDate) === 1"
                @update:checked="
                  (checked: boolean) => {
                    form.RegStartEndDate = checked ? 1 : 2;
                    if (!checked) {
                      form.RegStartDate = '';
                      form.RegEndDate = '';
                    }
                  }
                "
              />
              <InputNumber
                v-model:value="form.RegStartDate as number"
                :disabled="Number(form.RegStartEndDate) !== 1"
                :min="1"
                :max="365"
              />
              <span>-</span>
              <InputNumber
                v-model:value="form.RegEndDate as number"
                :disabled="Number(form.RegStartEndDate) !== 1"
                :min="1"
                :max="365"
              />
            </Space>
          </Form.Item>
          <Form.Item v-if="!isPayment" label="游客展示">
            <Radio.Group v-model:value="form.IsShowForGuest">
              <Radio :value="0">是</Radio>
              <Radio :value="1">否</Radio>
              <Radio :value="2">仅游客</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="VIP 限制" required>
            <Select
              v-model:value="form.Vip as string[]"
              mode="multiple"
              :options="vipOptions"
            />
          </Form.Item>
          <Form.Item label="首存后不展示">
            <Switch v-model:checked="form.IsNoFirstDeposit as boolean" />
          </Form.Item>
          <template v-if="isHomeDialog">
            <Form.Item label="有效时间">
              <Space>
                <Switch v-model:checked="form.IsShowTime as boolean" />
                <TimePicker.RangePicker
                  v-model:value="form.ShowTime as [Dayjs, Dayjs]"
                  :disabled="!form.IsShowTime"
                  format="HH:mm:ss"
                />
              </Space>
            </Form.Item>
            <Form.Item label="邀请限制">
              <Switch v-model:checked="form.IsInvite as boolean" />
            </Form.Item>
            <Form.Item label="注册天数">
              <Space>
                <Switch
                  :checked="Number(form.RegStartEndDate) === 1"
                  @update:checked="
                    (checked: boolean) => {
                      form.RegStartEndDate = checked ? 1 : 0;
                      if (!checked) {
                        form.RegStartDate = '';
                        form.RegEndDate = '';
                      }
                    }
                  "
                />
                <InputNumber
                  v-model:value="form.RegStartDate as number"
                  :disabled="Number(form.RegStartEndDate) !== 1"
                  :min="1"
                  :max="365"
                />
                <span>-</span>
                <InputNumber
                  v-model:value="form.RegEndDate as number"
                  :disabled="Number(form.RegStartEndDate) !== 1"
                  :min="1"
                  :max="365"
                />
              </Space>
            </Form.Item>
            <Form.Item label="注册时间">
              <Space>
                <Switch v-model:checked="form.IsRegTime as boolean" />
                <DatePicker
                  v-model:value="form.RegTime as Dayjs"
                  :disabled="!form.IsRegTime"
                />
              </Space>
            </Form.Item>
            <Form.Item label="展示机制">
              <Radio.Group v-model:value="form.DailyCount">
                <Radio :value="0">每次登录</Radio>
                <Radio :value="1">每日前几次登录</Radio>
              </Radio.Group>
              <InputNumber
                v-if="Number(form.DailyCount) === 1"
                v-model:value="form.DailyCountValue as number"
                :min="1"
                addon-after="次"
              />
            </Form.Item>
            <Form.Item label="总展示数">
              <Space>
                <Switch v-model:checked="form.IsTotalCount as boolean" />
                <InputNumber
                  v-model:value="form.TotalCount as number"
                  :disabled="!form.IsTotalCount"
                  :min="1"
                  addon-after="次"
                />
              </Space>
            </Form.Item>
            <Form.Item label="生效上架包">
              <Select
                v-model:value="form.ValidAppUrl as string[]"
                mode="multiple"
                :options="packageOptions"
                show-search
              />
            </Form.Item>
            <Form.Item label="屏蔽上架包">
              <Select
                v-model:value="form.ShieldAppUrl as string[]"
                mode="multiple"
                :options="packageOptions"
                show-search
              />
            </Form.Item>
            <Form.Item label="生效渠道">
              <ChannelSelect
                v-model="form.ValidChannels as Array<number | string>"
              />
            </Form.Item>
            <Form.Item label="屏蔽渠道">
              <ChannelSelect
                v-model="form.ShieldChannels as Array<number | string>"
              />
            </Form.Item>
          </template>
        </Form>
      </div>
    </Modal>

    <Modal
      v-model:open="libraryVisible"
      :footer="null"
      title="系统广告图"
      width="900px"
    >
      <div class="image-library">
        <button
          v-for="item in imageLibrary"
          :key="String(item.Id)"
          class="library-image"
          type="button"
          @click="selectSystemImage(item)"
        >
          <img :src="libraryImage(item)" alt="" />
        </button>
        <Empty v-if="imageLibrary.length === 0" description="暂无系统图片" />
      </div>
    </Modal>

    <Modal
      v-model:open="previewVisible"
      :footer="null"
      title="预览"
      width="900px"
    >
      <Radio.Group v-if="isCarousel" v-model:value="previewMode" class="mb-4">
        <Radio :value="1">横版</Radio>
        <Radio :value="2">竖版</Radio>
        <Radio :value="3">手机窄版</Radio>
      </Radio.Group>
      <div class="preview-list">
        <Image
          v-for="path in previewImages"
          :key="path"
          :src="getServiceImageUrl(path)"
          :width="240"
        />
        <Empty v-if="previewImages.length === 0" description="暂无可预览图片" />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.programme-bar,
.scheme-card,
.query-card,
.table-card {
  margin-bottom: 14px;
}

.scheme-card,
.query-card,
.table-card {
  border-radius: 10px;
}

.scheme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.scheme-header :deep(.ant-descriptions) {
  width: 360px;
}

.query-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 180px 220px auto;
  gap: 12px;
}

.form-scroll {
  max-height: 70vh;
  padding-right: 8px;
  overflow: auto;
}

.image-library,
.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  max-height: 60vh;
  overflow: auto;
}

.library-image {
  width: 260px;
  height: 130px;
  padding: 4px;
  overflow: hidden;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 6px;
}

.library-image:hover {
  border-color: hsl(var(--primary));
}

.library-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@media (max-width: 900px) {
  .scheme-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .query-grid {
    grid-template-columns: 1fr;
  }
}
</style>
