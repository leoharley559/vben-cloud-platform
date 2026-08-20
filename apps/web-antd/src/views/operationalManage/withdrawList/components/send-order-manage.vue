<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SendOrderManageItem } from '#/types/withdraw-extra';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createSendOrderManageApi,
  deleteSendOrderManageApi,
  fetchSendOrderManageDetailApi,
  fetchSendOrderManageListApi,
  fetchSendOrderSwitchApi,
  fetchWithdrawAutoConfigListApi,
  fetchWithdrawAutoSchemeListApi,
  updateSendOrderManageApi,
  updateSendOrderSwitchApi,
} from '#/api/operationManage/withdraw-extra';
import { fetchAdminListApi } from '#/api/systemManage/admin';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'SendOrderManageList' });

type RuleOption = { abbr: string; name: string };

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(10_371));
const canCreate = computed(() => checkPermission(10_372));
const canEdit = computed(() => checkPermission(10_373));
const canDelete = computed(() => checkPermission(10_374));
const canSwitch = computed(() => checkPermission(10_375));
const canRowSwitch = computed(() => checkPermission(10_376));

const autoSwitch = ref(false);
const switchLoading = ref(false);

const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formSaving = ref(false);
const formId = ref<number | string>();
const formAdminId = ref<number | string>();
const formMaxOrderNum = ref<number>();
const formConfigLabels = ref<string[]>([]);
const checkAll = ref(false);
const indeterminate = ref(false);

const adminOptions = ref<Array<{ label: string; value: number | string }>>([]);
const ruleOptions = ref<RuleOption[]>([]);

function formatConfigLabel(value?: string | string[]) {
  const names = Array.isArray(value)
    ? value
    : String(value || '')
        .split(',')
        .filter(Boolean);
  if (names.length === 0) {
    return '-';
  }
  return names
    .map((name) => {
      if (name === 'WithdrawRiskRulePass') {
        return '风控正常订单';
      }
      return ruleOptions.value.find((item) => item.name === name)?.abbr || name;
    })
    .join('、');
}

function syncCheckAllState() {
  const total = ruleOptions.value.length;
  const selected = formConfigLabels.value.length;
  checkAll.value = total > 0 && selected === total;
  indeterminate.value = selected > 0 && selected < total;
}

watch(formConfigLabels, () => {
  syncCheckAllState();
});

function handleCheckAll(checked: boolean | number | string) {
  const enabled = !!checked;
  formConfigLabels.value = enabled
    ? ruleOptions.value.map((item) => item.name)
    : [];
  checkAll.value = enabled;
  indeterminate.value = false;
}

async function loadAdminOptions() {
  const result = await fetchAdminListApi({ Page: 1, PageSize: 500 });
  adminOptions.value = (result?.Items || []).map((item) => ({
    label: `${item.Username || ''}${item.Name ? `（${item.Name}）` : ''}`,
    value: item.Id,
  }));
}

async function loadRuleOptions() {
  const schemes = await fetchWithdrawAutoSchemeListApi();
  const list = Array.isArray(schemes) ? schemes : [];
  const defaultScheme = list.find((scheme) => !scheme.SchemeType) || list[0];
  if (!defaultScheme?.Id) {
    ruleOptions.value = [
      { abbr: '风控正常订单', name: 'WithdrawRiskRulePass' },
    ];
    return;
  }
  const configs = await fetchWithdrawAutoConfigListApi({
    Id: defaultScheme.Id,
  });
  const items = Array.isArray(configs) ? configs : [];
  ruleOptions.value = [
    { abbr: '风控正常订单', name: 'WithdrawRiskRulePass' },
    ...items
      .filter((item) => item.Name)
      .map((item) => ({
        abbr: String(item.Abbr || item.Name),
        name: String(item.Name),
      })),
  ];
}

function openCreate() {
  formMode.value = 'create';
  formId.value = undefined;
  formAdminId.value = undefined;
  formMaxOrderNum.value = undefined;
  formConfigLabels.value = [];
  syncCheckAllState();
  formOpen.value = true;
}

async function openEdit(row: SendOrderManageItem) {
  if (!row.Id) {
    return;
  }
  formMode.value = 'edit';
  formOpen.value = true;
  formSaving.value = true;
  try {
    const detail = await fetchSendOrderManageDetailApi(row.Id);
    formId.value = detail?.Id ?? row.Id;
    formAdminId.value = detail?.AdminId ?? row.AdminId;
    formMaxOrderNum.value = detail?.MaxOrderNum
      ? Number(detail.MaxOrderNum)
      : undefined;
    const labels = detail?.ConfigLabel ?? row.ConfigLabel;
    formConfigLabels.value = Array.isArray(labels)
      ? labels.map(String)
      : String(labels || '')
          .split(',')
          .filter(Boolean);
    syncCheckAllState();
  } finally {
    formSaving.value = false;
  }
}

async function handleSave() {
  if (!formAdminId.value) {
    message.warning('请选择客服账号');
    return;
  }
  if (
    formMaxOrderNum.value === undefined ||
    formMaxOrderNum.value < 1 ||
    formMaxOrderNum.value > 1000
  ) {
    message.warning('最大派单数需为 1–1000');
    return;
  }
  formSaving.value = true;
  try {
    const payload = {
      AdminId: formAdminId.value,
      ConfigLabel: formConfigLabels.value.join(','),
      MaxOrderNum: formMaxOrderNum.value,
      ...(formMode.value === 'edit' ? { Id: formId.value } : {}),
      ...(formMode.value === 'create' ? { Hash: createRequestHash() } : {}),
    };
    if (formMode.value === 'create') {
      await createSendOrderManageApi(payload);
      message.success('新增成功');
    } else {
      await updateSendOrderManageApi(payload);
      message.success('编辑成功');
    }
    formOpen.value = false;
    gridApi.reload();
  } finally {
    formSaving.value = false;
  }
}

function handleRowSwitch(row: SendOrderManageItem, checked: boolean) {
  const nextStatus = checked ? 1 : 2;
  Modal.confirm({
    title: checked ? '启用派单客服' : '停用派单客服',
    content: checked ? '确认启用该客服派单？' : '确认停用该客服派单？',
    onOk: async () => {
      await updateSendOrderManageApi({
        ...row,
        ConfigLabel: Array.isArray(row.ConfigLabel)
          ? row.ConfigLabel.join(',')
          : row.ConfigLabel,
        Status: nextStatus,
      });
      message.success('状态已更新');
      gridApi.reload();
    },
  });
}

function handleDelete(row: SendOrderManageItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: `确认删除客服 ${row.Username || row.AdminName || ''}？`,
    onOk: async () => {
      await deleteSendOrderManageApi(row.Id!);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除派单客服',
  });
}

const gridOptions: VxeTableGridOptions<SendOrderManageItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '开关',
    },
    {
      field: 'Username',
      formatter: ({ row }) => String(row.Username || row.AdminName || '-'),
      minWidth: 120,
      title: '账号',
    },
    {
      field: 'Name',
      formatter: ({ cellValue }) => String(cellValue || '-'),
      minWidth: 120,
      title: '账号名称',
    },
    {
      field: 'IsOnline',
      minWidth: 100,
      slots: { default: 'online' },
      title: '客服状态',
    },
    {
      field: 'CountNum',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null ? '-' : String(cellValue),
      minWidth: 110,
      title: '当前派单数',
    },
    { field: 'MaxOrderNum', minWidth: 110, title: '最大派单数' },
    {
      field: 'ConfigLabel',
      minWidth: 200,
      slots: { default: 'configLabel' },
      title: '派单规则',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchSendOrderManageListApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadSwitch() {
  if (!canSwitch.value) {
    return;
  }
  const result = await fetchSendOrderSwitchApi();
  const raw = result as Record<string, unknown>;
  const nested = raw?.respond as Record<string, unknown> | undefined;
  // 实测 getswitch2 返回 { Status }；旧站读 DistributeOrderStatus；兼容 Switch
  const value =
    raw?.DistributeOrderStatus ??
    raw?.Switch ??
    raw?.Status ??
    nested?.DistributeOrderStatus ??
    nested?.Switch ??
    nested?.Status;
  autoSwitch.value = Number(value) === 1;
}

async function submitSwitch(checked: boolean) {
  const previous = autoSwitch.value;
  autoSwitch.value = checked;
  switchLoading.value = true;
  try {
    await updateSendOrderSwitchApi({
      Name: 'DistributeOrderStatus',
      Status: checked ? 1 : 2,
      Switch: checked ? 1 : 0,
    });
    message.success('开关更新成功');
  } catch {
    autoSwitch.value = previous;
  } finally {
    switchLoading.value = false;
  }
}

onMounted(async () => {
  if (!canViewTable.value) {
    return;
  }
  await Promise.all([loadRuleOptions(), loadAdminOptions(), loadSwitch()]);
  gridApi.reload();
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div
        v-if="canSwitch"
        class="flex items-center gap-2 rounded border px-3 py-2"
      >
        <span>自动派单开关</span>
        <Switch
          :checked="autoSwitch"
          :loading="switchLoading"
          @update:checked="(value) => void submitSwitch(!!value)"
        />
      </div>
      <Button v-if="canCreate" type="primary" @click="openCreate">
        添加分派人员
      </Button>
    </div>

    <Grid>
      <template #status="{ row }">
        <Switch
          :checked="Number(row.Status) === 1"
          :disabled="!canRowSwitch"
          @update:checked="(value) => handleRowSwitch(row, !!value)"
        />
      </template>
      <template #online="{ row }">
        <Tag :color="Number(row.IsOnline) === 1 ? 'success' : 'error'">
          {{ Number(row.IsOnline) === 1 ? '在线' : '离线' }}
        </Tag>
      </template>
      <template #configLabel="{ row }">
        {{ formatConfigLabel(row.ConfigLabel) }}
      </template>
      <template #actions="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="formOpen"
      :confirm-loading="formSaving"
      :title="formMode === 'create' ? '添加分派人员' : '编辑分派人员'"
      width="640px"
      @ok="handleSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="客服账号" required>
          <Select
            v-model:value="formAdminId"
            :disabled="formMode === 'edit'"
            :options="adminOptions"
            allow-clear
            class="w-full"
            option-filter-prop="label"
            placeholder="请选择客服账号"
            show-search
          />
        </Form.Item>
        <Form.Item label="最大派单数" required>
          <InputNumber
            v-model:value="formMaxOrderNum"
            :max="1000"
            :min="1"
            class="w-full"
            placeholder="1-1000"
          />
        </Form.Item>
        <Form.Item label="派单规则">
          <div class="mb-1">
            <Checkbox
              :checked="checkAll"
              :indeterminate="indeterminate"
              @update:checked="handleCheckAll"
            >
              全选
            </Checkbox>
          </div>
          <Checkbox.Group
            v-model:value="formConfigLabels"
            class="flex flex-col gap-1"
          >
            <Checkbox
              v-for="item in ruleOptions"
              :key="item.name"
              :value="item.name"
            >
              {{ item.abbr }}
            </Checkbox>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10371 才能查看派单管理"
    title="无权限"
  />
</template>
