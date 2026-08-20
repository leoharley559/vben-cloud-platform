<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, message, Modal, Space, Table } from 'ant-design-vue';

import { fetchAdActivityJumpListApi } from '#/api/operationManage/game-notice';
import {
  createRewardTaskApi,
  deleteRewardTaskApi,
  fetchRewardTaskListApi,
  switchRewardTaskSortApi,
  updateRewardTaskApi,
} from '#/api/operationManage/reward-mall';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { ACTIVITY_TYPE_OPTIONS } from '#/utils/bonus-reward';
import { getServiceImageUrl } from '#/utils/media';

import GoodsTaskUpsertModal from './goods-task-upsert-modal.vue';
import {
  assembleTaskPayload,
  breakupTaskDetail,
  parseLangTextMap,
  resolveLangGroupIds,
  SORT_SWITCH_TYPE,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsTaskManageModal' });

const open = defineModel<boolean>('open', { default: false });

interface TaskRow {
  Id: number | string;
  Jump: string;
  LangText?: unknown;
}

const cloudStore = useCloudPlatformStore();

const loading = ref(false);
const sortingId = ref<number | string>();
const tasks = ref<TaskRow[]>([]);
const activityNameMap = ref<Record<string, string>>({});
const activityTypeMap = ref<Record<string, number>>({});

const upsertOpen = ref(false);
const upsertMode = ref<'add' | 'edit'>('add');
const upsertTask = ref<null | Record<string, unknown>>(null);

function extractLangTitle(raw: unknown, fallback: string) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as undefined | { Title?: string };
  return first?.Title || fallback;
}

async function loadActivityMaps() {
  try {
    const result = await fetchAdActivityJumpListApi();
    const list = Array.isArray(result)
      ? result
      : (result as { Items?: unknown[] })?.Items || [];
    const items = list as Array<Record<string, unknown>>;
    activityNameMap.value = Object.fromEntries(
      items.map((item) => [
        String(item.Id),
        extractLangTitle(
          item.LangText,
          String(item.Name || item.Title || item.Id),
        ),
      ]),
    );
    activityTypeMap.value = Object.fromEntries(
      items.map((item) => [
        String(item.Id),
        Number(item.Type ?? item.ActivityType ?? Number.NaN),
      ]),
    );
  } catch {
    activityNameMap.value = {};
    activityTypeMap.value = {};
  }
}

async function loadTasks() {
  loading.value = true;
  try {
    const result = await fetchRewardTaskListApi();
    tasks.value = (result.Items || []) as unknown as TaskRow[];
  } finally {
    loading.value = false;
  }
}

watch(open, (visible) => {
  if (visible) {
    void loadActivityMaps();
    void loadTasks();
  }
});

function taskName(row: TaskRow) {
  return activityNameMap.value[String(row.Jump)] || `活动${row.Jump}`;
}
function taskType(row: TaskRow) {
  const type = activityTypeMap.value[String(row.Jump)];
  return (
    ACTIVITY_TYPE_OPTIONS.find((item) => item.value === type)?.label || '-'
  );
}

function openAdd() {
  upsertMode.value = 'add';
  upsertTask.value = null;
  upsertOpen.value = true;
}

function openEdit(row: TaskRow) {
  upsertMode.value = 'edit';
  upsertTask.value = breakupTaskDetail(
    row as unknown as Record<string, unknown>,
    resolveLangGroupIds(cloudStore.projectConfig),
  );
  upsertOpen.value = true;
}

async function handleUpsertSubmit(formValue: Record<string, unknown>) {
  const payload = assembleTaskPayload(formValue, {
    langGroupIds: resolveLangGroupIds(cloudStore.projectConfig),
    mode: upsertMode.value,
  });
  if (upsertMode.value === 'add') {
    await createRewardTaskApi(payload);
    message.success('新增成功');
  } else {
    await updateRewardTaskApi(payload);
    message.success('保存成功');
  }
  await loadTasks();
}

function handleDelete(row: TaskRow) {
  Modal.confirm({
    content: `确认删除积分任务「${taskName(row)}」？`,
    onOk: async () => {
      await deleteRewardTaskApi(row.Id);
      message.success('删除成功');
      await loadTasks();
    },
    title: '删除确认',
  });
}

async function handleSort(
  row: TaskRow,
  index: number,
  direction: 'bottom' | 'down' | 'top' | 'up',
) {
  let payload: {
    Id1: number | string;
    Id2?: number | string;
    SwitchType: number;
  };
  if (direction === 'top') {
    payload = { Id1: row.Id, SwitchType: SORT_SWITCH_TYPE.TOP };
  } else if (direction === 'bottom') {
    payload = { Id1: row.Id, SwitchType: SORT_SWITCH_TYPE.BOTTOM };
  } else {
    const siblingIndex = direction === 'up' ? index - 1 : index + 1;
    const sibling = tasks.value[siblingIndex];
    if (!sibling) {
      return;
    }
    payload = {
      Id1: row.Id,
      Id2: sibling.Id,
      SwitchType: SORT_SWITCH_TYPE.SWAP,
    };
  }
  sortingId.value = row.Id;
  try {
    await switchRewardTaskSortApi(payload);
    message.success('排序成功');
    await loadTasks();
  } finally {
    sortingId.value = undefined;
  }
}

function taskPic(row: TaskRow, key: 'AppPic' | 'PcPic') {
  const lang = parseLangTextMap(row.LangText);
  const first = Object.values(lang)[0] as Record<string, string> | undefined;
  return first?.[key] || '';
}

const columns = [
  { key: 'index', title: '序号', width: 60 },
  { key: 'name', title: '任务名称' },
  { key: 'type', title: '任务类型', width: 120 },
  { key: 'appPic', title: 'APP 图片', width: 100 },
  { key: 'pcPic', title: 'PC 图片', width: 100 },
  { key: 'sort', title: '排序', width: 260 },
  { key: 'action', title: '操作', width: 150 },
];
</script>

<template>
  <Modal v-model:open="open" :footer="null" title="积分任务" width="1080px">
    <div class="mb-3 flex justify-end">
      <Button type="primary" @click="openAdd">新增积分任务</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="tasks"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">{{ index + 1 }}</template>
        <template v-else-if="column.key === 'name'">
          {{ taskName(record as TaskRow) }}
        </template>
        <template v-else-if="column.key === 'type'">
          {{ taskType(record as TaskRow) }}
        </template>
        <template v-else-if="column.key === 'appPic'">
          <img
            v-if="taskPic(record as TaskRow, 'AppPic')"
            alt="APP图片"
            class="h-9 w-11 rounded border object-contain"
            :src="getServiceImageUrl(taskPic(record as TaskRow, 'AppPic'))"
          />
          <span v-else class="text-gray-400">-</span>
        </template>
        <template v-else-if="column.key === 'pcPic'">
          <img
            v-if="taskPic(record as TaskRow, 'PcPic')"
            alt="PC图片"
            class="h-9 w-11 rounded border object-contain"
            :src="getServiceImageUrl(taskPic(record as TaskRow, 'PcPic'))"
          />
          <span v-else class="text-gray-400">-</span>
        </template>
        <template v-else-if="column.key === 'sort'">
          <Space :size="4">
            <Button
              :loading="sortingId === (record as TaskRow).Id"
              size="small"
              @click="handleSort(record as TaskRow, index, 'top')"
            >
              置顶
            </Button>
            <Button
              :loading="sortingId === (record as TaskRow).Id"
              size="small"
              @click="handleSort(record as TaskRow, index, 'up')"
            >
              上移
            </Button>
            <Button
              :loading="sortingId === (record as TaskRow).Id"
              size="small"
              @click="handleSort(record as TaskRow, index, 'down')"
            >
              下移
            </Button>
            <Button
              :loading="sortingId === (record as TaskRow).Id"
              size="small"
              @click="handleSort(record as TaskRow, index, 'bottom')"
            >
              置底
            </Button>
          </Space>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button
              size="small"
              type="link"
              @click="openEdit(record as TaskRow)"
            >
              编辑
            </Button>
            <Button
              danger
              size="small"
              type="link"
              @click="handleDelete(record as TaskRow)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <GoodsTaskUpsertModal
      v-model:open="upsertOpen"
      :mode="upsertMode"
      :task="upsertTask"
      @submit="handleUpsertSubmit"
    />
  </Modal>
</template>
