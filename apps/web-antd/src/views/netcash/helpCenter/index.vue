<script lang="ts" setup>
import type { HelpCenterItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  Modal,
  Result,
  Space,
  message,
} from 'ant-design-vue';

import {
  createHelpCenterApi,
  deleteHelpCenterApi,
  fetchHelpCenterListApi,
  sortHelpCenterApi,
  updateHelpCenterApi,
} from '#/api/netcash/help-center';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'HelpCenter' });

const { checkPermission } = useCloudPermission();

const canViewPage = computed(() => checkPermission(10690));
const canCreate = computed(() => checkPermission(10693));
const canSort = computed(() => checkPermission(1209));
const canSave = computed(() => checkPermission(10704));
const canDelete = computed(() => checkPermission(10705));

const loading = ref(false);
const list = ref<HelpCenterItem[]>([]);
const currentIndex = ref(0);
const currentData = ref<HelpCenterItem>({ Content: '', Tag: '' });

const upDisabled = computed(() => currentIndex.value <= 0);
const downDisabled = computed(
  () => !list.value.length || currentIndex.value >= list.value.length - 1,
);

async function loadList(selectFirst = false) {
  loading.value = true;
  try {
    const result = await fetchHelpCenterListApi({});
    list.value = result.Items || [];
    if (list.value.length && (selectFirst || !currentData.value.Id)) {
      selectItem(list.value[0]!, 0);
    }
  } finally {
    loading.value = false;
  }
}

function selectItem(item: HelpCenterItem, index: number) {
  currentIndex.value = index;
  currentData.value = { ...item };
}

async function handleCreate() {
  Modal.confirm({
    content: '确认新增帮助标签？',
    onOk: async () => {
      await createHelpCenterApi({ Content: '', Tag: '新标签' });
      message.success('创建成功');
      await loadList(true);
    },
    title: '新增标签',
  });
}

async function handleSave() {
  if (!currentData.value.Tag?.trim()) {
    message.warning('请输入标签名称');
    return;
  }
  loading.value = true;
  try {
    if (currentData.value.Id) {
      await updateHelpCenterApi(currentData.value);
    } else {
      await createHelpCenterApi(currentData.value);
    }
    message.success('保存成功');
    await loadList();
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (!currentData.value.Id) {
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
  if (!current?.Id || !target?.Id) {
    return;
  }
  await sortHelpCenterApi({ Id1: current.Id, Id2: target.Id });
  message.success('排序已更新');
  await loadList();
  selectItem(list.value[targetIndex]!, targetIndex);
}

onMounted(() => {
  if (canViewPage.value) {
    loadList(true);
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 帮助中心"
    title="帮助中心"
  >
    <Card :loading="loading">
      <div class="flex min-h-[560px] gap-4">
        <div class="w-56 shrink-0 border-r pr-3">
          <Button
            v-if="canCreate"
            block
            class="mb-3"
            type="primary"
            @click="handleCreate"
          >
            新增标签
          </Button>
          <div class="space-y-1">
            <div
              v-for="(item, index) in list"
              :key="String(item.Id)"
              class="cursor-pointer rounded px-3 py-2 text-sm"
              :class="
                currentData.Id === item.Id
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100'
              "
              @click="selectItem(item, index)"
            >
              {{ item.Tag }}
            </div>
          </div>
        </div>

        <div class="flex-1">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span>标签名称</span>
              <Input v-model:value="currentData.Tag" style="width: 220px" />
            </div>
            <Space>
              <template v-if="canSort">
                <Button :disabled="upDisabled" @click="handleSort('up')">
                  上移
                </Button>
                <Button :disabled="downDisabled" @click="handleSort('down')">
                  下移
                </Button>
              </template>
              <Button v-if="canDelete" danger @click="handleDelete"
                >删除</Button
              >
              <Button v-if="canSave" type="primary" @click="handleSave">
                保存
              </Button>
            </Space>
          </div>
          <Input.TextArea
            v-model:value="currentData.Content"
            :rows="18"
            placeholder="帮助内容（支持 HTML）"
          />
        </div>
      </div>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无帮助中心查看权限" title="403" />
</template>
