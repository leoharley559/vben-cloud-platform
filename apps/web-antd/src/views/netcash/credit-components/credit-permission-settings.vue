<script lang="ts" setup>
import type { CreditPanelConfig } from './credit-data-panel.vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  addAgentRestrictionApi,
  getAgentPermissionsApi,
  getAgentRestrictionListApi,
  removeAgentRestrictionApi,
  updateAgentPermissionsApi,
} from '#/api/netcash/credit-limit';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import CreditDataPanel from './credit-data-panel.vue';

const { checkPermission } = useCloudPermission();
const canEdit = computed(() => checkPermission(11_785));
const canAdd = computed(() => checkPermission(11_787));
const canRemove = computed(() => checkPermission(11_788));
const canExport = computed(() => checkPermission(11_789));

const activeTab = ref('1');
const panelRefs = ref<Array<InstanceType<typeof CreditDataPanel>>>([]);
const settingsLoading = ref(false);
const settings = reactive<Record<number, Record<string, unknown>[]>>({
  1: [],
  2: [],
  3: [],
});

const accountTypeMap: Record<number, string> = {
  0: '无',
  1: '普通代理',
  2: '官方代理',
  3: '测试代理',
};

const permissionTabs = [
  {
    key: '1',
    label: '代理代存菜单',
    note: '按代理类型开启代存菜单，并可限制指定代理账号。',
  },
  {
    key: '2',
    label: '提款流水倍数',
    note: '按代理类型开启提款流水规则，并设置全局流水倍数。',
  },
  {
    key: '3',
    label: '代存限额',
    note: '按代理类型设置单笔与每日代存额度，并可覆盖指定代理账号。',
  },
];

function panelFor(type: number) {
  return panelRefs.value[type - 1];
}

async function loadSettings(type: number) {
  settingsLoading.value = true;
  try {
    const result = await getAgentPermissionsApi({
      LimitType: type,
      Page: 1,
      PageSize: 100,
    });
    settings[type] = (result.Items || []).map((item) => ({
      ...item,
      ...(type === 3
        ? {
            DailyDepositAmount: Number(item.DailyDepositAmount || 0) / 100,
            MaxDepositAmount: Number(item.MaxDepositAmount || 0) / 100,
            MinDepositAmount: Number(item.MinDepositAmount || 0) / 100,
          }
        : {}),
    }));
  } finally {
    settingsLoading.value = false;
  }
}

function firstSetting(type: number) {
  return settings[type]?.[0] || {};
}

async function updateToggle(
  type: number,
  target: 'normal' | 'official',
  value: boolean,
) {
  await updateAgentPermissionsApi({
    Hash: createRequestHash(),
    IsActive: value ? 1 : 0,
    LimitType: type,
    Type: target,
  });
  message.success('设置成功');
  await loadSettings(type);
}

async function updateWater() {
  const value = Number(firstSetting(2).WithdrawWaterMultiply || 1);
  if (!Number.isInteger(value) || value < 1) {
    message.warning('流水倍数必须为大于 0 的整数');
    return;
  }
  await updateAgentPermissionsApi({
    Hash: createRequestHash(),
    LimitType: 2,
    Type: 'water',
    WithdrawWaterMultiply: value,
  });
  message.success('设置成功');
  await loadSettings(2);
}

async function updateDepositRow(row: Record<string, unknown>) {
  const min = Number(row.MinDepositAmount || 0);
  const max = Number(row.MaxDepositAmount || 0);
  const daily = Number(row.DailyDepositAmount || 0);
  if (min > max) {
    message.warning('最小代存金额不能大于最大代存金额');
    return;
  }
  await updateAgentPermissionsApi({
    AccountType: row.AccountType,
    DailyDepositAmount: Math.round(daily * 100),
    Hash: createRequestHash(),
    IsActive: Number(row.Status || 0),
    LimitType: 3,
    MaxDepositAmount: Math.round(max * 100),
    MinDepositAmount: Math.round(min * 100),
    Type: 'deposit',
  });
  message.success('设置成功');
  await loadSettings(3);
}

function restrictionConfig(type: number): CreditPanelConfig {
  return {
    actionWidth: 100,
    baseQuery: { LimitType: type },
    checkbox: canRemove.value,
    columns: [
      { field: 'AgentAccount', title: '代理账号' },
      {
        field: 'AccountType',
        formatter: (value) => accountTypeMap[Number(value)] || '-',
        title: '代理类型',
      },
      ...(type === 3
        ? [
            {
              field: 'MinDepositAmount',
              formatter: (_value: unknown, row: Record<string, unknown>) =>
                `${formatAmountFromCent(Number(row.MinDepositAmount))} ~ ${formatAmountFromCent(Number(row.MaxDepositAmount))}`,
              title: '单笔代存范围',
            },
            {
              field: 'DailyDepositAmount',
              formatter: (value: unknown) =>
                formatAmountFromCent(Number(value)),
              title: '每日代存额度',
            },
          ]
        : []),
      {
        field: 'CreateTime',
        formatter: (value) => formatNetcashDateTime(value as string),
        title: '添加时间',
      },
      { field: 'CreateAccount', title: '添加人' },
    ],
    exportFileName: canExport.value
      ? `${permissionTabs[type - 1]?.label}账号限制`
      : undefined,
    fetchApi: (query) => getAgentRestrictionListApi(query as never),
    filters: [
      { field: 'AgentAccount', label: '代理账号' },
      {
        field: 'AccountType',
        label: '代理类型',
        options: [
          { label: '全部', value: '' },
          { label: '普通代理', value: 1 },
          { label: '官方代理', value: 2 },
          { label: '测试代理', value: 3 },
        ],
        type: 'select',
      },
      {
        fields: ['BeginCreateTime', 'EndCreateTime'],
        label: '添加时间',
        type: 'dateRange',
      },
    ],
    showActions: canRemove.value,
  };
}

const addOpen = ref(false);
const addSubmitting = ref(false);
const addForm = reactive({
  AgentAccounts: '',
  DailyDepositAmount: undefined as number | undefined,
  LimitType: 1,
  MaxDepositAmount: undefined as number | undefined,
  MinDepositAmount: undefined as number | undefined,
});

function openAdd(type: number) {
  Object.assign(addForm, {
    AgentAccounts: '',
    DailyDepositAmount: undefined,
    LimitType: type,
    MaxDepositAmount: undefined,
    MinDepositAmount: undefined,
  });
  addOpen.value = true;
}

function validAccounts(value: string) {
  return Boolean(value.trim()) && /^[\w,，\s]+$/.test(value);
}

async function submitAdd() {
  if (!validAccounts(addForm.AgentAccounts)) {
    message.warning('请输入以逗号分隔的代理账号');
    return;
  }
  if (
    addForm.LimitType === 3 &&
    Number(addForm.MinDepositAmount || 0) >
      Number(addForm.MaxDepositAmount || 0)
  ) {
    message.warning('最小代存金额不能大于最大代存金额');
    return;
  }
  addSubmitting.value = true;
  try {
    await addAgentRestrictionApi({
      AgentAccounts: addForm.AgentAccounts.replaceAll('，', ',')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .join(','),
      ...(addForm.LimitType === 3
        ? {
            DailyDepositAmount: Math.round(
              Number(addForm.DailyDepositAmount || 0) * 100,
            ),
            MaxDepositAmount: Math.round(
              Number(addForm.MaxDepositAmount || 0) * 100,
            ),
            MinDepositAmount: Math.round(
              Number(addForm.MinDepositAmount || 0) * 100,
            ),
          }
        : {}),
      Hash: createRequestHash(),
      LimitType: addForm.LimitType,
    });
    message.success('添加成功');
    addOpen.value = false;
    panelFor(addForm.LimitType)?.reload();
  } finally {
    addSubmitting.value = false;
  }
}

async function removeRows(type: number, rows: Record<string, unknown>[]) {
  const ids = rows
    .map((row) => row.Id)
    .filter(Boolean)
    .join(',');
  if (!ids) return;
  await removeAgentRestrictionApi({
    Hash: createRequestHash(),
    Ids: ids,
    LimitType: type,
  });
  message.success('移除成功');
  panelFor(type)?.reload();
}

function batchRemove(type: number) {
  return removeRows(type, panelFor(type)?.getSelectedRows() || []);
}

onMounted(() => {
  void Promise.all([loadSettings(1), loadSettings(2), loadSettings(3)]);
});
</script>

<template>
  <Tabs v-model:active-key="activeTab" type="line" size="small">
    <Tabs.TabPane v-for="tab in permissionTabs" :key="tab.key" :tab="tab.label">
      <Card :loading="settingsLoading" size="small">
        <p class="mb-4 text-sm text-gray-500">{{ tab.note }}</p>

        <template v-if="tab.key !== '3'">
          <Space size="large" wrap>
            <span>
              官方代理：
              <Switch
                :checked="
                  Number(firstSetting(Number(tab.key)).ActiveOfficial) === 1
                "
                :disabled="!canEdit"
                @change="
                  (value) =>
                    updateToggle(Number(tab.key), 'official', Boolean(value))
                "
              />
            </span>
            <span>
              普通代理：
              <Switch
                :checked="
                  Number(firstSetting(Number(tab.key)).ActiveNormal) === 1
                "
                :disabled="!canEdit"
                @change="
                  (value) =>
                    updateToggle(Number(tab.key), 'normal', Boolean(value))
                "
              />
            </span>
            <Space v-if="tab.key === '2'">
              <span>提款流水倍数：</span>
              <InputNumber
                :value="Number(firstSetting(2).WithdrawWaterMultiply || 1)"
                :disabled="!canEdit"
                :min="1"
                :precision="0"
                @change="
                  (value) => (firstSetting(2).WithdrawWaterMultiply = value)
                "
              />
              <Button v-if="canEdit" type="primary" @click="updateWater">
保存
</Button>
            </Space>
          </Space>
        </template>

        <Table
          v-else
          :columns="[
            { dataIndex: 'AccountType', key: 'AccountType', title: '代理类型' },
            { key: 'range', title: '单笔代存范围（元）' },
            { key: 'daily', title: '每日代存额度（元）' },
            { key: 'status', title: '状态' },
            {
              dataIndex: 'UpdateAccount',
              key: 'UpdateAccount',
              title: '操作人',
            },
            { key: 'UpdateTime', title: '操作时间' },
            { key: 'actions', title: '操作' },
          ]"
          :data-source="settings[3]"
          :pagination="false"
          row-key="AccountType"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'AccountType'">
              {{ accountTypeMap[Number(record.AccountType)] || '-' }}
            </template>
            <template v-else-if="column.key === 'range'">
              <Space>
                <InputNumber
                  v-model:value="record.MinDepositAmount"
                  :disabled="!record.editing"
                  :min="0"
                  :precision="2"
                />
                <span>~</span>
                <InputNumber
                  v-model:value="record.MaxDepositAmount"
                  :disabled="!record.editing"
                  :min="0"
                  :precision="2"
                />
              </Space>
            </template>
            <template v-else-if="column.key === 'daily'">
              <InputNumber
                v-model:value="record.DailyDepositAmount"
                :disabled="!record.editing"
                :min="0"
                :precision="2"
              />
            </template>
            <template v-else-if="column.key === 'status'">
              <Switch
                v-model:checked="record.Status"
                :checked-value="1"
                :disabled="!record.editing"
                :un-checked-value="0"
              />
            </template>
            <template v-else-if="column.key === 'UpdateTime'">
              {{ formatNetcashDateTime(record.UpdateTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space v-if="canEdit">
                <Button
                  v-if="!record.editing"
                  size="small"
                  type="link"
                  @click="
                    () => {
                      record.editing = true;
                    }
                  "
                >
                  编辑
                </Button>
                <Button
                  v-else
                  size="small"
                  type="link"
                  @click="updateDepositRow(record)"
                >
                  保存
                </Button>
              </Space>
              <Tag v-else>只读</Tag>
            </template>
          </template>
        </Table>
      </Card>

      <Card class="mt-4" size="small" title="按代理账号限制">
        <CreditDataPanel
          :ref="(el) => el && (panelRefs[Number(tab.key) - 1] = el as never)"
          :config="restrictionConfig(Number(tab.key))"
        >
          <template #toolbar>
            <Button
              v-if="canAdd"
              type="primary"
              @click="openAdd(Number(tab.key))"
            >
              添加
            </Button>
            <Popconfirm
              v-if="canRemove"
              title="确认批量移除选中的代理限制？"
              @confirm="batchRemove(Number(tab.key))"
            >
              <Button danger>批量移除</Button>
            </Popconfirm>
          </template>
          <template #actions="{ row }">
            <Popconfirm
              v-if="canRemove"
              title="确认移除此代理限制？"
              @confirm="removeRows(Number(tab.key), [row])"
            >
              <Button danger size="small" type="link">移除</Button>
            </Popconfirm>
          </template>
        </CreditDataPanel>
      </Card>
    </Tabs.TabPane>
  </Tabs>

  <Modal
    v-model:open="addOpen"
    :confirm-loading="addSubmitting"
    title="添加代理账号限制"
    @ok="submitAdd"
  >
    <Form layout="vertical">
      <Form.Item label="代理账号（多个用逗号分隔）" required>
        <Input.TextArea v-model:value="addForm.AgentAccounts" :rows="4" />
      </Form.Item>
      <template v-if="addForm.LimitType === 3">
        <Form.Item label="最小单笔代存金额（元）" required>
          <InputNumber
            v-model:value="addForm.MinDepositAmount"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="最大单笔代存金额（元）" required>
          <InputNumber
            v-model:value="addForm.MaxDepositAmount"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="每日代存额度（元）" required>
          <InputNumber
            v-model:value="addForm.DailyDepositAmount"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
      </template>
    </Form>
  </Modal>
</template>
