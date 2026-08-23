<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchSmsTemplateListApi,
  switchSmsTemplateApi,
  updateSmsTemplateApi,
} from '#/api/gameManage/message-manage';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'SmsTemplatePanel' });

interface TemplateRow {
  [key: string]: unknown;
  ApplyGamePackageIds?: string;
  Id: number | string;
  IsOpen?: number;
  OperateTime?: number | string;
  Operator?: string;
  Scenario?: number;
}

const { projectConfig } = useCloudPermission();
const status = ref<number | string>('');
const dateRange = ref<[Dayjs, Dayjs]>();
const actionKey = ref('');
const editVisible = ref(false);
const saving = ref(false);
const editForm = reactive({
  ApplyGamePackageIds: [] as Array<number | string>,
  Id: '' as number | string,
  Scenario: 1,
  raw: null as null | TemplateRow,
});
const packageOptions = computed(() =>
  (projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);
const packageNameMap = computed(
  () =>
    new Map(
      packageOptions.value.map((item) => [String(item.value), item.label]),
    ),
);

function scenarioText(value?: number) {
  return Number(value) === 1 ? '完成注册' : '首存成功';
}

function packageNames(value?: string) {
  if (!value) return '-';
  return (
    value
      .split(',')
      .map((id) => packageNameMap.value.get(id.trim()))
      .filter((name): name is string => name !== undefined)
      .join('、') || '-'
  );
}

const gridOptions: VxeTableGridOptions<TemplateRow> = {
  columns: [
    {
      field: 'IsOpen',
      slots: { default: 'status' },
      title: '状态',
      width: 100,
    },
    {
      field: 'switch',
      slots: { default: 'switch' },
      title: '开关',
      width: 90,
    },
    {
      field: 'Scenario',
      formatter: ({ cellValue }) => scenarioText(Number(cellValue)),
      minWidth: 130,
      title: '短信场景',
    },
    {
      field: 'ApplyGamePackageIds',
      minWidth: 220,
      slots: { default: 'packages' },
      title: '生效游戏包',
    },
    {
      field: 'OperateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as number | string),
      minWidth: 170,
      title: '操作时间',
    },
    { field: 'Operator', minWidth: 110, title: '操作人' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 90,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const [begin, end] = dateRange.value || [];
        const result = await fetchSmsTemplateListApi({
          BeginTime: begin?.startOf('day').unix() || '',
          EndTime: end?.endOf('day').unix() || '',
          IsOpen: status.value,
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: '',
        });
        const items = (result.Items || []) as TemplateRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount ?? items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFirstPage() {
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

function search() {
  void reloadFirstPage();
}

function reset() {
  status.value = '';
  dateRange.value = undefined;
  void reloadFirstPage();
}

function changeStatus(row: TemplateRow, checked: boolean) {
  const previous = Number(row.IsOpen) === 1 ? 1 : 2;
  const next = checked ? 1 : 2;
  Modal.confirm({
    content: `确认${checked ? '启用' : '停用'}“${scenarioText(row.Scenario)}”短信模板？`,
    onCancel() {
      row.IsOpen = previous;
    },
    async onOk() {
      actionKey.value = String(row.Id);
      try {
        await switchSmsTemplateApi({ Id: row.Id, IsOpen: next });
        message.success('开关更新成功');
        await gridApi.reload();
      } catch (error) {
        row.IsOpen = previous;
        throw error;
      } finally {
        actionKey.value = '';
      }
    },
    title: '模板开关确认',
  });
}

function openEdit(row: TemplateRow) {
  editForm.raw = { ...row };
  editForm.Id = row.Id;
  editForm.Scenario = Number(row.Scenario || 1);
  editForm.ApplyGamePackageIds = row.ApplyGamePackageIds
    ? row.ApplyGamePackageIds.split(',').map(Number)
    : [];
  editVisible.value = true;
}

async function submitEdit() {
  if (!editForm.raw) return;
  saving.value = true;
  try {
    await updateSmsTemplateApi({
      ...editForm.raw,
      ApplyGamePackageIds: editForm.ApplyGamePackageIds.join(','),
    });
    message.success('模板已保存');
    editVisible.value = false;
    await reloadFirstPage();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Alert
    class="mb-4"
    message="短信模板仅配置场景开关和生效产品；短信正文由服务端场景模板提供。"
    show-icon
    type="info"
  />
  <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
      <Space.Compact>
        <span class="query-field-addon">状态</span>
        <Select
          v-model:value="status"
          :options="[
            { label: '全部状态', value: '' },
            { label: '启用', value: 1 },
            { label: '停用', value: 2 },
          ]"
          placeholder="请选择状态"
        />
      </Space.Compact>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker v-model="dateRange" />
      </div>
      <div class="query-filter-actions query-filter-actions-single">
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
      </div>
    </div>
  </div>
    <Grid>
      <template #status="{ row }">
        <Tag :color="Number(row.IsOpen) === 1 ? 'green' : 'red'">
          {{ Number(row.IsOpen) === 1 ? '启用' : '停用' }}
        </Tag>
      </template>
      <template #switch="{ row }">
        <Switch
          :checked="Number(row.IsOpen) === 1"
          :loading="actionKey === String(row.Id)"
          @change="(checked) => changeStatus(row, !!checked)"
        />
      </template>
      <template #packages="{ row }">
        {{ packageNames(row.ApplyGamePackageIds) }}
      </template>
      <template #action="{ row }">
        <Button size="small" type="link" @click="openEdit(row)">编辑</Button>
      </template>
    </Grid>

  <Modal
    v-model:open="editVisible"
    :confirm-loading="saving"
    title="编辑短信模板"
    @ok="submitEdit"
  >
    <Form class="pt-3" layout="vertical">
      <Form.Item label="短信场景">
        <Input :value="scenarioText(editForm.Scenario)" disabled />
      </Form.Item>
      <Form.Item label="生效游戏包">
        <Select
          v-model:value="editForm.ApplyGamePackageIds"
          mode="multiple"
          :options="packageOptions"
          placeholder="请选择游戏包"
          show-search
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

