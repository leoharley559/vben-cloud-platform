<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Result,
  Segmented,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchUpdateDomainInUseApi,
  fetchDomainListApi,
  updateDomainApi,
  updateDomainInUseApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'DomainManage' });

interface DomainRow {
  Domain?: string;
  FilingStatus?: number;
  Id?: number | string;
  InUsed?: number;
  PackageId?: string;
  Remark?: string;
  State?: number;
  Type?: number;
}

interface PackageOption {
  PackageId: number | string;
  PackageName: string;
}

const domainTypes = [
  { label: '防封域名', value: 1 },
  { label: '落地域名', value: 2 },
  { label: 'H5 域名', value: 3 },
  { label: '代理专属 APP 域名', value: 4 },
  { label: '代理后台域名', value: 5 },
  { label: '主站域名', value: 6 },
  { label: '代理专属 H5 域名', value: 7 },
  { label: '推广专属 APP 域名', value: 8 },
  { label: '推广专属 H5 域名', value: 9 },
  { label: '推广后台域名', value: 10 },
];

const editableTypes = new Set([1, 2, 3, 4, 7, 8, 9]);
const { checkPermission, projectConfig } = useCloudPermission();
const canViewPage = computed(() => checkPermission(11_013));
const canList = computed(() => checkPermission(12_051));
const canBatchEdit = computed(
  () => checkPermission(13_235) && editableTypes.has(filters.Type),
);
const canBatchEnable = computed(() => checkPermission(12_053));
const canBatchDisable = computed(() => checkPermission(12_054));
const canExport = computed(() => checkPermission(12_057));
const canSingleEdit = computed(
  () => checkPermission(12_608) && editableTypes.has(filters.Type),
);
const canSingleEnable = computed(() => checkPermission(12_055));
const canSingleDisable = computed(() => checkPermission(12_056));

const filters = reactive({
  InUsed: '' as 1 | 2 | '',
  Keyword: '',
  Type: 1,
});
const operationLoading = ref(false);
const exportLoading = ref(false);
const editVisible = ref(false);
const editMode = ref<'batch' | 'single'>('single');
const editingRows = ref<DomainRow[]>([]);
const editForm = reactive({
  PackageId: [] as Array<number | string>,
  Remark: '',
});

const packageOptions = computed<PackageOption[]>(() => {
  const list = projectConfig.value?.RealPackageIdNameMap;
  return Array.isArray(list)
    ? list
        .filter((item) => item.PackageId !== '' && item.PackageId != null)
        .map((item) => ({
          PackageId: item.PackageId,
          PackageName: String(item.PackageName || item.PackageId),
        }))
    : [];
});

const packageNameMap = computed(
  () =>
    new Map(
      packageOptions.value.map((item) => [
        String(item.PackageId),
        item.PackageName,
      ]),
    ),
);

function parsePackageIds(value?: string) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const matched = packageOptions.value.find(
        (option) => String(option.PackageId) === item,
      );
      return matched?.PackageId ?? item;
    });
}

function packageNames(value?: string) {
  if (!value) return '-';
  const names = value
    .split(',')
    .map((id) => packageNameMap.value.get(id.trim()))
    .filter((name): name is string => name !== undefined);
  return names.join('、') || '-';
}

function filingText(value?: number) {
  return Number(value) === 2 ? '已备案' : '普通';
}

function getSelectedRows() {
  return (gridApi.grid?.getCheckboxRecords?.() || []) as DomainRow[];
}

/** 我的域名库存列表需带 IsAll=1，否则 Type=1/2/3 等在无该参数时 Items=null（渠道选域/代理域名同参）。 */
function buildDomainListQuery(
  page: { currentPage: number; pageSize: number },
  extra: Record<string, unknown> = {},
) {
  return {
    Domain: '',
    InUsed: filters.InUsed,
    IsAll: 1,
    Keyword: filters.Keyword.trim(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    Type: filters.Type,
    ...extra,
  };
}

const columns: VxeTableGridOptions<DomainRow>['columns'] = [
  { type: 'checkbox', width: 48 },
  { type: 'seq', title: '序号', width: 60 },
  {
    field: 'Domain',
    minWidth: 210,
    showOverflow: 'tooltip',
    title: '域名',
  },
  {
    field: 'FilingStatus',
    minWidth: 105,
    slots: { default: 'filingStatus' },
    title: '域名类型',
  },
  {
    field: 'PackageId',
    minWidth: 190,
    showOverflow: 'tooltip',
    slots: { default: 'packages' },
    title: '所属产品',
  },
  {
    field: 'State',
    minWidth: 135,
    slots: { default: 'blockStatus' },
    title: '封禁状态',
  },
  {
    field: 'InUsed',
    minWidth: 100,
    slots: { default: 'inUsed' },
    title: '状态',
  },
  {
    field: 'Remark',
    minWidth: 180,
    showOverflow: 'tooltip',
    title: '备注',
  },
  {
    field: 'actions',
    fixed: 'right',
    minWidth: 190,
    slots: { default: 'actions' },
    title: '操作',
  },
];

const gridOptions: VxeTableGridOptions<DomainRow> = {
  checkboxConfig: { highlight: true },
  columns,
  height: 'auto',
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    autoLoad: canList.value,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchDomainListApi(buildDomainListQuery(page));
        const items = (result.Items || []) as DomainRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
  rowConfig: { keyField: 'Id' },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFirstPage() {
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

async function handleTypeChange(value: number | string) {
  filters.Type = Number(value);
  filters.Keyword = '';
  filters.InUsed = '';
  await gridApi.grid?.clearCheckboxRow?.();
  if (!canList.value) return;
  await reloadFirstPage();
}

function handleSearch() {
  if (!canList.value) return;
  void reloadFirstPage();
}

function handleReset() {
  filters.Keyword = '';
  filters.InUsed = '';
  if (!canList.value) return;
  void reloadFirstPage();
}

function openSingleEdit(row: DomainRow) {
  editMode.value = 'single';
  editingRows.value = [row];
  editForm.PackageId = parsePackageIds(row.PackageId);
  editForm.Remark = String(row.Remark || '');
  editVisible.value = true;
}

function openBatchEdit() {
  const rows = getSelectedRows();
  if (rows.length === 0) {
    message.warning('请先勾选需要编辑的域名');
    return;
  }
  editMode.value = 'batch';
  editingRows.value = rows;
  editForm.PackageId = [];
  editForm.Remark = '';
  editVisible.value = true;
}

async function submitEdit() {
  const ids = editingRows.value
    .map((item) => item.Id)
    .filter((id): id is number | string => id !== undefined && id !== '');
  if (ids.length === 0) {
    message.error('所选域名缺少 ID，无法提交');
    return;
  }
  operationLoading.value = true;
  try {
    await updateDomainApi({
      Id: editMode.value === 'single' ? ids[0]! : ids,
      PackageId: editForm.PackageId.join(','),
      Remark: editForm.Remark.trim(),
    });
    message.success('编辑成功');
    editVisible.value = false;
    await gridApi.reload();
  } finally {
    operationLoading.value = false;
  }
}

async function switchOne(row: DomainRow, inUsed: 1 | 2) {
  if (!row.Domain) {
    message.error('该记录缺少域名');
    return;
  }
  Modal.confirm({
    content: `确认${inUsed === 1 ? '启用' : '停用'}域名“${row.Domain}”吗？`,
    okText: '确认',
    title: '操作确认',
    async onOk() {
      await updateDomainInUseApi({
        Domain: row.Domain!,
        DomainType: filters.Type,
        InUsed: inUsed,
        State: row.State,
      });
      message.success('操作成功');
      await gridApi.reload();
    },
  });
}

function batchSwitch(inUsed: 1 | 2) {
  const rows = getSelectedRows();
  if (rows.length === 0) {
    message.warning('请先勾选需要操作的域名');
    return;
  }
  const ids = rows
    .map((item) => item.Id)
    .filter((id): id is number | string => id !== undefined && id !== '');
  if (ids.length !== rows.length) {
    message.error('部分所选域名缺少 ID，无法批量操作');
    return;
  }
  Modal.confirm({
    content: `本次将${inUsed === 1 ? '启用' : '停用'} ${ids.length} 个域名，是否继续？`,
    okButtonProps: { danger: inUsed === 2 },
    okText: '确认',
    title: '批量操作确认',
    async onOk() {
      await batchUpdateDomainInUseApi({
        DomainIds: ids,
        DomainType: filters.Type,
        InUsed: inUsed,
      });
      message.success('批量操作成功');
      await gridApi.reload();
    },
  });
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function blockStatusText(state?: number) {
  const value = Number(state);
  if (value === 3) return '微信 + QQ';
  if (value === 1) return '微信';
  if (value === 2) return 'QQ';
  return '其他';
}

async function exportDomains() {
  exportLoading.value = true;
  try {
    const result = await fetchDomainListApi(
      buildDomainListQuery(
        { currentPage: 1, pageSize: 99_999 },
        { IsExp: true },
      ),
    );
    const rows = (result.Items || []) as DomainRow[];
    if (rows.length === 0) {
      message.info('当前条件下没有可导出的数据');
      return;
    }
    const hasBlockStatus = filters.Type === 1 || filters.Type === 2;
    const headers = [
      '序号',
      '域名',
      '域名类型',
      '所属产品',
      ...(hasBlockStatus ? ['封禁状态'] : []),
      '状态',
      '备注',
    ];
    const body = rows.map((row, index) => {
      return [
        index + 1,
        row.Domain,
        filingText(row.FilingStatus),
        packageNames(row.PackageId),
        ...(hasBlockStatus ? [blockStatusText(row.State)] : []),
        Number(row.InUsed) === 1 ? '启用' : '停用',
        row.Remark,
      ]
        .map((item) => csvCell(item))
        .join(',');
    });
    const csv = `\uFEFF${headers.map((item) => csvCell(item)).join(',')}\n${body.join('\n')}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${domainTypes.find((item) => item.value === filters.Type)?.label || '域名管理'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${rows.length} 条记录`);
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="维护各业务场景使用的域名、所属产品与启停状态"
    title="域名管理"
  >
    <Card class="domain-card" :bordered="false">
      <div class="domain-type-panel">
        <div>
          <div class="text-base font-semibold">我的域名</div>
          <div class="mt-1 text-xs text-gray-400">
            按业务用途切换域名分类，分类切换后查询条件与勾选记录会自动清空
          </div>
        </div>
        <Segmented
          :value="filters.Type"
          :options="domainTypes"
          class="domain-segmented"
          @change="handleTypeChange"
        />
      </div>

      <div class="query-panel">
        <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
                <div class="flex flex-col gap-1">
            <Input
              v-model:value="filters.Keyword"
              allow-clear
              class="!w-[280px]"
              @press-enter="handleSearch"
              placeholder="请输入域名"
            >
              <template #addonBefore>域名</template>
            </Input>
          </div>
          <Space.Compact>
            <span class="query-field-addon">使用状态</span>
            <Select
              v-model:value="filters.InUsed"
              class="!w-[140px]"
              :options="[
                { label: '全部状态', value: '' },
                { label: '启用', value: 1 },
                { label: '停用', value: 2 },
              ]"
              placeholder="请选择使用状态"
            />
          </Space.Compact>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </div>
    </div>
  </div>
      </div>

      <Alert
        v-if="!canList"
        class="mb-4"
        message="当前账号无域名列表权限"
        show-icon
        type="warning"
      />

      <template v-else>
        <div class="action-bar">
          <Space wrap>
            <Button
              v-if="canBatchEdit"
              type="primary"
              @click="openBatchEdit"
            >
              批量编辑
            </Button>
            <Button
              v-if="canBatchEnable"
              class="domain-enable-button"
              @click="batchSwitch(1)"
            >
              批量启用
            </Button>
            <Button
              v-if="canBatchDisable"
              danger
              @click="batchSwitch(2)"
            >
              批量停用
            </Button>
          </Space>
          <Button
            v-if="canExport"
            :loading="exportLoading"
            @click="exportDomains"
          >
            导出 Excel
          </Button>
        </div>

        <div class="domain-grid">
          <Grid>
            <template #filingStatus="{ row }">
              <Tag color="blue">{{ filingText(row.FilingStatus) }}</Tag>
            </template>
            <template #packages="{ row }">
              {{ packageNames(row.PackageId) }}
            </template>
            <template #blockStatus="{ row }">
              <template v-if="filters.Type === 1 || filters.Type === 2">
                <Space :size="4">
                  <Tag
                    :color="
                      Number(row.State) === 1 || Number(row.State) === 3
                        ? 'green'
                        : 'red'
                    "
                  >
                    微信
                  </Tag>
                  <Tag
                    :color="
                      Number(row.State) === 2 || Number(row.State) === 3
                        ? 'green'
                        : 'red'
                    "
                  >
                    QQ
                  </Tag>
                </Space>
              </template>
              <span v-else class="text-gray-400">-</span>
            </template>
            <template #inUsed="{ row }">
              <Tag :color="Number(row.InUsed) === 1 ? 'green' : 'red'">
                {{ Number(row.InUsed) === 1 ? '启用' : '停用' }}
              </Tag>
            </template>
            <template #actions="{ row }">
              <Space :size="4">
                <Button
                  v-if="canSingleEdit"
                  size="small"
                  type="link"
                  @click="openSingleEdit(row)"
                >
                  编辑
                </Button>
                <Button
                  v-if="Number(row.InUsed) === 2 && canSingleEnable"
                  size="small"
                  type="link"
                  @click="switchOne(row, 1)"
                >
                  启用
                </Button>
                <Button
                  v-if="Number(row.InUsed) === 1 && canSingleDisable"
                  danger
                  size="small"
                  type="link"
                  @click="switchOne(row, 2)"
                >
                  停用
                </Button>
              </Space>
            </template>
          </Grid>
        </div>
      </template>
    </Card>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="operationLoading"
      destroy-on-close
      :title="editMode === 'single' ? '编辑域名' : '批量编辑域名'"
      width="560px"
      @ok="submitEdit"
    >
      <Form class="pt-3" layout="vertical">
        <Form.Item :label="editMode === 'single' ? '域名' : '已选域名'">
          <Input
            :value="editingRows.map((item) => item.Domain).join('、')"
            disabled
          />
        </Form.Item>
        <Form.Item label="所属产品">
          <Select
            v-model:value="editForm.PackageId"
            allow-clear
            :field-names="{ label: 'PackageName', value: 'PackageId' }"
            mode="multiple"
            :options="packageOptions"
            placeholder="请选择所属产品"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea
            v-model:value="editForm.Remark"
            :maxlength="500"
            placeholder="请输入备注"
            show-count
            :rows="5"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无域名管理查看权限" title="403" />
</template>

<style scoped>
.domain-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(15 23 42 / 6%);
}

.domain-type-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 4px 20px;
  border-bottom: 1px solid hsl(var(--border));
}

.domain-segmented {
  width: 100%;
}

.domain-segmented :deep(.ant-segmented-group) {
  flex-wrap: wrap;
  gap: 4px;
}

.query-panel {
  padding: 18px;
  margin: 18px 0 14px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.domain-enable-button {
  color: #16a34a;
  border-color: #86efac;
}

.domain-grid {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}
</style>
