<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  message,
  Result,
  Spin,
  Switch,
} from 'ant-design-vue';

import { getProjectConfigApi } from '#/api';
import {
  deleteLanguageGroupApi,
  editLanguageGroupApi,
  fetchLanguageGroupListApi,
} from '#/api/systemManage/extra';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { translateMenuTitle } from '#/utils/menu-i18n';

defineOptions({ name: 'LanguageGroupManage' });

interface LanguageItem {
  checked: boolean;
  display: boolean;
  langKey: string;
  translated: string;
}

interface LanguageGroupItem {
  Default?: boolean;
  Id?: number;
  IsOpen: boolean;
  Languages: LanguageItem[];
  Name: string;
  isEditingName: boolean;
}

const { adminInfo, checkPermission } = useCloudPermission();

const loading = ref(false);
const submitting = ref(false);
const unchanged = ref(true);
const languageGroups = ref<LanguageGroupItem[]>([]);
const fetchedGroups = ref<
  Array<{
    Default?: boolean;
    Id: number;
    IsOpen: boolean;
    Languages: string[];
    Name: string;
  }>
>([]);
const deletedIds = reactive(new Set<number>());
const searchQuery = ref<string[]>([]);

const canViewPage = computed(
  () =>
    checkPermission(12478) || checkPermission(12479) || checkPermission(12480),
);
const canAdd = computed(() => checkPermission(12478));
const canSave = computed(() => checkPermission(12479));
const canDelete = computed(() => checkPermission(12480));

function getAdminLanguages(): string[] {
  const admin = adminInfo.value?.Admin as
    | { Languages?: string | string[] }
    | undefined;
  const raw = admin?.Languages;
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(/\s*,\s*/).filter(Boolean);
  }
  return [];
}

function normalizeLanguages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/\s*,\s*/).filter(Boolean);
  }
  return [];
}

function checkedCount(group: LanguageGroupItem) {
  return group.Languages.filter((item) => item.checked).length;
}

function toUiLanguages(keys: string[]): LanguageItem[] {
  return keys.map((langKey) => ({
    checked: false,
    display: true,
    langKey,
    translated: translateMenuTitle(langKey) || langKey,
  }));
}

function resetFromFetched() {
  const unusedKeys = new Set(getAdminLanguages());
  for (const group of fetchedGroups.value) {
    for (const lang of group.Languages) {
      unusedKeys.delete(lang);
    }
  }

  const idleGroup: LanguageGroupItem = {
    Id: -1,
    IsOpen: false,
    Languages: toUiLanguages([...unusedKeys]),
    Name: translateMenuTitle('idleLanguageGroup') || '闲置群组',
    isEditingName: false,
  };

  languageGroups.value = [
    idleGroup,
    ...fetchedGroups.value.map((group) => ({
      Default: group.Default,
      Id: group.Id,
      IsOpen: Boolean(group.IsOpen),
      Languages: toUiLanguages(group.Languages),
      Name: group.Name,
      isEditingName: false,
    })),
  ];
  deletedIds.clear();
  searchQuery.value = languageGroups.value.map(() => '');
  unchanged.value = true;
}

async function loadGroups() {
  loading.value = true;
  try {
    const result = await fetchLanguageGroupListApi();
    fetchedGroups.value = (result.Items || []).map((item) => ({
      Default: Boolean(item.Default),
      Id: Number(item.Id),
      IsOpen: Boolean(item.IsOpen),
      Languages: normalizeLanguages(item.Languages),
      Name: String(item.Name || ''),
    }));
    resetFromFetched();
  } finally {
    loading.value = false;
  }
}

function markChanged() {
  unchanged.value = false;
}

function addGroup() {
  languageGroups.value.push({
    IsOpen: true,
    Languages: [],
    Name: `群组${languageGroups.value.length}`,
    isEditingName: false,
  });
  searchQuery.value.push('');
  markChanged();
}

function deleteGroup(index: number) {
  if (index <= 0 || index >= languageGroups.value.length) {
    return;
  }
  const [deleted] = languageGroups.value.splice(index, 1);
  searchQuery.value.splice(index, 1);
  if (!deleted) {
    return;
  }
  languageGroups.value[0]?.Languages.push(...deleted.Languages);
  if (deleted.Id && deleted.Id > 0) {
    deletedIds.add(deleted.Id);
  }
  markChanged();
}

function moveLanguages(sourceIndex: number, targetIndex: number) {
  const source = languageGroups.value[sourceIndex];
  const target = languageGroups.value[targetIndex];
  if (!source || !target) {
    return;
  }
  const moving = source.Languages.filter((item) => item.checked);
  if (moving.length === 0) {
    return;
  }
  target.Languages.push(...moving.map((item) => ({ ...item, checked: false })));
  source.Languages = source.Languages.filter((item) => !item.checked);
  markChanged();
}

function filterGroup(index: number) {
  const group = languageGroups.value[index];
  const query = (searchQuery.value[index] || '').trim();
  if (!group) {
    return;
  }
  for (const lang of group.Languages) {
    lang.display = !query || lang.translated.includes(query);
  }
}

function startEditName(index: number) {
  const group = languageGroups.value[index];
  if (!group || group.Id === -1) {
    return;
  }
  group.isEditingName = true;
}

function finishEditName(index: number) {
  const group = languageGroups.value[index];
  if (!group) {
    return;
  }
  const name = group.Name.trim();
  if (!name) {
    message.error('群组名称不能为空');
    return;
  }
  const duplicated = languageGroups.value.some(
    (item, i) => i !== index && item.Name.trim() === name,
  );
  if (duplicated) {
    message.error('群组名称不能重复');
    return;
  }
  group.Name = name;
  group.isEditingName = false;
  markChanged();
}

function handleSwitchChange(index: number, checked: boolean) {
  const group = languageGroups.value[index];
  if (!group) {
    return;
  }
  if (checked && group.Languages.length === 0) {
    group.IsOpen = false;
    message.error(
      translateMenuTitle('emptyLangGroupError') || '空的语言群组不能被开启',
    );
    return;
  }
  group.IsOpen = checked;
  markChanged();
}

function serializeLanguages(items: LanguageItem[]) {
  return items.map((item) => item.langKey).join(', ');
}

function buildSubmitList() {
  const submitList: Array<{
    Id?: number;
    IsOpen: boolean;
    Languages: string;
    Name: string;
  }> = [];
  const initialGroups = fetchedGroups.value.filter(
    (group) => !deletedIds.has(group.Id),
  );
  const groups = languageGroups.value;

  for (let i = 1; i < groups.length; i += 1) {
    const current = groups[i]!;
    if (current.Id === undefined) {
      for (const item of groups.slice(i)) {
        submitList.push({
          IsOpen: item.Languages.length > 0 ? item.IsOpen : false,
          Languages: serializeLanguages(item.Languages),
          Name: item.Name,
        });
      }
      break;
    }

    const initial = initialGroups[i - 1];
    if (!initial) {
      submitList.push({
        Id: current.Id,
        IsOpen: current.Languages.length > 0 ? current.IsOpen : false,
        Languages: serializeLanguages(current.Languages),
        Name: current.Name,
      });
      continue;
    }

    const currentKeys = current.Languages.map((item) => item.langKey);
    const changed =
      current.Name !== initial.Name ||
      current.IsOpen !== initial.IsOpen ||
      currentKeys.length !== initial.Languages.length ||
      currentKeys.some((key, idx) => key !== initial.Languages[idx]);

    if (changed) {
      submitList.push({
        Id: current.Id,
        IsOpen: currentKeys.length > 0 ? current.IsOpen : false,
        Languages: serializeLanguages(current.Languages),
        Name: current.Name,
      });
    }
  }

  return submitList;
}

async function handleSubmit() {
  for (const group of languageGroups.value) {
    if (group.Id === undefined && group.Languages.length === 0) {
      message.error('新增语言群组不能为空');
      return;
    }
  }

  submitting.value = true;
  try {
    const submitList = buildSubmitList();
    for (const payload of submitList) {
      await editLanguageGroupApi(payload);
    }
    for (const id of deletedIds) {
      await deleteLanguageGroupApi(id);
    }
    await getProjectConfigApi();
    await loadGroups();
    message.success('保存成功');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  if (canViewPage.value) {
    void loadGroups();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="系统管理 · 语言群组"
    title="语言群组管理"
  >
    <Card>
      <div class="mb-4 flex items-center justify-between gap-3">
        <div class="text-base font-medium">语言设置</div>
        <Button v-if="canAdd" type="primary" @click="addGroup">
          添加群组
        </Button>
      </div>

      <Spin :spinning="loading">
        <div
          v-if="languageGroups.length > 0"
          class="flex flex-wrap items-start gap-3"
        >
          <template
            v-for="(group, index) in languageGroups"
            :key="`${group.Id ?? 'new'}-${index}`"
          >
            <div class="flex items-start gap-2">
              <div
                class="w-[220px] overflow-hidden rounded border border-border bg-card"
              >
                <div
                  class="flex items-center gap-2 bg-gray-50 px-3 py-2 text-sm"
                >
                  <Switch
                    v-if="
                      !group.Default && group.Id !== -1 && !group.isEditingName
                    "
                    :checked="group.IsOpen"
                    size="small"
                    @change="(checked) => handleSwitchChange(index, !!checked)"
                  />
                  <Input
                    v-if="group.isEditingName"
                    v-model:value="group.Name"
                    :maxlength="14"
                    size="small"
                    @blur="finishEditName(index)"
                    @press-enter="finishEditName(index)"
                  />
                  <div
                    v-else
                    class="flex min-w-0 flex-1 items-center gap-1"
                    :title="group.Name"
                  >
                    <span
                      v-if="group.Default"
                      class="shrink-0 text-xs text-gray-400"
                    >
                      (默认)
                    </span>
                    <span class="truncate">{{ group.Name }}</span>
                    <Button
                      v-if="group.Id !== -1"
                      type="link"
                      size="small"
                      class="!px-0"
                      @click="startEditName(index)"
                    >
                      编辑
                    </Button>
                  </div>
                  <span class="shrink-0 text-xs text-gray-400">
                    {{ checkedCount(group) }}/{{ group.Languages.length }}
                  </span>
                </div>

                <div class="px-3 py-2">
                  <Input
                    v-model:value="searchQuery[index]"
                    allow-clear
                    size="small"
                    @change="filterGroup(index)"
                    placeholder="请输入搜索语言"
                  />
                </div>

                <div class="h-[220px] overflow-auto px-3 pb-2">
                  <div
                    v-for="lang in group.Languages"
                    v-show="lang.display"
                    :key="lang.langKey"
                    class="py-1"
                  >
                    <Checkbox v-model:checked="lang.checked">
                      {{ lang.translated }}
                    </Checkbox>
                  </div>
                  <Empty
                    v-if="group.Languages.every((item) => !item.display)"
                    :image="Empty.PRESENTED_IMAGE_SIMPLE"
                    description="无匹配语言"
                  />
                </div>

                <div
                  v-if="!group.Default && index !== 0 && canDelete"
                  class="border-t border-gray-100 p-2 text-center"
                >
                  <Button danger size="small" @click="deleteGroup(index)">
                    删除
                  </Button>
                </div>
              </div>

              <div
                v-if="index < languageGroups.length - 1"
                class="flex h-[280px] flex-col justify-center gap-2"
              >
                <Button
                  type="primary"
                  size="small"
                  :disabled="checkedCount(languageGroups[index + 1]!) === 0"
                  @click="moveLanguages(index + 1, index)"
                >
                  ←
                </Button>
                <Button
                  type="primary"
                  size="small"
                  :disabled="checkedCount(group) === 0"
                  @click="moveLanguages(index, index + 1)"
                >
                  →
                </Button>
              </div>
            </div>
          </template>
        </div>
        <Empty v-else description="暂无语言群组" />
      </Spin>

      <div class="mt-6 flex justify-end gap-3">
        <Button :disabled="unchanged || submitting" @click="resetFromFetched">
          取消
        </Button>
        <Button
          v-if="canSave"
          type="primary"
          :disabled="unchanged"
          :loading="submitting"
          @click="handleSubmit"
        >
          确定
        </Button>
      </div>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无语言群组查看权限" title="403" />
</template>
