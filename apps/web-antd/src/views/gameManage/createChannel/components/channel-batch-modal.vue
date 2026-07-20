<script lang="ts" setup>
import type {
  ChannelBatchPayload,
  ChannelBatchResult,
  ChannelDomainOption,
  ChannelId,
  ChannelResource,
  ChannelRow,
  DefaultTagVenueOption,
} from '#/types/channel-config';

import { computed, reactive, ref, watch } from 'vue';

import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Radio,
  Result,
  Select,
  Spin,
  Switch,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  fetchChannelAndroidAppPackagesApi,
  fetchChannelDomainOptionsApi,
  fetchChannelIosAppPackagesApi,
  fetchChannelIosEnterprisePackagesApi,
  fetchChannelLandingResourcesApi,
  fetchChannelPackageOptionsApi,
  fetchDefaultTagVenuesApi,
  updateChannelsBatchApi,
} from '#/api/gameManage/channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'ChannelBatchModal' });

const props = defineProps<{
  dataFlag?: 0 | 1;
  open: boolean;
  rows: ChannelRow[];
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

type ActionType = 1 | 2 | 3 | 4 | 5 | 6;
type FailEntry = ChannelId | { Id?: ChannelId; Msg?: string };

interface FormState {
  AndroidAppPkgType?: number;
  BackgroundId?: ChannelId;
  DefaultTagSelected: number;
  DefaultTagVenueSetting: string;
  Domain?: string;
  GameTabSelected?: number;
  H5Domain1?: string;
  H5DownloadUserTarget: number;
  H5LandingPage: number;
  IosPackageId?: ChannelId;
  IosType?: number;
  IsOpenH5Site?: number;
  IsOpenKeFu?: number;
  KeFuRadio?: number;
  KeFuThirdUrl?: string;
  PackPlatformType: string;
  PageAutoDown?: number;
  PageAutoDownTime?: number;
  PushType?: number;
}

interface FailureDisplay {
  channel: string;
  id: string;
  message: string;
}

const ACTIONS: Array<{ key: ActionType; label: string }> = [
  { key: 1, label: '首页默认标签' },
  { key: 2, label: '版本与平台' },
  { key: 3, label: '落地页' },
  { key: 4, label: '推广模式' },
  { key: 5, label: '域名' },
  { key: 6, label: '重新打包' },
];

const ACTION_FIELDS: Record<ActionType, Array<keyof FormState>> = {
  1: ['GameTabSelected'],
  2: ['IosType', 'AndroidAppPkgType', 'IosPackageId', 'PackPlatformType'],
  3: [
    'BackgroundId',
    'IsOpenH5Site',
    'H5LandingPage',
    'H5DownloadUserTarget',
    'IsOpenKeFu',
    'KeFuRadio',
    'KeFuThirdUrl',
    'PackPlatformType',
    'PageAutoDown',
    'PageAutoDownTime',
  ],
  4: ['PushType', 'DefaultTagSelected', 'DefaultTagVenueSetting'],
  5: ['Domain', 'H5Domain1'],
  6: [],
};

const { adminInfo, checkPermission, projectConfig } = useCloudPermission();
const canBatchEdit = computed(() => checkPermission(12_322));
const actionType = ref<ActionType>(1);
const loading = ref(false);
const saving = ref(false);
const dependencyError = ref('');
const loadedActions = reactive(new Set<ActionType>());
const initialSnapshot = ref('');
const resultOpen = ref(false);
const resultFailures = ref<FailureDisplay[]>([]);
const resultFailCount = ref(0);

const packageOptions = ref<
  Array<{ Id?: ChannelId; PackageAlias?: string; PackageName?: string }>
>([]);
const enterpriseIosOptions = ref<Array<{ Id?: ChannelId; IosName?: string }>>(
  [],
);
const iosAppOptions = ref<Array<{ Id?: ChannelId }>>([]);
const androidAppOptions = ref<Array<{ Id?: ChannelId }>>([]);
const domainOptions = ref<ChannelDomainOption[]>([]);
const landingResources = ref<ChannelResource[]>([]);
const venueOptions = ref<DefaultTagVenueOption[]>([]);
const selectedVenueIds = ref<ChannelId[]>([]);

const form = reactive<FormState>(createDefaultForm());

const hasPackingRows = computed(() =>
  props.rows.some((row) => Number(row.PackStatus) === 4),
);
const hasMissingDatabaseIds = computed(() =>
  props.rows.some(
    (row) => row.Id === undefined || row.Id === null || row.Id === '',
  ),
);
const packageId = computed(() => props.rows[0]?.PackageConfigId);
const samePackage = computed(() => {
  if (props.rows.length === 0 || packageId.value == null) return false;
  return props.rows.every(
    (row) => String(row.PackageConfigId ?? '') === String(packageId.value),
  );
});
const packageName = computed(() => {
  const current = packageOptions.value.find(
    (item) => String(item.Id) === String(packageId.value),
  );
  return (
    current?.PackageAlias ||
    current?.PackageName ||
    props.rows[0]?.PackageName ||
    String(packageId.value ?? '')
  );
});
const blockedReason = computed(() => {
  if (!canBatchEdit.value) return '缺少批量配置权限（12322）。';
  if (props.rows.length === 0) return '请先选择需要批量配置的渠道。';
  if (hasPackingRows.value) return '打包中的渠道不能选择或进行批量配置。';
  if (hasMissingDatabaseIds.value)
    return '选中数据缺少数据库行 Id，无法批量配置。';
  return '';
});
const isDirty = computed(
  () =>
    snapshot() !== initialSnapshot.value || selectedVenueIds.value.length > 0,
);
const formDisabled = computed(
  () => Boolean(blockedReason.value) || loading.value || saving.value,
);
const antiBlockDomains = computed(() =>
  domainOptions.value.filter(
    (item) => Number(item.Type) === 1 && Number(item.InUsed) === 1,
  ),
);
const h5Domains = computed(() =>
  domainOptions.value.filter(
    (item) => Number(item.Type) === 3 && Number(item.InUsed) === 1,
  ),
);
const resourceBaseUrl = computed(() =>
  String(projectConfig.value?.CommonResourceDomainUrl || '').replace(/\/$/, ''),
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    reset();
    if (!blockedReason.value) void loadDependencies(actionType.value);
  },
);

watch(
  selectedVenueIds,
  (ids) => {
    form.DefaultTagVenueSetting = JSON.stringify(
      ids.map((id) => {
        const venue = venueOptions.value.find(
          (item) => String(item.GameId) === String(id),
        );
        return { GameId: id, I18nKey: venue?.I18nKey };
      }),
    );
  },
  { deep: true },
);

function createDefaultForm(): FormState {
  return {
    DefaultTagSelected: 1,
    DefaultTagVenueSetting: '[]',
    H5DownloadUserTarget: 2,
    H5LandingPage: 1,
    IsOpenH5Site: 0,
    IsOpenKeFu: 0,
    PackPlatformType: 'uniapp2',
    PageAutoDown: 0,
  };
}

function snapshot() {
  return JSON.stringify({ actionType: actionType.value, form });
}

function reset() {
  Object.assign(form, createDefaultForm());
  for (const key of Object.keys(form) as Array<keyof FormState>) {
    if (!(key in createDefaultForm())) delete form[key];
  }
  actionType.value = 1;
  selectedVenueIds.value = [];
  dependencyError.value = '';
  loadedActions.clear();
  packageOptions.value = [];
  enterpriseIosOptions.value = [];
  iosAppOptions.value = [];
  androidAppOptions.value = [];
  domainOptions.value = [];
  landingResources.value = [];
  venueOptions.value = [];
  resultFailures.value = [];
  initialSnapshot.value = snapshot();
}

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    return String(record.message || record.Msg || '加载失败');
  }
  return '加载失败';
}

function currentAdminId() {
  const account = adminInfo.value?.Account;
  if (account && typeof account === 'object' && account.AdminId != null) {
    return account.AdminId as ChannelId;
  }
  const admin = (adminInfo.value?.Admin || {}) as Record<string, unknown>;
  const accountInfo = projectConfig.value?.AccountInfo as
    | Record<string, unknown>
    | undefined;
  return (accountInfo?.AdminId ?? admin.AdminId ?? admin.Id) as
    | ChannelId
    | undefined;
}

async function loadDependencies(type: ActionType, force = false) {
  if (loadedActions.has(type) && !force) return;
  if ((type === 2 || type === 5) && !samePackage.value) {
    dependencyError.value = '版本及域名批量配置要求所有渠道属于同一包体。';
    return;
  }
  loading.value = true;
  dependencyError.value = '';
  try {
    switch (type) {
      case 2: {
        const id = packageId.value as ChannelId;
        const [packages, enterprise, iosApps, androidApps] = await Promise.all([
          fetchChannelPackageOptionsApi(),
          fetchChannelIosEnterprisePackagesApi(id),
          fetchChannelIosAppPackagesApi(id),
          fetchChannelAndroidAppPackagesApi(),
        ]);
        packageOptions.value = packages;
        enterpriseIosOptions.value = enterprise.Items;
        iosAppOptions.value = iosApps;
        androidAppOptions.value = androidApps;
        break;
      }
      case 3: {
        const result = await fetchChannelLandingResourcesApi({
          AgentId: currentAdminId(),
          Page: 1,
          PageSize: 1000,
        });
        landingResources.value = result.Items;
        if (landingResources.value.length > 0 && form.BackgroundId == null) {
          form.BackgroundId = landingResources.value[0]?.Id;
        }
        break;
      }
      case 4: {
        const result = await fetchDefaultTagVenuesApi();
        venueOptions.value = parseVenues(result);
        break;
      }
      case 5: {
        const [packages, domains] = await Promise.all([
          fetchChannelPackageOptionsApi(),
          fetchChannelDomainOptionsApi({
            InUsed: 1,
            IsAll: 1,
            OnlyUnused: true,
            PackageId: packageId.value as ChannelId,
            PageSize: 100_000_000,
          }),
        ]);
        packageOptions.value = packages;
        domainOptions.value = domains.Items;
        break;
      }
      // No default
    }
    loadedActions.add(type);
  } catch (error) {
    dependencyError.value = errorText(error);
  } finally {
    loading.value = false;
  }
}

function parseVenues(
  value: DefaultTagVenueOption[] | null | string,
): DefaultTagVenueOption[] {
  if (Array.isArray(value)) return value;
  if (!value || value === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function changeAction(key: number | string) {
  const next = Number(key) as ActionType;
  if ((next === 2 || next === 5) && !samePackage.value) {
    message.error('版本及域名批量配置要求所有渠道属于同一包体');
    return;
  }
  actionType.value = next;
  dependencyError.value = '';
  void loadDependencies(next);
}

function domainUrl(item: ChannelDomainOption) {
  const domain = String(item.Domain || '').replaceAll(/\s+/g, '');
  if (!domain) return '';
  if (/^https?:\/\//i.test(domain)) return domain;
  const parts = domain.split('.');
  return parts.length === 2 ||
    (parts.length > 2 && (parts[1]?.length ?? 4) <= 3)
    ? `https://www.${domain}`
    : `https://${domain}`;
}

function resourceUrl(resource: ChannelResource) {
  const path = String(resource.SmallPictureIp || resource.PictureIp || '');
  if (!path || /^https?:\/\//i.test(path)) return path;
  return `${resourceBaseUrl.value}/${path.replace(/^\//, '')}`;
}

function venueLabel(venue: DefaultTagVenueOption) {
  return String(
    venue.Name || venue.I18nKey || venue.ApiFee || venue.GameId || '',
  );
}

function validate() {
  const required = (value: unknown, label: string) => {
    if (value === undefined || value === null || value === '') {
      message.error(`请选择${label}`);
      return false;
    }
    return true;
  };
  if (blockedReason.value) {
    message.error(blockedReason.value);
    return false;
  }
  if (
    (actionType.value === 2 || actionType.value === 5) &&
    !samePackage.value
  ) {
    message.error('当前操作要求所有渠道属于同一包体');
    return false;
  }
  switch (actionType.value) {
    case 1: {
      return required(form.GameTabSelected, '首页默认标签');
    }
    case 2: {
      return (
        required(form.IosType, 'iOS 类型') &&
        required(form.AndroidAppPkgType, 'Android 类型') &&
        (form.IosType !== 2 || required(form.IosPackageId, 'iOS 企业包'))
      );
    }
    case 3: {
      if (!required(form.BackgroundId, '落地页资源')) return false;
      if (!required(form.IsOpenKeFu, '客服入口状态')) return false;
      if (!required(form.KeFuRadio, '客服类型')) return false;
      if (form.KeFuRadio === 2 && !form.KeFuThirdUrl?.trim()) {
        message.error('请输入第三方客服地址');
        return false;
      }
      if (
        form.PageAutoDownTime != null &&
        (!Number.isInteger(form.PageAutoDownTime) || form.PageAutoDownTime < 0)
      ) {
        message.error('自动下载延迟必须为非负整数');
        return false;
      }
      return true;
    }
    case 4: {
      if (!required(form.PushType, '推广模式')) return false;
      if (
        (form.PushType === 1 || form.PushType === 2) &&
        selectedVenueIds.value.length === 0
      ) {
        message.error('请至少选择一个专属场馆');
        return false;
      }
      return true;
    }
    case 5: {
      return (
        required(form.Domain, '防封域名') &&
        required(form.H5Domain1, 'H5 推广域名')
      );
    }
    case 6: {
      return true;
    }
  }
}

function buildPayload(): ChannelBatchPayload {
  const payload: Record<string, unknown> = {
    ActionType: actionType.value,
    Ids: props.rows.map((row) => row.Id).join(','),
    ...(props.dataFlag === undefined ? {} : { DataFlag: props.dataFlag }),
  };
  const promoterAdminId =
    props.rows[0]?.PromoterAdminId ?? props.rows[0]?.AdminId;
  if (promoterAdminId != null && promoterAdminId !== '') {
    payload.PromoterAdminId = promoterAdminId;
  }
  for (const field of ACTION_FIELDS[actionType.value]) {
    const value = form[field];
    if (value !== undefined && value !== '') payload[field] = value;
  }
  if (actionType.value === 4 && form.PushType === 2) {
    payload.DefaultTagSelected = 2;
  }
  if (actionType.value === 4 && form.PushType !== 1 && form.PushType !== 2) {
    delete payload.DefaultTagSelected;
    delete payload.DefaultTagVenueSetting;
  }
  if (actionType.value === 2 && form.IosType !== 2) {
    delete payload.IosPackageId;
  }
  if (actionType.value === 3) {
    if (form.KeFuRadio !== 2) delete payload.KeFuThirdUrl;
    if (form.PageAutoDown !== 1) delete payload.PageAutoDownTime;
  }
  return payload as unknown as ChannelBatchPayload;
}

function confirmSubmit() {
  if (!validate()) return;
  Modal.confirm({
    cancelText: '取消',
    content: `将对 ${props.rows.length} 个渠道执行“${
      ACTIONS.find((item) => item.key === actionType.value)?.label
    }”，确认继续？`,
    okText: '确认',
    title: '确认批量配置',
    onOk: submit,
  });
}

async function submit() {
  saving.value = true;
  try {
    const result = (await updateChannelsBatchApi(
      buildPayload(),
    )) as ChannelBatchResult & { FailIds?: FailEntry[] };
    const failures = parseFailures(result.FailIds || []);
    resultFailCount.value = Number(result.FailCount ?? failures.length);
    resultFailures.value = failures;
    emit('update:open', false);
    emit('success');
    if (resultFailCount.value > 0) {
      resultOpen.value = true;
    } else {
      message.success('批量配置成功');
    }
  } catch (error) {
    message.error(`批量配置失败：${errorText(error)}`);
    throw error;
  } finally {
    saving.value = false;
  }
}

function parseFailures(entries: FailEntry[]) {
  return entries.map((entry) => {
    const objectEntry =
      entry && typeof entry === 'object'
        ? (entry as { Id?: ChannelId; Msg?: string })
        : undefined;
    const id = objectEntry?.Id ?? (entry as ChannelId);
    const row = props.rows.find((item) => String(item.Id) === String(id));
    return {
      channel: String(row?.ChannelId ?? row?.ChannelName ?? id ?? ''),
      id: String(id ?? ''),
      message: objectEntry?.Msg || '批量配置失败',
    };
  });
}

function requestClose() {
  if (saving.value) return;
  if (!isDirty.value) {
    emit('update:open', false);
    return;
  }
  Modal.confirm({
    cancelText: '继续编辑',
    content: '关闭后未提交的配置将丢失。',
    okText: '放弃修改',
    title: '确认关闭？',
    onOk: () => emit('update:open', false),
  });
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :keyboard="!saving"
    :mask-closable="false"
    :open="open"
    width="min(920px, calc(100vw - 32px))"
    cancel-text="取消"
    destroy-on-close
    ok-text="确认"
    title="批量渠道配置"
    @cancel="requestClose"
    @ok="confirmSubmit"
  >
    <Result
      v-if="blockedReason"
      status="warning"
      :sub-title="blockedReason"
      title="当前无法批量配置"
    />

    <div v-else class="batch-modal-body">
      <Alert
        class="mb-3"
        show-icon
        type="info"
        :message="`已选择 ${rows.length} 个渠道；版本与域名配置仅支持相同包体。`"
      />

      <Tabs
        :active-key="actionType"
        size="small"
        type="line"
        @change="changeAction"
      >
        <Tabs.TabPane
          v-for="action in ACTIONS"
          :key="action.key"
          :disabled="(action.key === 2 || action.key === 5) && !samePackage"
          :tab="action.label"
        />
      </Tabs>

      <Alert
        v-if="dependencyError"
        class="mb-3"
        closable
        show-icon
        type="error"
        :message="dependencyError"
      >
        <template #action>
          <Button size="small" @click="loadDependencies(actionType, true)">
            重试
          </Button>
        </template>
      </Alert>

      <Spin :spinning="loading">
        <Form :disabled="formDisabled" layout="vertical">
          <Form.Item v-if="actionType === 1" label="首页默认标签" required>
            <Radio.Group v-model:value="form.GameTabSelected">
              <Radio :value="0">标签 1</Radio>
              <Radio :value="1">标签 2</Radio>
              <Radio :value="2">标签 3</Radio>
              <Radio :value="3">标签 4</Radio>
              <Radio :value="4">标签 5</Radio>
            </Radio.Group>
          </Form.Item>

          <template v-else-if="actionType === 2">
            <Alert
              class="mb-4"
              type="info"
              :message="`包体：${packageName || '-'}；可用 iOS 上架包 ${
                iosAppOptions.length
              } 个，Android 上架包 ${androidAppOptions.length} 个。`"
            />
            <Form.Item label="iOS 类型" required>
              <Radio.Group v-model:value="form.IosType">
                <Radio :disabled="enterpriseIosOptions.length === 0" :value="2">
                  企业包
                </Radio>
                <Radio :value="3">三方超级签</Radio>
                <Radio :value="4">上架包</Radio>
                <Radio :value="5">WebApp</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Android 类型" required>
              <Radio.Group v-model:value="form.AndroidAppPkgType">
                <Radio :value="1">上架包</Radio>
                <Radio :value="2">原生 APK</Radio>
                <Radio :value="3">H5 APK</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item v-if="form.IosType === 2" label="iOS 企业包" required>
              <Select
                v-model:value="form.IosPackageId"
                :options="
                  enterpriseIosOptions.map((item) => ({
                    label: item.IosName || item.Id,
                    value: item.Id,
                  }))
                "
                placeholder="请选择企业包"
              />
            </Form.Item>
          </template>

          <template v-else-if="actionType === 3">
            <Form.Item label="落地页资源" required>
              <div v-if="landingResources.length > 0" class="resource-grid">
                <label
                  v-for="resource in landingResources"
                  :key="String(resource.Id)"
                  class="resource-card"
                  :class="{ selected: form.BackgroundId === resource.Id }"
                >
                  <Radio
                    :checked="form.BackgroundId === resource.Id"
                    class="resource-radio"
                    @change="form.BackgroundId = resource.Id"
                  />
                  <img
                    :alt="resource.PictureName || '落地页资源'"
                    :src="resourceUrl(resource)"
                  />
                  <span>{{
                    resource.PictureName || `资源 ${resource.Id}`
                  }}</span>
                </label>
              </div>
              <Empty v-else description="暂无可用落地页资源" />
            </Form.Item>
            <div class="form-grid">
              <Form.Item label="客服入口" required>
                <Switch
                  :checked="form.IsOpenKeFu === 1"
                  @change="form.IsOpenKeFu = $event ? 1 : 0"
                />
              </Form.Item>
              <Form.Item label="客服类型" required>
                <Radio.Group v-model:value="form.KeFuRadio">
                  <Radio :value="1">官方客服</Radio>
                  <Radio :value="2">第三方客服</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
            <Form.Item
              v-if="form.KeFuRadio === 2"
              label="第三方客服地址"
              required
            >
              <Input
                v-model:value="form.KeFuThirdUrl"
                placeholder="请输入第三方客服地址"
              />
            </Form.Item>
            <div class="form-grid">
              <Form.Item label="H5 渠道入口">
                <Switch
                  :checked="form.IsOpenH5Site === 1"
                  @change="form.IsOpenH5Site = $event ? 1 : 0"
                />
              </Form.Item>
              <Form.Item label="H5 入口页面">
                <Radio.Group v-model:value="form.H5LandingPage">
                  <Radio :value="1">系统首页</Radio>
                  <Radio :value="2">注册页</Radio>
                  <Radio :value="3">登录页</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="自动下载">
                <Switch
                  :checked="form.PageAutoDown === 1"
                  @change="form.PageAutoDown = $event ? 1 : 0"
                />
              </Form.Item>
              <Form.Item v-if="form.PageAutoDown === 1" label="下载延迟（秒）">
                <InputNumber
                  v-model:value="form.PageAutoDownTime"
                  :min="0"
                  :precision="0"
                  class="w-full"
                />
              </Form.Item>
            </div>
          </template>

          <template v-else-if="actionType === 4">
            <Form.Item label="推广模式" required>
              <Radio.Group v-model:value="form.PushType">
                <Radio :value="0">纯娱乐</Radio>
                <Radio :value="1">娱乐 + 专属</Radio>
                <Radio :value="2">纯专属场馆</Radio>
                <Radio :value="3">游戏 + 直播</Radio>
                <Radio :value="4">直播 + 游戏</Radio>
              </Radio.Group>
            </Form.Item>
            <template v-if="form.PushType === 1 || form.PushType === 2">
              <Form.Item
                v-if="form.PushType === 1"
                label="游戏默认标签"
                required
              >
                <Radio.Group v-model:value="form.DefaultTagSelected">
                  <Radio :value="1">娱乐</Radio>
                  <Radio :value="2">专属场馆</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="专属场馆" required>
                <Checkbox.Group
                  v-model:value="selectedVenueIds"
                  class="venue-list"
                >
                  <Checkbox
                    v-for="venue in venueOptions"
                    :key="String(venue.GameId)"
                    :value="venue.GameId"
                  >
                    {{ venueLabel(venue) }}
                  </Checkbox>
                </Checkbox.Group>
                <Empty
                  v-if="venueOptions.length === 0"
                  description="暂无可用专属场馆"
                />
              </Form.Item>
            </template>
          </template>

          <template v-else-if="actionType === 5">
            <Alert
              class="mb-4"
              type="info"
              :message="`当前包体：${packageName || '-'}`"
            />
            <Form.Item label="防封域名" required>
              <Select
                v-model:value="form.Domain"
                show-search
                :options="
                  antiBlockDomains.map((item) => ({
                    label: domainUrl(item),
                    value: domainUrl(item),
                  }))
                "
                placeholder="请选择防封域名"
              />
            </Form.Item>
            <Form.Item label="H5 推广域名" required>
              <Select
                v-model:value="form.H5Domain1"
                show-search
                :options="
                  h5Domains.map((item) => ({
                    label: `${
                      Number(item.PublicType) === -1 ? '【公共】' : ''
                    }${domainUrl(item)}`,
                    value: domainUrl(item),
                  }))
                "
                placeholder="请选择 H5 推广域名"
              />
            </Form.Item>
          </template>

          <Alert
            v-else-if="actionType === 6"
            show-icon
            type="warning"
            message="确认后将通过批量编辑接口重新打包所有已选渠道。"
          />
        </Form>
      </Spin>
    </div>
  </Modal>

  <Modal
    :footer="null"
    :open="resultOpen"
    title="批量配置结果"
    width="min(680px, calc(100vw - 32px))"
    @cancel="resultOpen = false"
  >
    <Alert
      class="mb-3"
      show-icon
      type="error"
      :message="`${resultFailCount} 个渠道配置失败`"
    />
    <List :data-source="resultFailures" bordered size="small">
      <template #renderItem="{ item }">
        <List.Item>
          <div class="failure-row">
            <span>
              <Tag color="red">渠道 {{ item.channel || '-' }}</Tag>
              <span class="text-gray-400">行 Id：{{ item.id || '-' }}</span>
            </span>
            <span>{{ item.message }}</span>
          </div>
        </List.Item>
      </template>
    </List>
    <Alert
      v-if="resultFailCount > resultFailures.length"
      class="mt-3"
      show-icon
      type="warning"
      :message="`接口另报告 ${
        resultFailCount - resultFailures.length
      } 个失败项，但未返回明细。`"
    />
  </Modal>
</template>

<style scoped>
.batch-modal-body {
  max-height: min(70vh, 720px);
  overflow-y: auto;
  padding-right: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 12px;
}

.resource-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--ant-color-border, #d9d9d9);
  border-radius: 6px;
}

.resource-card.selected {
  border-color: var(--ant-color-primary, #1677ff);
  box-shadow: 0 0 0 1px var(--ant-color-primary, #1677ff);
}

.resource-card img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
}

.resource-card span {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-radio {
  position: absolute;
  top: 10px;
  right: 8px;
  z-index: 1;
}

.venue-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  width: 100%;
}

.failure-row {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .failure-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
