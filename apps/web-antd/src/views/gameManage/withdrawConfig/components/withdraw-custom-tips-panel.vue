<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { storeToRefs } from 'pinia';
import {
  Button,
  Form,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  Tabs,
  message,
} from 'ant-design-vue';

import {
  createWithdrawCustomTipApi,
  deleteWithdrawCustomTipApi,
  fetchWithdrawCustomTipsApi,
  sortWithdrawCustomTipsApi,
  updateWithdrawCustomTipApi,
} from '#/api/gameManage/withdraw-rules';
import { useCloudPlatformStore } from '#/store/cloud-platform';

interface LangTip {
  Content: string;
  LangGroupId: number | string;
}

const cloudStore = useCloudPlatformStore();
const { projectConfig } = storeToRefs(cloudStore);
const langGroups = computed(() => {
  const groups = projectConfig.value?.LangGroup || [];
  return groups.length
    ? groups
    : [{ Default: true, Id: 1, Languages: ['默认语言'] }];
});
const defaultLangId = computed(
  () =>
    langGroups.value.find((item) => item.Default)?.Id ??
    langGroups.value[0]!.Id,
);

const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const query = reactive({ Page: 1, PageSize: 20 });
const columns = [
  { key: 'index', title: '序号', width: 70 },
  { key: 'content', title: '自定义内容' },
  { dataIndex: 'UpdateTime', key: 'UpdateTime', title: '更新时间', width: 190 },
  { dataIndex: 'Operator', key: 'Operator', title: '操作人', width: 140 },
  { key: 'actions', title: '操作', width: 250 },
];

function parseLangText(raw: unknown): Record<string, LangTip> {
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }
  }
  const result: Record<string, LangTip> = {};
  if (Array.isArray(parsed)) {
    parsed.forEach((item, index) => {
      const row = item as Record<string, unknown>;
      const id = row.LangGroupId ?? langGroups.value[index]?.Id ?? index;
      result[String(id)] = {
        Content: String(row.Content || ''),
        LangGroupId: id as number | string,
      };
    });
  } else if (parsed && typeof parsed === 'object') {
    Object.entries(parsed as Record<string, Record<string, unknown>>).forEach(
      ([key, row]) => {
        const id = row.LangGroupId ?? key;
        result[String(id)] = {
          Content: String(row.Content || ''),
          LangGroupId: id as number | string,
        };
      },
    );
  }
  return result;
}

function normalizedLangText(raw?: unknown) {
  const parsed = parseLangText(raw);
  return Object.fromEntries(
    langGroups.value.map((group) => [
      String(group.Id),
      parsed[String(group.Id)] || {
        Content: '',
        LangGroupId: group.Id,
      },
    ]),
  ) as Record<string, LangTip>;
}

function displayContent(row: Record<string, unknown>) {
  const lang = parseLangText(row.LangText);
  return (
    lang[String(defaultLangId.value)]?.Content ||
    Object.values(lang).find((item) => item.Content)?.Content ||
    '-'
  );
}

async function load() {
  loading.value = true;
  try {
    const result = await fetchWithdrawCustomTipsApi(query);
    rows.value = result.Items;
    total.value = Number(result.Pagination.MaxCount || rows.value.length);
  } finally {
    loading.value = false;
  }
}

const editorOpen = ref(false);
const submitting = ref(false);
const activeLang = ref('');
const editorSnapshot = ref<Record<string, unknown>>({});
const form = reactive<{
  Id?: number | string;
  LangText: Record<string, LangTip>;
}>({ LangText: normalizedLangText() });

function openCreate() {
  editorSnapshot.value = {};
  form.Id = undefined;
  form.LangText = normalizedLangText();
  activeLang.value = String(defaultLangId.value);
  editorOpen.value = true;
}

function openEdit(row: Record<string, unknown>) {
  editorSnapshot.value = { ...row };
  form.Id = row.Id as number | string;
  form.LangText = normalizedLangText(row.LangText);
  activeLang.value = String(defaultLangId.value);
  editorOpen.value = true;
}

async function submit() {
  const missing = langGroups.value.find(
    (group) => !form.LangText[String(group.Id)]?.Content.trim(),
  );
  if (missing) {
    activeLang.value = String(missing.Id);
    message.warning(`请填写语言组 ${missing.Id} 的内容`);
    return;
  }
  const payload = {
    ...editorSnapshot.value,
    ...(form.Id === undefined ? {} : { Id: form.Id }),
    LangText: JSON.stringify(
      langGroups.value.map((group) => ({
        Content: form.LangText[String(group.Id)]!.Content.trim(),
        LangGroupId: group.Id,
      })),
    ),
  };
  submitting.value = true;
  try {
    if (form.Id === undefined) {
      await createWithdrawCustomTipApi(payload);
    } else {
      await updateWithdrawCustomTipApi(payload);
    }
    message.success(form.Id === undefined ? '添加成功' : '编辑成功');
    editorOpen.value = false;
    await load();
  } finally {
    submitting.value = false;
  }
}

function remove(row: Record<string, unknown>) {
  Modal.confirm({
    content: '确认删除该自定义提示？',
    okType: 'danger',
    title: '删除',
    onOk: async () => {
      await deleteWithdrawCustomTipApi(String(row.Id));
      message.success('删除成功');
      await load();
    },
  });
}

async function move(index: number, offset: -1 | 1) {
  const current = rows.value[index];
  const target = rows.value[index + offset];
  if (!current || !target) return;
  await sortWithdrawCustomTipsApi({
    Id1: current.Id as number | string,
    Id2: target.Id as number | string,
  });
  rows.value.splice(index + offset, 0, rows.value.splice(index, 1)[0]!);
  message.success('排序成功');
}

function langTitle(group: (typeof langGroups.value)[number]) {
  const languages = Array.isArray(group.Languages)
    ? group.Languages
    : String(group.Languages || '').split(',');
  return languages.filter(Boolean).join('/') || `语言组 ${group.Id}`;
}

function setLangContent(id: number | string, content: string) {
  const key = String(id);
  form.LangText[key] ||= { Content: '', LangGroupId: id };
  form.LangText[key].Content = content;
}

void load();
</script>

<template>
  <div class="mt-6 border-t pt-4">
    <div class="mb-3 flex items-center justify-between">
      <strong>提现页面多语言自定义提示</strong>
      <Button type="primary" @click="openCreate">新增</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, index, record }">
        <template v-if="column.key === 'index'">
          {{ (query.Page - 1) * query.PageSize + index + 1 }}
        </template>
        <template v-else-if="column.key === 'content'">
          {{ displayContent(record) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space :size="0">
            <Button
              :disabled="index === 0"
              type="link"
              @click="move(index, -1)"
            >
              上移
            </Button>
            <Button
              :disabled="index === rows.length - 1"
              type="link"
              @click="move(index, 1)"
            >
              下移
            </Button>
            <Button type="link" @click="openEdit(record)">编辑</Button>
            <Button danger type="link" @click="remove(record)">删除</Button>
          </Space>
        </template>
      </template>
    </Table>
    <Pagination
      v-if="total > query.PageSize"
      v-model:current="query.Page"
      v-model:page-size="query.PageSize"
      class="mt-3 text-right"
      :total="total"
      @change="load"
    />

    <Modal
      v-model:open="editorOpen"
      :confirm-loading="submitting"
      :title="form.Id === undefined ? '新增自定义提示' : '编辑自定义提示'"
      width="720px"
      @ok="submit"
    >
      <Tabs v-model:active-key="activeLang">
        <Tabs.TabPane
          v-for="group in langGroups"
          :key="String(group.Id)"
          :tab="langTitle(group)"
        >
          <Form layout="vertical">
            <Form.Item label="内容" required>
              <Input.TextArea
                :value="form.LangText[String(group.Id)]?.Content"
                :maxlength="1000"
                :rows="6"
                show-count
                @update:value="(value) => setLangContent(group.Id, value)"
              />
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  </div>
</template>
