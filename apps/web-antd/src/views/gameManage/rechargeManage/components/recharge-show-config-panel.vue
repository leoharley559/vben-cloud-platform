<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
  Spin,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  addRechargeNamePlayerApi,
  deleteRechargeNamePlayerApi,
  fetchMinFirstRechargeConfigApi,
  fetchRechargeCancelConfigApi,
  fetchRechargeCancelTipConfigApi,
  fetchRechargeFailTipConfigApi,
  fetchRechargeNameConfigApi,
  fetchRechargeNamePlayerListApi,
  updateMinFirstRechargeConfigApi,
  updateRechargeCancelConfigApi,
  updateRechargeFailTipConfigApi,
  updateRechargeNameConfigApi,
} from '#/api/gameManage';
import { queryPlayerByAccountApi } from '#/api/operationManage/player';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';

defineOptions({ name: 'RechargeShowConfigPanel' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canEditBlockage = computed(() => checkPermission(11_139));
const canEditNameConfig = computed(() => checkPermission(11_140));
const canEditFirstDeposit = computed(() => checkPermission(13_115));
const canEditCancel = computed(() => checkPermission(11_613));
const canViewAny = computed(
  () =>
    canEditBlockage.value ||
    canEditNameConfig.value ||
    canEditFirstDeposit.value ||
    canEditCancel.value,
);

type SectionKey = 'blockage' | 'cancel' | 'firstDeposit' | 'name';
const activeSection = ref<SectionKey>('blockage');

const sectionButtons = computed(() =>
  [
    {
      key: 'blockage' as const,
      label: '通道堵塞提示配置',
      visible: canEditBlockage.value,
    },
    {
      key: 'name' as const,
      label: '可充值姓名数量设置',
      visible: canEditNameConfig.value,
    },
    {
      key: 'firstDeposit' as const,
      label: '首存最低限制',
      visible: canEditFirstDeposit.value,
    },
    {
      key: 'cancel' as const,
      label: '充值取消设置',
      visible: canEditCancel.value,
    },
  ].filter((item) => item.visible),
);

const loading = ref(false);
const savingField = ref('');
const snapshot = ref<Record<string, unknown>>({});

const form = reactive({
  AutoSkipTime: undefined as number | undefined,
  DialogSwitch: 0,
  Tips: '',
});

async function loadBlockageConfig() {
  loading.value = true;
  try {
    const data = (await fetchRechargeFailTipConfigApi()) || {};
    snapshot.value = { ...data };
    form.DialogSwitch = Number(data.DialogSwitch ?? 0);
    form.AutoSkipTime =
      data.AutoSkipTime === undefined || data.AutoSkipTime === null
        ? undefined
        : Number(data.AutoSkipTime);
    form.Tips = String(data.Tips ?? '');
  } finally {
    loading.value = false;
  }
}

async function saveField(field: 'AutoSkipTime' | 'DialogSwitch' | 'Tips') {
  if (!canEditBlockage.value) {
    return;
  }
  if (field === 'AutoSkipTime' && (form.AutoSkipTime === undefined || form.AutoSkipTime < 0)) {
      message.warning('请输入有效的自动跳转时间');
      return;
    }
  savingField.value = field;
  try {
    const payload = {
      ...snapshot.value,
      [field]:
        field === 'DialogSwitch'
          ? Number(form.DialogSwitch)
          : (field === 'AutoSkipTime'
            ? Number(form.AutoSkipTime)
            : form.Tips),
    };
    await updateRechargeFailTipConfigApi(payload);
    snapshot.value = { ...payload };
    message.success('已保存');
  } finally {
    savingField.value = '';
  }
}

const nameNum = ref<number | undefined>();
const nameSaving = ref(false);

async function loadNameConfig() {
  const data = await fetchRechargeNameConfigApi();
  try {
    const parsed = JSON.parse(String(data?.RechargeNameConfig || '{}')) as {
      RechargeNameNum?: number;
    };
    nameNum.value =
      parsed.RechargeNameNum === undefined
        ? undefined
        : Number(parsed.RechargeNameNum);
  } catch {
    nameNum.value = undefined;
  }
}

async function saveNameConfig() {
  if (nameNum.value === undefined || nameNum.value < 0) {
    message.warning('请输入有效的姓名数量');
    return;
  }
  Modal.confirm({
    content: '确认保存可充值姓名数量设置？',
    title: '提示',
    onOk: async () => {
      nameSaving.value = true;
      try {
        await updateRechargeNameConfigApi({
          RechargeNameNum: Number(nameNum.value),
        });
        message.success('已保存');
        await loadNameConfig();
      } finally {
        nameSaving.value = false;
      }
    },
  });
}

const specialModalOpen = ref(false);
const specialLoading = ref(false);
const specialFilter = ref('');
const specialRows = ref<Record<string, unknown>[]>([]);
const specialColumns = [
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品' },
  { dataIndex: 'RechargeNum', key: 'RechargeNum', title: '可充值姓名数' },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function loadSpecialPlayers() {
  specialLoading.value = true;
  try {
    const result = await fetchRechargeNamePlayerListApi({
      LoginAccount: specialFilter.value,
      Page: 1,
      PageSize: 100,
    });
    specialRows.value = result.Items || [];
  } finally {
    specialLoading.value = false;
  }
}

function openSpecialModal() {
  specialFilter.value = '';
  specialModalOpen.value = true;
  void loadSpecialPlayers();
}

const addModalOpen = ref(false);
const addSubmitting = ref(false);
const addForm = reactive({
  LoginAccount: '',
  PackageId: undefined as number | string | undefined,
  PlayerId: '' as number | string,
  RechargeNum: undefined as number | undefined,
});
const playerResolved = ref(false);

const addPackageOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '' && item.PackageId != null)
    .map((item) => ({
      label: String(item.PackageName || item.PackageId),
      value: item.PackageId as number | string,
    })),
);

async function resolvePlayer() {
  playerResolved.value = false;
  addForm.PlayerId = '';
  if (!addForm.LoginAccount.trim() || !addForm.PackageId) {
    return;
  }
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: addForm.LoginAccount.trim(),
      PackageId: addForm.PackageId,
    });
    const player = result.Items?.[0];
    if (player?.PlayerId) {
      addForm.PlayerId = player.PlayerId;
      playerResolved.value = true;
    } else {
      message.warning('账号不存在');
    }
  } catch {
    // interceptor tips
  }
}

function openAddModal() {
  addForm.LoginAccount = '';
  addForm.PackageId = addPackageOptions.value[0]?.value;
  addForm.PlayerId = '';
  addForm.RechargeNum = undefined;
  playerResolved.value = false;
  addModalOpen.value = true;
}

async function submitAddModal() {
  if (!addForm.LoginAccount.trim()) {
    message.warning('请输入游戏账号');
    return;
  }
  if (!addForm.PackageId) {
    message.warning('请选择产品包');
    return;
  }
  if (!addForm.PlayerId) {
    await resolvePlayer();
  }
  if (!addForm.PlayerId) {
    message.warning('账号不存在');
    return;
  }
  if (addForm.RechargeNum === undefined || addForm.RechargeNum < 0) {
    message.warning('请输入可充值姓名数量');
    return;
  }
  addSubmitting.value = true;
  try {
    await addRechargeNamePlayerApi({
      LoginAccount: addForm.LoginAccount.trim(),
      PackageId: addForm.PackageId,
      PlayerId: addForm.PlayerId,
      RechargeNum: Number(addForm.RechargeNum),
    });
    message.success('添加成功');
    addModalOpen.value = false;
    await loadSpecialPlayers();
  } finally {
    addSubmitting.value = false;
  }
}

function handleDeletePlayer(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除玩家「${row.LoginAccount || ''}」的特殊设置？`,
    okType: 'danger',
    title: '删除',
    onOk: async () => {
      await deleteRechargeNamePlayerApi(String(row.Id));
      message.success('已删除');
      await loadSpecialPlayers();
    },
  });
}

const firstDepositAmt = ref<number | undefined>();
const firstDepositSaving = ref(false);

async function loadFirstDeposit() {
  const data = await fetchMinFirstRechargeConfigApi();
  const cents = Number(data?.MinFirstRechargeConfig || 0);
  firstDepositAmt.value = cents / 100;
}

async function saveFirstDeposit() {
  if (firstDepositAmt.value === undefined || firstDepositAmt.value < 0) {
    message.warning('请输入有效的首存最低金额');
    return;
  }
  firstDepositSaving.value = true;
  try {
    await updateMinFirstRechargeConfigApi({
      MinFirstRechargeConfig: Math.round(firstDepositAmt.value * 100),
    });
    message.success('已保存');
    await loadFirstDeposit();
  } finally {
    firstDepositSaving.value = false;
  }
}

const cancelForm = reactive({
  CancelReasonSwitch: 2,
  MaxCancelPerDay: undefined as number | undefined,
});
const oriMaxCancelPerDay = ref(0);
const cancelReasons = ref<Record<string, unknown>[]>([]);
const cancelSaving = ref(false);
const cancelSwitchSaving = ref(false);
const cancelReasonColumns = [
  { dataIndex: 'CancelReason', key: 'CancelReason', title: '取消原因' },
];

async function loadCancelConfig() {
  const [tipConfig, switchConfig] = await Promise.all([
    fetchRechargeCancelTipConfigApi(),
    fetchRechargeCancelConfigApi(),
  ]);
  const reasons = tipConfig?.Item || tipConfig?.Items || [];
  cancelReasons.value = Array.isArray(reasons) ? reasons : [];
  const maxFromTip = Number(tipConfig?.MaxCancelPerDay ?? 0);
  const maxFromSwitch = Number(switchConfig?.MaxCancelPerDay ?? maxFromTip);
  cancelForm.MaxCancelPerDay = maxFromSwitch;
  oriMaxCancelPerDay.value = maxFromSwitch;
  cancelForm.CancelReasonSwitch = Number(switchConfig?.CancelReasonSwitch ?? 2);
}

async function saveCancelMax() {
  if (
    cancelForm.MaxCancelPerDay === undefined ||
    cancelForm.MaxCancelPerDay < 0
  ) {
    message.warning('请输入有效的可取消次数');
    return;
  }
  Modal.confirm({
    content: '确认保存玩家可取消次数？',
    title: '提示',
    onOk: async () => {
      cancelSaving.value = true;
      try {
        await updateRechargeCancelConfigApi({
          CancelReasonSwitch: Number(cancelForm.CancelReasonSwitch),
          MaxCancelPerDay: Number(cancelForm.MaxCancelPerDay),
        });
        oriMaxCancelPerDay.value = Number(cancelForm.MaxCancelPerDay);
        message.success('已保存');
      } finally {
        cancelSaving.value = false;
      }
    },
  });
}

async function saveCancelSwitch(checked: boolean) {
  cancelForm.CancelReasonSwitch = checked ? 1 : 2;
  cancelSwitchSaving.value = true;
  try {
    await updateRechargeCancelConfigApi({
      CancelReasonSwitch: cancelForm.CancelReasonSwitch,
      MaxCancelPerDay: oriMaxCancelPerDay.value,
    });
    message.success('已保存');
  } finally {
    cancelSwitchSaving.value = false;
  }
}

function switchSection(key: SectionKey) {
  activeSection.value = key;
  if (key === 'blockage' && canEditBlockage.value) {
    void loadBlockageConfig();
  }
  if (key === 'name' && canEditNameConfig.value) {
    void loadNameConfig();
  }
  if (key === 'firstDeposit' && canEditFirstDeposit.value) {
    void loadFirstDeposit();
  }
  if (key === 'cancel' && canEditCancel.value) {
    void loadCancelConfig();
  }
}

onMounted(() => {
  const first = sectionButtons.value[0]?.key;
  if (first) {
    switchSection(first);
  }
});
</script>

<template>
  <div v-if="canViewAny">
    <div class="mb-4 flex flex-wrap gap-2">
      <Button
        v-for="item in sectionButtons"
        :key="item.key"
        :type="activeSection === item.key ? 'primary' : 'default'"
        @click="switchSection(item.key)"
      >
        {{ item.label }}
      </Button>
    </div>

    <Spin v-if="activeSection === 'blockage'" :spinning="loading">
      <Card size="small" title="通道堵塞提示配置">
        <Form class="max-w-3xl" layout="vertical">
          <Form.Item label="弹窗开关">
            <Switch
              :checked="form.DialogSwitch === 1"
              :loading="savingField === 'DialogSwitch'"
              checked-children="开"
              un-checked-children="关"
              @update:checked="
                (checked) => {
                  form.DialogSwitch = checked ? 1 : 0;
                  void saveField('DialogSwitch');
                }
              "
            />
          </Form.Item>
          <Form.Item label="自动跳转时间（秒）">
            <Space>
              <InputNumber
                v-model:value="form.AutoSkipTime"
                :min="0"
                placeholder="请输入秒数"
                style="width: 180px"
              />
              <Button
                :loading="savingField === 'AutoSkipTime'"
                type="primary"
                @click="saveField('AutoSkipTime')"
              >
                保存
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="提示文案">
            <Input.TextArea
              v-model:value="form.Tips"
              :rows="4"
              allow-clear
              placeholder="请输入提示文案"
            />
            <div class="mt-2">
              <Button
                :loading="savingField === 'Tips'"
                type="primary"
                @click="saveField('Tips')"
              >
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </Spin>

    <Card
      v-else-if="activeSection === 'name'"
      size="small"
      title="可充值姓名数量设置"
    >
      <Form class="max-w-xl" layout="vertical">
        <Form.Item label="玩家额外充值姓名数量">
          <Space>
            <InputNumber
              v-model:value="nameNum"
              :min="0"
              placeholder="请输入数量"
              style="width: 180px"
            />
            <Button
              :loading="nameSaving"
              type="primary"
              @click="saveNameConfig"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
        <Form.Item>
          <Button @click="openSpecialModal">特殊玩家数量设置</Button>
        </Form.Item>
      </Form>
    </Card>

    <Card
      v-else-if="activeSection === 'firstDeposit'"
      size="small"
      title="首存最低限制"
    >
      <Form class="max-w-xl" layout="vertical">
        <Form.Item label="玩家首存金额最低限制（元）">
          <Space>
            <InputNumber
              v-model:value="firstDepositAmt"
              :min="0"
              :precision="2"
              placeholder="请输入金额"
              style="width: 180px"
            />
            <Button
              :loading="firstDepositSaving"
              type="primary"
              @click="saveFirstDeposit"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

    <Card
      v-else-if="activeSection === 'cancel'"
      size="small"
      title="充值取消设置"
    >
      <Form class="max-w-2xl" layout="vertical">
        <Form.Item label="玩家可取消次数">
          <Space>
            <InputNumber
              v-model:value="cancelForm.MaxCancelPerDay"
              :min="0"
              placeholder="请输入次数"
              style="width: 180px"
            />
            <Button
              :loading="cancelSaving"
              type="primary"
              @click="saveCancelMax"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
        <Form.Item label="取消原因（只读）">
          <Table
            :columns="cancelReasonColumns"
            :data-source="cancelReasons"
            :pagination="false"
            :row-key="(record) => String(record.Id ?? record.CancelReason)"
            size="small"
          />
        </Form.Item>
        <Form.Item label="取消原因开关">
          <Switch
            :checked="cancelForm.CancelReasonSwitch === 1"
            :loading="cancelSwitchSaving"
            checked-children="开"
            un-checked-children="关"
            @update:checked="(checked) => void saveCancelSwitch(!!checked)"
          />
        </Form.Item>
      </Form>
    </Card>

    <Modal
      v-model:open="specialModalOpen"
      :footer="null"
      title="特殊玩家数量设置"
      width="800px"
    >
      <div class="mb-3 flex flex-wrap gap-2">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="specialFilter"
            allow-clear
            style="width: 230px"
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <Button type="primary" @click="loadSpecialPlayers">查询</Button>
        <Button type="primary" @click="openAddModal">添加玩家</Button>
      </div>
      <Table
        :columns="specialColumns"
        :data-source="specialRows"
        :loading="specialLoading"
        :pagination="false"
        row-key="Id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <PlayerAccountLink
            v-if="column.key === 'LoginAccount'"
            :login-account="String(record.LoginAccount || '')"
            :player-id="record.PlayerId as number | string | undefined"
          />
          <template v-else-if="column.key === 'actions'">
            <Button
              danger
              size="small"
              type="link"
              @click="handleDeletePlayer(record as Record<string, unknown>)"
            >
              删除
            </Button>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="addModalOpen"
      :confirm-loading="addSubmitting"
      title="添加特殊玩家"
      @ok="submitAddModal"
    >
      <Form layout="vertical">
        <Form.Item label="游戏账号" required>
          <Input
            v-model:value="addForm.LoginAccount"
            placeholder="请输入游戏账号"
            @blur="resolvePlayer"
          />
        </Form.Item>
        <Form.Item label="产品包" required>
          <Select
            v-model:value="addForm.PackageId"
            :options="addPackageOptions"
            placeholder="请选择产品包"
            style="width: 100%"
            @change="resolvePlayer"
          />
        </Form.Item>
        <Form.Item label="可充值姓名数量" required>
          <InputNumber
            v-model:value="addForm.RechargeNum"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <p v-if="playerResolved" class="text-xs text-green-600">
          已识别玩家 ID：{{ addForm.PlayerId }}
        </p>
      </Form>
    </Modal>
  </div>
  <Result
    v-else
    status="403"
    sub-title="无通用规则相关权限；其余子集待下一迭代"
    title="403"
  />
</template>
