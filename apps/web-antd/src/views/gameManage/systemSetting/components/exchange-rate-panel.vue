<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createExchangeRateApi,
  deleteExchangeRateApi,
  fetchExchangeRateListApi,
  updateExchangeRateApi,
} from '#/api/gameManage/system-setting';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

defineOptions({ name: 'ExchangeRatePanel' });

interface ExchangeRow extends Record<string, unknown> {
  Country?: string;
  HandlerName?: string;
  Id?: number | string;
  Rate?: number | string;
  UpdateTime?: number | string;
}

const { checkPermission } = useCloudPermission();
const loading = ref(false);
const saving = ref(false);
const rows = ref<ExchangeRow[]>([]);
const total = ref(0);
const pager = reactive({ Page: 1, PageSize: 20 });
const visible = ref(false);
const editing = ref(false);
const form = reactive<Partial<ExchangeRow>>({});
const columns: TableColumnsType<ExchangeRow> = [
  { key: 'index', title: '序号', width: 80 },
  { dataIndex: 'Country', key: 'Country', title: '名称', width: 240 },
  { dataIndex: 'Rate', key: 'Rate', title: '汇率' },
  { key: 'UpdateTime', title: '更新时间', width: 200 },
  { dataIndex: 'HandlerName', key: 'HandlerName', title: '操作人', width: 160 },
  { fixed: 'right', key: 'action', title: '操作', width: 150 },
];

async function loadData() {
  loading.value = true;
  try {
    const data = await fetchExchangeRateListApi({
      ...pager,
      Keyword: '',
    });
    if (data == null) {
      rows.value = [];
      total.value = 0;
      return;
    }
    rows.value = Array.isArray(data)
      ? (data as ExchangeRow[])
      : (Array.isArray(data.Items)
        ? (data.Items as ExchangeRow[])
        : []);
    total.value = Array.isArray(data)
      ? data.length
      : Number(data.Pagination?.MaxCount || rows.value.length);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: ExchangeRow) {
  Object.keys(form).forEach((key) => delete form[key]);
  editing.value = !!row;
  Object.assign(form, row ? structuredClone(row) : { Country: '', Rate: '' });
  visible.value = true;
}

async function saveRow() {
  if (!String(form.Country || '').trim() || !String(form.Rate || '').trim()) {
    message.warning('请填写名称和汇率');
    return;
  }
  if (!Number.isFinite(Number(form.Rate)) || Number(form.Rate) <= 0) {
    message.warning('汇率必须为大于 0 的数字');
    return;
  }
  saving.value = true;
  try {
    await (editing.value
      ? updateExchangeRateApi({ ...form })
      : createExchangeRateApi({ ...form }));
    visible.value = false;
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

function removeRow(row: ExchangeRow) {
  if (row.Id === undefined) return;
  const id = row.Id;
  Modal.confirm({
    content: `确定删除“${row.Country || ''}”吗？`,
    okType: 'danger',
    onOk: async () => {
      await deleteExchangeRateApi(id);
      message.success('删除成功');
      await loadData();
    },
    title: '删除汇率',
  });
}

function formatTime(value: unknown) {
  if (!value) return '-';
  const numeric = Number(value);
  const date =
    Number.isFinite(numeric) && String(value).length <= 10
      ? dayjs.unix(numeric)
      : dayjs(value as string);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
}

onMounted(() => {
  if (checkPermission(13_363)) loadData();
});
</script>

<template>
  <Card class="panel-card" :bordered="false">
    <div class="toolbar">
      <div>
        <strong>汇率设置</strong>
        <span class="tip">配置后将应用于相关业务金额换算</span>
      </div>
      <Button v-if="checkPermission(13_363)" type="primary" @click="openForm()">
        新增
      </Button>
    </div>
    <Table
      v-if="checkPermission(13_363)"
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="{
        current: pager.Page,
        pageSize: pager.PageSize,
        showSizeChanger: true,
        pageSizeOptions: [...TABLE_ANT_PAGE_SIZE_OPTIONS],
        total,
      }"
      :row-key="(row) => String(row.Id)"
      size="small"
      @change="
        (pagination) => {
          pager.Page = pagination.current || 1;
          pager.PageSize = pagination.pageSize || 20;
          loadData();
        }
      "
    >
      <template #bodyCell="{ column, record, index }">
        <span v-if="column.key === 'index'">{{ index + 1 }}</span>
        <span v-else-if="column.key === 'UpdateTime'">
          {{ formatTime(record.UpdateTime) }}
        </span>
        <Space v-else-if="column.key === 'action' && checkPermission(13_363)">
          <Button size="small" type="primary" @click="openForm(record)">
            编辑
          </Button>
          <Button danger size="small" @click="removeRow(record)">删除</Button>
        </Space>
      </template>
    </Table>
  </Card>

  <Modal
    v-model:open="visible"
    :confirm-loading="saving"
    :title="editing ? '编辑汇率' : '新增汇率'"
    @ok="saveRow"
  >
    <Form layout="vertical">
      <Form.Item label="名称" required>
        <Input v-model:value="form.Country" :maxlength="50" />
      </Form.Item>
      <Form.Item label="汇率" required>
        <Input v-model:value="form.Rate" />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.panel-card {
  border-radius: 10px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.tip {
  margin-left: 12px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
</style>
