<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameTitleItem, GameTitleOwnerItem } from '#/types/game-title';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addGameTitleOwnerApi,
  checkGameTitleOwnerApi,
  deleteGameTitleOwnerApi,
  exportGameTitleOwnerListApi,
  fetchGameTitleOwnerListApi,
  multiAddGameTitleOwnerApi,
} from '#/api/memberManage/game-title';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatGameTitleOwnerStatus } from '#/utils/game-title';
import { GAME_TITLE_OWNER_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

defineOptions({ name: 'GameTitleOwnerModal' });

const props = defineProps<{
  gameTitle?: GameTitleItem;
  open: boolean;
}>();

const emit = defineEmits<{
  changed: [];
  'update:open': [value: boolean];
}>();

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const canViewTable = computed(() => checkPermission(13_143));
const canBatchDelete = computed(() => checkPermission(13_144));
const canExport = computed(() => checkPermission(13_145));
const canBatchIssue = computed(() => checkPermission(13_146));
const canIssue = computed(() => checkPermission(13_148));
const canDelete = computed(() => checkPermission(13_149));

const filterAccount = ref('');
const filterPackageId = ref<number | string>('');
const issueOpen = ref(false);
const issueAccount = ref('');
const issuePackageId = ref<number | string>('');
const issueLoading = ref(false);
const batchIssueOpen = ref(false);
const batchIssueText = ref('');
const batchIssueLoading = ref(false);
const exportLoading = ref(false);
const totalCount = ref(0);
const tableRows = ref<GameTitleOwnerItem[]>([]);

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

function getPackageName(packageId?: number | string) {
  const target = packageOptions.value.find(
    (item) => String(item.PackageId) === String(packageId),
  );
  return target?.PackageName || String(packageId || '-');
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    Account: filterAccount.value,
    BadgeId: props.gameTitle?.Id,
    Deleted: 0,
    PackageId: filterPackageId.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    Status: '1,2,3',
  };
}

const gridOptions: VxeTableGridOptions<GameTitleOwnerItem> = {
  checkboxConfig: { highlight: true },
  columns: [
    { type: 'checkbox', width: 48 },
    {
      field: 'Status',
      formatter: ({ cellValue }) => formatGameTitleOwnerStatus(cellValue),
      minWidth: 100,
      title: '状态',
    },
    {
      field: 'Account',
      minWidth: 140,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'PackageId',
      formatter: ({ cellValue }) => getPackageName(cellValue),
      minWidth: 120,
      title: '产品',
    },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    { field: 'OperatorName', minWidth: 120, title: '操作人' },
    {
      field: 'AddTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 100,
    },
  ],
  height: 420,
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!props.gameTitle?.Id) {
          tableRows.value = [];
          return { items: [], total: 0 };
        }
        const result = await fetchGameTitleOwnerListApi(getQueryParams(page));
        const items = result.Items || [];
        tableRows.value = items;
        totalCount.value = Number(result.Pagination?.MaxCount || 0);
        return {
          items,
          total: totalCount.value,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function closeModal() {
  emit('update:open', false);
}

function getSelectedRows() {
  return (gridApi.grid?.getCheckboxRecords?.() || []) as GameTitleOwnerItem[];
}

async function handleIssue() {
  if (!props.gameTitle?.Id) {
    return;
  }
  if (!issuePackageId.value) {
    message.warning('请选择产品');
    return;
  }
  if (!issueAccount.value.trim()) {
    message.warning('请输入游戏账号');
    return;
  }
  issueLoading.value = true;
  try {
    await addGameTitleOwnerApi({
      Account: issueAccount.value.trim(),
      BadgeId: props.gameTitle.Id,
      PackageId: issuePackageId.value,
    });
    message.success('发放成功');
    issueOpen.value = false;
    issueAccount.value = '';
    gridApi.reload();
    emit('changed');
  } finally {
    issueLoading.value = false;
  }
}

async function handleRowIssue(row: GameTitleOwnerItem) {
  if (!props.gameTitle?.Id || !row.PlayerId) {
    return;
  }
  Modal.confirm({
    content: `确认向「${row.Account || ''}」发放称号？`,
    onOk: async () => {
      await addGameTitleOwnerApi({
        Account: row.Account,
        BadgeId: props.gameTitle?.Id,
        PackageId: row.PackageId,
        PlayerId: row.PlayerId,
      });
      message.success('发放成功');
      gridApi.reload();
      emit('changed');
    },
    title: '发放确认',
  });
}

function handleDelete(row: GameTitleOwnerItem) {
  if (!props.gameTitle?.Id || !row.Id) {
    return;
  }
  Modal.confirm({
    content: `确认删除玩家「${row.Account || ''}」的称号？`,
    onOk: async () => {
      await deleteGameTitleOwnerApi({
        BadgeId: props.gameTitle?.Id,
        Ids: [row.Id!],
      });
      message.success('删除成功');
      gridApi.reload();
      emit('changed');
    },
    title: '删除确认',
  });
}

function handleBatchDelete() {
  const rows = getSelectedRows();
  if (rows.length === 0) {
    message.warning('请先勾选玩家');
    return;
  }
  const playerIds = rows
    .map((item) => item.PlayerId)
    .filter((id): id is number | string => id != null && id !== '');
  if (playerIds.length === 0) {
    message.warning('选中记录缺少玩家 ID');
    return;
  }
  Modal.confirm({
    content: '此操作将对已勾选的游戏账号移除已获取称号，是否继续？',
    onOk: async () => {
      await deleteGameTitleOwnerApi({
        BadgeId: props.gameTitle?.Id,
        PlayerIds: playerIds,
      });
      message.success('批量删除成功');
      gridApi.reload();
      emit('changed');
    },
    title: '批量删除确认',
  });
}

function buildExportQuery() {
  const {
    Page: _page,
    PageSize: _size,
    ...rest
  } = getQueryParams({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

function handleExportClick() {
  if (!props.gameTitle?.Id) {
    return;
  }
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(GAME_TITLE_OWNER_EXPORT_PAGE_ID, {
    ...buildExportQuery(),
  });
}

async function handleExport(payload: Record<string, unknown> = {}) {
  if (!props.gameTitle?.Id) {
    return;
  }
  exportLoading.value = true;
  try {
    const result = await exportGameTitleOwnerListApi({
      ...buildExportQuery(),
      ...payload,
    });
    if (result?.Id && Number(result.Status) === 0) {
      Modal.confirm({
        content: '导出任务已创建，是否前往导出管理下载？',
        okText: '前往',
        title: '导出成功',
        onOk: () => {
          router.push('/operationalManage/downloadCsvManage').catch(() => {});
        },
      });
      return;
    }
    message.success(result?.Remark || '导出任务已提交');
  } finally {
    exportLoading.value = false;
  }
}

async function handleBatchIssue() {
  if (!props.gameTitle?.Id) {
    return;
  }
  const lines = batchIssueText.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    message.warning('请按「游戏账号,产品名」每行一条填写');
    return;
  }
  const playerInfos = lines
    .map((line) => {
      const [account, packageName] = line
        .split(/[,，\t]/)
        .map((part) => part.trim());
      return {
        Account: account || '',
        PackageName: packageName || '',
      };
    })
    .filter((item) => item.Account && item.PackageName);
  if (playerInfos.length === 0) {
    message.warning('格式有误，请使用「游戏账号,产品名」');
    return;
  }
  batchIssueLoading.value = true;
  try {
    const checkResult = (await checkGameTitleOwnerApi({
      BadgeId: props.gameTitle.Id,
      PlayerInfos: playerInfos,
    })) as Array<{ PlayerId?: number | string }> | null;
    const playerIds = (Array.isArray(checkResult) ? checkResult : [])
      .map((item) => item.PlayerId)
      .filter((id): id is number | string => id != null && id !== '');
    if (playerIds.length === 0) {
      message.warning('没有可发放的有效玩家');
      return;
    }
    await multiAddGameTitleOwnerApi({
      BadgeId: props.gameTitle.Id,
      PlayerIds: playerIds,
    });
    message.success(`批量发放成功（${playerIds.length}）`);
    batchIssueOpen.value = false;
    batchIssueText.value = '';
    gridApi.reload();
    emit('changed');
  } finally {
    batchIssueLoading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open && canViewTable.value) {
      filterAccount.value = '';
      filterPackageId.value = '';
      gridApi.reload();
    }
  },
);
</script>

<template>
  <Modal
    :open="open"
    :title="`拥有列表：${gameTitle?.Name || ''}`"
    width="960px"
    :footer="null"
    destroy-on-close
    @cancel="closeModal"
  >
    <template v-if="canViewTable">
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterAccount"
              allow-clear
              placeholder="请输入游戏账号"
            >
              <template #addonBefore>游戏账号</template>
            </Input>
          </div>
          <Select
            v-model:value="filterPackageId"
            allow-clear
            :options="
              packageOptions.map((item) => ({
                label: item.PackageName,
                value: item.PackageId,
              }))
            "
            placeholder="请选择产品"
          />
          <div class="query-filter-actions">
            <Space wrap>
              <Button type="primary" @click="handleSearch">查询</Button>
              <Button v-if="canIssue" type="primary" @click="issueOpen = true">
                发放称号
              </Button>
              <Button
                v-if="canBatchIssue"
                @click="
                  batchIssueText = '';
                  batchIssueOpen = true;
                "
              >
                批量发放
              </Button>
              <Button v-if="canBatchDelete" danger @click="handleBatchDelete">
                批量删除
              </Button>
              <Button
                v-if="canExport"
                :loading="exportLoading"
                @click="handleExportClick"
              >
                导出 Excel
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <Grid>
        <template #loginAccount="{ row }">
          <PlayerAccountLink
            :login-account="String(row.Account || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
        </template>
        <template #actions="{ row }">
          <Space>
            <Button
              v-if="canIssue && Number(row.Status) === 1"
              size="small"
              type="link"
              @click="handleRowIssue(row)"
            >
              发放
            </Button>
            <Button
              v-if="canDelete && Number(row.Status) !== 1"
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
    </template>

    <Modal
      v-model:open="issueOpen"
      :confirm-loading="issueLoading"
      title="发放称号"
      @ok="handleIssue"
    >
      <Form layout="vertical">
        <Form.Item label="产品" required>
          <Select
            v-model:value="issuePackageId"
            :options="
              packageOptions.map((item) => ({
                label: item.PackageName,
                value: item.PackageId,
              }))
            "
            placeholder="请选择"
          />
        </Form.Item>
        <Form.Item label="游戏账号" required>
          <Input v-model:value="issueAccount" placeholder="请输入" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="batchIssueOpen"
      :confirm-loading="batchIssueLoading"
      title="批量发放称号"
      @ok="handleBatchIssue"
    >
      <Form layout="vertical">
        <Form.Item label="玩家列表" required>
          <Input.TextArea
            v-model:value="batchIssueText"
            :rows="8"
            placeholder="每行一条：游戏账号,产品名"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Modal>

  <PassPopup ref="passPopupRef" type="csv" @confirm="handleExport" />
</template>
