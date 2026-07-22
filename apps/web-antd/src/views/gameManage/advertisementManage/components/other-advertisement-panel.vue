<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
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
} from 'ant-design-vue';

import {
  createAdvertisementApi,
  createAdvertisementProgrammeApi,
  createVenueRebateApi,
  deleteAdvertisementApi,
  deleteAdvertisementProgrammeApi,
  deleteVenueRebateApi,
  fetchAdvertisementListApi,
  fetchAdvertisementProgrammesApi,
  fetchVenueRebateListApi,
  recoverAdvertisementProgrammeApi,
  recoverVenueRebateApi,
  registerAdvertisementImageApi,
  switchAdvertisementSortApi,
  updateAdvertisementApi,
  updateAdvertisementProgrammeApi,
  updateVenueRebateApi,
} from '#/api/gameManage/advertisement-manage';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { getServiceImageUrl } from '#/utils/media';

import VoucherImageField from '../../../operationalManage/voucher/components/voucher-image-field.vue';

defineOptions({ name: 'OtherAdvertisementPanel' });

interface ProgrammeRow {
  AgentAppQrCode?: string;
  DisplayMode?: number;
  Id: number | string;
  SportsAppQrCode?: string;
  Status?: boolean;
  Switch?: number;
  TemplateName?: string;
  UrlApp?: string;
  UrlWeb?: string;
}

interface OtherRow {
  ActivityTitle?: string;
  CrossImageId?: number | string;
  CrossImageUrl?: string;
  Desc?: string;
  Desc2?: string;
  Description?: string;
  Id: number | string;
  ImageId?: number | string;
  ImageNightId?: number | string;
  ImageNightUrl?: string;
  ImageUrl?: string;
  Jump?: number | string;
  Jump2?: number | string;
  LangText?: string;
  Mode?: number;
  OpenType?: number;
  Sort?: number;
  SubTitle?: string;
  Title?: string;
  Type?: number | string;
  UrlApp?: string;
  UrlWeb?: string;
  [key: string]: unknown;
}

interface LanguageData {
  ActivityTitle?: string;
  CrossImageId?: number | string;
  CrossImageUrl?: string;
  Desc?: string;
  Desc2?: string;
  ImageId?: number | string;
  ImageNightId?: number | string;
  ImageNightUrl?: string;
  ImageUrl?: string;
  LangGroupId: number | string;
  Title?: string;
}

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const loading = ref(false);
const saving = ref(false);
const programmes = ref<ProgrammeRow[]>([]);
const activeProgrammeId = ref<number | string>('');
const subtype = ref(1);
const rows = ref<OtherRow[]>([]);
const programmeVisible = ref(false);
const programmeEditing = ref(false);
const programmeName = ref('');
const formVisible = ref(false);
const editing = ref(false);
const activeLanguage = ref('');
const displayMode = ref(1);
const schemeEnabled = ref(false);
const agentQrEnabled = ref(false);
const sportsAppQrCode = ref('');
const agentAppQrCode = ref('');
const form = reactive<Record<string, unknown>>({});
const languageData = reactive<Record<string, LanguageData>>({});

const subtypeOptions = [
  { label: '合营计划', value: 1 },
  { label: '赞助', value: 2 },
  { label: '优惠下拉', value: 3 },
  { label: '合营下拉页', value: 4 },
  { label: 'APP 下载下拉页', value: 5 },
  { label: '优惠主题页', value: 6 },
  { label: '场馆与返水显示设定', value: 7 },
];
const openTypeOptions = [
  { label: '网址', value: 1 },
  { label: '活动界面', value: 2 },
  { label: '功能界面', value: 3 },
  { label: '公告界面', value: 4 },
  { label: '游戏界面', value: 5 },
];
const venueOptions = [
  { label: '体育', value: 1 },
  { label: '真人', value: 2 },
  { label: '彩票', value: 3 },
  { label: '电竞', value: 4 },
  { label: '电子', value: 5 },
  { label: '棋牌', value: 6 },
  { label: '捕鱼', value: 7 },
  { label: '斗鸡', value: 8 },
];
const languageGroups = computed(() => {
  const groups = projectConfig.value?.LangGroup || [];
  return groups.length > 0 ? groups : [{ Default: true, Id: 0, Name: '默认语言' }];
});
const defaultLanguageId = computed(
  () =>
    languageGroups.value.find((item) => item.Default)?.Id ??
    languageGroups.value[0]?.Id ??
    0,
);
const currentLanguage = computed(() => languageData[activeLanguage.value]);
const currentProgramme = computed(() =>
  programmes.value.find(
    (item) => String(item.Id) === String(activeProgrammeId.value),
  ),
);

function syncProgrammeConfig() {
  const current = currentProgramme.value;
  displayMode.value = Number(current?.DisplayMode || 1);
  schemeEnabled.value = Boolean(current?.Status);
  agentQrEnabled.value = Number(current?.Switch || 0) === 1;
  sportsAppQrCode.value = String(current?.SportsAppQrCode || '');
  agentAppQrCode.value = String(current?.AgentAppQrCode || '');
}

const columns = computed(() => {
  if (subtype.value === 7) {
    return [
      { dataIndex: 'Type', key: 'venueType', title: '场馆类型', width: 120 },
      { dataIndex: 'Title', key: 'Title', title: '场馆主标题' },
      { dataIndex: 'SubTitle', key: 'SubTitle', title: '场馆副标题' },
      {
        dataIndex: 'Description',
        key: 'Description',
        title: '显示返水或介绍',
      },
      { key: 'action', title: '操作', width: 170 },
    ];
  }
  const result: Array<Record<string, unknown>> = [
    { key: 'index', title: '序号', width: 60 },
    { dataIndex: 'Title', key: 'Title', title: '标题', width: 170 },
  ];
  if (subtype.value === 1) {
    result.push(
      { key: 'ImageUrl', title: '背景图(APP 白天)', width: 210 },
      { key: 'ImageNightUrl', title: '背景图(APP 夜晚)', width: 210 },
      { key: 'CrossImageUrl', title: '背景图(PC)', width: 210 },
      { key: 'OpenType', title: '跳转类型', width: 110 },
      { dataIndex: 'Jump', key: 'Jump', title: '跳转参数', width: 130 },
    );
  } else if (subtype.value === 2) {
    if (displayMode.value === 1) {
      result.push(
        { key: 'ImageUrl', title: '宣传图(APP)', width: 260 },
        { key: 'CrossImageUrl', title: '宣传图(PC)', width: 260 },
      );
    } else {
      result.push(
        { dataIndex: 'UrlApp', key: 'UrlApp', title: 'APP 地址', width: 260 },
        { dataIndex: 'UrlWeb', key: 'UrlWeb', title: 'PC 地址', width: 260 },
      );
    }
  } else {
    result.push(
      { key: 'CrossImageUrl', title: '背景图(PC)', width: 260 },
      { key: 'OpenType', title: '跳转类型', width: 110 },
      { dataIndex: 'Jump', key: 'Jump', title: '跳转参数', width: 160 },
    );
    if ([3, 4].includes(subtype.value)) {
      result.push(
        {
          dataIndex: 'ActivityTitle',
          key: 'ActivityTitle',
          title: '活动标题',
        },
        { dataIndex: 'Desc', key: 'Desc', title: '描述内容1' },
      );
      if (subtype.value === 4) {
        result.push({ dataIndex: 'Desc2', key: 'Desc2', title: '描述内容2' });
      }
    }
  }
  result.push({ key: 'action', title: '操作', width: 220 });
  return result;
});

function toItems(data: unknown) {
  if (data == null) return [] as OtherRow[];
  if (Array.isArray(data)) return data as OtherRow[];
  const value = data as {
    Data?: null | OtherRow[];
    Items?: null | OtherRow[];
    Pagination?: unknown;
  };
  if (Array.isArray(value.Items)) return value.Items;
  if (Array.isArray(value.Data)) return value.Data;
  return [];
}

function parseLanguages(value: unknown) {
  if (!value) return {};
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed.map((item) => [String(item.LangGroupId), item]),
      );
    }
    return parsed as Record<string, LanguageData>;
  } catch {
    return {};
  }
}

function normalizeRows(data: unknown) {
  return toItems(data).map((row) => {
    const languages = parseLanguages(row.LangText);
    const lang =
      languages[String(defaultLanguageId.value)] ||
      Object.values(languages)[0] ||
      {};
    return { ...row, ...lang };
  });
}

async function loadProgrammes(preferredId?: number | string) {
  if (!checkPermission(11_231)) return;
  programmes.value = toItems(
    await fetchAdvertisementProgrammesApi({ Type: 4 }),
  ) as ProgrammeRow[];
  activeProgrammeId.value =
    programmes.value.find(
      (item) => String(item.Id) === String(preferredId),
    )?.Id ||
    programmes.value[0]?.Id ||
    '';
  syncProgrammeConfig();
  await loadRows();
}

async function loadRows() {
  loading.value = true;
  try {
    rows.value =
      subtype.value === 7
        ? (toItems(
            await fetchVenueRebateListApi({
              TemplateId: activeProgrammeId.value,
            }),
          ) as OtherRow[])
        : normalizeRows(
            await fetchAdvertisementListApi({
              SubType: subtype.value,
              TemplateId: activeProgrammeId.value,
              Type: 4,
            }),
          ).filter(
            (row) =>
              subtype.value !== 2 ||
              Number(row.Mode || 1) === displayMode.value,
          );
  } finally {
    loading.value = false;
  }
}

function changeSubtype() {
  void loadRows();
}

function selectProgramme(id: number | string) {
  activeProgrammeId.value = id;
  syncProgrammeConfig();
  void loadRows();
}

async function saveProgrammeConfig(actionText = '操作成功') {
  if (!currentProgramme.value) return;
  await updateAdvertisementProgrammeApi({
    ...currentProgramme.value,
    AgentAppQrCode: agentAppQrCode.value,
    DisplayMode: displayMode.value,
    SportsAppQrCode: sportsAppQrCode.value,
    Status: schemeEnabled.value,
    Switch: agentQrEnabled.value ? 1 : 0,
    Type: 4,
  });
  message.success(actionText);
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
    const payload: Record<string, unknown> = {
      Id: programmeEditing.value ? activeProgrammeId.value : '',
      TemplateName: programmeName.value.trim(),
      Type: 4,
    };
    await (programmeEditing.value ? updateAdvertisementProgrammeApi(payload) : createAdvertisementProgrammeApi(payload));
    programmeVisible.value = false;
    message.success(programmeEditing.value ? '编辑成功' : '新增成功');
    await loadProgrammes();
  } finally {
    saving.value = false;
  }
}

function removeProgramme() {
  Modal.confirm({
    content: '确认删除当前方案？',
    title: '提示',
    onOk: async () => {
      await deleteAdvertisementProgrammeApi(activeProgrammeId.value);
      message.success('删除成功');
      await loadProgrammes();
    },
  });
}

function initializeLanguages(source?: Record<string, LanguageData>) {
  Object.keys(languageData).forEach((key) => delete languageData[key]);
  languageGroups.value.forEach((group) => {
    const key = String(group.Id);
    languageData[key] = {
      ActivityTitle: '',
      CrossImageId: '',
      CrossImageUrl: '',
      Desc: '',
      Desc2: '',
      ImageId: '',
      ImageNightId: '',
      ImageNightUrl: '',
      ImageUrl: '',
      LangGroupId: group.Id,
      Title: '',
      ...source?.[key],
    };
  });
  activeLanguage.value = String(defaultLanguageId.value);
}

function openForm(source?: OtherRow | Record<string, unknown>) {
  const row = source as OtherRow | undefined;
  editing.value = !!row;
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(
    form,
    {
      Description: '',
      Id: '',
      IntroTexts: ['', '', ''],
      IsRebate: 1,
      Jump: '',
      Jump2: '',
      Mode: 1,
      OpenType: 1,
      SubTitle: '',
      Type: 1,
      UrlApp: '',
      UrlWeb: '',
    },
    row ? structuredClone(row) : {},
  );
  if (subtype.value === 7 && row) {
    const description = String(row.Description || '');
    form.IsRebate = description.includes('%') ? 1 : 2;
    form.RebatePercent = description.replace('%', '');
    form.IntroTexts = description.includes('%')
      ? ['', '', '']
      : description.split('[;]').slice(0, 3);
  }
  initializeLanguages(row ? parseLanguages(row.LangText) : undefined);
  formVisible.value = true;
}

async function ensureImageIds() {
  for (const data of Object.values(languageData)) {
    for (const [field, imageType] of [
      ['Image', 1],
      ['CrossImage', 2],
      ['ImageNight', 3],
    ] as const) {
      const path = String(data[`${field}Url`] || '');
      if (!path || data[`${field}Id`]) continue;
      const image = await registerAdvertisementImageApi({
        ImageType: imageType,
        Path: path,
        SubType: subtype.value,
        Type: 4,
      });
      data[`${field}Id`] = image.Id as number | string;
    }
  }
}

async function saveRow() {
  if (subtype.value === 7) {
    if (!form.Title || !form.SubTitle) {
      message.warning('请完整填写场馆标题');
      return;
    }
    if (
      String(form.Title).length > 8 ||
      String(form.SubTitle).length > 15
    ) {
      message.warning('场馆主标题最多 8 字，副标题最多 15 字');
      return;
    }
    const payload: Record<string, unknown> = {
      ...form,
      Description:
        Number(form.IsRebate) === 1
          ? `${Number(form.RebatePercent || 0)}%`
          : (form.IntroTexts as string[])
              .map((item) => item.trim())
              .filter(Boolean)
              .join('[;]'),
      TemplateId: activeProgrammeId.value,
    };
    if (
      Number(form.IsRebate) === 2 &&
      (form.IntroTexts as string[]).some((item) => item.length > 16)
    ) {
      message.warning('每条介绍文案最多 16 字');
      return;
    }
    delete payload.IntroTexts;
    delete payload.IsRebate;
    delete payload.RebatePercent;
    await (editing.value ? updateVenueRebateApi(payload) : createVenueRebateApi(payload));
  } else {
    const current = languageData[String(defaultLanguageId.value)];
    if (!current?.Title) {
      message.warning('请填写默认语言标题');
      return;
    }
    await ensureImageIds();
    const payload = {
      ...form,
      LangText: JSON.stringify(Object.values(languageData)),
      Mode: subtype.value === 2 ? displayMode.value : form.Mode,
      SubType: subtype.value,
      TemplateId: activeProgrammeId.value,
      Type: 4,
    };
    await (editing.value ? updateAdvertisementApi(payload) : createAdvertisementApi(payload));
  }
  formVisible.value = false;
  message.success(editing.value ? '编辑成功' : '新增成功');
  await loadRows();
}

function removeRow(source: OtherRow | Record<string, unknown>) {
  const row = source as OtherRow;
  Modal.confirm({
    content: '确认删除？',
    title: '提示',
    onOk: async () => {
      await (subtype.value === 7 ? deleteVenueRebateApi(row.Id) : deleteAdvertisementApi(row.Id));
      message.success('删除成功');
      await loadRows();
    },
  });
}

async function move(index: number, offset: -1 | 1) {
  const current = rows.value[index];
  const target = rows.value[index + offset];
  if (!current || !target) return;
  await switchAdvertisementSortApi({ Id1: current.Id, Id2: target.Id });
  await loadRows();
}

function recover() {
  Modal.confirm({
    content: '确认恢复系统预设？',
    title: '提示',
    onOk: async () => {
      await (subtype.value === 7 ? recoverVenueRebateApi({
          TemplateId: activeProgrammeId.value,
        }) : recoverAdvertisementProgrammeApi({
          // 旧站仅传 Id（首个方案），不传 SubType
          Id: programmes.value[0]?.Id,
        }));
      message.success('操作成功');
      await loadRows();
    },
  });
}

function venueName(value: unknown) {
  return venueOptions.find((item) => String(item.value) === String(value))?.label || value;
}

function rowImage(
  row: Record<string, unknown>,
  key: number | string | undefined,
) {
  return getServiceImageUrl(key ? String(row[key]) : '');
}

onMounted(loadProgrammes);
</script>

<template>
  <div>
    <div class="programme-bar">
      <Space wrap>
        <Button
          v-for="item in programmes"
          :key="item.Id"
          :type="
            String(activeProgrammeId) === String(item.Id) ? 'primary' : 'default'
          "
          @click="selectProgramme(item.Id)"
        >
          {{ item.TemplateName }}
        </Button>
        <Button
          v-if="checkPermission(11_232)"
          type="dashed"
          @click="openProgramme(false)"
        >
          新增自定义方案
        </Button>
      </Space>
    </div>

    <Card class="section-card" size="small">
      <div class="header-row">
        <Space>
          <strong>方案名称：</strong>
          <span>{{ currentProgramme?.TemplateName || '-' }}</span>
          <Button
            v-if="checkPermission(11_233)"
            size="small"
            @click="openProgramme(true)"
          >
            改名
          </Button>
          <Button
            v-if="checkPermission(11_234)"
            danger
            :disabled="
              String(activeProgrammeId) === String(programmes[0]?.Id)
            "
            size="small"
            @click="removeProgramme"
          >
            删除
          </Button>
        </Space>
      </div>
    </Card>

    <Card class="section-card" size="small">
      <div class="header-row">
        <div>
          <Radio.Group
            v-model:value="subtype"
            :options="subtypeOptions"
            @change="changeSubtype"
          />
          <Space v-if="[1, 2].includes(subtype)" class="scheme-config">
            <template v-if="subtype === 2">
              <span>显示模式：</span>
              <Select
                v-model:value="displayMode"
                :options="[
                  { label: '图片模式', value: 1 },
                  { label: '链接模式', value: 2 },
                ]"
                style="width: 120px"
              />
              <Button @click="saveProgrammeConfig('更换成功')">更换</Button>
            </template>
            <span>开关：</span>
            <Switch
              v-model:checked="schemeEnabled"
              @change="
                saveProgrammeConfig(schemeEnabled ? '已开启' : '已关闭')
              "
            />
          </Space>
        </div>
        <Space>
          <Button type="primary" @click="openForm()">
            {{ subtype === 1 ? '新增广告图' : '新增' }}
          </Button>
          <Button v-if="checkPermission(11_235)" @click="recover">
            恢复系统预设
          </Button>
        </Space>
      </div>
    </Card>

    <Card
      v-if="subtype === 1 && checkPermission(11_242)"
      class="section-card"
      size="small"
      title="二维码配置"
    >
      <div class="qr-grid">
        <Form.Item label="全站 APP 二维码">
          <VoucherImageField
            v-model="sportsAppQrCode"
            dimension-hint="请上传全站 APP 二维码"
            :preview-height="120"
            :preview-width="120"
          />
        </Form.Item>
        <Form.Item label="代理 APP 二维码">
          <Space align="start">
            <Switch v-model:checked="agentQrEnabled" />
            <VoucherImageField
              v-model="agentAppQrCode"
              :disabled="!agentQrEnabled"
              dimension-hint="请上传代理 APP 二维码"
              :preview-height="120"
              :preview-width="120"
            />
          </Space>
        </Form.Item>
        <Button type="primary" @click="saveProgrammeConfig('二维码保存成功')">
          保存二维码配置
        </Button>
      </div>
    </Card>

    <Card v-if="checkPermission(11_238)" class="section-card" :bordered="false">
      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        :scroll="{ x: 1200 }"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <span v-else-if="column.key === 'venueType'">
            {{ venueName(record.Type) }}
          </span>
          <Image
            v-else-if="
              ['ImageUrl', 'ImageNightUrl', 'CrossImageUrl'].includes(
                String(column.key),
              )
            "
            :height="72"
            :src="rowImage(record, column.key)"
            :width="160"
          />
          <span v-else-if="column.key === 'OpenType'">
            {{
              openTypeOptions.find(
                (item) => Number(item.value) === Number(record.OpenType),
              )?.label || '无'
            }}
          </span>
          <Space v-else-if="column.key === 'action'" size="small">
            <Button
              v-if="subtype !== 7 && checkPermission(11_243)"
              :disabled="index === 0"
              size="small"
              @click="move(index, -1)"
            >
              上移
            </Button>
            <Button
              v-if="subtype !== 7 && checkPermission(11_243)"
              :disabled="index === rows.length - 1"
              size="small"
              @click="move(index, 1)"
            >
              下移
            </Button>
            <Button
              v-if="checkPermission(11_240)"
              size="small"
              type="primary"
              @click="openForm(record)"
            >
              编辑
            </Button>
            <Button
              v-if="checkPermission(11_241)"
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
          <Input v-model:value="programmeName" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="formVisible"
      :confirm-loading="saving"
      :title="editing ? '编辑' : '新增'"
      width="850px"
      @ok="saveRow"
    >
      <div class="form-scroll">
        <template v-if="subtype === 7">
          <Form :label-col="{ span: 6 }">
            <Form.Item label="场馆类型" required>
              <Select
                v-model:value="form.Type as number"
                :options="venueOptions"
              />
            </Form.Item>
            <Form.Item label="场馆主标题" required>
              <Input v-model:value="form.Title as string" />
            </Form.Item>
            <Form.Item label="场馆副标题" required>
              <Input v-model:value="form.SubTitle as string" />
            </Form.Item>
            <Form.Item label="显示返水或介绍">
              <Radio.Group v-model:value="form.IsRebate">
                <Radio :value="1">显示返水</Radio>
                <Radio :value="2">显示介绍</Radio>
              </Radio.Group>
              <InputNumber
                v-if="Number(form.IsRebate) === 1"
                v-model:value="form.RebatePercent as number"
                class="mt-2"
                :max="100"
                :min="0"
                addon-after="%"
              />
              <Space v-else class="mt-2" direction="vertical">
                <Input
                  v-for="(_, index) in form.IntroTexts as string[]"
                  :key="index"
                  v-model:value="(form.IntroTexts as string[])[index]"
                  :maxlength="16"
                  :placeholder="`介绍文案 ${index + 1}`"
                />
              </Space>
            </Form.Item>
          </Form>
        </template>
        <template v-else>
          <Tabs v-model:active-key="activeLanguage">
            <Tabs.TabPane
              v-for="group in languageGroups"
              :key="String(group.Id)"
              :tab="group.Name || `语言 ${group.Id}`"
            />
          </Tabs>
          <Form v-if="currentLanguage" :label-col="{ span: 6 }">
            <Form.Item label="标题" required>
              <Input v-model:value="currentLanguage.Title" />
            </Form.Item>
            <template v-if="subtype === 1">
              <Form.Item label="背景图(APP 白天)">
                <VoucherImageField
                  v-model="currentLanguage.ImageUrl"
                  dimension-hint="APP 白天背景图"
                />
              </Form.Item>
              <Form.Item label="背景图(APP 夜晚)">
                <VoucherImageField
                  v-model="currentLanguage.ImageNightUrl"
                  dimension-hint="APP 夜晚背景图"
                />
              </Form.Item>
              <Form.Item label="背景图(PC)">
                <VoucherImageField
                  v-model="currentLanguage.CrossImageUrl"
                  dimension-hint="PC 背景图"
                  :max-size-kb="1000"
                />
              </Form.Item>
              <Form.Item label="跳转类型">
                <Select
                  v-model:value="form.OpenType as number"
                  :options="openTypeOptions"
                />
              </Form.Item>
              <Form.Item label="跳转参数">
                <Input v-model:value="form.Jump as string" />
              </Form.Item>
            </template>
            <template v-else-if="subtype === 2">
              <template v-if="displayMode === 1">
                <Form.Item label="宣传图(APP)">
                  <VoucherImageField v-model="currentLanguage.ImageUrl" />
                </Form.Item>
                <Form.Item label="宣传图(PC)">
                  <VoucherImageField
                    v-model="currentLanguage.CrossImageUrl"
                    :max-size-kb="1000"
                  />
                </Form.Item>
              </template>
              <template v-else>
                <Form.Item label="APP 地址">
                  <Input v-model:value="form.UrlApp as string" />
                </Form.Item>
                <Form.Item label="PC 地址">
                  <Input v-model:value="form.UrlWeb as string" />
                </Form.Item>
              </template>
            </template>
            <template v-else-if="[3, 4].includes(subtype)">
              <Form.Item label="背景图(PC)">
                <VoucherImageField
                  v-model="currentLanguage.CrossImageUrl"
                  :max-size-kb="1000"
                />
              </Form.Item>
              <Form.Item label="活动标题">
                <Input v-model:value="currentLanguage.ActivityTitle" />
              </Form.Item>
              <Form.Item label="描述内容1">
                <RichTextEditor v-model="currentLanguage.Desc" />
              </Form.Item>
              <Form.Item v-if="subtype === 4" label="描述内容2">
                <RichTextEditor v-model="currentLanguage.Desc2" />
              </Form.Item>
            </template>
            <template v-else>
              <Form.Item label="背景图(PC)">
                <VoucherImageField
                  v-model="currentLanguage.CrossImageUrl"
                  :max-size-kb="1000"
                />
              </Form.Item>
              <Form.Item label="跳转类型">
                <Select
                  v-model:value="form.OpenType as number"
                  :options="openTypeOptions"
                />
              </Form.Item>
              <Form.Item label="跳转参数">
                <Input v-model:value="form.Jump as string" />
              </Form.Item>
            </template>
          </Form>
        </template>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.programme-bar,
.section-card {
  margin-bottom: 14px;
}

.section-card {
  border-radius: 10px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.scheme-config {
  margin-top: 14px;
}

.qr-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 16px;
}

.form-scroll {
  max-height: 70vh;
  padding-right: 8px;
  overflow: auto;
}
</style>
