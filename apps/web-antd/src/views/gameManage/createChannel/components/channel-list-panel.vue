<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  ChannelAdminOption,
  ChannelId,
  ChannelListQuery,
  ChannelResource,
  ChannelRow,
} from '#/types/channel-config';

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchChannelDetailApi,
  fetchChannelHierarchyApi,
  fetchChannelListApi,
  repackChannelApi,
  updateChannelApi,
} from '#/api/gameManage/channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import ChannelBatchModal from './channel-batch-modal.vue';
import ChannelFormModal from './channel-form-modal.vue';
import ChannelInvitationModal from './channel-invitation-modal.vue';
import ChannelPackageModal from './channel-package-modal.vue';
import ChannelPreviewModal from './channel-preview-modal.vue';

defineOptions({ name: 'ChannelListPanel' });

const route = useRoute();
const router = useRouter();
const { checkPermission } = useCloudPermission();

const canList = computed(() => checkPermission(12_303));
const canHierarchy = computed(() => checkPermission(12_302));
const canCreate = computed(() => checkPermission(12_305));
const canBatch = computed(() => checkPermission(12_322));
const canVisibilityFilter = computed(() => checkPermission(12_315));
const canNavigateAncestry = computed(() => checkPermission(12_308));
const canInvitation = computed(() => checkPermission(12_319));
const canPackageEdit = computed(() => checkPermission(12_309));
const canPreview = computed(() => checkPermission(12_313));
const canEdit = computed(() => checkPermission(12_306));

const filters = reactive({
  ChannelId: '',
  ChannelName: '',
  IsHidden: 1,
  PackStatus: '',
  PromoterAdminName: '',
  PromoterAdminUserName: '',
  Sort: '',
});
const selectedPromoterId = ref<'' | ChannelId>('');
const rows = ref<ChannelRow[]>([]);
const resources = ref<ChannelResource[]>([]);
const parents = ref<ChannelAdminOption[]>([]);
const subordinates = ref<ChannelRow[]>([]);
const hierarchyLoading = ref(false);
const repackingId = ref<ChannelId>();
const togglingId = ref<ChannelId>();
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const formOpen = ref(false);
const formChannelId = ref<ChannelId>();
const formPromoterId = ref<ChannelId>();
const initialPackageId = ref<ChannelId>();
const quickCreate = ref(false);
const batchOpen = ref(false);
const batchRows = ref<ChannelRow[]>([]);
const invitationOpen = ref(false);
const invitationChannelId = ref<ChannelId>();
const previewOpen = ref(false);
const previewTitle = ref('');
const previewUrl = ref('');
const previewChannelName = ref('');
const packageOpen = ref(false);
const packageRow = ref<ChannelRow>({});
const packagePlatform = ref<'android' | 'ios'>('ios');

const visibilityOptions = [
  { label: '启用渠道', value: 1 },
  { label: '停用渠道', value: 2 },
  { label: '全部渠道', value: 3 },
];
const packStatusOptions = [
  { label: '未打包', value: '1' },
  { label: '打包成功', value: '2' },
  { label: '打包失败', value: '3' },
  { label: '处理中', value: '4' },
];
const sortOptions = [
  { label: '创建时间倒序', value: '-CreateTime' },
  { label: '创建时间正序', value: 'CreateTime' },
  { label: '渠道号倒序', value: '-ChannelId' },
  { label: '渠道号正序', value: 'ChannelId' },
];

function formatDateTime(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  const date =
    Number.isFinite(numeric) && numeric > 0
      ? dayjs(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
      : dayjs(String(value));
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
}

function packStatusText(value: unknown) {
  return (
    { 0: '未打包', 1: '未打包', 2: '打包成功', 3: '打包失败', 4: '处理中' }[
      Number(value)
    ] || '-'
  );
}

function packStatusColor(value: unknown) {
  return { 1: 'default', 2: 'success', 3: 'error', 4: 'processing' }[
    Number(value)
  ];
}

function pushTypeText(value: unknown) {
  return (
    {
      0: '纯娱乐',
      1: '娱乐 + 专属',
      2: '纯专属场馆',
      3: '游戏 + 直播',
      4: '直播 + 游戏',
    }[Number(value)] || '-'
  );
}

function iosDescription(row: ChannelRow) {
  const type = Number(row.IosType);
  if (type === 1)
    return `超级签：${Number(row.IosSignStatus) === 1 ? '通道开启' : '通道关闭'}`;
  if (type === 2) return '企业包';
  if (type === 3)
    return `第三方签名：${row.ThirdCustomIosUrl ? '已设置' : '未设置'}`;
  if (type === 4) return `上架包：${row.IosPkgConfigId ? '已设置' : '未设置'}`;
  if (type === 5) return 'WebApp';
  return '其他';
}

function androidDescription(row: ChannelRow) {
  const type = Number(row.AndroidAppPkgType);
  if (type === 1)
    return `上架包：${row.AndroidPkgConfigId ? '已设置' : '未设置'}`;
  if (type === 2 || type === 3) return 'APK：已设置';
  return '其他';
}

function normalizeDomain(value: unknown) {
  const domain = String(value || '').trim();
  if (!domain) return '';
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

function promotionUrl(row: ChannelRow) {
  const domain = normalizeDomain(row.Domain);
  if (!domain) return '';
  const [withoutHash, ...hashParts] = domain.split('#');
  const base = withoutHash || '';
  const separator = base.includes('?')
    ? base.endsWith('?') || base.endsWith('&')
      ? ''
      : '&'
    : '?';
  const hash = hashParts.length > 0 ? `#${hashParts.join('#')}` : '';
  return `${base}${separator}cid=${encodeURIComponent(String(row.ChannelId || ''))}${hash}`;
}

function h5Url(row: ChannelRow) {
  const domain = normalizeDomain(row.H5Domain1);
  if (!domain) return '';
  return `${domain}${domain.includes('?') ? '&' : '?'}cid=${encodeURIComponent(String(row.ChannelId || ''))}`;
}

function schedulePolling(items: ChannelRow[]) {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = undefined;
  if (items.some((item) => Number(item.PackStatus) === 4)) {
    pollTimer = setTimeout(() => void gridApi.reload(), 10_000);
  }
}

function buildListQuery(page: {
  currentPage: number;
  pageSize: number;
}): ChannelListQuery {
  return {
    ChannelId: filters.ChannelId.trim(),
    ChannelName: filters.ChannelName.trim(),
    IsHidden: filters.IsHidden,
    PackStatus: filters.PackStatus,
    Page: page.currentPage,
    PageSize: page.pageSize,
    PromoterAdminId: selectedPromoterId.value,
    Sort: filters.Sort,
  };
}

const columns: VxeTableGridOptions<ChannelRow>['columns'] = [
  ...(canBatch.value ? [{ type: 'checkbox' as const, width: 48 }] : []),
  {
    field: 'PackStatus',
    minWidth: 145,
    slots: { default: 'packStatus' },
    title: '打包状态',
  },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) => formatDateTime(cellValue),
    minWidth: 165,
    title: '创建时间',
  },
  // 排序走筛选区 Sort（-CreateTime 等）；表头 sortable 仅客户端翻页内排序，易误导
  { field: 'ChannelId', minWidth: 105, title: '渠道号' },
  {
    field: 'ChannelName',
    minWidth: 140,
    showOverflow: 'tooltip',
    title: '渠道名称',
  },
  {
    field: 'InvitationCode',
    minWidth: 130,
    slots: { default: 'invitation' },
    title: '邀请码',
  },
  {
    field: 'PackageName',
    minWidth: 140,
    slots: { default: 'package' },
    title: '产品名称',
  },
  {
    field: 'PushType',
    formatter: ({ cellValue }) => pushTypeText(cellValue),
    minWidth: 125,
    title: '推广模式',
  },
  {
    field: 'IosType',
    minWidth: 165,
    slots: { default: 'ios' },
    title: 'iOS 包体',
  },
  {
    field: 'AndroidAppPkgType',
    minWidth: 145,
    slots: { default: 'android' },
    title: 'Android 包体',
  },
  {
    field: 'promotion',
    minWidth: 105,
    slots: { default: 'promotion' },
    title: '推广地址',
  },
  { field: 'h5', minWidth: 105, slots: { default: 'h5' }, title: 'H5 地址' },
  {
    field: 'actions',
    fixed: 'right',
    minWidth: 220,
    slots: { default: 'actions' },
    title: '操作',
  },
];

const gridOptions: VxeTableGridOptions<ChannelRow> = {
  checkboxConfig: {
    checkMethod: ({ row }) => Number(row.PackStatus) !== 4,
    highlight: true,
  },
  columns,
  height: 'auto',
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    autoLoad: canList.value,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchChannelListApi(buildListQuery(page));
        rows.value = result.Items;
        resources.value = result.MoreItems.Resources;
        if (result.MoreItems.Parents.length > 0) {
          parents.value = result.MoreItems.Parents;
        }
        schedulePolling(rows.value);
        return {
          items: rows.value,
          total: Number(result.Pagination?.MaxCount || rows.value.length),
        };
      },
    },
  },
  rowClassName: ({ row }) =>
    Number(row.IsHidden) === 2 ? 'channel-disabled-row' : '',
  rowConfig: { keyField: 'Id' },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFirstPage() {
  await gridApi.grid.setCurrentPage(1);
  await gridApi.query();
}

async function loadHierarchy(
  adminId: '' | ChannelId = selectedPromoterId.value,
) {
  if (!canHierarchy.value) return undefined;
  hierarchyLoading.value = true;
  try {
    const result = await fetchChannelHierarchyApi({
      AdminId: adminId,
      ChannelId: filters.ChannelId.trim(),
      ChannelName: filters.ChannelName.trim(),
      PromoterAdminName: filters.PromoterAdminName.trim(),
      PromoterAdminUserName: filters.PromoterAdminUserName.trim(),
    });
    subordinates.value = result.ItemsSon;
    if (result.Parents.length > 0) parents.value = result.Parents;
    if (parents.value.length === 0 && result.ItemsAdmin) {
      parents.value = [result.ItemsAdmin];
    }
    return result;
  } finally {
    hierarchyLoading.value = false;
  }
}

function promoterMatches(
  item: ChannelAdminOption | ChannelRow,
  username: string,
  name: string,
) {
  const record = item as Record<string, unknown>;
  const itemUsername = String(
    item.Username || record.PromoterAdminUserName || '',
  )
    .trim()
    .toLowerCase();
  const itemName = String(item.Name || record.PromoterAdminName || '')
    .trim()
    .toLowerCase();
  return (
    (!username || itemUsername === username) && (!name || itemName === name)
  );
}

function resolveSearchedPromoter(
  result: Awaited<ReturnType<typeof loadHierarchy>>,
) {
  if (!result) return undefined;
  const username = filters.PromoterAdminUserName.trim().toLowerCase();
  const name = filters.PromoterAdminName.trim().toLowerCase();
  const candidates: Array<ChannelAdminOption | ChannelRow> = [
    ...result.ItemsSon,
    ...(result.ItemsAdmin ? [result.ItemsAdmin] : []),
    ...result.Parents.toReversed(),
  ];
  return (
    candidates.find((item) => promoterMatches(item, username, name)) ??
    result.ItemsSon[0] ??
    result.ItemsAdmin ??
    result.Parents.at(-1)
  );
}

async function handleSearch() {
  const hasPromoterFilter = Boolean(
    filters.PromoterAdminUserName.trim() || filters.PromoterAdminName.trim(),
  );
  if (canHierarchy.value) {
    const hierarchy = await loadHierarchy();
    if (hasPromoterFilter) {
      selectedPromoterId.value = resolveSearchedPromoter(hierarchy)?.Id ?? '';
    }
  }
  await reloadFirstPage();
}

async function handleReset() {
  Object.assign(filters, {
    ChannelId: '',
    ChannelName: '',
    IsHidden: 1,
    PackStatus: '',
    PromoterAdminName: '',
    PromoterAdminUserName: '',
    Sort: '',
  });
  selectedPromoterId.value = '';
  parents.value = [];
  await loadHierarchy('');
  await reloadFirstPage();
}

async function selectPromoter(
  item: ChannelAdminOption | ChannelRow,
  parentIndex?: number,
) {
  if (!item.Id) return;
  selectedPromoterId.value = item.Id;
  if (parentIndex !== undefined)
    parents.value = parents.value.slice(0, parentIndex + 1);
  await loadHierarchy(item.Id);
  await reloadFirstPage();
}

function openCreate(options?: { packageId?: ChannelId; quick?: boolean }) {
  formChannelId.value = undefined;
  formPromoterId.value = selectedPromoterId.value || undefined;
  initialPackageId.value = options?.packageId;
  quickCreate.value = Boolean(options?.quick);
  formOpen.value = true;
}

function openEdit(row: ChannelRow) {
  formChannelId.value = row.Id;
  formPromoterId.value = row.AdminId;
  initialPackageId.value = row.PackageConfigId;
  quickCreate.value = false;
  formOpen.value = true;
}

function openBatch() {
  const selected = (gridApi.grid?.getCheckboxRecords?.() || []) as ChannelRow[];
  if (selected.length === 0) {
    message.warning('请先选择渠道');
    return;
  }
  batchRows.value = selected;
  batchOpen.value = true;
}

function openInvitation(row: ChannelRow) {
  invitationChannelId.value = row.Id;
  invitationOpen.value = true;
}

function openPackage(row: ChannelRow, platform: 'android' | 'ios') {
  packageRow.value = row;
  packagePlatform.value = platform;
  packageOpen.value = true;
}

function showPreview(row: ChannelRow, kind: 'h5' | 'promotion') {
  previewTitle.value = kind === 'h5' ? 'H5 地址' : '推广地址';
  previewUrl.value = kind === 'h5' ? h5Url(row) : promotionUrl(row);
  previewChannelName.value = row.ChannelName || String(row.ChannelId || '');
  previewOpen.value = true;
}

function confirmRepack(row: ChannelRow) {
  Modal.confirm({
    content: `确认重新打包渠道「${row.ChannelName || row.ChannelId}」？`,
    onOk: async () => {
      if (!row.ChannelId) return;
      repackingId.value = row.Id || row.ChannelId;
      try {
        await repackChannelApi({ ChannelId: row.ChannelId });
        message.success('已提交重新打包');
        await gridApi.reload();
      } finally {
        repackingId.value = undefined;
      }
    },
    title: '重新打包',
  });
}

function confirmToggle(row: ChannelRow) {
  if (!row.Id) return;
  const disabled = Number(row.IsHidden) === 2;
  const nextStatus = disabled ? 1 : 2;
  Modal.confirm({
    content: `确认${disabled ? '启用' : '停用'}渠道「${row.ChannelName || row.ChannelId}」？`,
    okButtonProps: { danger: !disabled },
    onOk: async () => {
      togglingId.value = row.Id;
      try {
        const detail = await fetchChannelDetailApi(row.Id!);
        await updateChannelApi({
          ...detail,
          IsHidden: nextStatus,
          PromoterAdminId: detail.AdminId,
        });
        message.success(`渠道已${disabled ? '启用' : '停用'}`);
        await gridApi.reload();
      } finally {
        togglingId.value = undefined;
      }
    },
    title: disabled ? '启用渠道' : '停用渠道',
  });
}

async function clearHandledQuery() {
  const query = { ...route.query };
  delete query.id;
  delete query.type;
  await router.replace({ query });
}

async function handleDeepLink() {
  const type = Array.isArray(route.query.type)
    ? route.query.type[0]
    : route.query.type;
  const rawId = Array.isArray(route.query.id)
    ? route.query.id[0]
    : route.query.id;
  const id = rawId ?? undefined;
  if (type !== '1' && type !== '2') return;
  await clearHandledQuery();
  if (!canCreate.value) {
    message.warning('当前账号没有创建渠道权限');
    return;
  }
  if (type === '1') {
    openCreate({ packageId: id });
    return;
  }
  Modal.confirm({
    content: '一键创建将按默认配置进入快速创建流程，确认继续？',
    onOk: () => openCreate({ packageId: id, quick: true }),
    title: '确认一键创建渠道',
  });
}

onMounted(() => {
  if (canHierarchy.value) void loadHierarchy();
  void handleDeepLink();
});

onBeforeUnmount(() => {
  if (pollTimer) clearTimeout(pollTimer);
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <Space wrap>
        <Input
          v-model:value="filters.ChannelId"
          allow-clear
          placeholder="渠道号"
          style="width: 150px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="filters.ChannelName"
          allow-clear
          placeholder="渠道名称"
          style="width: 170px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="filters.PromoterAdminUserName"
          allow-clear
          placeholder="推广账号"
          style="width: 170px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="filters.PromoterAdminName"
          allow-clear
          placeholder="推广名称"
          style="width: 170px"
          @press-enter="handleSearch"
        />
        <Select
          v-if="canVisibilityFilter"
          v-model:value="filters.IsHidden"
          :options="visibilityOptions"
          style="width: 125px"
        />
        <Select
          v-model:value="filters.PackStatus"
          allow-clear
          :options="packStatusOptions"
          placeholder="打包状态"
          style="width: 125px"
        />
        <Select
          v-model:value="filters.Sort"
          allow-clear
          :options="sortOptions"
          placeholder="排序"
          style="width: 150px"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </Space>
      <Space wrap>
        <Button v-if="canBatch && canList" @click="openBatch">批量设置</Button>
        <Button v-if="canCreate" type="primary" @click="openCreate()"
          >创建渠道</Button
        >
      </Space>
    </div>

    <div v-if="canHierarchy" class="mb-4 rounded border border-gray-200 p-3">
      <div class="mb-2 flex items-center justify-between">
        <span class="font-medium">渠道层级</span>
        <span v-if="hierarchyLoading" class="text-xs text-gray-400"
          >加载中…</span
        >
      </div>
      <Breadcrumb v-if="parents.length > 0" class="mb-3">
        <BreadcrumbItem v-for="(item, index) in parents" :key="String(item.Id)">
          <Button
            v-if="canNavigateAncestry"
            size="small"
            type="link"
            @click="selectPromoter(item, index)"
          >
            {{ item.Name || item.Username || item.Id }}
          </Button>
          <span v-else>{{ item.Name || item.Username || item.Id }}</span>
        </BreadcrumbItem>
      </Breadcrumb>
      <Space v-if="subordinates.length > 0" wrap>
        <Button
          v-for="item in subordinates"
          :key="String(item.Id)"
          size="small"
          :type="
            String(selectedPromoterId) === String(item.Id)
              ? 'primary'
              : 'default'
          "
          @click="selectPromoter(item)"
        >
          {{
            item.Name || item.PromoterAdminName || item.ChannelName || item.Id
          }}
          <span v-if="item.Username || item.PromoterAdminUserName">
            （{{ item.Username || item.PromoterAdminUserName }}）
          </span>
        </Button>
      </Space>
      <span v-else class="text-sm text-gray-400">当前层级暂无下级推广</span>
    </div>

    <Grid v-if="canList">
      <template #packStatus="{ row }">
        <Space :size="4">
          <Tag :color="packStatusColor(row.PackStatus)">
            {{ packStatusText(row.PackStatus) }}
          </Tag>
          <Tooltip v-if="Number(row.PackStatus) !== 4" title="重新打包">
            <Button
              :loading="String(repackingId) === String(row.Id || row.ChannelId)"
              size="small"
              type="link"
              @click="confirmRepack(row)"
            >
              重打包
            </Button>
          </Tooltip>
        </Space>
      </template>

      <template #invitation="{ row }">
        <Button
          v-if="canInvitation"
          size="small"
          type="link"
          @click="openInvitation(row)"
        >
          {{
            !row.InvitationCode || String(row.InvitationCode) === '0'
              ? '设置'
              : row.InvitationCode
          }}
        </Button>
        <span v-else>{{ row.InvitationCode || '-' }}</span>
      </template>

      <template #package="{ row }">
        <span>{{ row.PackageName || '-' }}</span>
      </template>

      <template #ios="{ row }">
        <Button
          v-if="canPackageEdit"
          size="small"
          type="link"
          @click="openPackage(row, 'ios')"
        >
          {{ iosDescription(row) }}
        </Button>
        <span v-else>{{ iosDescription(row) }}</span>
      </template>

      <template #android="{ row }">
        <Button
          v-if="canPackageEdit && Number(row.AndroidAppPkgType) === 1"
          size="small"
          type="link"
          @click="openPackage(row, 'android')"
        >
          {{ androidDescription(row) }}
        </Button>
        <span v-else>{{ androidDescription(row) }}</span>
      </template>

      <template #promotion="{ row }">
        <Button
          v-if="canPreview && promotionUrl(row)"
          size="small"
          type="link"
          @click="showPreview(row, 'promotion')"
        >
          预览
        </Button>
        <span v-else>-</span>
      </template>

      <template #h5="{ row }">
        <Button
          v-if="canPreview && h5Url(row)"
          size="small"
          type="link"
          @click="showPreview(row, 'h5')"
        >
          预览
        </Button>
        <span v-else>-</span>
      </template>

      <template #actions="{ row }">
        <Space :size="2" wrap>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canEdit"
            :danger="Number(row.IsHidden) !== 2"
            :loading="String(togglingId) === String(row.Id)"
            size="small"
            type="link"
            @click="confirmToggle(row)"
          >
            {{ Number(row.IsHidden) === 2 ? '启用' : '停用' }}
          </Button>
        </Space>
      </template>
    </Grid>

    <Result
      v-else
      status="403"
      sub-title="当前账号可创建渠道，但没有渠道列表查看权限"
      title="无列表权限"
    >
      <template #extra>
        <Button v-if="canCreate" type="primary" @click="openCreate()"
          >创建渠道</Button
        >
      </template>
    </Result>

    <ChannelFormModal
      v-model:open="formOpen"
      :channel-id="formChannelId"
      :initial-package-id="initialPackageId"
      :promoter-admin-id="formPromoterId"
      :quick-create="quickCreate"
      @created="gridApi.reload()"
      @success="gridApi.reload()"
    />
    <ChannelBatchModal
      v-model:open="batchOpen"
      :rows="batchRows"
      @success="gridApi.reload()"
    />
    <ChannelInvitationModal
      v-model:open="invitationOpen"
      :channel-id="invitationChannelId"
      :existing-codes="
        rows.map((row) => String(row.InvitationCode || '')).filter(Boolean)
      "
      @success="gridApi.reload()"
    />
    <ChannelPreviewModal
      v-model:open="previewOpen"
      :channel-name="previewChannelName"
      :title="previewTitle"
      :url="previewUrl"
    />
    <ChannelPackageModal
      v-model:open="packageOpen"
      :platform="packagePlatform"
      :row="packageRow"
      @success="gridApi.reload()"
    />
  </div>
</template>

<style>
.vxe-body--row.channel-disabled-row > .vxe-body--column {
  background: #fff1f0 !important;
  color: #a8071a;
}
</style>
