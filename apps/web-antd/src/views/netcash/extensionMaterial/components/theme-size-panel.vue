<script lang="ts" setup>
import type { PromotionConfItem } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createPromotionConfApi,
  deletePromotionConfApi,
  fetchPromotionConfListApi,
  updatePromotionConfApi,
} from '#/api/netcash/extension-material';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

defineOptions({ name: 'ExtensionMaterialThemeSizePanel' });

const { checkPermission } = useCloudPermission();
const themeRows = ref<PromotionConfItem[]>([]);
const sizeRows = ref<PromotionConfItem[]>([]);
const themeTotal = ref(0);
const sizeTotal = ref(0);
const themeLoading = ref(false);
const sizeLoading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editing = ref(false);
const form = reactive<{ Id?: number | string; Type: 1 | 2; Value: string }>({
  Type: 2,
  Value: '',
});
const themeQuery = reactive({ Page: 1, PageSize: 20, Type: 2 });
const sizeQuery = reactive({ Page: 1, PageSize: 20, Type: 1 });
const title = computed(
  () =>
    `${editing.value ? '编辑' : '新增'}${form.Type === 2 ? '主题' : '尺寸'}`,
);
const columns = [
  { key: 'index', title: '序号', width: 72 },
  { dataIndex: 'Value', key: 'Value', title: '名称' },
  { key: 'actions', title: '操作', width: 170 },
];

async function load(type: 1 | 2) {
  const isTheme = type === 2;
  const loading = isTheme ? themeLoading : sizeLoading;
  loading.value = true;
  try {
    const query = isTheme ? themeQuery : sizeQuery;
    const result = await fetchPromotionConfListApi(query);
    const items = Array.isArray(result?.Items) ? result.Items : [];
    const total = Number(result?.Pagination?.MaxCount ?? items.length);
    if (isTheme) {
      themeRows.value = items;
      themeTotal.value = total;
    } else {
      sizeRows.value = items;
      sizeTotal.value = total;
    }
  } catch {
    if (isTheme) {
      themeRows.value = [];
      themeTotal.value = 0;
    } else {
      sizeRows.value = [];
      sizeTotal.value = 0;
    }
  } finally {
    loading.value = false;
  }
}

function openForm(type: 1 | 2, row?: PromotionConfItem) {
  form.Type = type;
  form.Id = row?.Id;
  form.Value = row?.Value || '';
  editing.value = !!row;
  modalOpen.value = true;
}

async function save() {
  const value = form.Value.trim();
  if (!value) {
    message.warning(`请输入${form.Type === 2 ? '主题名称' : '尺寸'}`);
    return;
  }
  if (form.Type === 1 && !/^[1-9]\d*\s*[*×xX]\s*[1-9]\d*$/.test(value)) {
    message.warning('尺寸格式应为宽*高，例如 750*1334');
    return;
  }
  saving.value = true;
  try {
    await (editing.value && form.Id !== undefined
      ? updatePromotionConfApi({ Id: form.Id, Value: value })
      : createPromotionConfApi({ Type: form.Type, Value: value }));
    modalOpen.value = false;
    message.success(editing.value ? '编辑成功' : '新增成功');
    await load(form.Type);
  } catch {
    /* requestClient 已提示 */
  } finally {
    saving.value = false;
  }
}

function remove(type: 1 | 2, row: PromotionConfItem) {
  if (row.Id === undefined || row.Id === null) return;
  Modal.confirm({
    content: `删除后可能影响已关联素材，确定删除“${row.Value || ''}”吗？`,
    okType: 'danger',
    onOk: async () => {
      try {
        await deletePromotionConfApi(row.Id!);
        message.success('删除成功');
        await load(type);
      } catch {
        /* requestClient 已提示 */
      }
    },
    title: `删除${type === 2 ? '主题' : '尺寸'}`,
  });
}

function changePage(type: 1 | 2, page: number, pageSize: number) {
  const query = type === 2 ? themeQuery : sizeQuery;
  query.Page = query.PageSize === pageSize ? page : 1;
  query.PageSize = pageSize;
  load(type);
}

onMounted(() => Promise.all([load(2), load(1)]));
</script>

<template>
  <div v-if="checkPermission(10_582)" class="config-grid">
    <Card size="small" class="config-card">
      <template #title>主题管理</template>
      <template #extra>
        <Button
          v-if="checkPermission(10_664)"
          type="primary"
          @click="openForm(2)"
        >
          新增主题
        </Button>
      </template>
      <Table
        :columns="columns"
        :data-source="themeRows"
        :loading="themeLoading"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <span v-if="column.key === 'index'">
            {{ (themeQuery.Page - 1) * themeQuery.PageSize + index + 1 }}
          </span>
          <Space v-else-if="column.key === 'actions'">
            <Button
              v-if="checkPermission(10_667)"
              size="small"
              type="link"
              @click="openForm(2, record)"
            >
              编辑
            </Button>
            <Button
              v-if="checkPermission(10_670)"
              danger
              size="small"
              type="link"
              @click="remove(2, record)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
      <Pagination
        v-if="themeTotal"
        class="pager"
        :current="themeQuery.Page"
        :page-size="themeQuery.PageSize"
        :show-total="(value: number) => `共 ${value} 条`"
        :total="themeTotal"
        :page-size-options="TABLE_ANT_PAGE_SIZE_OPTIONS"
          show-size-changer
        @change="(page, size) => changePage(2, page, size)"
        @show-size-change="(page, size) => changePage(2, page, size)"
      />
    </Card>

    <Card size="small" class="config-card">
      <template #title>尺寸管理</template>
      <template #extra>
        <Button
          v-if="checkPermission(10_673)"
          type="primary"
          @click="openForm(1)"
        >
          新增尺寸
        </Button>
      </template>
      <Table
        :columns="columns"
        :data-source="sizeRows"
        :loading="sizeLoading"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <span v-if="column.key === 'index'">
            {{ (sizeQuery.Page - 1) * sizeQuery.PageSize + index + 1 }}
          </span>
          <Space v-else-if="column.key === 'actions'">
            <Button
              v-if="checkPermission(10_676)"
              size="small"
              type="link"
              @click="openForm(1, record)"
            >
              编辑
            </Button>
            <Button
              v-if="checkPermission(10_680)"
              danger
              size="small"
              type="link"
              @click="remove(1, record)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
      <Pagination
        v-if="sizeTotal"
        class="pager"
        :current="sizeQuery.Page"
        :page-size="sizeQuery.PageSize"
        :show-total="(value: number) => `共 ${value} 条`"
        :total="sizeTotal"
        :page-size-options="TABLE_ANT_PAGE_SIZE_OPTIONS"
          show-size-changer
        @change="(page, size) => changePage(1, page, size)"
        @show-size-change="(page, size) => changePage(1, page, size)"
      />
    </Card>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="saving"
      :title="title"
      @ok="save"
    >
      <Form layout="vertical">
        <Form.Item
          :label="form.Type === 2 ? '主题名称' : '尺寸（宽*高）'"
          required
        >
          <Input
            v-model:value="form.Value"
            :maxlength="100"
            :placeholder="form.Type === 2 ? '请输入主题名称' : '例如 750*1334'"
            @press-enter="save"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  <Empty v-else description="无主题和尺寸查看权限（10582）" />
</template>

<style scoped>
.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.config-card {
  min-width: 0;
  border-radius: 10px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 1000px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
