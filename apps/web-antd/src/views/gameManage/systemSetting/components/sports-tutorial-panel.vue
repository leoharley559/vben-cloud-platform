<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Image,
  Input,
  message,
  Modal,
  Radio,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createSportsTutorialApi,
  deleteSportsTutorialApi,
  fetchSportsTutorialListApi,
  sortSportsTutorialApi,
  updateSportsTutorialApi,
} from '#/api/gameManage/system-setting';
import { getProjectConfigApi } from '#/api/core/project';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { getServiceImageUrl } from '#/utils/media';

import SystemImageField from './system-image-field.vue';

defineOptions({ name: 'SportsTutorialPanel' });

interface TutorialLang {
  AppImageUrl: string;
  Content: string;
  LangGroupId: number;
  PcImageUrl: string;
}
interface TutorialRow extends Record<string, unknown> {
  ConfigType?: number;
  Id?: number | string;
  LangText?: string | TutorialLang[];
}

const cloudStore = useCloudPlatformStore();
const loading = ref(false);
const saving = ref(false);
const rows = ref<TutorialRow[]>([]);
const total = ref(0);
const pager = reactive({ Page: 1, PageSize: 20 });
const visible = ref(false);
const editing = ref(false);
const selectedLangGroup = ref<number>();
const form = reactive<Record<string, unknown>>({});
const langForms = ref<TutorialLang[]>([]);
const langGroups = computed(() =>
  (cloudStore.projectConfig?.LangGroup || []).map((item) => ({
    Id: Number(item.Id),
    Name: String(item.Name || `语言组 ${item.Id}`),
  })),
);
const currentLangId = computed(() => langGroups.value[0]?.Id || 0);
const columns: TableColumnsType<TutorialRow> = [
  { key: 'index', title: '序号', width: 70 },
  { key: 'AppImageUrl', title: 'APP', width: 220 },
  { key: 'PcImageUrl', title: 'PC', width: 260 },
  { key: 'Content', title: '内容' },
  { fixed: 'right', key: 'action', title: '操作', width: 230 },
];

function parseLangText(value: unknown) {
  if (!value) return [] as TutorialLang[];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return (Array.isArray(parsed) ? parsed : Object.values(parsed || {})) as TutorialLang[];
  } catch {
    return [];
  }
}

function rowLang(row: TutorialRow) {
  const list = parseLangText(row.LangText);
  return (
    list.find((item) => Number(item.LangGroupId) === currentLangId.value) ||
    list[0] ||
    {
      AppImageUrl: '',
      Content: '',
      LangGroupId: currentLangId.value,
      PcImageUrl: '',
    }
  );
}

async function loadData() {
  loading.value = true;
  try {
    if (!cloudStore.projectConfig?.LangGroup?.length) {
      await getProjectConfigApi().catch(() => undefined);
    }
    const data = await fetchSportsTutorialListApi(pager);
    const result =
      data == null
        ? { Items: [] as TutorialRow[], Pagination: { MaxCount: 0 } }
        : Array.isArray(data)
          ? { Items: data as TutorialRow[], Pagination: { MaxCount: data.length } }
          : {
              Items: Array.isArray(data.Items) ? (data.Items as TutorialRow[]) : [],
              Pagination: data.Pagination || { MaxCount: 0 },
            };
    rows.value = result.Items;
    total.value = Number(result.Pagination?.MaxCount || rows.value.length);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: TutorialRow) {
  Object.keys(form).forEach((key) => delete form[key]);
  editing.value = !!row;
  Object.assign(form, row ? structuredClone(row) : { ConfigType: 1 });
  const existing = parseLangText(row?.LangText);
  langForms.value = langGroups.value.map((group) => {
    const found = existing.find(
      (item) => Number(item.LangGroupId) === group.Id,
    );
    return (
      found || {
        AppImageUrl: '',
        Content: '',
        LangGroupId: group.Id,
        PcImageUrl: '',
      }
    );
  });
  selectedLangGroup.value = langForms.value[0]?.LangGroupId;
  visible.value = true;
}

async function saveTutorial() {
  if (
    langForms.value.some(
      (item) =>
        !item.AppImageUrl ||
        !item.PcImageUrl ||
        !item.Content.trim(),
    )
  ) {
    message.warning('请完整填写所有语言组的 APP 图片、PC 图片和内容');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form,
      ConfigType: 1,
      LangText: JSON.stringify(langForms.value),
    };
    await (editing.value ? updateSportsTutorialApi(payload) : createSportsTutorialApi(payload));
    visible.value = false;
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

function removeRow(row: TutorialRow) {
  if (row.Id === undefined) return;
  const id = row.Id;
  Modal.confirm({
    content: '确定删除该玩法教程吗？',
    okType: 'danger',
    onOk: async () => {
      await deleteSportsTutorialApi(id);
      message.success('删除成功');
      await loadData();
    },
    title: '删除教程',
  });
}

async function moveRow(index: number, distance: number) {
  const current = rows.value[index];
  const target = rows.value[index + distance];
  if (
    !current ||
    !target ||
    current.Id === undefined ||
    target.Id === undefined
  )
    return;
  await sortSportsTutorialApi({
    ConfigType: 1,
    Id1: current.Id,
    Id2: target.Id,
  });
  message.success('排序成功');
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Card class="panel-card" :bordered="false">
    <div class="toolbar">
      <strong>体育玩法教程配置</strong>
      <Button type="primary" @click="openForm()">新增玩法教程</Button>
    </div>
    <Table
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
      :scroll="{ x: 1050 }"
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
        <Image
          v-else-if="column.key === 'AppImageUrl'"
          :height="110"
          :src="getServiceImageUrl(rowLang(record).AppImageUrl)"
          :width="145"
          style="object-fit: contain"
        />
        <Image
          v-else-if="column.key === 'PcImageUrl'"
          :height="90"
          :src="getServiceImageUrl(rowLang(record).PcImageUrl)"
          :width="220"
          style="object-fit: contain"
        />
        <span v-else-if="column.key === 'Content'">
          {{ rowLang(record).Content || '-' }}
        </span>
        <Space v-else-if="column.key === 'action'">
          <Button :disabled="index === 0" size="small" @click="moveRow(index, -1)">
            上移
          </Button>
          <Button
            :disabled="index === rows.length - 1"
            size="small"
            @click="moveRow(index, 1)"
          >
            下移
          </Button>
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
    :title="editing ? '编辑玩法教程' : '新增玩法教程'"
    width="720px"
    @ok="saveTutorial"
  >
    <div class="mb-3">
      <Radio.Group v-model:value="selectedLangGroup" button-style="solid">
        <Radio.Button
          v-for="group in langGroups"
          :key="group.Id"
          :value="group.Id"
        >
          {{ group.Name }}
        </Radio.Button>
      </Radio.Group>
    </div>
    <div class="form-scroll">
      <Form
        v-for="item in langForms"
        v-show="item.LangGroupId === selectedLangGroup"
        :key="item.LangGroupId"
        :label-col="{ span: 5 }"
      >
        <Form.Item label="APP 图片" required>
          <SystemImageField
            v-model="item.AppImageUrl"
            hint="建议尺寸 470×750"
          />
        </Form.Item>
        <Form.Item label="PC 图片" required>
          <SystemImageField
            v-model="item.PcImageUrl"
            hint="建议尺寸 940×250"
          />
        </Form.Item>
        <Form.Item label="内容" required>
          <Input.TextArea
            v-model:value="item.Content"
            :auto-size="{ maxRows: 6, minRows: 5 }"
          />
        </Form.Item>
      </Form>
    </div>
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

.form-scroll {
  max-height: 68vh;
  padding-top: 18px;
  padding-right: 8px;
  overflow: auto;
}
</style>
