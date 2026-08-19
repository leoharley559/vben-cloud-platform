<script lang="ts" setup>
/* eslint-disable vue/no-v-html -- renders trusted admin-authored rich text */
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
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createGameHelpContentApi,
  createGameHelpTabApi,
  deleteGameHelpContentApi,
  deleteGameHelpTabApi,
  fetchGameHelpContentsApi,
  fetchGameHelpTabsApi,
  recoverGameHelpApi,
  sortGameHelpApi,
  updateGameHelpContentApi,
  updateGameHelpTabApi,
} from '#/api/gameManage/system-setting';
import { getProjectConfigApi } from '#/api/core/project';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { getServiceImageUrl } from '#/utils/media';

import SystemImageField from './system-image-field.vue';

defineOptions({ name: 'GameHelpPanel' });

interface HelpTab extends Record<string, unknown> {
  Desc?: string;
  Icon?: string;
  Id: number | string;
  IsJump?: number;
  Name: string;
  Sort?: number;
}
interface HelpContent extends Record<string, unknown> {
  Content?: string | string[];
  Id?: number | string;
  LangText?: string;
  SecIcon?: string;
  SecName?: string;
  TabId?: number | string;
  TabName?: string;
  ThirdIcon?: string;
  ThirdName?: string;
  children?: HelpContent[];
  parentIcon?: string;
  parentName?: string;
  source?: HelpContent;
}
interface LangContent {
  Content: string;
  LangGroupId: number;
  SecIcon: string;
  SecName: string;
}

const HELP_UPLOAD_URL = '/api/gamehelpcenter/uploadimage';
const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();
const loading = ref(false);
const saving = ref(false);
const tabs = ref<HelpTab[]>([]);
const allContents = ref<HelpContent[]>([]);
const activeIndex = ref(0);
const tabVisible = ref(false);
const tabEditing = ref(false);
const contentVisible = ref(false);
const contentEditing = ref(false);
const langVisible = ref(false);
const selectedLangGroup = ref<number>();
const tabForm = reactive<Partial<HelpTab>>({});
const contentForm = reactive<Record<string, unknown>>({});
const langForms = ref<LangContent[]>([]);
const editingSource = ref<HelpContent>();

const langGroups = computed(() =>
  (cloudStore.projectConfig?.LangGroup || []).map((item) => ({
    Default: Boolean(item.Default),
    Id: Number(item.Id),
    Languages: Array.isArray(item.Languages)
      ? item.Languages
      : String(item.Languages || '').split(','),
    Name: String(item.Name || `语言组 ${item.Id}`),
  })),
);
// 对齐旧站 currentLangGroupId：优先 Default
const currentLangGroupId = computed(() => {
  const preferred =
    langGroups.value.find((item) => item.Default) || langGroups.value[0];
  return Number(preferred?.Id || 0);
});
const activeTab = computed(() => tabs.value[activeIndex.value]);
const secondaryOptions = computed(() =>
  displayContents.value
    .filter((item) => item.children?.length)
    .map((item) => ({
      icon: item.SecIcon,
      label: item.SecName,
      value: item.SecName,
    })),
);
const columns: TableColumnsType<HelpContent> = [
  { key: 'index', title: '序号', width: 70 },
  { dataIndex: 'SecName', key: 'SecName', title: '页签', width: 200 },
  { key: 'SecIcon', title: '图标', width: 130 },
  { key: 'Content', title: '说明' },
  { key: 'language', title: '多语言设置', width: 130 },
  { fixed: 'right', key: 'action', title: '操作', width: 150 },
];

function parseLangText(value: unknown) {
  if (!value || value === 'null') return [] as LangContent[];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return (Array.isArray(parsed) ? parsed : Object.values(parsed || {})) as LangContent[];
  } catch {
    return [];
  }
}

function localized(row: HelpContent) {
  const item = structuredClone(row);
  const lang = parseLangText(row.LangText).find(
    (entry) => Number(entry.LangGroupId) === currentLangGroupId.value,
  );
  if (lang) {
    item.SecName = lang.SecName;
    item.SecIcon = lang.SecIcon;
    item.Content = lang.Content;
  }
  return item;
}

const displayContents = computed(() => {
  const current = activeTab.value;
  if (!current) return [];
  const source = allContents.value
    .filter(
      (item) =>
        String(item.TabId || item.TabName) === String(current.Id) ||
        item.TabName === current.Name,
    )
    .filter((item) => Number(item.IsJump || 0) !== 1)
    .map((item) => ({ ...localized(item), source: item }));
  const standalone: HelpContent[] = [];
  const groups = new Map<string, HelpContent>();
  for (const item of source) {
    if (!item.ThirdName) {
      standalone.push({
        ...item,
        Content: String(item.Content || '').split(/\n|\\n/).filter(Boolean),
      });
      continue;
    }
    const name = String(item.SecName || '');
    if (!groups.has(name)) {
      groups.set(name, {
        Id: `${item.Id}-group`,
        SecIcon: item.SecIcon,
        SecName: name,
        children: [],
      });
    }
    groups.get(name)!.children!.push({
      ...item,
      Content: String(item.Content || '').split(/\n|\\n/).filter(Boolean),
      SecIcon: item.ThirdIcon,
      SecName: item.ThirdName,
      parentIcon: item.SecIcon,
      parentName: name,
    });
  }
  return [...standalone, ...groups.values()];
});

async function loadData() {
  loading.value = true;
  try {
    if (!cloudStore.projectConfig?.LangGroup?.length) {
      await getProjectConfigApi().catch(() => undefined);
    }
    const [tabData, contentData] = await Promise.all([
      fetchGameHelpTabsApi(),
      fetchGameHelpContentsApi(),
    ]);
    tabs.value = Array.isArray(tabData) ? (tabData as HelpTab[]) : [];
    allContents.value = Array.isArray(contentData)
      ? (contentData as HelpContent[])
      : [];
    if (activeIndex.value >= tabs.value.length) activeIndex.value = 0;
  } finally {
    loading.value = false;
  }
}

function selectTab(index: number) {
  activeIndex.value = index;
}

function openTab(row?: HelpTab) {
  Object.keys(tabForm).forEach((key) => delete tabForm[key]);
  tabEditing.value = !!row;
  Object.assign(
    tabForm,
    row ? structuredClone(row) : { Desc: '', Icon: '', Name: '' },
  );
  tabVisible.value = true;
}

async function saveTab() {
  if (!String(tabForm.Name || '').trim() || !tabForm.Icon || !String(tabForm.Desc || '').trim()) {
    message.warning('请完整填写页签名称、图标和页签介绍');
    return;
  }
  saving.value = true;
  try {
    await (tabEditing.value ? updateGameHelpTabApi({ ...tabForm }) : createGameHelpTabApi({ ...tabForm }));
    tabVisible.value = false;
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

function resetContentForm() {
  Object.keys(contentForm).forEach((key) => delete contentForm[key]);
  Object.assign(contentForm, {
    Content: '',
    Id: undefined,
    LangText: '',
    SecIcon: '',
    SecMode: 2,
    SecName: '',
    TabId: activeTab.value?.Id,
    ThirdIcon: '',
    ThirdName: '',
    UseThird: false,
  });
}

function openContent(row?: HelpContent) {
  resetContentForm();
  contentEditing.value = !!row;
  editingSource.value = row?.source || row;
  if (row) {
    const source = row.source || row;
    const content = Array.isArray(row.Content)
      ? row.Content.join('\n')
      : String(row.Content || '');
    Object.assign(contentForm, {
      ...structuredClone(source),
      Content: content,
      SecIcon: row.parentIcon || row.SecIcon || '',
      SecMode: row.parentName ? 1 : 2,
      SecName: row.parentName || row.SecName || '',
      ThirdIcon: row.parentName ? row.SecIcon : '',
      ThirdName: row.parentName ? row.SecName : '',
      UseThird: !!row.parentName,
    });
  }
  contentVisible.value = true;
}

function selectSecondary(value: unknown) {
  const matched = secondaryOptions.value.find(
    (item) => item.value === value,
  );
  contentForm.SecIcon = matched?.icon || '';
  contentForm.UseThird = true;
}

function mergeCurrentLangText() {
  const items = parseLangText(contentForm.LangText);
  const current: LangContent = {
    Content: String(contentForm.Content || ''),
    LangGroupId: currentLangGroupId.value,
    SecIcon: String(contentForm.SecIcon || ''),
    SecName: String(contentForm.SecName || ''),
  };
  const index = items.findIndex(
    (item) => Number(item.LangGroupId) === currentLangGroupId.value,
  );
  if (index === -1) {items.push(current);}
  else {items[index] = current;}
  return JSON.stringify(items);
}

async function saveContent() {
  const secName = String(contentForm.SecName || '').trim();
  const content = String(contentForm.Content || '').trim();
  const useThird = Boolean(contentForm.UseThird);
  if (
    !secName ||
    !content ||
    !contentForm.SecIcon ||
    (useThird &&
      (!String(contentForm.ThirdName || '').trim() ||
        !contentForm.ThirdIcon))
  ) {
    message.warning('请完整填写页签名称、图片和说明');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...editingSource.value,
      Id: contentForm.Id,
      LangText: mergeCurrentLangText(),
      SecName: secName,
      TabId: activeTab.value?.Id,
      ThirdIcon: useThird ? contentForm.ThirdIcon : '',
      ThirdName: useThird ? contentForm.ThirdName : '',
    };
    if (contentEditing.value) await updateGameHelpContentApi(payload);
    else {
      delete payload.Id;
      await createGameHelpContentApi(payload);
    }
    contentVisible.value = false;
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

function confirmDeleteTab() {
  const current = activeTab.value;
  if (!current) return;
  Modal.confirm({
    content: `确定删除页签“${current.Name}”吗？`,
    okType: 'danger',
    onOk: async () => {
      await deleteGameHelpTabApi(current.Id);
      message.success('删除成功');
      await loadData();
    },
    title: '删除页签',
  });
}

function confirmDeleteContent(row: HelpContent) {
  // 分组父行 Id 为合成值，禁止误删
  if (row.Id === undefined || row.children?.length || String(row.Id).includes('-group')) {
    return;
  }
  const id = row.Id;
  Modal.confirm({
    content: `确定删除“${row.SecName}”吗？`,
    okType: 'danger',
    onOk: async () => {
      await deleteGameHelpContentApi(id);
      message.success('删除成功');
      await loadData();
    },
    title: '删除选项',
  });
}

function recover() {
  Modal.confirm({
    content: '恢复默认配置将覆盖当前帮助中心设置，确定继续吗？',
    onOk: async () => {
      await recoverGameHelpApi();
      message.success('恢复成功');
      await loadData();
    },
    title: '恢复默认配置',
  });
}

async function moveTab(distance: number) {
  const target = tabs.value[activeIndex.value + distance];
  const current = activeTab.value;
  if (!target || !current) return;
  await sortGameHelpApi({ Id1: current.Id, Id2: target.Id });
  activeIndex.value += distance;
  message.success('排序成功');
  await loadData();
}

function openLanguage(row: HelpContent) {
  editingSource.value = row.source || row;
  const existing = parseLangText(editingSource.value.LangText);
  langForms.value = langGroups.value.map((group) => {
    const found = existing.find(
      (item) => Number(item.LangGroupId) === group.Id,
    );
    return (
      found || {
        Content: '',
        LangGroupId: group.Id,
        SecIcon: '',
        SecName: '',
      }
    );
  });
  selectedLangGroup.value = langForms.value[0]?.LangGroupId;
  langVisible.value = true;
}

async function saveLanguages() {
  if (
    langForms.value.some(
      (item) =>
        !item.SecName.trim() ||
        !item.SecIcon ||
        !item.Content.trim(),
    )
  ) {
    message.warning('请完整填写每个语言组的页签名称、图片和说明');
    return;
  }
  saving.value = true;
  try {
    await updateGameHelpContentApi({
      ...editingSource.value,
      LangText: JSON.stringify(langForms.value),
    });
    langVisible.value = false;
    message.success('多语言设置保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (checkPermission(11_004)) loadData();
});
</script>

<template>
  <div v-if="checkPermission(11_004)" class="help-layout">
    <Card class="side-card" size="small">
      <div class="side-actions">
        <Button v-if="checkPermission(11_005)" type="primary" @click="openTab()">
          添加页签
        </Button>
        <Button v-if="checkPermission(11_011)" @click="recover">恢复默认配置</Button>
      </div>
      <div class="tab-list">
        <button
          v-for="(item, index) in tabs"
          :key="item.Id"
          class="tab-item"
          :class="{ active: index === activeIndex }"
          type="button"
          @click="selectTab(index)"
        >
          <Image v-if="item.Icon" :preview="false" :src="getServiceImageUrl(item.Icon)" :width="28" />
          <span>{{ item.Name }}</span>
          <Button
            v-if="checkPermission(11_009)"
            size="small"
            type="link"
            @click.stop="openTab(item)"
          >
            编辑
          </Button>
        </button>
      </div>
    </Card>

    <Card class="content-card" :bordered="false" :loading="loading">
      <div v-if="activeTab" class="content-header">
        <div class="description">
          <strong>页签介绍：</strong>
          <span v-html="activeTab.Desc"></span>
        </div>
        <Space wrap>
          <span>排序位置：</span>
          <Button
            v-if="checkPermission(11_009)"
            :disabled="activeIndex === 0"
            @click="moveTab(-1)"
          >
            上移
          </Button>
          <Button
            v-if="checkPermission(11_009)"
            :disabled="activeIndex === tabs.length - 1"
            @click="moveTab(1)"
          >
            下移
          </Button>
          <Button
            v-if="checkPermission(11_007) && activeTab.IsJump !== 1"
            danger
            @click="confirmDeleteTab"
          >
            删除页签
          </Button>
          <Button
            v-if="checkPermission(11_008) && activeTab.IsJump !== 1"
            type="primary"
            @click="openContent()"
          >
            添加选项
          </Button>
        </Space>
      </div>
      <Table
        :columns="columns"
        :data-source="displayContents"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        :scroll="{ x: 1050 }"
        children-column-name="children"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <span v-if="column.key === 'index'">{{ index + 1 }}</span>
          <Image
            v-else-if="column.key === 'SecIcon' && record.SecIcon"
            :height="50"
            :src="getServiceImageUrl(record.SecIcon)"
            :width="50"
          />
          <template v-else-if="column.key === 'Content'">
            <span v-if="record.children">--</span>
            <div
              v-for="(line, lineIndex) in record.Content"
              v-else
              :key="lineIndex"
              class="content-line"
              v-html="line"
            ></div>
          </template>
          <Button
            v-else-if="
              column.key === 'language' &&
              !record.children &&
              langGroups.length > 1 &&
              checkPermission(11_009)
            "
            size="small"
            @click="openLanguage(record)"
          >
            多语言
          </Button>
          <Space v-else-if="column.key === 'action' && !record.children">
            <Button
              v-if="checkPermission(11_009)"
              size="small"
              type="primary"
              @click="openContent(record)"
            >
              编辑
            </Button>
            <Button
              v-if="checkPermission(11_010)"
              danger
              size="small"
              @click="confirmDeleteContent(record)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="tabVisible"
      :confirm-loading="saving"
      :title="tabEditing ? '编辑页签' : '添加页签'"
      width="720px"
      @ok="saveTab"
    >
      <Form :label-col="{ span: 5 }">
        <Form.Item label="页签名称" required>
          <Input v-model:value="tabForm.Name" :maxlength="50" />
        </Form.Item>
        <Form.Item label="页签图标" required>
          <SystemImageField
            v-model="tabForm.Icon"
            :action="HELP_UPLOAD_URL"
            :expected-height="110"
            :expected-width="110"
            hint="JPG/PNG，严格 110×110，小于 160KB"
            :max-size-kb="160"
          />
        </Form.Item>
        <Form.Item label="页签介绍" required>
          <RichTextEditor v-model="tabForm.Desc" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="contentVisible"
      :confirm-loading="saving"
      :title="contentEditing ? '编辑选项' : '添加选项'"
      width="760px"
      @ok="saveContent"
    >
      <div class="modal-scroll">
        <Form :label-col="{ span: 6 }">
          <Form.Item label="二级页签内容" required>
            <Radio.Group v-model:value="contentForm.SecMode as number">
              <Radio :value="1" :disabled="secondaryOptions.length === 0">原有页签</Radio>
              <Radio :value="2">新页签</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="二级页签名称" required>
            <Select
              v-if="contentForm.SecMode === 1"
              v-model:value="contentForm.SecName as string"
              :options="secondaryOptions"
              @change="selectSecondary"
            />
            <Input v-else v-model:value="contentForm.SecName as string" />
          </Form.Item>
          <Form.Item label="二级页签图片" required>
            <SystemImageField
              v-model="contentForm.SecIcon as string"
              :action="HELP_UPLOAD_URL"
              :expected-height="110"
              :expected-width="110"
              hint="JPG/PNG，严格 110×110，小于 160KB"
              :max-size-kb="160"
            />
          </Form.Item>
          <Form.Item label="启用三级页签">
            <Radio.Group v-model:value="contentForm.UseThird as boolean">
              <Radio :value="true">启用</Radio>
              <Radio :value="false" :disabled="contentForm.SecMode === 1">不启用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item v-if="contentForm.UseThird" label="三级页签名称" required>
            <Input v-model:value="contentForm.ThirdName as string" />
          </Form.Item>
          <Form.Item v-if="contentForm.UseThird" label="三级页签图片" required>
            <SystemImageField
              v-model="contentForm.ThirdIcon as string"
              :action="HELP_UPLOAD_URL"
              :expected-height="110"
              :expected-width="110"
              hint="JPG/PNG，严格 110×110，小于 160KB"
              :max-size-kb="160"
            />
          </Form.Item>
          <Form.Item label="说明" required>
            <RichTextEditor v-model="contentForm.Content as string" />
          </Form.Item>
        </Form>
      </div>
    </Modal>

    <Modal
      v-model:open="langVisible"
      :confirm-loading="saving"
      title="多语言设置"
      width="760px"
      @ok="saveLanguages"
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
      <div class="modal-scroll lang-form">
        <Form
          v-for="item in langForms"
          v-show="item.LangGroupId === selectedLangGroup"
          :key="item.LangGroupId"
          :label-col="{ span: 6 }"
        >
          <Form.Item label="二级页签内容" required>
            <Input v-model:value="item.SecName" />
          </Form.Item>
          <Form.Item label="二级页签图片" required>
            <SystemImageField
              v-model="item.SecIcon"
              :action="HELP_UPLOAD_URL"
              :expected-height="110"
              :expected-width="110"
              hint="JPG/PNG，严格 110×110，小于 160KB"
              :max-size-kb="160"
            />
          </Form.Item>
          <Form.Item label="说明" required>
            <RichTextEditor v-model="item.Content" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.help-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 14px;
}

.side-card,
.content-card {
  min-width: 0;
  border-radius: 10px;
}

.side-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tab-list {
  max-height: calc(100vh - 250px);
  overflow: auto;
}

.tab-item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 9px 8px;
  text-align: left;
  border-bottom: 1px solid hsl(var(--border));
}

.tab-item.active {
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
}

.content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid hsl(var(--border));
}

.description {
  min-width: 0;
}

.content-line {
  margin: 3px 0;
}

.modal-scroll {
  max-height: 70vh;
  padding-right: 8px;
  overflow: auto;
}

.lang-form {
  margin-top: 18px;
}

@media (max-width: 1000px) {
  .help-layout {
    grid-template-columns: 1fr;
  }

  .tab-list {
    max-height: 280px;
  }
}
</style>
