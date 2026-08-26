<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { AdminAccountOption } from '#/types/config';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createGameEmailApi,
  fetchGameEmailDetailApi,
  fetchGameEmailPackagesApi,
  updateGameEmailApi,
} from '#/api/operationManage/game-notice';
import { queryPlayerByExcelApi } from '#/api/operationManage/player';
import AccountSelect from '#/components/global/account-select.vue';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useProjectConfig } from '#/composables/use-project-config';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'GameEmailFormModal' });

const props = withDefaults(
  defineProps<{
    open: boolean;
    readonly?: boolean;
    rowId?: null | number | string;
  }>(),
  { readonly: false, rowId: undefined },
);

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

interface MatchedPlayer {
  LoginAccount: string;
  PackageName: string;
  PlayerId: number | string;
}

const { projectConfig } = useProjectConfig();

const submitting = ref(false);
const loading = ref(false);
const packageLoading = ref(false);
const playerLookupLoading = ref(false);

/** 全部产品包（项目配置 RealPackageIdNameMap） */
const allPackages = computed(() => {
  const list = projectConfig.value?.RealPackageIdNameMap;
  return Array.isArray(list) ? list : [];
});

/** 代理账号筛选后的可选包；无代理时等于全部包 */
const restrictedPackages = ref<
  Array<{ PackageId: number | string; PackageName: string }>
>([]);

const form = reactive({
  AdminId: '' as string,
  Content: '',
  Icon: 0,
  Id: '' as number | string,
  IsAll: 1,
  IsPush: 2,
  Jump: '' as number | string,
  OpenType: '' as number | string,
  PackageIds: [] as Array<number | string>,
  /** 对齐旧站：指定玩家时存的是 PlayerId 逗号串，不是登录账号 */
  PlayerList: '',
  PushContent: '',
  PushTitle: '',
  SendTime: undefined as Dayjs | undefined,
  Title: '',
  Type: 0,
  Username: [] as string[],
  Vip: '' as string,
});

const packageSelectOptions = computed(() => {
  const source =
    form.Username.length > 0 ? restrictedPackages.value : allPackages.value;
  return source.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  }));
});

const packageNameOptions = computed(() =>
  allPackages.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageName,
  })),
);

const vipOptions = computed(() => {
  const map = (
    projectConfig.value as {
      VIPLevelMap?: Array<{ VipLevelId: number; VipLevelName: string }>;
    }
  )?.VIPLevelMap;
  if (Array.isArray(map) && map.length > 0) {
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

const langGroups = computed(
  () => projectConfig.value?.LangGroup?.filter((item) => item.Id) || [],
);

const isEdit = computed(() => !!props.rowId);
const isReadonly = computed(() => !!props.readonly);
const createLocked = computed(() => isEdit.value || isReadonly.value);
const modalTitle = computed(() => {
  if (isReadonly.value) {
    return '查看邮件';
  }
  return isEdit.value ? '编辑邮件' : '新增邮件';
});

/** 指定玩家查询条件 */
const playerQuery = reactive({
  LoginAccount: '',
  PackageName: '',
});

/** 已确认加入的指定玩家（展示用） */
const matchedPlayers = ref<MatchedPlayer[]>([]);

const typeOptions = [
  { label: '通知', value: 0 },
  { label: '活动', value: 1 },
];

const iconOptions = [
  { label: '普通', value: 0 },
  { label: '重要', value: 1 },
];

const openTypeOptions = [
  { label: '网址', value: 1 },
  { label: '活动', value: 2 },
  { label: '功能', value: 3 },
  { label: '公告', value: 4 },
  { label: '游戏', value: 5 },
];

const vipSelectValue = computed({
  get: () =>
    form.Vip
      ? form.Vip.split(',')
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item))
      : [],
  set: (value: number[]) => {
    form.Vip = value.length > 0 ? value.join(',') : '';
  },
});

function resetForm() {
  form.Id = '';
  form.Type = 0;
  form.Icon = 0;
  form.IsAll = 1;
  form.IsPush = 2;
  form.PackageIds = [];
  form.PlayerList = '';
  form.Title = '';
  form.Content = '';
  form.PushTitle = '';
  form.PushContent = '';
  form.OpenType = '';
  form.Jump = '';
  form.Username = [];
  form.AdminId = '';
  form.Vip = '';
  form.SendTime = undefined;
  playerQuery.LoginAccount = '';
  playerQuery.PackageName = allPackages.value[0]?.PackageName || '';
  matchedPlayers.value = [];
  restrictedPackages.value = [...allPackages.value];
}

function isRichTextEmpty(html: string) {
  const text = html
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/&nbsp;/gi, ' ')
    .trim();
  return !text;
}

function parseLangText(raw: unknown): { Content?: string; Title?: string } {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const map = raw as Record<string, Record<string, unknown>>;
    const preferredId = langGroups.value[0]?.Id;
    const preferred = preferredId != null ? map[String(preferredId)] : undefined;
    const first = preferred || Object.values(map)[0];
    return {
      Content: String(first?.Content || ''),
      Title: String(first?.Title || ''),
    };
  }
  let list: Array<Record<string, unknown>> = [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        list = parsed as Array<Record<string, unknown>>;
      } else if (parsed && typeof parsed === 'object') {
        return parseLangText(parsed);
      }
    } catch {
      return {};
    }
  } else if (Array.isArray(raw)) {
    list = raw as Array<Record<string, unknown>>;
  }
  const first = list[0];
  return {
    Content: String(first?.Content || ''),
    Title: String(first?.Title || ''),
  };
}

function parseIdList(value: unknown): Array<number | string> {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== '' && item != null);
  }
  if (typeof value === 'string' && value) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function buildLangTextPayload() {
  const groups =
    langGroups.value.length > 0
      ? langGroups.value
      : [{ Id: 1, Languages: [] as string[] }];
  return groups.map((group, index) => ({
    Content: index === 0 ? form.Content : '',
    LangGroupId: group.Id,
    Title: index === 0 ? form.Title.trim() : '',
  }));
}

async function loadRestrictedPackages(adminId: string, adminType: string) {
  if (!adminId) {
    restrictedPackages.value = [...allPackages.value];
    return;
  }
  packageLoading.value = true;
  try {
    const result = await fetchGameEmailPackagesApi({
      AdminId: adminId,
      AdminType: adminType,
    });
    const list = Array.isArray(result) ? result : [];
    restrictedPackages.value = list.map((item) => ({
      PackageId: item.PackageId ?? item.Id ?? '',
      PackageName: String(item.PackageName || item.PackageId || item.Id || ''),
    }));
  } catch {
    restrictedPackages.value = [];
  } finally {
    packageLoading.value = false;
  }
}

function handleAccountChange(list: AdminAccountOption[]) {
  const adminIds: Array<number | string> = [];
  const adminTypes: Array<number | string> = [];
  for (const item of list) {
    adminIds.push(item.Id);
    if (item.AdminType !== undefined && item.AdminType !== null) {
      adminTypes.push(item.AdminType);
    }
  }
  // 对齐旧站：有选账号时 AdminId 为逗号字符串；未选时为空串
  form.AdminId = adminIds.join(',');
  void loadRestrictedPackages(adminIds.join(','), adminTypes.join(','));
  form.PackageIds = [];
}

/**
 * 对齐旧站 dispose + employ：
 * LoginAccount + PackageName → queryplayerexcel → PlayerId 写入 PlayerList
 */
async function lookupAndAddPlayers() {
  const account = playerQuery.LoginAccount.trim().toLowerCase().replaceAll(/\s/g, '');
  const packageName = playerQuery.PackageName;
  if (!account || !packageName) {
    message.warning('游戏账号和产品名称不能为空');
    return;
  }
  playerLookupLoading.value = true;
  try {
    const result = await queryPlayerByExcelApi({
      LoginAccount: account,
      PackageName: packageName,
    });
    const items = (result?.Items || []) as Array<{
      LoginAccount?: string;
      PackageName?: string;
      PlayerId?: number | string;
    }>;
    const valid = items.filter((item) => Number(item.PlayerId || 0) !== 0);
    if (valid.length === 0) {
      message.error('未匹配到正确的玩家ID');
      return;
    }
    const existingIds = new Set(
      matchedPlayers.value.map((item) => String(item.PlayerId)),
    );
    for (const item of valid) {
      const id = item.PlayerId as number | string;
      if (existingIds.has(String(id))) {
        continue;
      }
      matchedPlayers.value.push({
        LoginAccount: String(item.LoginAccount || account),
        PackageName: String(item.PackageName || packageName),
        PlayerId: id,
      });
      existingIds.add(String(id));
    }
    form.PlayerList = matchedPlayers.value.map((item) => item.PlayerId).join(',');
    playerQuery.LoginAccount = '';
    message.success(`已添加 ${valid.length} 名玩家`);
  } finally {
    playerLookupLoading.value = false;
  }
}

function removeMatchedPlayer(playerId: number | string) {
  matchedPlayers.value = matchedPlayers.value.filter(
    (item) => String(item.PlayerId) !== String(playerId),
  );
  form.PlayerList = matchedPlayers.value.map((item) => item.PlayerId).join(',');
}

async function loadDetail(id: number | string) {
  loading.value = true;
  try {
    const detail = await fetchGameEmailDetailApi(id);
    const lang = parseLangText(detail.LangText);
    form.Id = detail.Id as number | string;
    form.Type = Number(detail.Type ?? 0);
    form.Icon = Number(detail.Icon ?? 0);
    form.IsAll = Number(detail.IsAll ?? 1);
    form.IsPush = Number(detail.IsPush ?? 2);
    form.Title = lang.Title || String(detail.Title || '');
    form.Content = lang.Content || '';
    form.PlayerList = String(detail.PlayerList || '');
    form.PackageIds = parseIdList(detail.PackageIds ?? detail.Packages).map(
      (item) => (Number.isFinite(Number(item)) ? Number(item) : item),
    );
    form.Username = parseIdList(detail.Username).map(String);
    form.AdminId = Array.isArray(detail.AdminId)
      ? detail.AdminId.join(',')
      : String(detail.AdminId || '');
    form.Vip = String(detail.Vip ?? '');
    form.PushTitle = String(detail.PushTitle || '');
    form.PushContent = String(detail.PushContent || '');
    form.OpenType =
      detail.OpenType === '' || detail.OpenType == null
        ? ''
        : Number(detail.OpenType);
    form.Jump = (detail.Jump as number | string) ?? '';
    form.SendTime =
      detail.SendTime && Number(detail.SendTime) > 0
        ? dayjs.unix(Number(detail.SendTime))
        : undefined;

    if (form.IsAll === 2 && form.PlayerList) {
      matchedPlayers.value = form.PlayerList.split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((playerId) => ({
          LoginAccount: '-',
          PackageName: '-',
          PlayerId: playerId,
        }));
    } else {
      matchedPlayers.value = [];
    }

    if (form.AdminId) {
      await loadRestrictedPackages(form.AdminId, '');
    } else {
      restrictedPackages.value = [...allPackages.value];
    }
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
    if (props.rowId) {
      await loadDetail(props.rowId);
    }
  },
);

watch(
  () => form.IsAll,
  (value) => {
    if (value === 1) {
      form.PlayerList = '';
      matchedPlayers.value = [];
      playerQuery.LoginAccount = '';
    } else {
      form.Username = [];
      form.AdminId = '';
      form.Vip = '';
      form.PackageIds = [];
      restrictedPackages.value = [...allPackages.value];
    }
  },
);

function closeModal() {
  emit('update:open', false);
}

/** 对齐旧站 fnGetAllPackages：空包时用 RealPackageIdNameMap 全部 Id */
function resolvePackageIds() {
  if (form.PackageIds.length > 0) {
    return form.PackageIds;
  }
  return allPackages.value
    .map((item) => item.PackageId)
    .filter((id) => id !== '' && id != null);
}

/**
 * 对齐旧站 createData 的 tempData 结构与序列化约定。
 * urlencoded 下数组会变成 "1,2,3"，与旧站一致。
 */
function buildPayload() {
  const payload: Record<string, unknown> = {
    AdminId: form.AdminId || [],
    Event: '',
    EventType: '',
    Icon: form.Icon,
    Id: form.Id || '',
    IsAll: form.IsAll,
    IsPush: form.IsPush,
    Jump: form.Jump || '',
    LangText: JSON.stringify(buildLangTextPayload()),
    OpenType: form.OpenType === '' || form.OpenType == null ? '' : form.OpenType,
    // 对齐旧站：无论 IsAll，空包都补全全部产品包
    PackageIds: resolvePackageIds(),
    PlayerList: form.PlayerList || '',
    PushContent: form.PushContent || '',
    PushTitle: form.PushTitle || '',
    Type: form.Type,
    Username: form.Username || [],
    Vip: form.Vip || '',
  };

  if (form.SendTime) {
    const sendMs = form.SendTime.valueOf();
    if (sendMs <= dayjs().valueOf()) {
      payload.SendNow = true;
    }
    payload.SendTime = String(Math.floor(sendMs / 1000));
  } else {
    payload.SendTime = '';
  }

  if (isEdit.value && form.Id) {
    payload.Id = form.Id;
  } else {
    payload.Hash = createRequestHash();
  }
  return payload;
}

async function handleSubmit() {
  if (isReadonly.value) {
    closeModal();
    return;
  }
  if (!form.Title.trim()) {
    message.warning('请填写邮件标题');
    return;
  }
  if (isRichTextEmpty(form.Content)) {
    message.warning('请填写邮件内容');
    return;
  }
  if (form.IsAll === 1) {
    if (!form.Vip) {
      message.warning('请选择生效 VIP 等级');
      return;
    }
    if (form.Username.length > 0 && restrictedPackages.value.length === 0) {
      message.error('所选代理/推广账号与产品包不匹配');
      return;
    }
  } else if (!form.PlayerList) {
    message.warning('请先查询并添加收件玩家');
    return;
  }
  if (form.IsPush === 1) {
    if (!form.PushTitle.trim()) {
      message.warning('请填写推送标题');
      return;
    }
    if (!form.PushContent.trim()) {
      message.warning('请填写推送内容');
      return;
    }
  }
  if (form.SendTime) {
    const min = dayjs().valueOf() - 3600 * 1000;
    if (form.SendTime.valueOf() < min) {
      message.warning('请设置有效的发送时间');
      return;
    }
  }

  submitting.value = true;
  try {
    const payload = buildPayload();
    if (isEdit.value) {
      await updateGameEmailApi(payload);
      message.success('邮件已更新');
    } else {
      await createGameEmailApi(payload);
      message.success('邮件已创建');
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
    :ok-button-props="
      isReadonly
        ? ({ style: { display: 'none' } } as Record<string, unknown>)
        : undefined
    "
    :open="open"
    :title="modalTitle"
    :width="760"
    cancel-text="关闭"
    destroy-on-close
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form
      :label-col="{ span: 5 }"
      class="mt-2 max-h-[70vh] overflow-y-auto pr-2"
      layout="horizontal"
    >
      <Form.Item label="标题" required>
        <Input
          v-model:value="form.Title"
          :disabled="isReadonly"
          allow-clear
          placeholder="邮件标题"
        />
      </Form.Item>
      <Form.Item label="内容" required>
        <RichTextEditor
          v-model="form.Content"
          :disabled="isReadonly"
          placeholder="请输入邮件内容"
        />
      </Form.Item>

      <Form.Item label="发送方式" required>
        <Radio.Group v-model:value="form.IsAll" :disabled="createLocked">
          <Radio :value="1">全部玩家</Radio>
          <Radio :value="2">指定玩家</Radio>
        </Radio.Group>
      </Form.Item>

      <template v-if="form.IsAll === 1">
        <Form.Item label="代理/推广账号">
          <AccountSelect
            v-model="form.Username"
            :disabled="createLocked"
            return-name
            @change-object="handleAccountChange"
          />
        </Form.Item>
        <Form.Item label="生效游戏包">
          <Select
            v-model:value="form.PackageIds"
            :disabled="createLocked"
            :loading="packageLoading || loading"
            :options="packageSelectOptions"
            allow-clear
            mode="multiple"
            placeholder="不选=全部产品包"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="生效VIP等级" required>
          <Select
            v-model:value="vipSelectValue"
            :disabled="isReadonly"
            :options="vipOptions"
            allow-clear
            mode="multiple"
            placeholder="请选择 VIP 等级"
            style="width: 100%"
          />
        </Form.Item>
      </template>

      <template v-else>
        <Form.Item label="指定玩家" required>
          <Space wrap class="w-full">
            <Input
              v-model:value="playerQuery.LoginAccount"
              :disabled="createLocked"
              allow-clear
              placeholder="游戏账号"
              style="width: 180px"
              @press-enter="lookupAndAddPlayers"
            />
            <Select
              v-model:value="playerQuery.PackageName"
              :disabled="createLocked"
              :options="packageNameOptions"
              placeholder="产品名称"
              style="width: 160px"
            />
            <Button
              :disabled="createLocked"
              :loading="playerLookupLoading"
              type="primary"
              @click="lookupAndAddPlayers"
            >
              查询添加
            </Button>
          </Space>
          <div class="mt-1 text-xs text-gray-400">
            输入游戏账号并选择产品后查询，确认玩家后再提交
          </div>
        </Form.Item>
        <Form.Item v-if="matchedPlayers.length > 0" label="已选玩家">
          <Table
            :columns="[
              { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
              { dataIndex: 'PackageName', key: 'PackageName', title: '产品名称' },
              { dataIndex: 'PlayerId', key: 'PlayerId', title: '玩家ID' },
              { key: 'action', title: '操作', width: 80 },
            ]"
            :data-source="matchedPlayers"
            :pagination="false"
            row-key="PlayerId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button
                  v-if="!createLocked"
                  danger
                  size="small"
                  type="link"
                  @click="removeMatchedPlayer(record.PlayerId)"
                >
                  移除
                </Button>
              </template>
            </template>
          </Table>
        </Form.Item>
      </template>

      <Form.Item label="发送时间">
        <DatePicker
          v-model:value="form.SendTime"
          :disabled="isReadonly"
          :disabled-date="
            (current) => !!current && current < dayjs().startOf('day')
          "
          allow-clear
          show-time
          style="width: 100%"
        />
        <div class="mt-1 text-xs text-gray-400">不设置则不会自动发送</div>
      </Form.Item>

      <Form.Item label="邮件类型" required>
        <Radio.Group v-model:value="form.Type" :disabled="isReadonly">
          <Radio
            v-for="item in typeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="图标标识" required>
        <Radio.Group v-model:value="form.Icon" :disabled="isReadonly">
          <Radio
            v-for="item in iconOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="是否推送" required>
        <Radio.Group v-model:value="form.IsPush" :disabled="isReadonly">
          <Radio :value="1">是</Radio>
          <Radio :value="2">否</Radio>
        </Radio.Group>
      </Form.Item>

      <template v-if="form.IsPush === 1">
        <Form.Item label="推送标题" required>
          <Input
            v-model:value="form.PushTitle"
            :disabled="isReadonly"
            allow-clear
            placeholder="推送标题"
          />
        </Form.Item>
        <Form.Item label="推送内容" required>
          <Input.TextArea
            v-model:value="form.PushContent"
            :disabled="isReadonly"
            :maxlength="200"
            :rows="3"
            allow-clear
            placeholder="推送内容"
            show-count
          />
        </Form.Item>
        <Form.Item label="跳转类型">
          <Select
            v-model:value="form.OpenType"
            :disabled="isReadonly"
            :options="openTypeOptions"
            allow-clear
            placeholder="请选择"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item v-if="form.OpenType === 1" label="跳转地址">
          <Input
            v-model:value="form.Jump"
            :disabled="isReadonly"
            allow-clear
            placeholder="网址"
          />
        </Form.Item>
      </template>
    </Form>
  </Modal>
</template>
