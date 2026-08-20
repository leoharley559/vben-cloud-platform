<script lang="ts" setup>
import type { HelpCenterItem, HelpCenterLangTextItem } from '#/types/netcash';

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Result,
  Space,
  Spin,
} from 'ant-design-vue';

import {
  createHelpCenterApi,
  deleteHelpCenterApi,
  fetchHelpCenterListApi,
  sortHelpCenterApi,
  updateHelpCenterApi,
} from '#/api/netcash/help-center';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';

defineOptions({ name: 'HelpCenter' });

const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();

const canViewPage = computed(() => checkPermission(10_690));
const canCreate = computed(() => checkPermission(10_693));
const canSort = computed(() => checkPermission(1209));
const canSave = computed(() => checkPermission(10_704));
const canDelete = computed(() => checkPermission(10_705));

const loading = ref(false);
const saving = ref(false);
const list = ref<HelpCenterItem[]>([]);
const currentIndex = ref(0);
const currentData = ref<HelpCenterItem>({ Content: '', Tag: '' });
const createOpen = ref(false);
const activeLangGroupId = ref<number | string>();
const addForm = reactive<HelpCenterItem>({
  Content: '',
  LangGroupId: undefined,
  Tag: '',
});

const langGroups = computed(() =>
  (cloudStore.projectConfig?.LangGroup || [])
    .filter((item) => item.Id !== undefined && item.Id !== null)
    .map((item) => ({
      Id: item.Id,
      Languages: Array.isArray(item.Languages)
        ? item.Languages.filter(Boolean)
        : String(item.Languages || '')
            .split(/\s*,\s*/)
            .filter(Boolean),
      Name: String(item.Name || `语言组 ${item.Id}`),
    })),
);
const activeLanguages = computed(
  () =>
    langGroups.value.find(
      (item) => String(item.Id) === String(activeLangGroupId.value),
    )?.Languages || [],
);

const upDisabled = computed(() => currentIndex.value <= 0);
const downDisabled = computed(
  () => list.value.length === 0 || currentIndex.value >= list.value.length - 1,
);

function parseLangText(
  value: HelpCenterItem['LangText'],
): HelpCenterLangTextItem[] {
  if (!value || value === 'null') return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed as HelpCenterLangTextItem[];
    return Object.entries(parsed || {}).map(([langGroupId, item]) => ({
      ...(item as HelpCenterLangTextItem),
      LangGroupId: (item as HelpCenterLangTextItem).LangGroupId ?? langGroupId,
    }));
  } catch {
    return [];
  }
}

function localizedItem(item: HelpCenterItem) {
  const localized = parseLangText(item.LangText).find(
    (entry) => String(entry.LangGroupId) === String(activeLangGroupId.value),
  );
  return localized ? { ...item, ...localized, LangText: item.LangText } : item;
}

function hasRichTextContent(value: unknown) {
  const html = String(value || '');
  if (/<(?:img|video|audio|iframe)\b/i.test(html)) return true;
  const text = html
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll(/&nbsp;|&#160;/gi, ' ')
    .replaceAll(/&[a-z]+;|&#\d+;/gi, '')
    .trim();
  return text.length > 0;
}

async function loadList(selectFirst = false) {
  loading.value = true;
  try {
    const result = await fetchHelpCenterListApi({
      LangGroupId: activeLangGroupId.value,
      Page: 1,
      PageSize: 1000,
    });
    list.value = Array.isArray(result?.Items)
      ? result.Items.map((item) => localizedItem(item))
      : [];
    if (list.value.length === 0) {
      currentIndex.value = 0;
      currentData.value = {
        Content: '',
        LangGroupId: activeLangGroupId.value,
        Tag: '',
      };
    } else if (
      selectFirst ||
      currentData.value.Id === undefined ||
      currentData.value.Id === null
    ) {
      selectItem(list.value[0]!, 0);
    } else {
      const index = list.value.findIndex(
        (item) => String(item.Id) === String(currentData.value.Id),
      );
      selectItem(list.value[Math.max(index, 0)]!, Math.max(index, 0));
    }
  } finally {
    loading.value = false;
  }
}

function selectItem(item: HelpCenterItem, index: number) {
  currentIndex.value = index;
  currentData.value = {
    ...item,
    Content: String(item.Content || ''),
    LangGroupId: item.LangGroupId ?? activeLangGroupId.value,
    Tag: String(item.Tag || ''),
  };
}

function handleCreate() {
  Object.assign(addForm, {
    Content: '',
    LangGroupId: activeLangGroupId.value,
    Tag: '',
  });
  createOpen.value = true;
}

async function submitCreate() {
  if (!String(addForm.Tag || '').trim()) {
    message.warning('请输入分类名称');
    return;
  }
  if (!hasRichTextContent(addForm.Content)) {
    message.warning('请输入帮助内容');
    return;
  }
  saving.value = true;
  try {
    await createHelpCenterApi({
      ...addForm,
      Content: String(addForm.Content || ''),
      LangGroupId: activeLangGroupId.value,
      Tag: String(addForm.Tag || '').trim(),
    });
    createOpen.value = false;
    message.success('新增成功');
    await loadList(true);
  } finally {
    saving.value = false;
  }
}

async function handleSave() {
  if (currentData.value.Id === undefined || currentData.value.Id === null) {
    return;
  }
  if (!currentData.value.Tag?.trim()) {
    message.warning('请输入标签名称');
    return;
  }
  if (!hasRichTextContent(currentData.value.Content)) {
    message.warning('请输入帮助内容');
    return;
  }
  saving.value = true;
  try {
    await updateHelpCenterApi({
      ...currentData.value,
      Content: String(currentData.value.Content || ''),
      LangGroupId: activeLangGroupId.value,
      Tag: String(currentData.value.Tag || '').trim(),
    });
    message.success('保存成功');
    await loadList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (currentData.value.Id === undefined || currentData.value.Id === null) {
    return;
  }
  Modal.confirm({
    content: '确认删除当前标签？',
    onOk: async () => {
      await deleteHelpCenterApi(currentData.value.Id!);
      message.success('删除成功');
      currentData.value = { Content: '', Tag: '' };
      await loadList(true);
    },
    title: '删除标签',
  });
}

async function handleSort(direction: 'down' | 'up') {
  const targetIndex =
    direction === 'up' ? currentIndex.value - 1 : currentIndex.value + 1;
  const current = list.value[currentIndex.value];
  const target = list.value[targetIndex];
  if (
    current?.Id === undefined ||
    current.Id === null ||
    target?.Id === undefined ||
    target.Id === null
  ) {
    return;
  }
  loading.value = true;
  try {
    await sortHelpCenterApi({ Id1: current.Id, Id2: target.Id });
    message.success('排序已更新');
    const currentId = current.Id;
    await loadList();
    const movedIndex = list.value.findIndex(
      (item) => String(item.Id) === String(currentId),
    );
    if (movedIndex !== -1) selectItem(list.value[movedIndex]!, movedIndex);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const defaultGroup =
    langGroups.value.find((item) => {
      const source = cloudStore.projectConfig?.LangGroup?.find(
        (group) => String(group.Id) === String(item.Id),
      );
      return source?.Default === true;
    }) || langGroups.value[0];
  activeLangGroupId.value = defaultGroup?.Id;
  if (canViewPage.value) {
    loadList(true);
  }
});

watch(activeLangGroupId, async (value, oldValue) => {
  if (!canViewPage.value || oldValue === undefined || value === oldValue)
    return;
  await nextTick();
  await loadList(true);
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 帮助中心"
    title="帮助中心"
  >
    <div class="help-toolbar">
      <div>
        <strong>内容语言组</strong>
        <span v-if="langGroups.length > 0" class="lang-switch">
          <Radio.Group v-model:value="activeLangGroupId" button-style="solid">
            <Radio.Button
              v-for="group in langGroups"
              :key="group.Id"
              :value="group.Id"
            >
              {{ group.Name }}
            </Radio.Button>
          </Radio.Group>
        </span>
        <span v-else class="muted">未配置语言组，将使用后端默认语言</span>
      </div>
      <span v-if="activeLanguages.length > 0" class="muted">
        包含语言：{{ activeLanguages.join('、') }}
      </span>
    </div>

    <Alert
      class="help-note"
      message="内容编辑说明"
      description="分类与内容按语言组独立维护；富文本支持图片上传、预览和常用排版。切换语言组前请先保存当前修改。"
      show-icon
      type="info"
    />

    <Card class="help-card">
      <Spin :spinning="loading">
        <div class="help-layout">
          <aside class="category-panel">
            <Button
              v-if="canCreate"
              block
              class="create-button"
              type="primary"
              @click="handleCreate"
            >
              新增分类
            </Button>
            <div v-if="list.length > 0" class="category-list">
              <button
                v-for="(item, index) in list"
                :key="String(item.Id)"
                class="category-item"
                :class="{ active: currentData.Id === item.Id }"
                type="button"
                @click="selectItem(item, index)"
              >
                <span>{{ item.Tag || '未命名分类' }}</span>
                <small>第 {{ index + 1 }} 项</small>
              </button>
            </div>
            <Empty
              v-else
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="暂无分类"
            />
          </aside>

          <main class="editor-panel">
            <div class="editor-toolbar">
              <div class="category-name">
                <span>分类名称</span>
                <Input
                  v-model:value="currentData.Tag"
                  :disabled="list.length === 0"
                  :maxlength="100"
                  placeholder="请输入分类名称"
                />
              </div>
              <Space wrap>
                <template v-if="canSort">
                  <span class="muted">排序：</span>
                  <Button
                    :disabled="upDisabled || list.length === 0"
                    @click="handleSort('up')"
                  >
                    上移
                  </Button>
                  <Button
                    :disabled="downDisabled || list.length === 0"
                    @click="handleSort('down')"
                  >
                    下移
                  </Button>
                </template>
                <Button
                  v-if="canDelete"
                  danger
                  :disabled="!currentData.Id"
                  @click="handleDelete"
                >
                  删除分类
                </Button>
                <Button
                  v-if="canSave"
                  type="primary"
                  :disabled="list.length === 0"
                  :loading="saving"
                  @click="handleSave"
                >
                  保存
                </Button>
              </Space>
            </div>
            <RichTextEditor
              v-model="currentData.Content"
              :disabled="list.length === 0"
              :min-height="430"
              placeholder="请输入帮助内容，可插入图片"
            />
          </main>
        </div>
      </Spin>
    </Card>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="saving"
      title="新增帮助分类"
      width="780px"
      @ok="submitCreate"
    >
      <div class="modal-scroll">
        <Form :label-col="{ span: 4 }">
          <Form.Item label="语言组">
            <span>{{
              langGroups.find(
                (item) => String(item.Id) === String(activeLangGroupId),
              )?.Name || '默认语言'
            }}</span>
          </Form.Item>
          <Form.Item label="分类名称" required>
            <Input
              v-model:value="addForm.Tag"
              :maxlength="100"
              placeholder="请输入分类名称"
            />
          </Form.Item>
          <Form.Item label="帮助内容" required>
            <RichTextEditor
              v-model="addForm.Content"
              :min-height="300"
              placeholder="请输入帮助内容，可插入图片"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无帮助中心查看权限" title="403" />
</template>

<style scoped>
.help-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.lang-switch {
  margin-left: 14px;
}

.muted {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.help-note {
  margin-top: 12px;
}

.help-card {
  margin-top: 12px;
  border-radius: 10px;
}

.help-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  min-height: 590px;
}

.category-panel {
  padding-right: 14px;
  border-right: 1px solid hsl(var(--border));
}

.create-button {
  margin-bottom: 12px;
}

.category-list {
  max-height: 535px;
  overflow: auto;
}

.category-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 11px 10px;
  text-align: left;
  border-bottom: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.category-item small {
  flex: none;
  color: hsl(var(--muted-foreground));
}

.category-item:hover {
  background: hsl(var(--muted) / 45%);
}

.category-item.active {
  font-weight: 600;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 10%);
}

.editor-panel {
  min-width: 0;
  padding-left: 16px;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid hsl(var(--border));
}

.category-name {
  display: grid;
  grid-template-columns: auto minmax(180px, 280px);
  gap: 10px;
  align-items: center;
}

.modal-scroll {
  max-height: 72vh;
  padding-right: 8px;
  overflow: auto;
}

@media (max-width: 900px) {
  .help-layout {
    grid-template-columns: 1fr;
  }

  .category-panel {
    padding-right: 0;
    padding-bottom: 14px;
    border-right: 0;
    border-bottom: 1px solid hsl(var(--border));
  }

  .category-list {
    max-height: 240px;
  }

  .editor-panel {
    padding-top: 14px;
    padding-left: 0;
  }
}
</style>
