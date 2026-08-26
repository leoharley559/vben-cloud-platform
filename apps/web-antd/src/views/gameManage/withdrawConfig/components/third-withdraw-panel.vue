<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchThirdWithdrawListApi,
  shelfThirdWithdrawApi,
  updateThirdWithdrawApi,
  updateThirdWithdrawSecretApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'ThirdWithdrawPanel' });

interface ParamSchemaItem {
  description?: string;
  name?: string;
}

interface ThirdWithdrawRow {
  AgentParams?: string;
  AisleBalance?: number;
  Category?: number;
  ChannelName?: string;
  ConfigId?: number | string;
  CreateTime?: number | string;
  CustomRate?: number;
  Description?: string;
  Id: number | string;
  MaxDayMoney?: number;
  MaxOrderMoney?: number;
  MinDayMoney?: number;
  MinOrderMoney?: number;
  NickName?: string;
  OnShelf?: number;
  Params?: string;
  PayType?: number | string;
  Rate?: number | string;
  RateType?: number;
  ShowName?: string;
  Status?: number;
  SupportBank?: string;
  TotalAmount?: number;
  TotalCount?: number;
  TypeName?: string;
}

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canShelf = computed(() => checkPermission(11_023));
const canSecret = computed(() => checkPermission(10_990));
const canEdit = computed(() => checkPermission(10_988));

const bankOptions = computed(() => {
  const list = (projectConfig.value?.BankList || []) as Array<{
    BankCode?: string;
    BankName?: string;
    IsOpen?: number;
  }>;
  return list
    .filter((item) => item.IsOpen === undefined || Number(item.IsOpen) === 1)
    .map((item) => ({
      label: item.BankName || item.BankCode || '',
      value: String(item.BankCode || ''),
    }));
});

const withdrawTypeMap = computed(() => {
  const source = projectConfig.value?.WithdrawTypeList as
    | Array<{
        I18nKey?: string;
        Key?: number | string;
        Name?: string;
        ShowName?: string;
      }>
    | undefined;
  return new Map(
    (source ?? []).map((item) => [
      String(item.Key ?? ''),
      item.ShowName || item.Name || item.I18nKey || String(item.Key ?? ''),
    ]),
  );
});

function payTypeName(row: ThirdWithdrawRow) {
  if (row.TypeName) return row.TypeName;
  const key = String(row.PayType ?? '');
  if (!key) return '-';
  return withdrawTypeMap.value.get(key) || key;
}

const rateTypeOptions = [
  { label: '百分比', value: 0 },
  { label: '固定', value: 1 },
  { label: '百分比+固定', value: 2 },
];

const actionId = ref<number | string>();
const secretVisible = ref(false);
const editVisible = ref(false);
const saving = ref(false);
const queryForm = reactive({
  OnShelf: undefined as number | undefined,
  ShowName: '',
});

const secretForm = reactive({
  Description: '',
  Id: '' as number | string,
  NickName: '',
  Paramss: {} as Record<string, string>,
  fields: [] as Array<{ key: string; label: string }>,
});

const editForm = reactive({
  Category: 0,
  CustomRate: 0 as number | undefined,
  Description: '',
  Id: '' as number | string,
  MaxDayMoney: undefined as number | undefined,
  MaxOrderMoney: undefined as number | undefined,
  MinDayMoney: undefined as number | undefined,
  MinOrderMoney: undefined as number | undefined,
  Rate: undefined as number | undefined,
  RateType: 0,
  ShowName: '',
  SupportBank: [] as string[],
  TypeName: '',
});

const gridOptions: VxeTableGridOptions<ThirdWithdrawRow> = {
  columns: [
    { field: 'ShowName', minWidth: 140, title: '第三方支付名称' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as number | string),
      minWidth: 160,
      title: '创建时间',
    },
    {
      field: 'PayType',
      formatter: ({ row }) => payTypeName(row),
      minWidth: 120,
      title: '支付类型',
    },
    {
      field: 'Rate',
      formatter: ({ row }) => formatRate(row),
      minWidth: 120,
      title: '费率',
    },
    {
      field: 'MinDayMoney',
      formatter: ({ row }) =>
        `${formatAmountFromCent(row.MinDayMoney)} ~ ${formatAmountFromCent(row.MaxDayMoney)}`,
      minWidth: 140,
      title: '日限额',
    },
    {
      field: 'MinOrderMoney',
      formatter: ({ row }) =>
        `${formatAmountFromCent(row.MinOrderMoney)} ~ ${formatAmountFromCent(row.MaxOrderMoney)}`,
      minWidth: 140,
      title: '单笔限额',
    },
    {
      field: 'AisleBalance',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '通道余额',
    },
    {
      field: 'TotalAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '累计金额',
    },
    { field: 'TotalCount', minWidth: 90, title: '累计订单' },
    { field: 'Description', minWidth: 140, title: '备注' },
    {
      field: 'OnShelf',
      slots: { default: 'onShelf' },
      title: '上下架',
      width: 160,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 140,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchThirdWithdrawListApi({
          OnShelf: queryForm.OnShelf,
          Page: page.currentPage,
          PageSize: page.pageSize,
          ShowName: queryForm.ShowName.trim(),
        });
        const items = (result.Items || []) as unknown as ThirdWithdrawRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function displayName(row: ThirdWithdrawRow) {
  return String(
    row.NickName || row.ShowName || row.ChannelName || row.TypeName || row.Id,
  );
}

function formatRate(row: ThirdWithdrawRow) {
  const type = Number(row.RateType);
  const percent =
    row.Rate === undefined || row.Rate === '' ? '-' : `${row.Rate}%`;
  const fixed = Number(row.CustomRate || 0) / 10_000;
  if (type === 1) {
    return String(fixed);
  }
  if (type === 2) {
    return `${percent} + ${fixed}`;
  }
  return percent;
}

function parseParamSchema(row: ThirdWithdrawRow): ParamSchemaItem[] {
  if (!row.Params) {
    return [];
  }
  try {
    const parsed = JSON.parse(row.Params) as
      | ParamSchemaItem[]
      | Record<string, unknown>;
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function openSecret(row: ThirdWithdrawRow) {
  if (Number(row.OnShelf) === 1) {
    message.warning('请先下架后再编辑密钥');
    return;
  }
  let values: Record<string, string>;
  try {
    values = row.AgentParams
      ? (JSON.parse(row.AgentParams) as Record<string, string>)
      : {};
  } catch {
    values = {};
  }
  const schema = parseParamSchema(row);
  const fields =
    schema.length > 0
      ? schema.map((item) => ({
          key: String(item.name || ''),
          label: String(item.description || item.name || ''),
        }))
      : Object.keys(values).map((key) => ({ key, label: key }));

  if (fields.length === 0) {
    fields.push(
      { key: 'Key', label: 'Key' },
      { key: 'Secret', label: 'Secret' },
    );
  }

  secretForm.Id = row.Id;
  secretForm.NickName = displayName(row);
  secretForm.Description = String(row.Description || '');
  secretForm.fields = fields.filter((item) => item.key);
  secretForm.Paramss = {};
  for (const field of secretForm.fields) {
    secretForm.Paramss[field.key] = String(values[field.key] ?? '');
  }
  secretVisible.value = true;
}

function openEdit(row: ThirdWithdrawRow) {
  if (Number(row.OnShelf) === 1) {
    message.warning('请先下架后再编辑通道');
    return;
  }
  editForm.Id = row.Id;
  editForm.ShowName = String(row.ShowName || row.NickName || '');
  editForm.TypeName = payTypeName(row);
  editForm.RateType = Number(row.RateType || 0);
  editForm.Rate =
    row.Rate === undefined || row.Rate === '' ? undefined : Number(row.Rate);
  editForm.CustomRate = Number(row.CustomRate || 0) / 10_000;
  editForm.MinDayMoney = row.MinDayMoney
    ? Number(row.MinDayMoney) / 100
    : undefined;
  editForm.MaxDayMoney = row.MaxDayMoney
    ? Number(row.MaxDayMoney) / 100
    : undefined;
  editForm.MinOrderMoney = row.MinOrderMoney
    ? Number(row.MinOrderMoney) / 100
    : undefined;
  editForm.MaxOrderMoney = row.MaxOrderMoney
    ? Number(row.MaxOrderMoney) / 100
    : undefined;
  editForm.Description = String(row.Description || '');
  editForm.Category = Number(row.Category || 0);
  editForm.SupportBank = row.SupportBank
    ? row.SupportBank.split(',').filter(Boolean)
    : bankOptions.value.map((item) => item.value);
  editVisible.value = true;
}

async function submitSecret() {
  const missingField = secretForm.fields.find(
    (field) => !String(secretForm.Paramss[field.key] ?? '').trim(),
  );
  if (missingField) {
    message.warning(`请填写${missingField.label || missingField.key}`);
    return;
  }
  saving.value = true;
  try {
    await updateThirdWithdrawSecretApi({
      Id: secretForm.Id,
      Params: JSON.stringify(secretForm.Paramss),
    });
    message.success('密钥已保存');
    secretVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function submitEdit() {
  if (
    editForm.RateType !== 1 &&
    (editForm.Rate === undefined || editForm.Rate < 0 || editForm.Rate > 100)
  ) {
    message.warning('百分比费率必须在 0 至 100 之间');
    return;
  }
  if (
    editForm.RateType !== 0 &&
    (editForm.CustomRate === undefined || editForm.CustomRate < 0)
  ) {
    message.warning('请填写正确的固定费率');
    return;
  }
  if (
    (editForm.MinDayMoney === undefined) !==
    (editForm.MaxDayMoney === undefined)
  ) {
    message.warning('每日限额最小值与最大值必须同时填写');
    return;
  }
  if (
    editForm.MinDayMoney !== undefined &&
    editForm.MaxDayMoney !== undefined &&
    editForm.MinDayMoney > editForm.MaxDayMoney
  ) {
    message.warning('日限额最小值不能大于最大值');
    return;
  }
  if (
    (editForm.MinOrderMoney === undefined) !==
    (editForm.MaxOrderMoney === undefined)
  ) {
    message.warning('单笔限额最小值与最大值必须同时填写');
    return;
  }
  if (
    editForm.MinOrderMoney !== undefined &&
    editForm.MaxOrderMoney !== undefined &&
    editForm.MinOrderMoney > editForm.MaxOrderMoney
  ) {
    message.warning('单笔限额最小值不能大于最大值');
    return;
  }
  if (editForm.Category === 2 && editForm.SupportBank.length === 0) {
    message.warning('请至少选择一家支持银行');
    return;
  }
  saving.value = true;
  try {
    await updateThirdWithdrawApi({
      CustomRate: Number(editForm.CustomRate || 0) * 10_000,
      Description: editForm.Description,
      Id: editForm.Id,
      MaxDayMoney: Number(editForm.MaxDayMoney || 0) * 100,
      MaxOrderMoney: Number(editForm.MaxOrderMoney || 0) * 100,
      MinDayMoney: Number(editForm.MinDayMoney || 0) * 100,
      MinOrderMoney: Number(editForm.MinOrderMoney || 0) * 100,
      Rate: editForm.Rate ?? 0,
      RateType: editForm.RateType,
      SupportBank: editForm.SupportBank.join(','),
    });
    message.success('通道已保存');
    editVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleShelf(row: ThirdWithdrawRow, onShelf: number) {
  if (onShelf === 1) {
    if (!row.AgentParams) {
      message.warning('请先配置完整密钥参数后再上架');
      return;
    }
    try {
      const params = JSON.parse(row.AgentParams) as Record<string, unknown>;
      if (Object.values(params).some((value) => !String(value ?? '').trim())) {
        message.warning('密钥参数未填写完整，暂不能上架');
        return;
      }
    } catch {
      message.warning('密钥参数格式异常，暂不能上架');
      return;
    }
  }
  const text = onShelf === 1 ? '上架' : '下架';
  Modal.confirm({
    content: `确认对「${displayName(row)}」执行${text}？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await shelfThirdWithdrawApi({ Id: row.Id, OnShelf: onShelf });
        message.success(`${text}成功`);
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '提示',
  });
}

function search() {
  gridApi.reload();
}

function resetSearch() {
  queryForm.ShowName = '';
  queryForm.OnShelf = undefined;
  gridApi.reload();
}
</script>

<template>
  <div>
    <div class="mb-3 rounded-lg bg-gray-50 p-3">
      <Form layout="inline">
        <Form.Item label="第三方名称">
          <Input
            v-model:value="queryForm.ShowName"
            allow-clear
            placeholder="请输入第三方名称"
            @press-enter="search"
          />
        </Form.Item>
        <Form.Item label="上架状态">
          <Select
            v-model:value="queryForm.OnShelf"
            allow-clear
            :options="[
              { label: '已上架', value: 1 },
              { label: '已下架', value: 2 },
            ]"
            placeholder="全部"
            style="width: 140px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" @click="search">查询</Button>
            <Button @click="resetSearch">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
    <Grid>
      <template #onShelf="{ row }">
        <div class="flex flex-wrap items-center gap-1">
          <Tag :color="Number(row.OnShelf) === 1 ? 'success' : 'default'">
            {{ Number(row.OnShelf) === 1 ? '已上架' : '已下架' }}
          </Tag>
          <Button
            v-if="canShelf && Number(row.OnShelf) !== 1"
            size="small"
            type="primary"
            :loading="actionId === row.Id"
            @click="handleShelf(row, 1)"
          >
            上架
          </Button>
          <Button
            v-if="canShelf && Number(row.OnShelf) === 1"
            danger
            size="small"
            :loading="actionId === row.Id"
            @click="handleShelf(row, 2)"
          >
            下架
          </Button>
        </div>
      </template>
      <template #action="{ row }">
        <Space :size="0">
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            :disabled="Number(row.OnShelf) === 1"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canSecret"
            size="small"
            type="link"
            :disabled="Number(row.OnShelf) === 1"
            @click="openSecret(row)"
          >
            密钥
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="secretVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="密钥参数"
      @ok="submitSecret"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="通道">
          <Input :value="secretForm.NickName" disabled />
        </Form.Item>
        <Form.Item label="通道说明">
          <Input :value="secretForm.Description" disabled />
        </Form.Item>
        <Form.Item
          v-for="field in secretForm.fields"
          :key="field.key"
          :label="field.label || field.key"
        >
          <Input
            v-model:value="secretForm.Paramss[field.key]"
            :placeholder="`请输入 ${field.label || field.key}`"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑通道"
      width="640px"
      @ok="submitEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="通道名称">
          <Input :value="editForm.ShowName" disabled />
        </Form.Item>
        <Form.Item label="通道类型">
          <Input :value="editForm.TypeName" disabled />
        </Form.Item>
        <Form.Item label="费率模式">
          <Select
            v-model:value="editForm.RateType"
            :options="rateTypeOptions"
            class="w-full"
          />
        </Form.Item>
        <Form.Item v-if="editForm.RateType !== 1" label="百分比费率 (%)">
          <InputNumber v-model:value="editForm.Rate" :min="0" class="!w-full" />
        </Form.Item>
        <Form.Item v-if="editForm.RateType !== 0" label="固定费率">
          <InputNumber
            v-model:value="editForm.CustomRate"
            :min="0"
            :precision="4"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="每日出款限额">
          <div class="flex items-center gap-2">
            <InputNumber
              v-model:value="editForm.MinDayMoney"
              :min="0"
              class="!w-full"
              placeholder="最小"
            />
            <span>~</span>
            <InputNumber
              v-model:value="editForm.MaxDayMoney"
              :min="0"
              class="!w-full"
              placeholder="最大"
            />
          </div>
        </Form.Item>
        <Form.Item label="单笔出款限额">
          <div class="flex items-center gap-2">
            <InputNumber
              v-model:value="editForm.MinOrderMoney"
              :min="0"
              class="!w-full"
              placeholder="最小"
            />
            <span>~</span>
            <InputNumber
              v-model:value="editForm.MaxOrderMoney"
              :min="0"
              class="!w-full"
              placeholder="最大"
            />
          </div>
        </Form.Item>
        <Form.Item v-if="editForm.Category === 2" label="支持银行">
          <Checkbox.Group
            v-model:value="editForm.SupportBank"
            :options="bankOptions"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="editForm.Description" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
