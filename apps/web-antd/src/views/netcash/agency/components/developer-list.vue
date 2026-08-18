<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import { Button, Form, Input, message, Modal, Space } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createDeveloperNameApi,
  deleteDeveloperNameApi,
  fetchDeveloperNamesListApi,
  updateDeveloperNameApi,
} from '#/api/netcash/agency';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'DeveloperList' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(12_181));
const canCreate = computed(() => checkPermission(12_182));
const canEdit = computed(() => checkPermission(12_183));
const canDelete = computed(() => checkPermission(12_184));
const developerName = ref('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const modalOpen = ref(false);
const submitting = ref(false);
const mode = ref<'create' | 'edit'>('create');
const form = reactive({ DeveloperName: '', Id: '' as number | string, Remark: '' });

function queryParams(page: { currentPage: number; pageSize: number }) {
  return {
    BeginTime: dateRange.value?.[0]?.unix() || 0,
    CurrPage: page.currentPage,
    DeveloperName: developerName.value,
    EndTime: dateRange.value?.[1]?.unix() || 0,
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { type: 'seq', width: 60, title: '序号' },
    { field: 'DeveloperName', minWidth: 180, title: '发展人名称' },
    { field: 'Remark', minWidth: 220, title: '备注' },
    { field: 'actions', fixed: 'right', minWidth: 150, slots: { default: 'actions' }, title: '操作' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await fetchDeveloperNamesListApi(queryParams(page));
          const items = result?.Items || [];
          return {
            items,
            total: Number(result?.Pagination?.MaxCount || items.length),
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
};
const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function openCreate() {
  mode.value = 'create';
  Object.assign(form, { DeveloperName: '', Id: '', Remark: '' });
  modalOpen.value = true;
}
function openEdit(row: Record<string, unknown>) {
  mode.value = 'edit';
  Object.assign(form, {
    DeveloperName: String(row.DeveloperName || ''),
    Id: row.Id as number | string,
    Remark: String(row.Remark || ''),
  });
  modalOpen.value = true;
}
async function submit() {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.DeveloperName)) {
    message.warning('发展人名称仅支持 3-20 位英文、数字或下划线');
    return;
  }
  submitting.value = true;
  try {
    const payload = { DeveloperName: form.DeveloperName, Id: form.Id, Remark: form.Remark };
    await (mode.value === 'create'
      ? createDeveloperNameApi(payload)
      : updateDeveloperNameApi(payload));
    message.success('操作成功');
    modalOpen.value = false;
    gridApi.reload();
  } catch {
    // 全局拦截已提示
  } finally {
    submitting.value = false;
  }
}
function remove(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除发展人「${row.DeveloperName || ''}」？`,
    okType: 'danger',
    title: '删除发展人',
    onOk: async () => {
      try {
        await deleteDeveloperNameApi({ Id: row.Id as number | string });
        message.success('删除成功');
        gridApi.reload();
      } catch {
        // 全局拦截已提示
      }
    },
  });
}
function reset() {
  developerName.value = '';
  dateRange.value = undefined;
  gridApi.reload();
}
onMounted(() => canView.value && gridApi.reload());
</script>

<template>
  <div v-if="canView">
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="developerName"
          allow-clear
          placeholder="请输入发展人名称"
        >
          <template #addonBefore>发展人名称</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="reset">重置</Button>
      <Button v-if="canCreate" type="primary" @click="openCreate">新增发展人</Button>
        </div>
    </div>
  </div>
    <Grid>
      <template #actions="{ row }">
        <Space>
          <Button v-if="canEdit" type="link" size="small" @click="openEdit(row)">编辑</Button>
          <Button v-if="canDelete" danger type="link" size="small" @click="remove(row)">删除</Button>
        </Space>
      </template>
    </Grid>
    <Modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="mode === 'create' ? '新增发展人' : '编辑发展人'"
      @ok="submit"
    >
      <Form layout="vertical">
        <Form.Item label="发展人名称" required>
          <Input v-model:value="form.DeveloperName" :maxlength="20" />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="form.Remark" :maxlength="200" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
