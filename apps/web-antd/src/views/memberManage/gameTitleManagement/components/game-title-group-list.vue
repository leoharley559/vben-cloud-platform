<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameTitleGroupItem } from '#/types/game-title';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Space,
  Switch,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createGameTitleGroupApi,
  deleteGameTitleGroupApi,
  editGameTitleGroupApi,
  fetchGameTitleGroupListApi,
  updateGameTitleGroupSwitchApi,
} from '#/api/memberManage/game-title';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'GameTitleGroupList' });

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(13151));
const canAdd = computed(() => checkPermission(13152));
const canEdit = computed(() => checkPermission(13153));
const canDelete = computed(() => checkPermission(13154));
const canSwitch = computed(() => checkPermission(13155));

const filterName = ref('');
const formOpen = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const formLoading = ref(false);
const editingId = ref<number | string>();
const formName = ref('');
const formOrdinal = ref(1);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function openForm(mode: 'add' | 'edit', row?: GameTitleGroupItem) {
  formMode.value = mode;
  editingId.value = row?.Id;
  formName.value = row?.Name || '';
  formOrdinal.value = row?.Ordinal || 1;
  formOpen.value = true;
}

async function handleSubmit() {
  if (!formName.value.trim()) {
    message.warning('请输入称号类别名称');
    return;
  }
  formLoading.value = true;
  try {
    const payload = {
      Id: editingId.value,
      Name: formName.value.trim(),
      Ordinal: formOrdinal.value,
    };
    if (formMode.value === 'add') {
      await createGameTitleGroupApi(payload);
      message.success('新增成功');
    } else {
      await editGameTitleGroupApi(payload);
      message.success('编辑成功');
    }
    formOpen.value = false;
    gridApi.reload();
  } finally {
    formLoading.value = false;
  }
}

async function handleSwitch(row: GameTitleGroupItem, checked: boolean) {
  if (!row.Id) {
    return;
  }
  const nextSwitch = checked ? 1 : 0;
  const previous = row.Switch;
  row.Switch = nextSwitch;
  try {
    await updateGameTitleGroupSwitchApi({ Id: row.Id, Switch: nextSwitch });
    message.success('状态已更新');
  } catch {
    row.Switch = previous;
  }
}

function handleDelete(row: GameTitleGroupItem) {
  if (!row.Id) {
    return;
  }
  if (Number(row.UseCount || 0) >= 1) {
    message.warning('该类别下仍有称号，无法删除');
    return;
  }
  Modal.confirm({
    content: `确认删除称号类别「${row.Name || row.Id}」？`,
    onOk: async () => {
      await deleteGameTitleGroupApi(row.Id!);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除确认',
  });
}

const gridOptions: VxeTableGridOptions<GameTitleGroupItem> = {
  columns: [
    {
      field: 'Switch',
      slots: { default: 'switch' },
      title: '开关',
      width: 90,
    },
    { field: 'Ordinal', title: '排序', width: 80 },
    { field: 'Name', minWidth: 160, title: '称号类别' },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '最后操作时间',
    },
    { field: 'OperatorName', minWidth: 120, title: '操作人' },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 140,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchGameTitleGroupListApi({
          Name: filterName.value,
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        return {
          items: result.Items || [],
          total: Number(result.Pagination?.MaxCount || 0),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <OpsListPanel v-if="canViewTable">
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入类别名称"
        >
          <template #addonBefore>类别名称</template>
        </Input>
      </div>
        <div class="query-filter-actions">
          <Space>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button v-if="canAdd" type="primary" @click="openForm('add')">
          新增类别
        </Button>
      </Space>
        </div>
      </template>

    <Grid>
      <template #switch="{ row }">
        <Switch
          :checked="row.Switch === 1"
          :disabled="!canSwitch"
          @change="(checked) => handleSwitch(row, Boolean(checked))"
        />
      </template>
      <template #actions="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openForm('edit', row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="formOpen"
      :confirm-loading="formLoading"
      :title="formMode === 'add' ? '新增称号类别' : '编辑称号类别'"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <Form.Item label="类别名称" required>
          <Input v-model:value="formName" placeholder="请输入" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber v-model:value="formOrdinal" :min="1" class="w-full" />
        </Form.Item>
      </Form>
    </Modal>
  </OpsListPanel>
  <Result v-else status="403" sub-title="无称号类别查看权限" title="403" />
</template>
