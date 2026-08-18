<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  PackageId,
  PackageListItem,
  PackageResourceItem,
  PackageVipBadgeGroup,
} from '#/types/package-config';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Image,
  Input,
  message,
  Modal,
  Result,
  Space,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  buyPackageNumberApi,
  deletePackageApi,
  fetchBackWaterSchemeListApi,
  fetchPackageListApi,
} from '#/api/gameManage/package';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import PackageRemarkModal from './components/package-remark-modal.vue';
import PackageSettingsModal from './components/package-settings-modal.vue';
import PackageUnderageModal from './components/package-underage-modal.vue';

defineOptions({ name: 'InclusionDeploy' });

type UnderageType = 1 | 2;
type SettingsTabKey =
  | 'analytics'
  | 'appearance'
  | 'company'
  | 'game-support'
  | 'general'
  | 'growth'
  | 'login'
  | 'payment'
  | 'promotion'
  | 'push'
  | 'records'
  | 'support'
  | 'venue';

const router = useRouter();
const { checkPermission, projectConfig } = useCloudPermission();

const canViewList = computed(() => checkPermission(10_775));
const canCreate = computed(() => checkPermission(10_776));
const canEdit = computed(() => checkPermission(10_778));
const canDelete = computed(() => checkPermission(10_779));
const canPreview = computed(() => checkPermission(11_103));
const canRemark = computed(() => checkPermission(11_853));
const canUnderage = computed(() => checkPermission(12_740));
const canViewPage = computed(() => canViewList.value || canCreate.value);
const settingsPermissions = [
  10_775, 11_105, 11_106, 11_107, 11_108, 11_109, 11_110, 11_409, 11_966,
  11_408, 11_411, 11_669, 11_853, 12_607, 12_909, 12_935, 13_010, 13_178,
  13_179, 13_203, 13_250,
];
const canOpenSettings = computed(() =>
  settingsPermissions.some((permission) => checkPermission(permission)),
);
const accountInfo = computed(
  () =>
    (projectConfig.value?.AccountInfo as Record<string, unknown> | undefined) ||
    {},
);
const accountLevel = computed(() =>
  Number(accountInfo.value.AccountLevel || 0),
);
const canBuyQuota = computed(() => accountLevel.value === 3);

const packageName = ref('');
const resources = ref<PackageResourceItem[]>([]);
const vipBadgeGroups = ref<PackageVipBadgeGroup[]>([]);
const rebateSchemes = ref<Array<{ Id?: PackageId; Name?: string }>>([]);
const total = ref(0);
const deletingId = ref<PackageId>();
const quotaLoading = ref(false);

const previewOpen = ref(false);
const previewUrl = ref('');
const previewName = ref('');
const remarkOpen = ref(false);
const underageOpen = ref(false);
const settingsOpen = ref(false);
const activePackage = ref<PackageListItem>();
const underageType = ref<UnderageType>(1);
const settingsInitialTab = ref<SettingsTabKey>();

const resourceDomain = computed(() =>
  String(projectConfig.value?.CommonResourceDomainUrl || ''),
);

const packageCapacity = computed(() => {
  const configs = projectConfig.value?.ProjectConfig;
  if (!Array.isArray(configs)) {
    return undefined;
  }
  const key =
    accountLevel.value === 3
      ? 'PackageNumAccountLevelThree'
      : accountLevel.value === 2
        ? 'PackageNumAccountLevelTwo'
        : 'PackageNumAccountLevelOne';
  const item = configs.find(
    (config) =>
      config &&
      typeof config === 'object' &&
      (config as Record<string, unknown>).Key === key,
  ) as Record<string, unknown> | undefined;
  const base = Number(item?.ValueInt || 0);
  const purchased = Number(accountInfo.value.BuyPackageGameNum || 0);
  return base + purchased;
});

function isAbsoluteUrl(value: string) {
  return /^(?:data:|https?:)?\/\//i.test(value);
}

function joinUrl(domain: string, path: string) {
  if (!path) {
    return '';
  }
  if (isAbsoluteUrl(path)) {
    return path;
  }
  return `${domain.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function resolveResource(id?: PackageId) {
  return resources.value.find((item) => String(item.Id) === String(id));
}

function resolveIcon(row: PackageListItem) {
  return joinUrl(
    resourceDomain.value,
    String(resolveResource(row.Icon)?.PictureIp || ''),
  );
}

function parseSerialized(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  if (!value.trim()) {
    return [];
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function selectedGameCount(value: unknown) {
  const parsed = parseSerialized(value);
  if (Array.isArray(parsed)) {
    return parsed.length;
  }
  if (parsed && typeof parsed === 'object') {
    return Object.values(parsed).flatMap((item) =>
      Array.isArray(item) ? item : [item],
    ).length;
  }
  if (typeof parsed === 'string') {
    return parsed.split(',').filter((item) => item.trim()).length;
  }
  return 0;
}

function formatLanguages(value: unknown) {
  const parsed = parseSerialized(value);
  if (!Array.isArray(parsed)) {
    return typeof parsed === 'string' && parsed ? parsed : '-';
  }
  const labels = parsed
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object') {
        const language = item as Record<string, unknown>;
        return language.label || language.value;
      }
      return '';
    })
    .filter(Boolean);
  return labels.length > 0 ? labels.join('、') : '-';
}

function formatCreateTime(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const numeric = Number(value);
  const date =
    Number.isFinite(numeric) && numeric > 0
      ? dayjs(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
      : dayjs(String(value));
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : String(value);
}

function formatStyle(row: PackageListItem) {
  const settingMap: Record<string, string> = {
    '1': '综合风格',
    '2': '体育风格',
  };
  const setting = settingMap[String(row.StyleSetting)] || row.StyleSetting;
  const styleType = row.StyleType ?? '-';
  return setting ? `${setting} / ${styleType}` : String(styleType);
}

const adFields = [
  'BannerId',
  'AppBannerId',
  'MainImgId',
  'OtherImgId',
  'SteamingBannerId',
  'PayForAdId',
  'FloatingWindowId',
  'PcHomeSettingId',
  'AppHomeAdTmpId',
  'LivestreamFloatingTmpId',
] as const;

function configuredAds(row: PackageListItem) {
  return adFields.filter((field) => {
    const value = row[field];
    return value !== undefined && value !== null && value !== '' && value !== 0;
  }).length;
}

function resolveVipBadge(row: PackageListItem) {
  if (!row.VIPBadgeGroupID) {
    return '未配置';
  }
  return (
    vipBadgeGroups.value.find(
      (item) => String(item.TemplateId) === String(row.VIPBadgeGroupID),
    )?.TemplateName || `模板 ${row.VIPBadgeGroupID}`
  );
}

function rebateModeLabel(row: PackageListItem) {
  try {
    const parsed =
      typeof row.BetWaterMode === 'string'
        ? JSON.parse(row.BetWaterMode)
        : row.BetWaterMode;
    const mode = Number(
      parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>).Mode
        : 0,
    );
    return (
      (
        {
          0: '日结',
          1: '按天数',
          2: '周结',
        } as Record<number, string>
      )[mode] || '日结'
    );
  } catch {
    return '日结';
  }
}

function formatRebateConfig(row: PackageListItem) {
  if (!row.BetWaterTemplateIdV2) {
    return '未配置';
  }
  const schemeName =
    rebateSchemes.value.find(
      (item) => String(item.Id) === String(row.BetWaterTemplateIdV2),
    )?.Name || `方案 ${row.BetWaterTemplateIdV2}`;
  return `${schemeName}（${rebateModeLabel(row)}）`;
}

const gridOptions: VxeTableGridOptions<PackageListItem> = {
  columns: [
    {
      field: 'Icon',
      minWidth: 72,
      slots: { default: 'icon' },
      title: '图标',
    },
    { field: 'Id', minWidth: 90, title: '产品 ID' },
    {
      field: 'PackageName',
      minWidth: 150,
      showOverflow: 'tooltip',
      title: '产品名称',
    },
    {
      field: 'StyleSetting',
      formatter: ({ row }) => formatStyle(row),
      minWidth: 150,
      title: '产品风格 / 类型',
    },
    {
      field: 'ApiIdentifierLabel',
      minWidth: 150,
      showOverflow: 'tooltip',
      title: 'API 标识',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatCreateTime(cellValue),
      minWidth: 165,
      title: '创建时间',
    },
    {
      field: 'Description',
      minWidth: 180,
      showOverflow: 'tooltip',
      slots: { default: 'description' },
      title: '备注',
    },
    {
      field: 'Languages',
      formatter: ({ cellValue }) => formatLanguages(cellValue),
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '语言',
    },
    {
      field: 'Games',
      formatter: ({ cellValue }) => selectedGameCount(cellValue),
      minWidth: 90,
      title: '已选游戏',
    },
    {
      field: 'AdConfig',
      minWidth: 100,
      slots: { default: 'adConfig' },
      title: '广告配置',
    },
    {
      field: 'BetWaterTemplateIdV2',
      minWidth: 100,
      slots: { default: 'rebateConfig' },
      title: '返水配置',
    },
    {
      field: 'VIPBadgeGroupID',
      formatter: ({ row }) => resolveVipBadge(row),
      minWidth: 120,
      showOverflow: 'tooltip',
      title: 'VIP 图配置',
    },
    {
      field: 'IsUnderageConfig',
      minWidth: 105,
      slots: { default: 'underageStatus' },
      title: '未成年配置',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 350,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    autoLoad: true,
    ajax: {
      query: async ({ page }) => {
        const [result] = await Promise.all([
          fetchPackageListApi({
            PackageName: packageName.value.trim(),
            Page: page.currentPage,
            PageSize: page.pageSize,
          }),
          rebateSchemes.value.length
            ? Promise.resolve(null)
            : fetchBackWaterSchemeListApi({}).then((schemes) => {
                const items = Array.isArray(schemes)
                  ? schemes
                  : ((schemes as { Items?: Array<Record<string, unknown>> })
                      ?.Items ?? []);
                rebateSchemes.value = items.map((item) => ({
                  Id: item.Id as PackageId,
                  Name: String(item.Name ?? ''),
                }));
              }),
        ]);
        const items = result.Items || [];
        resources.value = result.MoreItems?.Resources || [];
        vipBadgeGroups.value = result.VIPBadgeGroups || [];
        total.value = Number(result.Pagination?.MaxCount || items.length);
        return { items, total: total.value };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFromFirstPage() {
  await gridApi.grid.setCurrentPage(1);
  await gridApi.query();
}

function handleSearch() {
  packageName.value = packageName.value.trim();
  void reloadFromFirstPage();
}

function handleReset() {
  packageName.value = '';
  void reloadFromFirstPage();
}

function handleCreate() {
  void router.push('/gameManage/addPackage');
}

function handleEdit(row: PackageListItem) {
  void router.push({
    path: '/gameManage/addPackage',
    query: { id: String(row.Id) },
  });
}

async function handleDelete(row: PackageListItem) {
  if (!row.Id) {
    return;
  }
  deletingId.value = row.Id;
  try {
    await deletePackageApi(row.Id);
    message.success('产品删除成功');
    await gridApi.reload();
  } finally {
    deletingId.value = undefined;
  }
}

function confirmDelete(row: PackageListItem) {
  Modal.confirm({
    content: `确认删除产品「${row.PackageName || row.Id}」？`,
    okButtonProps: { danger: true },
    onOk: () => handleDelete(row),
    title: '删除产品',
  });
}

function purchasePrice() {
  const configs = projectConfig.value?.ProjectConfig;
  if (!Array.isArray(configs)) {
    return undefined;
  }
  const item = configs.find(
    (config) =>
      config &&
      typeof config === 'object' &&
      (config as Record<string, unknown>).Key === 'BuyPackageNumMoney',
  ) as Record<string, unknown> | undefined;
  return item?.ValueInt;
}

function handleBuyQuota() {
  const price = purchasePrice();
  Modal.confirm({
    content: price
      ? `确认花费 ${price} 购买一个产品创建额度？`
      : '确认购买一个产品创建额度？',
    onOk: async () => {
      quotaLoading.value = true;
      try {
        await buyPackageNumberApi();
        message.success('产品额度购买成功');
        await gridApi.reload();
      } finally {
        quotaLoading.value = false;
      }
    },
    title: '购买产品额度',
  });
}

function legacyResourceSuffix(
  resourceId: PackageId | undefined,
  segment: number,
) {
  const name = String(resolveResource(resourceId)?.PictureName || '');
  const value = Number(name.split('.')[0]?.split('_')[segment]) - 1;
  return Number.isFinite(value) && value !== 0 ? String(value) : '';
}

function createPreviewUrl(row: PackageListItem) {
  const base = String(projectConfig.value?.GameTestPreviewUrl || '');
  if (!base) {
    return '';
  }
  if (Number(row.PackageType) === 2 && Number(row.StyleType) === 16) {
    return `${base}${base.includes('?') ? '&' : '?'}type=3`;
  }

  const agentId = String(
    (projectConfig.value?.AgentAccount as Record<string, unknown> | undefined)
      ?.Id || '',
  );
  const params = new URLSearchParams({
    WxAppID: '',
    WxURL: '',
    agentId,
    gameList: String(row.Games || ''),
    or_src: 'recharge',
    res_all:
      Number(row.PackageType) === 2
        ? 'resource5'
        : `resource${
            Number(row.StyleType) >= 4
              ? Number(row.StyleType) - 2 || ''
              : Number(row.StyleType) - 1 || ''
          }`,
    res_hall:
      Number(row.PackageType) === 2
        ? 'hall20002'
        : `hall${legacyResourceSuffix(row.H5HallBackground, 2)}`,
    res_login:
      Number(row.PackageType) === 2
        ? 'nover_login_bg102'
        : `nover_login_bg${legacyResourceSuffix(row.H5LoginBackground, 2)}`,
    roomId: '',
    scOffx: '',
    setup: '0',
    sortList: String(row.SortIds || ''),
    soundBgm: String(row.MusicData || ''),
    type: Number(row.PackageType) === 2 ? '2' : '',
  });
  const styleCode =
    row.StyleType && row.SkinColor ? `${row.StyleType}_${row.SkinColor}` : '';
  if (styleCode) {
    params.set('StyleType', styleCode);
  }
  if (row.SkinColorPc) {
    params.set('StyleTypePc', String(row.SkinColorPc));
  }
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}mobile/${styleCode ? `${styleCode}/` : ''}?${params}`;
}

function handlePreview(row: PackageListItem) {
  const url = createPreviewUrl(row);
  if (!url) {
    message.warning('当前环境未配置产品预览地址');
    return;
  }
  previewName.value = row.PackageName || String(row.Id || '');
  previewUrl.value = url;
  previewOpen.value = true;
}

function openRemark(row: PackageListItem) {
  activePackage.value = row;
  remarkOpen.value = true;
}

function openUnderage(row: PackageListItem, type: UnderageType) {
  activePackage.value = row;
  underageType.value = type;
  underageOpen.value = true;
}

function openSettings(row: PackageListItem, initialTab?: SettingsTabKey) {
  activePackage.value = row;
  settingsInitialTab.value = initialTab;
  settingsOpen.value = true;
}
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 产品列表与配置"
    title="产品配置"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="packageName"
              allow-clear
              style="width: 240px"
              @press-enter="handleSearch"
              placeholder="请输入产品名称"
            >
              <template #addonBefore>产品名称</template>
            </Input>
          </div>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
          <span v-if="canViewList" class="text-sm text-gray-500">
            已创建 {{ total }} 个产品
            <template v-if="packageCapacity !== undefined">
              / 可创建 {{ packageCapacity }} 个
            </template>
          </span>
        </div>
        <Space wrap>
          <Button
            v-if="canBuyQuota"
            :loading="quotaLoading"
            @click="handleBuyQuota"
          >
            购买产品额度
          </Button>
          <Button v-if="canCreate" type="primary" @click="handleCreate">
            创建产品
          </Button>
        </Space>
      </div>

      <Grid v-if="canViewList">
        <template #icon="{ row }">
          <Image
            v-if="resolveIcon(row)"
            :preview="false"
            :src="resolveIcon(row)"
            :width="36"
            fallback=""
          />
          <span v-else>-</span>
        </template>

        <template #description="{ row }">
          <Button
            v-if="canRemark"
            size="small"
            type="link"
            @click="openRemark(row)"
          >
            {{ row.Description || '未设置' }}
          </Button>
          <span v-else>{{ row.Description || '-' }}</span>
        </template>

        <template #adConfig="{ row }">
          <Tag :color="configuredAds(row) ? 'green' : 'default'">
            {{
              configuredAds(row) ? `已配置 ${configuredAds(row)} 项` : '未配置'
            }}
          </Tag>
        </template>

        <template #rebateConfig="{ row }">
          <Tag :color="row.BetWaterTemplateIdV2 ? 'green' : 'default'">
            {{ formatRebateConfig(row) }}
          </Tag>
        </template>

        <template #underageStatus="{ row }">
          <Tag :color="row.IsUnderageConfig ? 'green' : 'default'">
            {{ row.IsUnderageConfig ? '已配置' : '未配置' }}
          </Tag>
        </template>

        <template #action="{ row }">
          <Space :size="2" wrap>
            <Button
              v-if="canEdit"
              size="small"
              type="link"
              @click="handleEdit(row)"
            >
              编辑
            </Button>
            <Button
              v-if="canPreview"
              size="small"
              type="link"
              @click="handlePreview(row)"
            >
              预览
            </Button>
            <Button
              v-if="canRemark"
              size="small"
              type="link"
              @click="openRemark(row)"
            >
              备注
            </Button>
            <template v-if="canUnderage">
              <Tooltip title="未成年登录设置">
                <Button size="small" type="link" @click="openUnderage(row, 1)">
                  登录设置
                </Button>
              </Tooltip>
              <Tooltip title="未成年注册设置">
                <Button size="small" type="link" @click="openUnderage(row, 2)">
                  注册设置
                </Button>
              </Tooltip>
            </template>
            <Button
              v-if="canOpenSettings"
              size="small"
              type="link"
              @click="openSettings(row)"
            >
              更多配置
            </Button>
            <Button
              v-if="canDelete"
              danger
              :loading="deletingId === row.Id"
              size="small"
              type="link"
              @click="confirmDelete(row)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Grid>

      <Result
        v-else
        status="403"
        sub-title="当前账号可创建产品，但没有产品列表查看权限"
        title="无列表权限"
      >
        <template #extra>
          <Button v-if="canCreate" type="primary" @click="handleCreate">
            创建产品
          </Button>
        </template>
      </Result>
    </Card>

    <Modal
      v-model:open="previewOpen"
      :footer="null"
      :title="`产品预览${previewName ? ` · ${previewName}` : ''}`"
      width="min(1100px, calc(100vw - 32px))"
      @after-close="previewUrl = ''"
    >
      <iframe
        v-if="previewUrl"
        class="package-preview-frame"
        :src="previewUrl"
        title="产品预览"
      ></iframe>
    </Modal>

    <PackageRemarkModal
      v-model:open="remarkOpen"
      :package-id="activePackage?.Id"
      :package-name="activePackage?.PackageName"
      @success="gridApi.reload()"
    />
    <PackageUnderageModal
      v-model:open="underageOpen"
      :package-id="activePackage?.Id"
      :package-name="activePackage?.PackageName"
      :type="underageType"
      @success="gridApi.reload()"
    />
    <PackageSettingsModal
      v-model:open="settingsOpen"
      :initial-tab="settingsInitialTab"
      :package-id="activePackage?.Id ?? 0"
      :package-name="activePackage?.PackageName || ''"
      @success="gridApi.reload()"
    />
  </Page>
  <Result v-else status="403" sub-title="无产品配置查看权限" title="403" />
</template>

<style scoped>
.package-preview-frame {
  width: 100%;
  height: min(76vh, 820px);
  min-height: 520px;
  border: 0;
  border-radius: 6px;
}

@media (max-width: 640px) {
  .package-preview-frame {
    height: 72vh;
    min-height: 420px;
  }
}
</style>
