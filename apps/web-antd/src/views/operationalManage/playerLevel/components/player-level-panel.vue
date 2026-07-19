<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  addPlayerLevelApi,
  deletePlayerLevelApi,
  editPlayerLevelApi,
  fetchPlayerLevelListApi,
  fetchPlayerLevelSchemeOptionsApi,
} from '#/api/operationManage/player-level';
import { fetchWithdrawAutoSchemeListApi } from '#/api/operationManage/withdraw-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import PlayerLevelMembersModal from './player-level-members-modal.vue';

defineOptions({ name: 'PlayerLevelPanel' });

interface LevelRow {
  DefaultLevel?: number;
  Id: number | string;
  LevelName?: string;
  PlayerCount?: number;
  SchemeId?: number;
  SchemeName?: string;
  WithdrawAutoConfigSchemeName?: string;
  WithdrawAutoConfigSchemeNameId?: number;
}

const { checkPermission } = useCloudPermission();
const canFilter = computed(() => checkPermission(12282));
const canAdd = computed(() => checkPermission(12283));
const canEdit = computed(() => checkPermission(12285));
const canDelete = computed(() => checkPermission(12286));

const filterLevelName = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const modalOpen = ref(false);
const submitting = ref(false);
const actionId = ref<number | string>();
const editingId = ref<number | string>();
const schemeOptions = ref<Array<{ label: string; value: number }>>([
  { label: '默认返水方案', value: 0 },
]);
const withdrawSchemeOptions = ref<Array<{ label: string; value: number }>>([]);
const defaultWithdrawSchemeId = ref<number>();

const membersOpen = ref(false);
const membersLevelId = ref<number | string | null>(null);
const membersLevelName = ref('');

const form = reactive({
  LevelName: '',
  SchemeId: 0 as number,
  WithdrawAutoConfigSchemeNameId: undefined as number | undefined,
});

function buildListQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : undefined,
    EndTime: end ? end.endOf('day').unix() : undefined,
    LevelName: canFilter.value ? filterLevelName.value.trim() : undefined,
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<LevelRow> = {
  columns: [
    { type: 'seq', width: 60 },
    {
      field: 'LevelName',
      minWidth: 140,
      slots: { default: 'levelName' },
      title: '会员层级',
    },
    {
      field: 'SchemeName',
      formatter: ({ cellValue, row }) =>
        Number(row.DefaultLevel) === 0 || Number(row.SchemeId) === 0
          ? '默认返水方案'
          : String(cellValue || '-'),
      minWidth: 140,
      title: '返水方案',
    },
    {
      field: 'WithdrawAutoConfigSchemeName',
      formatter: ({ cellValue, row }) =>
        Number(row.DefaultLevel) === 0 ||
        Number(row.WithdrawAutoConfigSchemeNameId) === 0
          ? '默认风控方案'
          : String(cellValue || '-'),
      minWidth: 140,
      title: '风控方案',
    },
    {
      field: 'PlayerCount',
      minWidth: 110,
      slots: { default: 'playerCount' },
      title: '所属会员',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerLevelListApi(buildListQuery(page));
        const items = (result.Items || []) as unknown as LevelRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadSchemes() {
  try {
    const list = await fetchPlayerLevelSchemeOptionsApi();
    const options = list.map((item) => ({
      label: String(item.Name || item.SchemeName || item.Id),
      value: Number(item.Id ?? 0),
    }));
    schemeOptions.value = [
      { label: '默认返水方案', value: 0 },
      ...options.filter((item) => item.value !== 0),
    ];
  } catch {
    schemeOptions.value = [{ label: '默认返水方案', value: 0 }];
  }
}

async function loadWithdrawSchemes() {
  try {
    const list = await fetchWithdrawAutoSchemeListApi();
    const rows = Array.isArray(list) ? list : [];
    withdrawSchemeOptions.value = rows.map((item) => ({
      label: String(item.Name || item.Id),
      value: Number(item.Id ?? 0),
    }));
    const defaultItem = rows.find((item) => Number(item.SchemeType) === 0);
    defaultWithdrawSchemeId.value = defaultItem
      ? Number(defaultItem.Id)
      : withdrawSchemeOptions.value[0]?.value;
  } catch {
    withdrawSchemeOptions.value = [];
    defaultWithdrawSchemeId.value = undefined;
  }
}

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterLevelName.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openCreate() {
  editingId.value = '';
  form.LevelName = '';
  form.SchemeId = 0;
  form.WithdrawAutoConfigSchemeNameId = defaultWithdrawSchemeId.value;
  modalOpen.value = true;
}

function openEdit(row: LevelRow) {
  editingId.value = row.Id;
  form.LevelName = String(row.LevelName || '');
  form.SchemeId = Number(row.SchemeId || 0);
  form.WithdrawAutoConfigSchemeNameId =
    Number(row.WithdrawAutoConfigSchemeNameId) === 0
      ? defaultWithdrawSchemeId.value
      : Number(row.WithdrawAutoConfigSchemeNameId);
  modalOpen.value = true;
}

function openMembers(row: LevelRow) {
  membersLevelId.value = row.Id;
  membersLevelName.value =
    Number(row.DefaultLevel) === 0 ? '未分层' : String(row.LevelName || '');
  membersOpen.value = true;
}

async function submitForm() {
  if (!form.LevelName.trim()) {
    message.warning('请输入层级名称');
    return;
  }
  if (form.SchemeId === undefined || form.SchemeId === null) {
    message.warning('请选择返水方案');
    return;
  }
  if (
    form.WithdrawAutoConfigSchemeNameId === undefined ||
    form.WithdrawAutoConfigSchemeNameId === null
  ) {
    message.warning('请选择风控方案');
    return;
  }
  submitting.value = true;
  try {
    const payload = {
      LevelName: form.LevelName.trim(),
      SchemeId: form.SchemeId,
      WithdrawAutoConfigSchemeNameId: form.WithdrawAutoConfigSchemeNameId,
    };
    if (editingId.value) {
      await editPlayerLevelApi({ ...payload, Id: editingId.value });
      message.success('编辑成功');
    } else {
      await addPlayerLevelApi(payload);
      message.success('新增成功');
    }
    modalOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function handleDelete(row: LevelRow) {
  Modal.confirm({
    content: `确认删除层级「${row.LevelName}」？删除后该层级下会员将回到未分层。`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deletePlayerLevelApi(row.Id);
        message.success('删除成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '提示',
  });
}

onMounted(() => {
  void loadSchemes();
  void loadWithdrawSchemes();
});
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div v-if="canFilter" class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">会员层级</span>
        <Input
          v-model:value="filterLevelName"
          allow-clear
          placeholder="请输入"
          style="width: 200px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">创建时间</span>
        <DatePicker.RangePicker v-model:value="filterDateRange" />
      </div>
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
      <Button v-if="canAdd" type="primary" ghost @click="openCreate">
        新增层级
      </Button>
    </template>

    <Grid>
      <template #levelName="{ row }">
        {{ Number(row.DefaultLevel) === 0 ? '未分层' : row.LevelName || '-' }}
      </template>
      <template #playerCount="{ row }">
        <Button
          v-if="Number(row.DefaultLevel) !== 0"
          type="link"
          class="!px-0"
          @click="openMembers(row)"
        >
          {{ row.PlayerCount ?? 0 }}
        </Button>
        <span v-else>-</span>
      </template>
      <template #action="{ row }">
        <div v-if="Number(row.DefaultLevel) === 1" class="flex flex-wrap gap-1">
          <Button v-if="canEdit" size="small" @click="openEdit(row)">
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            :loading="actionId === row.Id"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </div>
        <span v-else>-</span>
      </template>
    </Grid>
  </OpsListPanel>

  <Modal
    v-model:open="modalOpen"
    :confirm-loading="submitting"
    destroy-on-close
    :title="editingId ? '编辑会员层级' : '新增会员层级'"
    @ok="submitForm"
  >
    <Form layout="vertical" class="pt-2">
      <Form.Item label="会员层级" required>
        <Input
          v-model:value="form.LevelName"
          :maxlength="30"
          placeholder="请输入层级名称"
        />
      </Form.Item>
      <Form.Item label="返水方案" required>
        <Select
          v-model:value="form.SchemeId"
          class="w-full"
          show-search
          option-filter-prop="label"
          :options="schemeOptions"
          placeholder="请选择"
        />
      </Form.Item>
      <Form.Item label="风控方案" required>
        <Select
          v-model:value="form.WithdrawAutoConfigSchemeNameId"
          class="w-full"
          show-search
          option-filter-prop="label"
          :options="withdrawSchemeOptions"
          placeholder="请选择"
        />
      </Form.Item>
    </Form>
  </Modal>

  <PlayerLevelMembersModal
    v-model:open="membersOpen"
    :level-id="membersLevelId"
    :level-name="membersLevelName"
    @refreshed="gridApi.reload()"
  />
</template>
