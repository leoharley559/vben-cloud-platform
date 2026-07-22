<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudListResult } from '#/types/operation-manage';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Result,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  batchDeleteBankCardBlackApi,
  createBankCardBlackApi,
  fetchBankCardBlackInfoApi,
  fetchGameBankRiskListApi,
  removeBankCardBlackApi,
  updateBankCardBlackApi,
} from '#/api/operationManage/game-risk-control';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatBankCode } from '#/utils/bank-card';
import { formatOperationDateTime } from '#/utils/operation-status';

import BankCardRiskImportModal from './bank-card-risk-import-modal.vue';

defineOptions({ name: 'BankCardRiskPanel' });

const { checkPermission, adminInfo } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canView = computed(
  () => checkPermission(10047) || checkPermission(10031),
);
const canWrite = computed(() => checkPermission(10048));

const filterLoginAccount = ref('');
const filterKeyword = ref('');
const filterSourceType = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(1, 'month').startOf('day'),
  dayjs().endOf('day'),
]);

const sourceTypeOptions = [
  { label: '全部来源', value: '' },
  { label: '后台添加', value: 1 },
  { label: '后台删除', value: 2 },
  { label: '玩家删除', value: 3 },
];

const sourceTypeMap: Record<number, string> = {
  0: '-',
  1: '后台添加',
  2: '后台删除',
  3: '玩家删除',
};

const createOpen = ref(false);
const importOpen = ref(false);
const editOpen = ref(false);
const saving = ref(false);
const editingId = ref<number | string>('');
const editDesc = ref('');
const multiInfo = ref<Array<Record<string, unknown>>>([]);

const createForm = reactive({
  BankCardNum: '',
  BankCode: '',
  Desc: '',
  LoginAccount: '',
});

const bankOptions = computed(() => {
  const list = projectConfig.value?.BankList as
    | Array<{ BankCode?: string; BankName?: string }>
    | undefined;
  return (list || [])
    .filter(
      (item) =>
        item.BankCode && Number((item as { IsOpen?: number }).IsOpen) === 1,
    )
    .map((item) => ({
      label: item.BankName || item.BankCode || '',
      value: item.BankCode || '',
    }));
});

const bankListForFormat = computed(
  () =>
    (projectConfig.value?.BankList as Array<{
      BankCode?: string;
      BankName?: string;
    }>) || [],
);

function resolveOperator() {
  const info = adminInfo.value as Record<string, unknown> | null;
  const admin = info?.Admin as { Username?: string } | undefined;
  return admin?.Username || String(info?.AdminName || info?.Account || '');
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin?.startOf('day').unix(),
    EndTime: end?.endOf('day').unix(),
    FilterKey: 'SourceType',
    FilterValue: filterSourceType.value,
    Keyword: filterKeyword.value.trim(),
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    Type: 1,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  checkboxConfig: { highlight: true },
  columns: [
    { type: 'checkbox', width: 48 },
    {
      field: 'DeletedTime',
      formatter: ({ cellValue, row }) =>
        formatOperationDateTime(
          (cellValue || row.CreateTime) as string | number | undefined,
        ),
      minWidth: 170,
      title: '创建时间',
    },
    { field: 'BankCardNum', minWidth: 180, title: '银行卡号' },
    {
      field: 'BankCode',
      formatter: ({ cellValue }) =>
        formatBankCode(String(cellValue || ''), bankListForFormat.value),
      minWidth: 140,
      title: '银行',
    },
    {
      field: 'SourceType',
      formatter: ({ cellValue }) =>
        sourceTypeMap[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 100,
      title: '来源',
    },
    { field: 'LoginAccount', minWidth: 140, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品名称' },
    { field: 'Operator', minWidth: 110, title: '添加人员' },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '操作时间',
    },
    { field: 'HandlerName', minWidth: 110, title: '操作人' },
    { field: 'Desc', minWidth: 140, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = (await fetchGameBankRiskListApi(
          getQueryParams(page),
        )) as CloudListResult<Record<string, unknown>>;
        return {
          items: result?.Items || [],
          total: Number(result?.Pagination?.MaxCount || 0),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function resetFilters() {
  filterLoginAccount.value = '';
  filterKeyword.value = '';
  filterSourceType.value = '';
  filterDateRange.value = [
    dayjs().subtract(1, 'month').startOf('day'),
    dayjs().endOf('day'),
  ];
  gridApi.reload();
}

async function prefetchCard() {
  if (!createForm.BankCardNum.trim()) {
    return;
  }
  const result = await fetchBankCardBlackInfoApi({
    BankCardNum: createForm.BankCardNum.trim(),
    Type: 1,
  });
  const items = result?.Items || [];
  multiInfo.value = items;
  createForm.LoginAccount = items
    .map((item) => String(item.LoginAccount || ''))
    .filter(Boolean)
    .join(', ');
}

function openCreate() {
  createForm.BankCardNum = '';
  createForm.BankCode = bankOptions.value[0]?.value || '';
  createForm.Desc = '';
  createForm.LoginAccount = '';
  multiInfo.value = [];
  createOpen.value = true;
}

function openEdit(row: Record<string, unknown>) {
  editingId.value = (row.Id as number | string) ?? '';
  editDesc.value = String(row.Desc || '');
  editOpen.value = true;
}

async function submitCreate() {
  if (!createForm.BankCardNum.trim() || !createForm.BankCode) {
    message.warning('请填写卡号与银行');
    return;
  }
  if (!multiInfo.value.length) {
    await prefetchCard();
  }
  saving.value = true;
  try {
    const info =
      multiInfo.value.length > 0
        ? multiInfo.value
        : [{ BankCardNum: createForm.BankCardNum.trim() }];
    await createBankCardBlackApi({
      BankCardNum: createForm.BankCardNum.trim(),
      BankCode: createForm.BankCode,
      Desc: createForm.Desc.trim(),
      Enabled: 1,
      LoginAccount: createForm.LoginAccount,
      MultiInfo: JSON.stringify(info),
      Operator: resolveOperator(),
      RadioType: 1,
      Type: 1,
    });
    message.success('新增成功');
    createOpen.value = false;
    gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function submitEdit() {
  if (editingId.value === '') {
    return;
  }
  saving.value = true;
  try {
    await updateBankCardBlackApi({
      Desc: editDesc.value.trim(),
      Id: editingId.value,
    });
    message.success('已更新');
    editOpen.value = false;
    gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleDelete(row: Record<string, unknown>) {
  const id = row.Id as number | string | undefined;
  if (id === undefined || id === null || id === '') {
    return;
  }
  Modal.confirm({
    content: '确认解除该银行卡黑名单？',
    onOk: async () => {
      await removeBankCardBlackApi(id);
      message.success('已解除');
      gridApi.reload();
    },
    title: '删除',
  });
}

function handleBatchDelete() {
  const records =
    (gridApi.grid?.getCheckboxRecords?.() as Array<Record<string, unknown>>) ||
    [];
  const ids = records
    .map((item) => item.Id as number | string)
    .filter((id) => id !== undefined && id !== null && id !== '');
  if (!ids.length) {
    message.warning('请先勾选记录');
    return;
  }
  Modal.confirm({
    content: `确认批量删除 ${ids.length} 条？`,
    onOk: async () => {
      await batchDeleteBankCardBlackApi(ids);
      message.success('批量删除已提交');
      gridApi.reload();
    },
    title: '批量删除',
  });
}

onMounted(() => {
  if (canView.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canView">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 160px"
      />
      <Input
        v-model:value="filterKeyword"
        allow-clear
        placeholder="卡号关键字"
        style="width: 180px"
      />
      <Select
        v-model:value="filterSourceType"
        :options="sourceTypeOptions"
        placeholder="来源"
        style="width: 140px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Space>
        <Button type="primary" @click="gridApi.reload()">查询</Button>
        <Button @click="resetFilters">重置</Button>
        <Button v-if="canWrite" type="primary" @click="openCreate">新增</Button>
        <Button v-if="canWrite" @click="importOpen = true">批量导入</Button>
        <Button v-if="canWrite" danger @click="handleBatchDelete">
          批量删除
        </Button>
      </Space>
    </div>

    <Grid>
      <template #actions="{ row }">
        <Space :size="0">
          <Button
            v-if="canWrite"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canWrite"
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
      v-model:open="createOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="新增银行卡黑名单"
      @ok="submitCreate"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="银行卡号" required>
          <Input
            v-model:value="createForm.BankCardNum"
            allow-clear
            placeholder="请输入卡号"
            @blur="prefetchCard"
          />
        </Form.Item>
        <Form.Item label="银行" required>
          <Select
            v-model:value="createForm.BankCode"
            :options="bankOptions"
            class="!w-full"
            option-filter-prop="label"
            show-search
          />
        </Form.Item>
        <Form.Item label="关联账号">
          <Input :value="createForm.LoginAccount || '-'" disabled />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="createForm.Desc" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑备注"
      @ok="submitEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="备注">
          <Input.TextArea v-model:value="editDesc" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <BankCardRiskImportModal
      v-model:open="importOpen"
      @success="gridApi.reload()"
    />
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要列表权限 10047 或 Tab 权限 10031"
    title="无权限"
  />
</template>
