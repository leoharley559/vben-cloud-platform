<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { PlayerBasicInfo } from '#/types/player-detail';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  DatePicker,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPackageSiteConfigApi,
  fetchPlayerCardApi,
  fetchPlayerIdCardImagesApi,
  fetchPlayerTagListApi,
  unbindPlayerPhoneApi,
  updatePlayerBindFacebookApi,
  updatePlayerBindPhoneApi,
  updatePlayerBindQqWechatApi,
  updatePlayerCardApi,
  updatePlayerInviterApi,
  updatePlayerInviteSiteApi,
  updatePlayerLevelAssignApi,
  updatePlayerOtherApi,
  updatePlayerPasswordApi,
  updatePlayerTagApi,
  updatePlayerVipLevelApi,
  uploadPlayerIdCardImagesApi,
} from '#/api/operationManage/player';
import { fetchPlayerLevelListApi } from '#/api/operationManage/player-level';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import VipLevelTag from '#/components/global/vip-level-tag.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';
import { formatMemberType } from '#/utils/player-status';

import PlayerAlipayList from './player-alipay-list.vue';
import PlayerBankCardList from './player-bank-card-list.vue';
import PlayerWechatList from './player-wechat-list.vue';
import PlayerPayAcctList from './player-pay-acct-list.vue';
import PlayerRemarkList from './player-remark-list.vue';
import PlayerVirtualAddressList from './player-virtual-address-list.vue';

defineOptions({ name: 'PlayerBasicInfoPanel' });

const props = defineProps<{
  info: null | PlayerBasicInfo;
  loading?: boolean;
}>();
const emit = defineEmits<{
  refreshed: [];
}>();
/** 各安全校验 PageId（security-paths），与旧站 GoogleCode 页面配置一致 */
const OTHER_SECURITY_PAGE_ID = 1;
const SOCIAL_BIND_SECURITY_PAGE_ID = 4;
const UNBIND_PHONE_SECURITY_PAGE_ID = 5;
const PASSWORD_SECURITY_PAGE_ID = 6;
const ID_CARD_SECURITY_PAGE_ID = 7;
const INVITE_SITE_SECURITY_PAGE_ID = 0;

type PendingAction =
  | 'card'
  | 'inviteSite'
  | 'other'
  | 'password'
  | 'social'
  | 'unbindPhone';

type SocialType = 'facebook' | 'telegram' | 'viber';

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canViewVip = computed(() => checkPermission(11_316));
const canEditVip = computed(() => checkPermission(13_267));
const canEditPhone = computed(
  () => checkPermission(10_405) || checkPermission(11_316),
);
const canUnbindPhone = computed(() => checkPermission(13_269));
const canEditOther = computed(
  () => checkPermission(10_405) || checkPermission(11_316),
);
const canEditAddress = computed(() => checkPermission(13_275));
const canEditDob = computed(() => checkPermission(13_277));
const canEditInviter = computed(() => checkPermission(13_265));
const canViewPassword = computed(() => checkPermission(11_328));
const canEditPassword = computed(() => checkPermission(13_283));
const canViewLevel = computed(() => checkPermission(12_298));
const canEditLevel = computed(() => checkPermission(13_287));
const canViewTag = computed(() => checkPermission(11_326));
const canEditTag = computed(() => checkPermission(13_279));
const canViewViber = computed(() => checkPermission(11_327));
const canEditViber = computed(() => checkPermission(13_267));
const canEditTelegram = computed(() => checkPermission(13_285));
const canEditFacebook = computed(() => checkPermission(13_289));
const canViewInviteSite = computed(() => checkPermission(13_252));
const canEditInviteSite = computed(() => checkPermission(13_291));
const canViewCard = computed(() => checkPermission(11_332));
const canEditCard = computed(() => checkPermission(13_297));

const vipOptions = computed(() => {
  const map = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId: number;
    VipLevelName: string;
  }>;
  if (map.length > 0) {
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

const levelOptions = ref<
  Array<{
    Id: number | string;
    LevelName?: string;
    SchemeName?: string;
    WithdrawAutoConfigSchemeName?: string;
  }>
>([{ Id: 0, LevelName: '未分层' }]);

const tagOptions = ref<Array<{ TagId: number | string; TagName?: string }>>([]);
const inviteSiteOptions = ref<Array<{ label: string; value: string }>>([]);
const cardInfo = ref<null | Record<string, unknown>>(null);

const vipOpen = ref(false);
const phoneOpen = ref(false);
const otherOpen = ref(false);
const inviterOpen = ref(false);
const passwordOpen = ref(false);
const levelOpen = ref(false);
const tagOpen = ref(false);
const socialOpen = ref(false);
const inviteOpen = ref(false);
const cardOpen = ref(false);
const saving = ref(false);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const pendingAction = ref<PendingAction>('password');
const socialType = ref<SocialType>('viber');

const vipForm = reactive({ VipLevel: 0 as number });
const phoneForm = reactive({ BindPhone: '', DialingCode: '86' });
const otherForm = reactive({
  Address: '',
  DateOfBirth: undefined as Dayjs | undefined,
  Email: '',
  RealName: '',
});
const inviterForm = reactive({ InviterLoginAccount: '' });
const passwordForm = reactive({ NewPassword: '' });
const levelForm = reactive({ PlayerLevelId: 0 as number | string });
const tagForm = reactive({ TagIds: [] as string[] });
const socialForm = reactive({ value: '' });
const inviteForm = reactive({ InviteSite: '' });
const cardForm = reactive({
  BackIdNumCardImg: '',
  FrontIdNumCardImg: '',
  IdNum: '',
});

const selectedLevel = computed(() =>
  levelOptions.value.find(
    (item) => String(item.Id) === String(levelForm.PlayerLevelId),
  ),
);

const socialConfig = computed(() => {
  if (socialType.value === 'telegram') {
    return {
      field: 'BindWechat',
      label: 'Telegram 账号',
      title: '绑定 Telegram',
    };
  }
  if (socialType.value === 'facebook') {
    return {
      field: 'BindFacebook',
      label: 'Facebook 账号',
      title: '绑定 Facebook',
    };
  }
  return { field: 'BindQQ', label: 'Viber 账号', title: '绑定 Viber' };
});

function parseDateValue(value?: number | string) {
  if (!value) {
    return undefined;
  }
  if (/^\d+$/.test(String(value))) {
    const num = Number(value);
    const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
    return parsed.isValid() ? parsed : undefined;
  }
  const parsed = dayjs(String(value));
  return parsed.isValid() ? parsed : undefined;
}

function formatDateOnly(value?: number | string) {
  return parseDateValue(value)?.format('YYYY-MM-DD') || '-';
}

watch(
  () => props.info,
  (info) => {
    if (!info) {
      return;
    }
    vipForm.VipLevel = Number(info.VipLevel || 0);
    phoneForm.BindPhone = String(info.BindPhone || info.PhoneNo || '');
    phoneForm.DialingCode = String(info.DialingCode || '86').replace(/^\+/, '');
    otherForm.RealName = String(info.RealName || '');
    otherForm.Email = String(info.Email || '');
    otherForm.Address = String(info.Address || '');
    otherForm.DateOfBirth = parseDateValue(info.DateOfBirth as number | string);
    inviterForm.InviterLoginAccount = String(info.InviterLoginAccount || '');
    levelForm.PlayerLevelId =
      (info as { PlayerLevelId?: number | string }).PlayerLevelId ?? 0;
  },
  { immediate: true },
);

watch(
  () => props.info?.PlayerId,
  () => {
    void loadCardInfo();
  },
  { immediate: true },
);

function formatDateTime(value?: number | string) {
  if (!value) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

async function loadLevelOptions() {
  try {
    const result = await fetchPlayerLevelListApi({ Page: 1, PageSize: 200 });
    const items = (result.Items || []) as Array<{
      Id: number | string;
      LevelName?: string;
      SchemeName?: string;
      WithdrawAutoConfigSchemeName?: string;
    }>;
    levelOptions.value = [{ Id: 0, LevelName: '未分层' }, ...items];
  } catch {
    levelOptions.value = [{ Id: 0, LevelName: '未分层' }];
  }
}

async function loadTagOptions() {
  try {
    const result = await fetchPlayerTagListApi({ Page: 1, PageSize: 200 });
    tagOptions.value = (result.Items || []) as Array<{
      TagId: number | string;
      TagName?: string;
    }>;
  } catch {
    tagOptions.value = [];
  }
}

async function loadCardInfo() {
  if (!props.info?.PlayerId || !(canViewCard.value || canEditCard.value)) {
    cardInfo.value = null;
    return;
  }
  try {
    cardInfo.value =
      ((await fetchPlayerCardApi(props.info.PlayerId)) as null | Record<
        string,
        unknown
      >) || null;
  } catch {
    cardInfo.value = null;
  }
}

function normalizeSiteOptions(raw: unknown) {
  const list = Array.isArray(raw)
    ? raw
    : (Array.isArray((raw as null | { Items?: unknown[] })?.Items)
      ? ((raw as { Items: unknown[] }).Items as unknown[])
      : []);
  return list
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const value = String(
          record.Site ?? record.InviteSite ?? record.Value ?? record.Name ?? '',
        );
        const label = String(
          record.Name ?? record.SiteName ?? record.Label ?? value,
        );
        return value ? { label, value } : null;
      }
      return null;
    })
    .filter((item): item is { label: string; value: string } => !!item);
}

function openVip() {
  vipForm.VipLevel = Number(props.info?.VipLevel || 0);
  vipOpen.value = true;
}

function openPhone() {
  phoneForm.BindPhone = String(
    props.info?.BindPhone || props.info?.PhoneNo || '',
  );
  phoneForm.DialingCode = String(props.info?.DialingCode || '86').replace(
    /^\+/,
    '',
  );
  phoneOpen.value = true;
}

function openOther() {
  otherForm.RealName = String(props.info?.RealName || '');
  otherForm.Email = String(props.info?.Email || '');
  otherForm.Address = String(props.info?.Address || '');
  otherForm.DateOfBirth = parseDateValue(
    props.info?.DateOfBirth as number | string,
  );
  otherOpen.value = true;
}

function openInviter() {
  inviterForm.InviterLoginAccount = String(
    props.info?.InviterLoginAccount || '',
  );
  inviterOpen.value = true;
}

function openPassword() {
  passwordForm.NewPassword = '';
  passwordOpen.value = true;
}

async function openLevel() {
  await loadLevelOptions();
  const currentId = (props.info as null | { PlayerLevelId?: number | string })
    ?.PlayerLevelId;
  levelForm.PlayerLevelId =
    currentId === undefined || currentId === null || currentId === ''
      ? 0
      : currentId;
  levelOpen.value = true;
}

async function openTag() {
  await loadTagOptions();
  tagForm.TagIds = String(props.info?.TagId || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  tagOpen.value = true;
}

function openSocial(type: SocialType) {
  socialType.value = type;
  const field =
    type === 'telegram'
      ? 'BindWechat'
      : (type === 'facebook'
        ? 'BindFacebook'
        : 'BindQQ');
  socialForm.value = String(
    (props.info as null | Record<string, unknown>)?.[field] || '',
  );
  socialOpen.value = true;
}

async function openInvite() {
  inviteForm.InviteSite = String(props.info?.InviteSite || '');
  inviteSiteOptions.value = [];
  try {
    const result = await fetchPackageSiteConfigApi(
      (props.info as null | { PackageId?: number | string })?.PackageId || '',
    );
    inviteSiteOptions.value = normalizeSiteOptions(result);
  } catch {
    inviteSiteOptions.value = [];
  }
  inviteOpen.value = true;
}

async function openCard() {
  if (!props.info?.PlayerId) return;
  cardForm.IdNum = String(cardInfo.value?.IdNum || '');
  cardForm.FrontIdNumCardImg = '';
  cardForm.BackIdNumCardImg = '';
  cardOpen.value = true;
  try {
    const images = (await fetchPlayerIdCardImagesApi({
      PlayerId: props.info.PlayerId,
    })) as null | Record<string, unknown>;
    cardForm.FrontIdNumCardImg = String(images?.FrontIdNumCardImg || '');
    cardForm.BackIdNumCardImg = String(images?.BackIdNumCardImg || '');
  } catch {
    // 图片加载失败不影响证件号码编辑
  }
}

async function submitVip() {
  if (!props.info?.PlayerId) return;
  if (Number(vipForm.VipLevel) === Number(props.info.VipLevel)) {
    message.warning('VIP 等级未变化');
    return;
  }
  saving.value = true;
  try {
    await updatePlayerVipLevelApi({
      PlayerId: props.info.PlayerId,
      UpField: 'VipLevel',
      VipLevel: vipForm.VipLevel,
    });
    message.success('VIP 等级已更新');
    vipOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

async function submitPhone() {
  if (!props.info?.PlayerId) return;
  if (!phoneForm.BindPhone.trim()) {
    message.warning('请输入手机号');
    return;
  }
  saving.value = true;
  try {
    await updatePlayerBindPhoneApi({
      BindPhone: phoneForm.BindPhone.replaceAll(/\s/g, ''),
      DialingCode: phoneForm.DialingCode.replace(/^\+/, ''),
      PlayerId: props.info.PlayerId,
      UpField: 'BindPhone',
    });
    message.success('手机号已更新');
    phoneOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

function resolveOtherUpField() {
  const info = props.info;
  const originalAddress = String(info?.Address || '').trim();
  const originalDob = formatDateOnly(info?.DateOfBirth as number | string);
  const newDob = otherForm.DateOfBirth
    ? otherForm.DateOfBirth.format('YYYY-MM-DD')
    : '-';
  if (otherForm.Address.trim() !== originalAddress) {
    return 'Address';
  }
  if (newDob !== originalDob) {
    return 'DateOfBirth';
  }
  const originalEmail = String(info?.Email || '').trim();
  if (otherForm.Email.trim() !== originalEmail) {
    return 'Email';
  }
  return 'RealName';
}

function requestOtherSave() {
  if (!props.info?.PlayerId) return;
  pendingAction.value = 'other';
  passPopupRef.value?.validate(OTHER_SECURITY_PAGE_ID, {
    PlayerId: props.info.PlayerId,
  });
}

async function doOtherSave(data: Record<string, unknown>) {
  if (!props.info?.PlayerId) return;
  saving.value = true;
  try {
    await updatePlayerOtherApi({
      Address: otherForm.Address.trim(),
      DateOfBirth: otherForm.DateOfBirth
        ? otherForm.DateOfBirth.format('YYYY-MM-DD')
        : '',
      Email: otherForm.Email.trim(),
      PlayerId: props.info.PlayerId,
      RealName: otherForm.RealName.trim(),
      UpField: resolveOtherUpField(),
      ...(data.ValidCode ? { ValidCode: String(data.ValidCode) } : {}),
    });
    message.success('资料已更新');
    otherOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

async function submitInviter() {
  if (!props.info?.PlayerId) return;
  const account = inviterForm.InviterLoginAccount.trim().toLowerCase();
  if (!account) {
    message.warning('请输入上级账号');
    return;
  }
  saving.value = true;
  try {
    await updatePlayerInviterApi({
      BindLoginAccount: account,
      PlayerId: props.info.PlayerId,
    });
    message.success('上级账号已绑定');
    inviterOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

function validatePassword(value: string) {
  return /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,20}$/.test(value);
}

function requestPasswordSave() {
  if (!props.info?.PlayerId) return;
  if (!validatePassword(passwordForm.NewPassword)) {
    message.warning('密码需 8–20 位，且同时包含字母和数字');
    return;
  }
  pendingAction.value = 'password';
  passPopupRef.value?.validate(PASSWORD_SECURITY_PAGE_ID, {
    NewPassword: passwordForm.NewPassword,
    PlayerId: props.info.PlayerId,
  });
}

async function doPasswordSave(data: Record<string, unknown>) {
  saving.value = true;
  try {
    await updatePlayerPasswordApi({
      NewPassword: String(data.NewPassword || passwordForm.NewPassword),
      PlayerId: String(data.PlayerId || props.info?.PlayerId || ''),
      UpField: 'ChangePassword',
      ...(data.ValidCode ? { ValidCode: String(data.ValidCode) } : {}),
    });
    message.success('密码已修改');
    passwordOpen.value = false;
    passwordForm.NewPassword = '';
  } finally {
    saving.value = false;
  }
}

async function submitLevel() {
  if (!props.info?.PlayerId) return;
  saving.value = true;
  try {
    await updatePlayerLevelAssignApi({
      PlayerId: props.info.PlayerId,
      PlayerLevelId: levelForm.PlayerLevelId,
    });
    message.success('会员层级已更新');
    levelOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

async function submitTag() {
  if (!props.info?.PlayerId) return;
  saving.value = true;
  try {
    const selected = tagOptions.value.filter((item) =>
      tagForm.TagIds.includes(String(item.TagId)),
    );
    await updatePlayerTagApi({
      PlayerId: props.info.PlayerId,
      TagId: selected.map((item) => item.TagId).join(','),
      TagName: selected.map((item) => item.TagName || '').join(','),
    });
    message.success('标签已更新');
    tagOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

function requestUnbindPhone() {
  if (!props.info?.PlayerId) return;
  pendingAction.value = 'unbindPhone';
  passPopupRef.value?.validate(UNBIND_PHONE_SECURITY_PAGE_ID, {
    PlayerId: props.info.PlayerId,
  });
}

async function doUnbindPhone(data: Record<string, unknown>) {
  if (!props.info?.PlayerId) return;
  saving.value = true;
  try {
    await unbindPlayerPhoneApi({
      PlayerId: props.info.PlayerId,
      ...(data.ValidCode ? { ValidCode: String(data.ValidCode) } : {}),
    });
    message.success('手机号已解绑');
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

function requestSocialSave() {
  if (!props.info?.PlayerId) return;
  const value = socialForm.value.trim();
  if (!value) {
    message.warning('请输入绑定账号');
    return;
  }
  if (socialType.value === 'telegram' && !/^[a-z0-9_]{5,}$/i.test(value)) {
    message.warning('Telegram 账号格式不正确，需 5 位以上字母/数字/下划线');
    return;
  }
  pendingAction.value = 'social';
  passPopupRef.value?.validate(SOCIAL_BIND_SECURITY_PAGE_ID, {
    PlayerId: props.info.PlayerId,
  });
}

async function doSocialSave(data: Record<string, unknown>) {
  if (!props.info?.PlayerId) return;
  saving.value = true;
  try {
    const validCode = data.ValidCode
      ? { ValidCode: String(data.ValidCode) }
      : {};
    const value = socialForm.value.trim();
    if (socialType.value === 'facebook') {
      await updatePlayerBindFacebookApi({
        BindFacebook: value,
        PlayerId: props.info.PlayerId,
        ...validCode,
      });
    } else if (socialType.value === 'telegram') {
      await updatePlayerBindQqWechatApi({
        BindWechat: value,
        PlayerId: props.info.PlayerId,
        UpField: 'BindWechat',
        ...validCode,
      });
    } else {
      await updatePlayerBindQqWechatApi({
        BindQQ: value,
        PlayerId: props.info.PlayerId,
        UpField: 'BindQQ',
        ...validCode,
      });
    }
    message.success('绑定已更新');
    socialOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

function requestInviteSave() {
  if (!props.info?.PlayerId) return;
  if (!inviteForm.InviteSite.trim()) {
    message.warning('请选择邀请站点');
    return;
  }
  pendingAction.value = 'inviteSite';
  passPopupRef.value?.validate(INVITE_SITE_SECURITY_PAGE_ID, {
    PlayerId: props.info.PlayerId,
  });
}

async function doInviteSave(data: Record<string, unknown>) {
  if (!props.info?.PlayerId) return;
  saving.value = true;
  try {
    await updatePlayerInviteSiteApi({
      InviteSite: inviteForm.InviteSite.trim(),
      PlayerId: props.info.PlayerId,
      ...(data.ValidCode ? { ValidCode: String(data.ValidCode) } : {}),
    });
    message.success('邀请站点已更新');
    inviteOpen.value = false;
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

function beforeUploadIdCardImage(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['jpeg', 'jpg', 'png'].includes(ext)) {
    message.warning('仅支持 JPG/PNG 图片');
    return Upload.LIST_IGNORE;
  }
  return true;
}

function handleIdCardImageChange(
  side: 'back' | 'front',
  info: UploadChangeParam,
) {
  const response = info.file.response as
    | undefined
    | { Code?: number | string; Data?: { url?: string }; Msg?: string };
  if (info.file.status === 'done') {
    if (String(response?.Code) === '200' && response?.Data?.url) {
      if (side === 'front') {
        cardForm.FrontIdNumCardImg = response.Data.url;
      } else {
        cardForm.BackIdNumCardImg = response.Data.url;
      }
      return;
    }
    message.error(response?.Msg || '图片上传失败');
  }
}

function requestCardSave() {
  if (!props.info?.PlayerId) return;
  if (!cardForm.IdNum.trim()) {
    message.warning('请输入证件号码');
    return;
  }
  pendingAction.value = 'card';
  passPopupRef.value?.validate(ID_CARD_SECURITY_PAGE_ID, {
    PlayerId: props.info.PlayerId,
  });
}

async function doCardSave(data: Record<string, unknown>) {
  if (!props.info?.PlayerId) return;
  saving.value = true;
  try {
    await updatePlayerCardApi({
      ...cardInfo.value,
      IdNum: cardForm.IdNum.trim(),
      PlayerId: props.info.PlayerId,
      ...(data.ValidCode ? { ValidCode: String(data.ValidCode) } : {}),
    });
    if (cardForm.FrontIdNumCardImg || cardForm.BackIdNumCardImg) {
      await uploadPlayerIdCardImagesApi({
        BackIdNumCardImg: cardForm.BackIdNumCardImg,
        FrontIdNumCardImg: cardForm.FrontIdNumCardImg,
        PlayerId: props.info.PlayerId,
      });
    }
    message.success('证件信息已更新');
    cardOpen.value = false;
    await loadCardInfo();
    emit('refreshed');
  } finally {
    saving.value = false;
  }
}

function handlePassConfirm(data: Record<string, unknown>) {
  switch (pendingAction.value) {
    case 'card': {
      void doCardSave(data);
      break;
    }
    case 'inviteSite': {
      void doInviteSave(data);
      break;
    }
    case 'other': {
      void doOtherSave(data);
      break;
    }
    case 'social': {
      void doSocialSave(data);
      break;
    }
    case 'unbindPhone': {
      void doUnbindPhone(data);
      break;
    }
    default: {
      void doPasswordSave(data);
    }
  }
}

onMounted(() => {
  void loadLevelOptions();
});
</script>

<template>
  <div v-if="info">
    <div class="mb-3 flex flex-wrap gap-2">
      <Button v-if="canEditVip" ghost type="primary" @click="openVip">
        修改 VIP
      </Button>
      <Button v-if="canEditLevel" ghost type="primary" @click="openLevel">
        修改层级
      </Button>
      <Button v-if="canEditTag" ghost type="primary" @click="openTag">
        打标
      </Button>
      <Button v-if="canEditInviter" ghost type="primary" @click="openInviter">
        绑定上级
      </Button>
      <Button v-if="canEditPhone" ghost type="primary" @click="openPhone">
        修改手机
      </Button>
      <Button
        v-if="canUnbindPhone && (info.BindPhone || info.PhoneNo)"
        danger
        ghost
        @click="requestUnbindPhone"
      >
        解绑手机
      </Button>
      <Button
        v-if="canEditViber"
        ghost
        type="primary"
        @click="openSocial('viber')"
      >
        绑定 Viber
      </Button>
      <Button
        v-if="canEditTelegram"
        ghost
        type="primary"
        @click="openSocial('telegram')"
      >
        绑定 Telegram
      </Button>
      <Button
        v-if="canEditFacebook"
        ghost
        type="primary"
        @click="openSocial('facebook')"
      >
        绑定 Facebook
      </Button>
      <Button
        v-if="canEditOther || canEditAddress || canEditDob"
        ghost
        type="primary"
        @click="openOther"
      >
        修改资料
      </Button>
      <Button v-if="canEditInviteSite" ghost type="primary" @click="openInvite">
        修改邀请站点
      </Button>
      <Button v-if="canEditCard" ghost type="primary" @click="openCard">
        修改证件
      </Button>
      <Button
        v-if="canEditPassword || canViewPassword"
        :disabled="!canEditPassword"
        ghost
        type="primary"
        @click="openPassword"
      >
        修改密码
      </Button>
    </div>

    <Descriptions bordered :column="2" size="small" title="基础信息">
      <Descriptions.Item label="玩家 ID">
        {{ info.PlayerId ?? '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="游戏账号">
        {{ info.LoginAccount ?? '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="会员类型">
        {{ formatMemberType(info.DataFlag) }}
      </Descriptions.Item>
      <Descriptions.Item label="玩家状态">
        <PlayerStatusTag :status="info.Status" />
      </Descriptions.Item>
      <Descriptions.Item label="VIP 等级">
        <Space>
          <VipLevelTag v-if="canViewVip" :level="info.VipLevel" />
          <span v-else>***</span>
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label="会员层级">
        {{ canViewLevel ? info.PlayerLevelName || '未分层' : '***' }}
      </Descriptions.Item>
      <Descriptions.Item label="标签">
        {{ canViewTag ? info.TagName || '-' : '***' }}
      </Descriptions.Item>
      <Descriptions.Item label="上级账号">
        {{ info.InviterLoginAccount || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="推广账号">
        {{ info.PromoterUserName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="邀请码">
        {{ info.InviteCode || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="邀请站点">
        {{ canViewInviteSite ? info.InviteSite || '-' : '***' }}
      </Descriptions.Item>
      <Descriptions.Item label="渠道">
        {{
          info.ChannelName
            ? `${info.ChannelName}(${info.ChannelId ?? '-'})`
            : '-'
        }}
      </Descriptions.Item>
      <Descriptions.Item label="产品">
        {{ info.PackageName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="注册时间">
        {{ formatDateTime(info.CreateTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="最后登录">
        {{ formatDateTime(info.LastLoginTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="注册 IP">
        {{ info.RegIp || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="注册来源">
        {{ info.DevicePlatform || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="真实姓名">
        {{ info.RealName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="手机号">
        {{
          info.BindPhone
            ? `${info.DialingCode ? `+${info.DialingCode} ` : ''}${info.BindPhone}`
            : info.PhoneNo || '-'
        }}
      </Descriptions.Item>
      <Descriptions.Item label="邮箱">
        {{ info.Email || '-' }}
      </Descriptions.Item>
      <Descriptions.Item v-if="info.Address" label="地址">
        {{ info.Address }}
      </Descriptions.Item>
      <Descriptions.Item v-if="info.DateOfBirth" label="生日">
        {{ formatDateOnly(info.DateOfBirth as string | number | undefined) }}
      </Descriptions.Item>
      <Descriptions.Item v-if="info.BindQQ" label="Viber">
        {{ canViewViber ? info.BindQQ : '***' }}
      </Descriptions.Item>
      <Descriptions.Item v-if="info.BindWechat" label="Telegram">
        {{ info.BindWechat }}
      </Descriptions.Item>
      <Descriptions.Item v-if="info.BindFacebook" label="Facebook">
        {{ info.BindFacebook }}
      </Descriptions.Item>
      <Descriptions.Item v-if="canViewCard || canEditCard" label="证件号码">
        {{ canViewCard ? cardInfo?.IdNum || '-' : '***' }}
      </Descriptions.Item>
    </Descriptions>

    <Modal
      v-model:open="vipOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="修改 VIP 等级"
      @ok="submitVip"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="VIP 等级" required>
          <Select
            v-model:value="vipForm.VipLevel"
            :options="vipOptions"
            class="w-full"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="phoneOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="修改绑定手机"
      @ok="submitPhone"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="区号">
          <Input v-model:value="phoneForm.DialingCode" style="width: 120px" />
        </Form.Item>
        <Form.Item label="手机号" required>
          <Input v-model:value="phoneForm.BindPhone" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="otherOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="修改资料"
      @ok="requestOtherSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="真实姓名">
          <Input v-model:value="otherForm.RealName" />
        </Form.Item>
        <Form.Item label="邮箱">
          <Input v-model:value="otherForm.Email" />
        </Form.Item>
        <Form.Item v-if="canEditOther || canEditAddress" label="地址">
          <Input v-model:value="otherForm.Address" placeholder="请输入地址" />
        </Form.Item>
        <Form.Item v-if="canEditOther || canEditDob" label="生日">
          <DatePicker v-model:value="otherForm.DateOfBirth" class="w-full" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="inviterOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="绑定上级账号"
      @ok="submitInviter"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="当前上级">
          <Input :value="info.InviterLoginAccount || '-'" disabled />
        </Form.Item>
        <Form.Item label="新上级账号" required>
          <Input
            v-model:value="inviterForm.InviterLoginAccount"
            placeholder="请输入上级游戏账号"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="passwordOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="修改登录密码"
      @ok="requestPasswordSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="新密码" required>
          <Input.Password
            v-model:value="passwordForm.NewPassword"
            :maxlength="20"
            placeholder="8–20 位，字母+数字"
          />
        </Form.Item>
        <div class="text-xs text-gray-400">
          若已开启谷歌验证，提交时将要求输入验证码。
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="levelOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="修改会员层级"
      @ok="submitLevel"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="会员层级" required>
          <Select
            v-model:value="levelForm.PlayerLevelId"
            :options="
              levelOptions.map((item) => ({
                label: item.LevelName || String(item.Id),
                value: item.Id,
              }))
            "
            class="w-full"
            option-filter-prop="label"
            show-search
          />
        </Form.Item>
        <Form.Item label="返水方案">
          <Input
            :value="selectedLevel?.SchemeName || '默认返水方案'"
            disabled
          />
        </Form.Item>
        <Form.Item label="风控方案">
          <Input
            :value="selectedLevel?.WithdrawAutoConfigSchemeName || '-'"
            disabled
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="tagOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="打标"
      @ok="submitTag"
    >
      <Checkbox.Group
        v-model:value="tagForm.TagIds"
        class="flex flex-wrap gap-2"
      >
        <Checkbox
          v-for="item in tagOptions"
          :key="item.TagId"
          :value="String(item.TagId)"
        >
          {{ item.TagName || item.TagId }}
        </Checkbox>
      </Checkbox.Group>
      <div v-if="tagOptions.length === 0" class="text-xs text-gray-400">
        暂无可用标签
      </div>
    </Modal>

    <Modal
      v-model:open="socialOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="socialConfig.title"
      @ok="requestSocialSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item :label="socialConfig.label" required>
          <Input
            v-model:value="socialForm.value"
            :placeholder="`请输入${socialConfig.label}`"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="inviteOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="修改邀请站点"
      @ok="requestInviteSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="邀请站点" required>
          <Select
            v-model:value="inviteForm.InviteSite"
            allow-clear
            :options="inviteSiteOptions"
            class="w-full"
            option-filter-prop="label"
            placeholder="请选择邀请站点"
            show-search
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="cardOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="修改证件信息"
      width="600px"
      @ok="requestCardSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="证件号码" required>
          <Input
            v-model:value="cardForm.IdNum"
            placeholder="请输入身份证号码"
          />
        </Form.Item>
        <Form.Item label="证件正面">
          <div class="flex items-center gap-3">
            <img
              v-if="cardForm.FrontIdNumCardImg"
              alt=""
              class="h-16 w-24 rounded border object-cover"
              :src="getServiceImageUrl(cardForm.FrontIdNumCardImg)"
            />
            <Upload
              :action="getUploadMd5ImageUrl()"
              :before-upload="beforeUploadIdCardImage"
              :show-upload-list="false"
              @change="(info) => handleIdCardImageChange('front', info)"
            >
              <Button size="small">
                {{ cardForm.FrontIdNumCardImg ? '重新上传' : '上传' }}
              </Button>
            </Upload>
          </div>
        </Form.Item>
        <Form.Item label="证件反面">
          <div class="flex items-center gap-3">
            <img
              v-if="cardForm.BackIdNumCardImg"
              alt=""
              class="h-16 w-24 rounded border object-cover"
              :src="getServiceImageUrl(cardForm.BackIdNumCardImg)"
            />
            <Upload
              :action="getUploadMd5ImageUrl()"
              :before-upload="beforeUploadIdCardImage"
              :show-upload-list="false"
              @change="(info) => handleIdCardImageChange('back', info)"
            >
              <Button size="small">
                {{ cardForm.BackIdNumCardImg ? '重新上传' : '上传' }}
              </Button>
            </Upload>
          </div>
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />

    <PlayerRemarkList v-if="info.PlayerId" :player-id="info.PlayerId" />

    <PlayerBankCardList
      v-if="info.PlayerId"
      :login-account="String(info.LoginAccount || '')"
      :package-name="String(info.PackageName || '')"
      :player-id="info.PlayerId"
    />

    <PlayerAlipayList
      v-if="info.PlayerId"
      :device-id="String(info.DeviceId || '')"
      :login-account="String(info.LoginAccount || '')"
      :package-name="String(info.PackageName || '')"
      :player-id="info.PlayerId"
    />

    <PlayerWechatList
      v-if="info.PlayerId"
      :device-id="String(info.DeviceId || '')"
      :login-account="String(info.LoginAccount || '')"
      :package-name="String(info.PackageName || '')"
      :player-id="info.PlayerId"
    />

    <PlayerVirtualAddressList
      v-if="info.PlayerId"
      :login-account="String(info.LoginAccount || '')"
      :package-name="String(info.PackageName || '')"
      :player-id="info.PlayerId"
    />

    <PlayerPayAcctList v-if="info.PlayerId" :player-id="info.PlayerId" />
  </div>

  <Result
    v-else-if="!loading"
    status="info"
    sub-title="未加载到玩家信息"
    title="暂无数据"
  />
</template>
