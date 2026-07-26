<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  ChannelAdminOption,
  ChannelId,
  ChannelListQuery,
  ChannelRow,
} from '#/types/channel-config';

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchChannelHierarchyApi,
  repackChannelApi,
} from '#/api/gameManage/channel';
import {
  fetchMoneyChannelDetailApi,
  fetchMoneyChannelListApi,
  updateMoneyChannelApi,
} from '#/api/netcash/create-money-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import ChannelBatchModal from '../../../gameManage/createChannel/components/channel-batch-modal.vue';
import ChannelFormModal from '../../../gameManage/createChannel/components/channel-form-modal.vue';
import ChannelInvitationModal from '../../../gameManage/createChannel/components/channel-invitation-modal.vue';
import ChannelPackageModal from '../../../gameManage/createChannel/components/channel-package-modal.vue';
import ChannelPreviewModal from '../../../gameManage/createChannel/components/channel-preview-modal.vue';
import ChannelAppearanceModal from './channel-appearance-modal.vue';

defineOptions({ name: 'MoneyChannelPanel' });

const props = defineProps<{ isTest?: boolean }>();
const { checkPermission } = useCloudPermission();
const dataFlag = computed<0 | 1>(() => (props.isTest ? 1 : 0));
const permission = computed(() =>
  props.isTest
    ? {
        batch: 12_509,
        create: 12_493,
        edit: 12_495,
        h5: 12_504,
        hierarchy: 12_494,
        invitation: 12_508,
        list: 12_492,
        loading: 12_510,
        name: 12_500,
        promote: 12_313,
      }
    : {
        batch: 12_352,
        create: 12_335,
        edit: 12_338,
        h5: 12_347,
        hierarchy: 12_336,
        invitation: 12_351,
        list: 12_334,
        loading: 12_366,
        name: 12_343,
        promote: 12_313,
      },
);
const can = (key: keyof typeof permission.value) =>
  checkPermission(permission.value[key]);

const filters = reactive({
  ChannelId: '',
  ChannelName: '',
  IsHidden: 1,
  IsHiddenAgent: 1,
  InvitationCode: '',
  NetCashDomain: '',
  NetCashH5Domain: '',
  PackStatus: '',
  PromoterAdminName: '',
  PromoterAdminUserName: '',
  PushType: '',
  Sort: '',
});
const selectedPromoterId = ref<'' | ChannelId>('');
const rows = ref<ChannelRow[]>([]);
const parents = ref<ChannelAdminOption[]>([]);
const subordinates = ref<ChannelAdminOption[]>([]);
/** 测试渠道：面包屑仅根账号时禁止创建（对齐旧站 AdminTitleList.length === 1） */
const createDisabled = computed(
  () => Boolean(props.isTest) && parents.value.length <= 1,
);
const hierarchyLoading = ref(false);
const mutatingId = ref<ChannelId>();
const formOpen = ref(false);
const formChannelId = ref<ChannelId>();
const formPromoterId = ref<ChannelId>();
const batchOpen = ref(false);
const batchRows = ref<ChannelRow[]>([]);
const invitationOpen = ref(false);
const invitationChannelId = ref<ChannelId>();
const packageOpen = ref(false);
const packageRow = ref<ChannelRow>({});
const packagePlatform = ref<'android' | 'ios'>('ios');
const previewOpen = ref(false);
const previewTitle = ref('');
const previewUrl = ref('');
const previewChannelName = ref('');
const appearanceOpen = ref(false);
const appearanceRow = ref<ChannelRow>({});
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const packStatusOptions = [
  { label: '未打包', value: '1' },
  { label: '打包成功', value: '2' },
  { label: '打包失败', value: '3' },
  { label: '处理中', value: '4' },
];
const visibilityOptions = [
  { label: '启用渠道', value: 1 },
  { label: '仅停用渠道', value: 2 },
  { label: '全部渠道', value: 3 },
];
const pushTypeOptions = [
  { label: '纯娱乐', value: 0 },
  { label: '娱乐 + 专属', value: 1 },
  { label: '纯专属场馆', value: 2 },
  { label: '游戏 + 直播', value: 3 },
  { label: '直播 + 游戏', value: 4 },
];

function formatDate(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  const date =
    Number.isFinite(numeric) && numeric > 0
      ? dayjs(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
      : dayjs(String(value));
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
}

function packText(value: unknown) {
  return (
    { 0: '未打包', 1: '未打包', 2: '打包成功', 3: '打包失败', 4: '处理中' }[
      Number(value)
    ] || '-'
  );
}

function pushText(value: unknown) {
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

function absoluteDomain(value: unknown) {
  const domain = String(value || '').trim();
  if (!domain) return '';
  return /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
}

function channelUrl(row: ChannelRow, h5 = false) {
  const domain = absoluteDomain(h5 ? row.H5Domain1 : row.Domain);
  if (!domain) return '';
  return `${domain}${domain.includes('?') ? '&' : '?'}cid=${encodeURIComponent(
    String(row.ChannelId || ''),
  )}`;
}

function schedulePoll(items: ChannelRow[]) {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = items.some((item) => Number(item.PackStatus) === 4)
    ? setTimeout(() => void gridApi.reload(), 10_000)
    : undefined;
}

const columns: VxeTableGridOptions<ChannelRow>['columns'] = [
  ...(can('batch') ? [{ type: 'checkbox' as const, width: 48 }] : []),
  {
    field: 'PackStatus',
    minWidth: 140,
    slots: { default: 'packStatus' },
    title: '打包状态',
  },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) => formatDate(cellValue),
    minWidth: 165,
    sortable: true,
    title: '创建时间',
  },
  { field: 'ChannelId', minWidth: 105, sortable: true, title: '渠道号' },
  {
    field: 'ChannelName',
    minWidth: 150,
    showOverflow: 'tooltip',
    slots: { default: 'channelName' },
    title: '渠道名称',
  },
  {
    field: 'InvitationCode',
    minWidth: 120,
    slots: { default: 'invitation' },
    title: '邀请码',
  },
  { field: 'PackageName', minWidth: 140, title: '产品名称' },
  {
    field: 'PushType',
    formatter: ({ cellValue }) => pushText(cellValue),
    minWidth: 125,
    title: '推广模式',
  },
  {
    field: 'IosType',
    minWidth: 140,
    slots: { default: 'ios' },
    title: 'iOS 包体',
  },
  {
    field: 'AndroidAppPkgType',
    minWidth: 140,
    slots: { default: 'android' },
    title: 'Android 包体',
  },
  {
    field: 'appearance',
    minWidth: 130,
    slots: { default: 'appearance' },
    title: 'Loading / Logo',
  },
  {
    field: 'links',
    minWidth: 150,
    slots: { default: 'links' },
    title: '渠道地址',
  },
  {
    field: 'actions',
    fixed: 'right',
    minWidth: 145,
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
    autoLoad: can('list'),
    ajax: {
      query: async ({ page, sort }) => {
        try {
          const query: ChannelListQuery = {
            ChannelId: filters.ChannelId.trim(),
            ChannelName: filters.ChannelName.trim(),
            ChannelType: 2,
            DataSearchType: dataFlag.value,
            IsHidden: filters.IsHidden,
            IsHiddenAgent: filters.IsHiddenAgent,
            InvitationCode: filters.InvitationCode.trim(),
            NetCashDomain: filters.NetCashDomain.trim(),
            NetCashH5Domain: filters.NetCashH5Domain.trim(),
            PackStatus: filters.PackStatus,
            Page: page.currentPage,
            PageSize: page.pageSize,
            PromoterAdminId: selectedPromoterId.value,
            PushType: filters.PushType,
            Sort:
              sort?.field && sort?.order
                ? `${sort.order === 'desc' ? '-' : ''}${sort.field}`
                : filters.Sort,
          };
          const result = await fetchMoneyChannelListApi(query);
          rows.value = result.Items;
          // 对齐旧站：列表接口的 MoreItems.Parents 不覆盖代理链路面包屑
          schedulePoll(rows.value);
          return {
            items: rows.value,
            total: Number(result.Pagination?.MaxCount ?? rows.value.length),
          };
        } catch {
          rows.value = [];
          return { items: [], total: 0 };
        }
      },
    },
  },
  rowClassName: ({ row }) =>
    Number(row.IsHidden) === 2 ? 'money-channel-disabled-row' : '',
  rowConfig: { keyField: 'Id' },
};
const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFirstPage() {
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

async function loadHierarchy(adminId: '' | ChannelId = selectedPromoterId.value) {
  if (!can('hierarchy')) return undefined;
  hierarchyLoading.value = true;
  try {
    // 对齐旧站：链路只有根节点时 AdminId 传空
    const requestAdminId =
      parents.value.length <= 1 && !adminId ? '' : adminId;
    const result = await fetchChannelHierarchyApi({
      AdminId: requestAdminId,
      AdminType: 7,
      ChannelId: filters.ChannelId.trim(),
      ChannelName: filters.ChannelName.trim(),
      ChannelType: 2,
      DataSearchType: dataFlag.value,
      NetCashDomain: filters.NetCashDomain.trim(),
      NetCashH5Domain: filters.NetCashH5Domain.trim(),
      PromoterAdminName: filters.PromoterAdminName.trim(),
      PromoterAdminUserName: filters.PromoterAdminUserName.trim(),
      PushType: '',
    });
    const sons = (result.ItemsSon ?? []) as ChannelAdminOption[];
    subordinates.value =
      filters.IsHiddenAgent === 2
        ? sons
        : sons.filter((item) => Number(item.Status) !== 2);

    // 对齐旧站 getTGList：
    // 1) 首次无链路时写入 ItemsAdmin
    // 2) Parents 完整（含根节点且不短于本地）时用接口链路
    // 3) 否则保留本地已 push 的 leying/A/B，绝不被截断
    if (parents.value.length === 0 && result.ItemsAdmin) {
      parents.value = [result.ItemsAdmin];
    } else if (result.Parents && result.Parents.length > 0) {
      const rootId = parents.value[0]?.Id;
      const hasRoot =
        !rootId ||
        result.Parents.some((item) => String(item.Id) === String(rootId));
      if (hasRoot && result.Parents.length >= parents.value.length) {
        parents.value = result.Parents;
      }
    }
    return result;
  } catch {
    subordinates.value = [];
    return undefined;
  } finally {
    hierarchyLoading.value = false;
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\/.+/i.test(value.trim());
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
    [...(result.Parents || [])].reverse(),
  ];
  return (
    candidates.find((item) => promoterMatches(item, username, name)) ??
    result.ItemsSon[0] ??
    result.ItemsAdmin ??
    result.Parents?.at(-1)
  );
}

async function search() {
  if (filters.NetCashDomain && !isHttpUrl(filters.NetCashDomain)) {
    message.warning('专属 APP 域名需包含 http:// 或 https://');
    return;
  }
  if (filters.NetCashH5Domain && !isHttpUrl(filters.NetCashH5Domain)) {
    message.warning('专属 H5 域名需包含 http:// 或 https://');
    return;
  }
  const hasPromoterFilter = Boolean(
    filters.PromoterAdminUserName.trim() || filters.PromoterAdminName.trim(),
  );
  if (can('hierarchy')) {
    const hierarchy = await loadHierarchy();
    if (hasPromoterFilter) {
      selectedPromoterId.value = resolveSearchedPromoter(hierarchy)?.Id ?? '';
    }
  }
  await reloadFirstPage();
}

async function reset() {
  Object.assign(filters, {
    ChannelId: '',
    ChannelName: '',
    IsHidden: 1,
    IsHiddenAgent: 1,
    InvitationCode: '',
    NetCashDomain: '',
    NetCashH5Domain: '',
    PackStatus: '',
    PromoterAdminName: '',
    PromoterAdminUserName: '',
    PushType: '',
    Sort: '',
  });
  selectedPromoterId.value = '';
  parents.value = [];
  await loadHierarchy('');
  await reloadFirstPage();
}

/** 规范化层级节点（下级 ItemsSon 可能挂在 ChannelRow 结构上） */
function toHierarchyNode(
  row: ChannelAdminOption | ChannelRow,
): ChannelAdminOption {
  const record = row as Record<string, unknown>;
  return {
    Id: row.Id,
    Name: String(row.Name ?? record.PromoterAdminName ?? ''),
    Username: String(
      (row as ChannelAdminOption).Username ??
        record.Username ??
        record.PromoterAdminUserName ??
        '',
    ),
    Status: record.Status,
  };
}

async function selectPromoter(
  row: ChannelAdminOption | ChannelRow,
  index?: number,
) {
  if (row.Id == null) return;
  const node = toHierarchyNode(row);

  if (index === undefined) {
    // 点击下级：对齐旧站 handleAdmin，先 push 再请求
    const existsIndex = parents.value.findIndex(
      (item) => String(item.Id) === String(node.Id),
    );
    if (existsIndex >= 0) {
      parents.value = parents.value.slice(0, existsIndex + 1);
    } else {
      parents.value = [...parents.value, node];
    }
  } else {
    // 点击链路节点：对齐旧站 fnClickTiltle，截断到该级
    parents.value = parents.value.slice(0, index + 1);
  }

  // 对齐旧站：链路仅根节点时 AdminId 传空
  selectedPromoterId.value = parents.value.length <= 1 ? '' : node.Id!;
  await loadHierarchy(selectedPromoterId.value);
  await reloadFirstPage();
}

/** 链路展示优先账号：leying/A/B */
function formatHierarchyLabel(item: ChannelAdminOption | ChannelRow) {
  const node = toHierarchyNode(item);
  return (
    String(node.Username || '').trim() ||
    String(node.Name || '').trim() ||
    String(node.Id ?? '-')
  );
}

/** 下级代理：账号 + 姓名，便于辨认 */
function formatSubordinateLabel(item: ChannelAdminOption | ChannelRow) {
  const node = toHierarchyNode(item);
  const username = String(node.Username || '').trim();
  const name = String(node.Name || '').trim();
  if (username && name && username !== name) {
    return `${username}（${name}）`;
  }
  return username || name || String(node.Id ?? '-');
}

function createChannel() {
  if (createDisabled.value) {
    message.warning('测试渠道请先选择下级代理后再创建');
    return;
  }
  formChannelId.value = undefined;
  formPromoterId.value = selectedPromoterId.value || undefined;
  formOpen.value = true;
}

function editChannel(row: ChannelRow) {
  formChannelId.value = row.Id;
  formPromoterId.value = row.AdminId;
  formOpen.value = true;
}

function openBatch() {
  const selected = (gridApi.grid?.getCheckboxRecords?.() || []) as ChannelRow[];
  if (selected.length === 0) return void message.warning('请先选择渠道');
  batchRows.value = selected;
  batchOpen.value = true;
}

function editInvitation(row: ChannelRow) {
  invitationChannelId.value = row.Id;
  invitationOpen.value = true;
}

function repack(row: ChannelRow) {
  Modal.confirm({
    content: `确认重新打包渠道“${row.ChannelName || row.ChannelId}”？`,
    onOk: async () => {
      mutatingId.value = row.Id || row.ChannelId;
      try {
        await repackChannelApi({ ChannelId: row.ChannelId! });
        message.success('已提交重新打包');
        await gridApi.reload();
      } finally {
        mutatingId.value = undefined;
      }
    },
    title: '重新打包',
  });
}

function toggle(row: ChannelRow) {
  const enable = Number(row.IsHidden) === 2;
  Modal.confirm({
    content: `确认${enable ? '启用' : '停用'}渠道“${row.ChannelName || row.ChannelId}”？`,
    okButtonProps: { danger: !enable },
    onOk: async () => {
      mutatingId.value = row.Id;
      try {
        const detail = await fetchMoneyChannelDetailApi(row.Id!);
        if (detail.Id == null) {
          message.error('渠道详情为空，无法变更状态');
          return;
        }
        await updateMoneyChannelApi({
          ...detail,
          DataFlag: dataFlag.value,
          IsHidden: enable ? 1 : 2,
          PromoterAdminId: detail.AdminId,
        });
        message.success(`渠道已${enable ? '启用' : '停用'}`);
        await gridApi.reload();
      } finally {
        mutatingId.value = undefined;
      }
    },
    title: enable ? '启用渠道' : '停用渠道',
  });
}

function openPackage(row: ChannelRow, platform: 'android' | 'ios') {
  packageRow.value = row;
  packagePlatform.value = platform;
  packageOpen.value = true;
}

function preview(row: ChannelRow, h5: boolean) {
  previewTitle.value = h5 ? 'H5 地址' : '推广地址';
  previewUrl.value = channelUrl(row, h5);
  previewChannelName.value = row.ChannelName || String(row.ChannelId || '');
  previewOpen.value = true;
}

function openAppearance(row: ChannelRow) {
  appearanceRow.value = row;
  appearanceOpen.value = true;
}

onMounted(() => void loadHierarchy());
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
          style="width: 145px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.ChannelName"
          allow-clear
          placeholder="渠道名称"
          style="width: 165px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.PromoterAdminUserName"
          allow-clear
          placeholder="代理账号"
          style="width: 165px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.PromoterAdminName"
          allow-clear
          placeholder="代理名称"
          style="width: 165px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.InvitationCode"
          allow-clear
          placeholder="邀请码"
          style="width: 145px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.NetCashDomain"
          allow-clear
          placeholder="专属 APP 域名"
          style="width: 185px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.NetCashH5Domain"
          allow-clear
          placeholder="专属 H5 域名"
          style="width: 185px"
          @press-enter="search"
        />
        <Select
          v-model:value="filters.PushType"
          allow-clear
          :options="pushTypeOptions"
          placeholder="推广模式"
          style="width: 135px"
        />
        <Select
          v-if="checkPermission(props.isTest ? 12_498 : 12_341)"
          v-model:value="filters.IsHiddenAgent"
          :options="[
            { label: '启用代理', value: 1 },
            { label: '显示停用代理', value: 2 },
          ]"
          style="width: 135px"
        />
        <Select
          v-if="checkPermission(props.isTest ? 12_498 : 12_341)"
          v-model:value="filters.IsHidden"
          :options="visibilityOptions"
          style="width: 120px"
        />
        <Select
          v-model:value="filters.PackStatus"
          allow-clear
          :options="packStatusOptions"
          placeholder="打包状态"
          style="width: 120px"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
      </Space>
      <Space>
        <Button v-if="can('batch') && can('list')" @click="openBatch">
          批量设置
        </Button>
        <Button
          v-if="can('create')"
          :disabled="createDisabled"
          type="primary"
          @click="createChannel"
        >
          创建渠道
        </Button>
      </Space>
    </div>

    <div
      v-if="can('hierarchy')"
      class="mb-4 rounded border border-gray-200 p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <b>代理层级</b>
        <span v-if="hierarchyLoading" class="text-xs text-gray-400">加载中…</span>
      </div>
      <div class="mb-3 flex flex-wrap items-center gap-1 rounded bg-slate-50 px-3 py-2 text-sm">
        <template v-if="parents.length > 0">
          <template v-for="(item, index) in parents" :key="String(item.Id)">
            <span v-if="index > 0" class="text-gray-400">/</span>
            <a
              class="cursor-pointer hover:underline"
              :class="
                index === parents.length - 1
                  ? 'font-semibold text-blue-600'
                  : 'text-gray-700'
              "
              @click.prevent="selectPromoter(item, index)"
            >
              {{ formatHierarchyLabel(item) }}
            </a>
          </template>
        </template>
        <span v-else class="text-gray-400">暂无层级</span>
      </div>
      <div class="flex flex-wrap items-start gap-2">
        <span class="mt-1 shrink-0 text-sm text-gray-600">下级代理：</span>
        <Space v-if="subordinates.length > 0" wrap>
          <Button
            v-for="item in subordinates"
            :key="String(item.Id)"
            size="small"
            :danger="Number(item.Status) === 2"
            @click="selectPromoter(item)"
          >
            {{ formatSubordinateLabel(item) }}
          </Button>
        </Space>
        <span v-else class="mt-1 text-sm text-gray-400">当前层级暂无下级代理</span>
      </div>
    </div>

    <Grid v-if="can('list')">
      <template #packStatus="{ row }">
        <Space :size="2">
          <Tag
            :color="
              Number(row.PackStatus) === 2
                ? 'green'
                : Number(row.PackStatus) === 3
                  ? 'red'
                  : Number(row.PackStatus) === 4
                    ? 'blue'
                    : 'default'
            "
          >
            {{ packText(row.PackStatus) }}
          </Tag>
          <Button
            :loading="String(mutatingId) === String(row.Id || row.ChannelId)"
            size="small"
            type="link"
            @click="repack(row)"
          >
            重打包
          </Button>
        </Space>
      </template>
      <template #channelName="{ row }">
        <Button
          v-if="can('name')"
          size="small"
          type="link"
          @click="editChannel(row)"
        >
          {{ row.ChannelName || '-' }}
        </Button>
        <span v-else>{{ row.ChannelName || '-' }}</span>
      </template>
      <template #invitation="{ row }">
        <Button
          v-if="can('invitation')"
          size="small"
          type="link"
          @click="editInvitation(row)"
        >
          {{ !row.InvitationCode || row.InvitationCode === '0' ? '设置' : row.InvitationCode }}
        </Button>
        <span v-else>{{ row.InvitationCode || '-' }}</span>
      </template>
      <template #ios="{ row }">
        <Button size="small" type="link" @click="openPackage(row, 'ios')">
          {{
            Number(row.IosType) === 2
              ? '企业包'
              : Number(row.IosType) === 3
                ? '第三方签名'
                : Number(row.IosType) === 4
                  ? '上架包'
                  : Number(row.IosType) === 5
                    ? 'WebApp'
                    : '其他'
          }}
        </Button>
      </template>
      <template #android="{ row }">
        <Button size="small" type="link" @click="openPackage(row, 'android')">
          {{ Number(row.AndroidAppPkgType) === 1 ? '上架包' : 'APK' }}
        </Button>
      </template>
      <template #appearance="{ row }">
        <Button
          v-if="can('loading')"
          size="small"
          type="link"
          @click="openAppearance(row)"
        >
          设置
        </Button>
        <span v-else>-</span>
      </template>
      <template #links="{ row }">
        <Space :size="2">
          <Button
            v-if="can('promote') && channelUrl(row)"
            size="small"
            type="link"
            @click="preview(row, false)"
          >
            推广
          </Button>
          <Button
            v-if="can('h5') && channelUrl(row, true)"
            size="small"
            type="link"
            @click="preview(row, true)"
          >
            H5
          </Button>
        </Space>
      </template>
      <template #actions="{ row }">
        <Space :size="2">
          <Button
            v-if="can('edit')"
            size="small"
            type="link"
            @click="editChannel(row)"
          >
            编辑
          </Button>
          <Button
            v-if="can('edit')"
            :danger="Number(row.IsHidden) !== 2"
            size="small"
            type="link"
            @click="toggle(row)"
          >
            {{ Number(row.IsHidden) === 2 ? '启用' : '停用' }}
          </Button>
        </Space>
      </template>
    </Grid>
    <Result
      v-else
      status="403"
      sub-title="当前账号没有渠道列表权限"
      title="无列表权限"
    />

    <ChannelFormModal
      v-model:open="formOpen"
      :channel-id="formChannelId"
      :channel-type="2"
      :data-flag="dataFlag"
      :promoter-admin-id="formPromoterId"
      @created="gridApi.reload()"
      @success="gridApi.reload()"
    />
    <ChannelBatchModal
      v-model:open="batchOpen"
      :batch-permission="permission.batch"
      :data-flag="dataFlag"
      :rows="batchRows"
      @success="gridApi.reload()"
    />
    <ChannelPackageModal
      v-model:open="packageOpen"
      :platform="packagePlatform"
      :row="packageRow"
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
    <ChannelAppearanceModal
      v-model:open="appearanceOpen"
      :row="appearanceRow"
      @success="gridApi.reload()"
    />
  </div>
</template>

<style>
.vxe-body--row.money-channel-disabled-row > .vxe-body--column {
  background: #fff1f0 !important;
  color: #a8071a;
}
</style>
