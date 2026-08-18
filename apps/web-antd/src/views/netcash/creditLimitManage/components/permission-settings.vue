<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';

import {
  addAgentRestrictionApi,
  getAgentPermissionsApi,
  getAgentRestrictionListApi,
  removeAgentRestrictionApi,
  updateAgentPermissionsApi,
} from '#/api/netcash/credit-limit';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

import {
  accountTypeMap,
  accountTypeOptions,
  amount,
  date,
  type DateRange,
  exportRows,
  rangeParams,
  type Row,
} from './shared';

const { checkPermission } = useCloudPermission();
const canEdit = computed(() => checkPermission(11_785));
const canAdd = computed(() => checkPermission(11_787));
const canRemove = computed(() => checkPermission(11_788));
const canExport = computed(() => checkPermission(11_789));
const activeTab = ref('1');
const activeType = computed(() => Number(activeTab.value));
const loading = ref(false);
const exporting = ref(false);
const settings = reactive<Record<number, Row[]>>({ 1: [], 2: [], 3: [] });
const rows = ref<Row[]>([]);
const total = ref(0);
const selectedKeys = ref<Array<number | string>>([]);
const createRange = ref<DateRange>();
const query = reactive({
  AccountType: '',
  AgentAccount: '',
  Page: 1,
  PageSize: 20,
});
const tabs = [
  { key: '1', label: '存款菜单', note: '按代理类型开启代理代存菜单，并可排除指定代理账号。' },
  { key: '2', label: '提款亏损', note: '按代理类型开启提款流水规则，并设置提款流水倍数。' },
  { key: '3', label: '信用额度', note: '按代理类型设置单笔及每日代存额度，并可覆盖指定代理账号。' },
];
const restrictionColumns = computed(() => [
  { key: 'seq', title: '序号', width: 70 },
  { dataIndex: 'AgentAccount', key: 'AgentAccount', title: '代理账号' },
  { dataIndex: 'AccountType', key: 'AccountType', title: '代理类型' },
  ...(activeType.value === 3
    ? [
        { key: 'range', title: '单笔代存范围（元）' },
        { dataIndex: 'DailyDepositAmount', key: 'DailyDepositAmount', title: '每日代存额度（元）' },
      ]
    : []),
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '添加时间', width: 180 },
  { dataIndex: 'CreateAccount', key: 'CreateAccount', title: '添加人' },
  { key: 'actions', title: '操作', width: 100 },
]);
const depositColumns = [
  { dataIndex: 'AccountType', key: 'AccountType', title: '代理类型' },
  { key: 'range', title: '单笔代存范围（元）' },
  { dataIndex: 'DailyDepositAmount', key: 'DailyDepositAmount', title: '每日代存额度（元）' },
  { dataIndex: 'Status', key: 'Status', title: '状态' },
  { dataIndex: 'UpdateAccount', key: 'UpdateAccount', title: '操作人' },
  { dataIndex: 'UpdateTime', key: 'UpdateTime', title: '操作时间' },
  { key: 'actions', title: '操作', width: 150 },
];

function firstSetting(type: number) {
  return settings[type]?.[0] || {};
}

async function loadSettings(type = activeType.value) {
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
            editing: false,
          }
        : {}),
    }));
  } catch {
    settings[type] = [];
  }
}

function buildQuery(page = query.Page, pageSize = query.PageSize) {
  return {
    AccountType: query.AccountType,
    AgentAccount: query.AgentAccount,
    LimitType: activeType.value,
    Page: page,
    PageSize: pageSize,
    ...rangeParams(createRange.value, 'BeginCreateTime', 'EndCreateTime'),
  };
}

async function loadRestrictions() {
  loading.value = true;
  try {
    const result = await getAgentRestrictionListApi(buildQuery());
    rows.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || 0);
    selectedKeys.value = [];
  } catch {
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadTab() {
  loading.value = true;
  try {
    await Promise.all([loadSettings(), loadRestrictions()]);
  } finally {
    loading.value = false;
  }
}

function search() {
  query.Page = 1;
  void loadRestrictions();
}

function reset() {
  Object.assign(query, { AccountType: '', AgentAccount: '', Page: 1 });
  createRange.value = undefined;
  void loadRestrictions();
}

async function updateToggle(target: 'normal' | 'official', value: boolean) {
  try {
    await updateAgentPermissionsApi({
      Hash: createRequestHash(),
      IsActive: value ? 1 : 0,
      LimitType: activeType.value,
      Type: target,
    });
    message.success('设置成功');
    await loadSettings();
  } catch {
    message.error('设置失败');
    await loadSettings();
  }
}

async function updateWater() {
  const value = Number(firstSetting(2).WithdrawWaterMultiply || 1);
  if (!Number.isInteger(value) || value < 1) {
    message.warning('提款流水倍数必须为大于 0 的整数');
    return;
  }
  try {
    await updateAgentPermissionsApi({
      Hash: createRequestHash(),
      LimitType: 2,
      Type: 'water',
      WithdrawWaterMultiply: value,
    });
    message.success('设置成功');
    await loadSettings(2);
  } catch {
    message.error('设置失败');
    await loadSettings(2);
  }
}

function beginDepositEdit(row: Row) {
  row.backup = {
    DailyDepositAmount: row.DailyDepositAmount,
    MaxDepositAmount: row.MaxDepositAmount,
    MinDepositAmount: row.MinDepositAmount,
    Status: row.Status,
  };
  row.editing = true;
}

function cancelDepositEdit(row: Row) {
  Object.assign(row, row.backup || {}, { backup: undefined, editing: false });
}

async function saveDeposit(row: Row) {
  const min = Number(row.MinDepositAmount || 0);
  const max = Number(row.MaxDepositAmount || 0);
  const daily = Number(row.DailyDepositAmount || 0);
  if (min > max || min < 0 || daily < 0) {
    message.warning('请检查单笔代存范围与每日代存额度');
    return;
  }
  try {
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
    message.success('保存成功');
    await loadSettings(3);
  } catch {
    message.error('保存失败');
    await loadSettings(3);
  }
}

const addOpen = ref(false);
const addSubmitting = ref(false);
const addForm = reactive({
  AgentAccounts: '',
  DailyDepositAmount: undefined as number | undefined,
  MaxDepositAmount: undefined as number | undefined,
  MinDepositAmount: undefined as number | undefined,
});

function openAdd() {
  Object.assign(addForm, {
    AgentAccounts: '',
    DailyDepositAmount: undefined,
    MaxDepositAmount: undefined,
    MinDepositAmount: undefined,
  });
  addOpen.value = true;
}

async function submitAdd() {
  const accounts = addForm.AgentAccounts.replaceAll('，', ',').replaceAll(' ', '');
  if (!accounts || !/^[\w,]+$/.test(accounts)) {
    message.warning('请输入以英文逗号分隔的代理账号');
    return;
  }
  const min = Number(addForm.MinDepositAmount || 0);
  const max = Number(addForm.MaxDepositAmount || 0);
  const daily = Number(addForm.DailyDepositAmount || 0);
  if (activeType.value === 3 && (min > max || min < 0 || daily < 0)) {
    message.warning('请检查单笔代存范围与每日代存额度');
    return;
  }
  addSubmitting.value = true;
  try {
    await addAgentRestrictionApi({
      AgentAccounts: accounts,
      ...(activeType.value === 3
        ? {
            DailyDepositAmount: Math.round(daily * 100),
            MaxDepositAmount: Math.round(max * 100),
            MinDepositAmount: Math.round(min * 100),
          }
        : {}),
      Hash: createRequestHash(),
      LimitType: activeType.value,
    });
    message.success('添加成功');
    addOpen.value = false;
    await loadRestrictions();
  } catch {
    message.error('添加失败');
  } finally {
    addSubmitting.value = false;
  }
}

async function removeRows(ids: Array<number | string>) {
  if (ids.length === 0) return;
  try {
    await removeAgentRestrictionApi({
      Hash: createRequestHash(),
      Ids: ids.join(','),
      LimitType: activeType.value,
    });
    message.success('移除成功');
    await loadRestrictions();
  } catch {
    message.error('移除失败');
    await loadRestrictions();
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const result = await getAgentRestrictionListApi({
      ...buildQuery(1, Math.max(total.value + 1, 1000)),
      IsExp: true,
    });
    const exportColumns = [
      { field: 'AgentAccount', title: '代理账号' },
      { field: 'AccountType', formatter: (value: unknown) => accountTypeMap[Number(value)] || '-', title: '代理类型' },
      ...(activeType.value === 3
        ? [
            { field: 'MinDepositAmount', formatter: (_value: unknown, row: Row) => `${amount(row.MinDepositAmount)} ~ ${amount(row.MaxDepositAmount)}`, title: '单笔代存范围（元）' },
            { field: 'DailyDepositAmount', formatter: amount, title: '每日代存额度（元）' },
          ]
        : []),
      { field: 'CreateAccount', title: '添加人' },
      { field: 'CreateTime', formatter: date, title: '添加时间' },
    ];
    if (!(await exportRows(`${tabs[activeType.value - 1]?.label}代理限制`, exportColumns, result.Items || []))) {
      message.info('暂无可导出数据');
    }
  } catch {
    message.error('导出失败，请稍后重试');
  } finally {
    exporting.value = false;
  }
}

watch(activeTab, () => {
  reset();
  void loadTab();
});
onMounted(loadTab);
</script>

<template>
  <Tabs v-model:active-key="activeTab" type="line" size="small">
    <Tabs.TabPane v-for="tab in tabs" :key="tab.key" :tab="tab.label">
      <Card :loading="loading" size="small">
        <p class="mb-4 text-sm text-gray-500">{{ tab.note }}</p>
        <template v-if="activeType !== 3">
          <Space size="large" wrap>
            <span>官方代理：<Switch :checked="Number(firstSetting(activeType).ActiveOfficial) === 1" :disabled="!canEdit" @change="(value) => updateToggle('official', Boolean(value))" /></span>
            <span>普通代理：<Switch :checked="Number(firstSetting(activeType).ActiveNormal) === 1" :disabled="!canEdit" @change="(value) => updateToggle('normal', Boolean(value))" /></span>
            <Space v-if="activeType === 2">
              <span>提款流水倍数：</span>
              <InputNumber :value="Number(firstSetting(2).WithdrawWaterMultiply || 1)" :disabled="!canEdit" :min="1" :precision="0" @change="(value) => (firstSetting(2).WithdrawWaterMultiply = value)" />
              <Button v-if="canEdit" type="primary" @click="updateWater">保存</Button>
            </Space>
          </Space>
        </template>

        <Table v-else :columns="depositColumns" :data-source="settings[3]" :pagination="false" row-key="AccountType" size="small">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'AccountType'">{{ accountTypeMap[Number(record.AccountType)] || '-' }}</template>
            <template v-else-if="column.key === 'range'">
              <Space v-if="record.editing"><InputNumber v-model:value="record.MinDepositAmount" :min="0" :precision="2" /><span>~</span><InputNumber v-model:value="record.MaxDepositAmount" :min="0" :precision="2" /></Space>
              <span v-else>{{ Number(record.MinDepositAmount).toFixed(2) }} ~ {{ Number(record.MaxDepositAmount).toFixed(2) }}</span>
            </template>
            <template v-else-if="column.key === 'DailyDepositAmount'"><InputNumber v-if="record.editing" v-model:value="record.DailyDepositAmount" :min="0" :precision="2" /><span v-else>{{ Number(record.DailyDepositAmount).toFixed(2) }}</span></template>
            <template v-else-if="column.key === 'Status'"><Switch v-model:checked="record.Status" :checked-value="1" :disabled="!record.editing" :un-checked-value="0" /></template>
            <template v-else-if="column.key === 'UpdateTime'">{{ date(record.UpdateTime) }}</template>
            <template v-else-if="column.key === 'actions'">
              <Space v-if="canEdit">
                <Button v-if="!record.editing" size="small" type="link" @click="beginDepositEdit(record)">编辑</Button>
                <template v-else><Button size="small" type="link" @click="saveDeposit(record)">保存</Button><Button size="small" type="link" @click="cancelDepositEdit(record)">取消</Button></template>
              </Space>
              <Tag v-else>只读</Tag>
            </template>
          </template>
        </Table>
      </Card>

      <Card class="mt-4" size="small" title="按代理账号限制">
        <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
                <div class="flex flex-col gap-1">
            <Input
              v-model:value="query.AgentAccount"
              allow-clear
              @press-enter="search"
              placeholder="请输入代理账号"
            >
              <template #addonBefore>代理账号</template>
            </Input>
          </div>
          <Space.Compact>
            <span class="query-field-addon">代理类型</span>
            <Select v-model:value="query.AccountType" :options="accountTypeOptions" placeholder="请选择代理类型" />
          </Space.Compact>
          <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="createRange" />
        </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
          <Button v-if="canExport" :loading="exporting" @click="handleExport">导出</Button>
          <Button v-if="canAdd" type="primary" @click="openAdd">添加</Button>
          <Popconfirm v-if="canRemove" title="确认批量移除选中的代理限制？" @confirm="removeRows(selectedKeys)"><Button :disabled="selectedKeys.length === 0" danger>批量移除</Button></Popconfirm>
        </div>
    </div>
  </div>
        <Table :columns="restrictionColumns" :data-source="rows" :loading="loading" :pagination="false" :row-selection="canRemove ? { selectedRowKeys: selectedKeys, onChange: (keys: Array<number | string>) => (selectedKeys = keys) } : undefined" row-key="Id" :scroll="{ x: 1000 }" size="small">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'seq'">{{ (query.Page - 1) * query.PageSize + index + 1 }}</template>
            <template v-else-if="column.key === 'AccountType'">{{ accountTypeMap[Number(record.AccountType)] || '-' }}</template>
            <template v-else-if="column.key === 'range'">{{ amount(record.MinDepositAmount) }} ~ {{ amount(record.MaxDepositAmount) }}</template>
            <template v-else-if="column.key === 'DailyDepositAmount'">{{ amount(record.DailyDepositAmount) }}</template>
            <template v-else-if="column.key === 'CreateTime'">{{ date(record.CreateTime) }}</template>
            <template v-else-if="column.key === 'actions'"><Popconfirm v-if="canRemove" title="确认移除此代理限制？" @confirm="removeRows([record.Id])"><Button danger size="small" type="link">移除</Button></Popconfirm></template>
          </template>
        </Table>
        <Pagination v-if="total" v-model:current="query.Page" v-model:page-size="query.PageSize" :page-size-options="['10', '20', '50', '100']" :total="total" class="mt-4 text-right" show-size-changer @change="loadRestrictions" @show-size-change="loadRestrictions" />
      </Card>
    </Tabs.TabPane>
  </Tabs>

  <Modal v-model:open="addOpen" :confirm-loading="addSubmitting" title="添加代理账号限制" @ok="submitAdd">
    <Form layout="vertical">
      <Form.Item label="代理账号（多个用英文逗号分隔）" required><Input.TextArea v-model:value="addForm.AgentAccounts" :rows="4" /></Form.Item>
      <template v-if="activeType === 3">
        <Form.Item label="最小单笔代存金额（元）" required><InputNumber v-model:value="addForm.MinDepositAmount" :min="0" :precision="2" class="w-full" /></Form.Item>
        <Form.Item label="最大单笔代存金额（元）" required><InputNumber v-model:value="addForm.MaxDepositAmount" :min="0" :precision="2" class="w-full" /></Form.Item>
        <Form.Item label="每日代存额度（元）" required><InputNumber v-model:value="addForm.DailyDepositAmount" :min="0" :precision="2" class="w-full" /></Form.Item>
      </template>
    </Form>
  </Modal>
</template>
