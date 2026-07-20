<script lang="ts" setup>
import type { TableColumnsType, TransferProps } from 'ant-design-vue';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Transfer,
} from 'ant-design-vue';

import { fetchChildAdminInfoApi } from '#/api/config';
import { getProjectConfigApi } from '#/api/core/project';
import {
  createSystemTemplateApi,
  deleteSystemTemplateApi,
  fetchSystemTemplateListApi,
  updateSystemTemplateApi,
} from '#/api/gameManage/system-setting';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';

defineOptions({ name: 'SystemTemplatesPanel' });

interface TemplateRow extends Record<string, unknown> {
  AdminIds?: string;
  GroupName?: string;
  Id?: number | string;
  PlatformGameType?: string;
  PlatformType?: string;
  Type?: number;
}
interface AdminItem {
  Id: number;
  Name?: string;
  Username?: string;
}

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const loading = ref(false);
const saving = ref(false);
const mode = ref<1 | 2>(1);
const rows = ref<TemplateRow[]>([]);
const total = ref(0);
const pager = reactive({ Page: 1, PageSize: 20 });
const visible = ref(false);
const editing = ref(false);
const form = reactive<Record<string, unknown>>({});
const adminList = ref<AdminItem[]>([]);
const columns = computed<TableColumnsType<TemplateRow>>(() => [
  { key: 'index', title: '序号', width: 80 },
  { dataIndex: 'GroupName', key: 'GroupName', title: '组别名称' },
  mode.value === 1
    ? { key: 'AdminIds', title: '代理成员' }
    : { key: 'PlatformType', title: '场馆类型' },
  { fixed: 'right', key: 'action', title: '操作', width: 150 },
]);
const transferData = computed<TransferProps['dataSource']>(() =>
  adminList.value.map((item) => ({
    description: item.Name || '',
    key: String(item.Id),
    title: `${item.Username || ''}（${item.Name || ''}）`,
  })),
);
const categoryOptions = computed(() =>
  Object.entries(gameConfig.value.GameTypeLangGroup).map(([value, item]) => ({
    label: item.Langs?.[0]?.Name || `类别 ${value}`,
    value: String(item.Classify ?? value),
  })),
);

async function loadData() {
  loading.value = true;
  try {
    const data = await fetchSystemTemplateListApi({
      ...pager,
      Type: mode.value,
    });
    rows.value = Array.isArray(data)
      ? (data as TemplateRow[])
      : ((data?.Items || []) as TemplateRow[]);
    total.value = Array.isArray(data)
      ? data.length
      : Number(data?.Pagination?.MaxCount || rows.value.length);
  } finally {
    loading.value = false;
  }
}

async function loadDependencies() {
  await ensureGameConfig();
  if (mode.value === 1 && adminList.value.length === 0) {
    const data = await fetchChildAdminInfoApi();
    adminList.value = Array.isArray(data?.ChildAdminInfo)
      ? (data.ChildAdminInfo as AdminItem[])
      : [];
  }
}

async function changeMode() {
  pager.Page = 1;
  await loadDependencies();
  await loadData();
}

function openForm(row?: TemplateRow) {
  Object.keys(form).forEach((key) => delete form[key]);
  editing.value = !!row;
  if (row) {
    Object.assign(form, structuredClone(row));
    if (mode.value === 1) {
      form.AdminIds = String(row.AdminIds || '')
        .split(',')
        .filter(Boolean)
        .map(String);
    } else {
      form.PlatformType = String(row.PlatformType || '')
        .split(',')
        .filter(Boolean);
    }
  } else {
    Object.assign(form, {
      AdminIds: [],
      GroupName: '',
      PlatformGameType: [],
      PlatformType: [],
      Type: mode.value,
    });
  }
  visible.value = true;
}

function adminNames(value: unknown) {
  const ids = String(value || '')
    .split(',')
    .filter(Boolean);
  return ids
    .map(
      (id) =>
        adminList.value.find((item) => String(item.Id) === id)?.Username,
    )
    .filter(Boolean)
    .join(', ');
}

function categoryNames(value: unknown) {
  const ids = String(value || '')
    .split(',')
    .filter(Boolean);
  return ids
    .map(
      (id) =>
        categoryOptions.value.find((item) => String(item.value) === id)
          ?.label || id,
    )
    .join(', ');
}

function buildVenueGames(categories: string[]) {
  const ids: string[] = [];
  const codes: Array<number | string> = [];
  for (const [id, game] of Object.entries(
    gameConfig.value.platformGameList,
  )) {
    const classify = Array.isArray(game.ClientClassify)
      ? game.ClientClassify
      : String(game.ClientClassify || '').split(',');
    if (
      categories.some((value) =>
        classify.some((item) => String(item) === String(value)),
      )
    ) {
      ids.push(id);
      if (game.PlatfromCode !== undefined) codes.push(game.PlatfromCode as number | string);
    }
  }
  return { codes, ids };
}

async function saveRow() {
  if (!String(form.GroupName || '').trim()) {
    message.warning('请输入组别名称');
    return;
  }
  const payload: Record<string, unknown> = { ...form, Type: mode.value };
  if (mode.value === 1) {
    const ids = (form.AdminIds || []) as string[];
    if (ids.length === 0) {
      message.warning('请选择代理成员');
      return;
    }
    payload.AdminIds = ids.join(',');
  } else {
    const categories = (form.PlatformType || []) as string[];
    if (categories.length === 0) {
      message.warning('请选择场馆类型');
      return;
    }
    const games = buildVenueGames(categories);
    payload.AdminIds = games.ids.join(',');
    payload.PlatformGameType = games.codes.join(',');
    payload.PlatformType = categories.join(',');
  }
  saving.value = true;
  try {
    await (editing.value ? updateSystemTemplateApi(payload) : createSystemTemplateApi(payload));
    await getProjectConfigApi();
    visible.value = false;
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

function removeRow(row: TemplateRow) {
  if (row.Id === undefined) return;
  const id = row.Id;
  Modal.confirm({
    content: `确定删除“${row.GroupName || ''}”吗？`,
    okType: 'danger',
    onOk: async () => {
      await deleteSystemTemplateApi(id);
      await getProjectConfigApi();
      message.success('删除成功');
      await loadData();
    },
    title: '删除系统模板',
  });
}

watch(mode, changeMode);
onMounted(async () => {
  if (!checkPermission(10_005)) return;
  await loadDependencies();
  await loadData();
});
</script>

<template>
  <Card class="panel-card" :bordered="false">
    <div class="toolbar">
      <Radio.Group v-model:value="mode" button-style="solid">
        <Radio.Button :value="1">代理模板</Radio.Button>
        <Radio.Button :value="2">场馆模板</Radio.Button>
      </Radio.Group>
      <Button
        v-if="checkPermission(10_005)"
        type="primary"
        @click="openForm()"
      >
        新增
      </Button>
    </div>
    <Table
      v-if="checkPermission(10_005)"
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="{
        current: pager.Page,
        pageSize: pager.PageSize,
        showSizeChanger: true,
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
        <span v-else-if="column.key === 'AdminIds'">
          {{ adminNames(record.AdminIds) || '-' }}
        </span>
        <span v-else-if="column.key === 'PlatformType'">
          {{ categoryNames(record.PlatformType) || '-' }}
        </span>
        <Space
          v-else-if="
            column.key === 'action' && checkPermission(10_005)
          "
        >
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
    :title="editing ? '编辑系统模板' : '新增系统模板'"
    width="760px"
    @ok="saveRow"
  >
    <Form :label-col="{ span: 5 }">
      <Form.Item label="组别名称" required>
        <Input v-model:value="form.GroupName as string" :maxlength="50" />
      </Form.Item>
      <Form.Item v-if="mode === 1" label="代理成员" required>
        <Transfer
          v-model:target-keys="form.AdminIds as string[]"
          :data-source="transferData"
          :filter-option="
            (input, option) =>
              String(option.title || '')
                .toLowerCase()
                .includes(input.toLowerCase())
          "
          :list-style="{ height: '360px', width: '280px' }"
          :render="(item) => String(item.title)"
          :show-select-all="true"
          show-search
          :titles="['组外代理', '组内代理']"
        />
      </Form.Item>
      <Form.Item v-else label="场馆类型" required>
        <Select
          v-model:value="form.PlatformType as string[]"
          mode="multiple"
          :options="categoryOptions"
          placeholder="请选择场馆类型"
        />
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
</style>
