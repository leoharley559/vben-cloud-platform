<!-- eslint-disable -->
<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SpillManageItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  Image,
  Modal,
  Result,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  auditSpillManageApi,
  fetchSpillManageListApi,
} from '#/api/netcash/spill-manage';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { getServiceImageUrl } from '#/utils/media';
import {
  SPILL_STATUS_COLOR,
  SPILL_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

defineOptions({ name: 'SpillManage' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canViewPage = computed(() => checkPermission(10168));
const canAudit = computed(() => checkPermission(10169));

const LOGIN_ACCOUNT_RE = /^[a-zA-Z0-9]{4,20}$/;
// 对齐旧站 SearchTypeTwo / listQuery：当月 1 日 00:00 ～ 今日结束
const defaultBegin = dayjs().startOf('month');
const defaultEnd = dayjs().endOf('day');

const filterLoginAccount = ref('');
const filterAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterStatus = ref<number | string>(0);
const filterVipLevel = ref<number | string>(-1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const applyTotal = ref(0);

const packageOptions = computed(() => {
  const list = projectConfig.value?.RealPackageIdNameMap || [];
  return list.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  }));
});

function normalizeLoginAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  const status =
    filterStatus.value === undefined ||
    filterStatus.value === null ||
    filterStatus.value === ''
      ? 0
      : filterStatus.value;
  return {
    Account: filterAccount.value.trim(),
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value),
    PackageId: filterPackageId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    PlayerId: '',
    Status: status,
    TimeBegin: begin ? begin.unix() : '',
    TimeEnd: end ? end.unix() : '',
    VipLevel: filterVipLevel.value ?? -1,
  };
}

async function search() {
  const account = normalizeLoginAccount(filterLoginAccount.value);
  filterLoginAccount.value = account;
  if (account && !LOGIN_ACCOUNT_RE.test(account)) {
    message.warning('游戏账号须为 4-20 位字母或数字');
    return;
  }
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

async function resetQuery() {
  filterLoginAccount.value = '';
  filterAccount.value = '';
  filterPackageId.value = '';
  // 对齐旧站重置：Status 置空后再按全部语义请求（getQueryParams 会归一为 0）
  filterStatus.value = '';
  filterVipLevel.value = -1;
  filterDateRange.value = [defaultBegin, defaultEnd];
  await search();
}

function getImageList(value?: string | string[]) {
  const paths = Array.isArray(value) ? value : String(value || '').split(',');
  return paths
    .map((path) => path.trim())
    .filter(Boolean)
    .map((path) => getServiceImageUrl(path));
}

const gridOptions: VxeTableGridOptions<SpillManageItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '申请时间',
    },
    { field: 'LoginAccount', minWidth: 120, slots: { default: 'loginAccount' }, title: '游戏账号' },
    {
      field: 'RegisterTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '注册时间',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined ? '-' : `VIP${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    { field: 'OwnerAccount', minWidth: 120, title: '当前归属代理' },
    { field: 'OwnerChannelId', minWidth: 110, title: '安装渠道' },
    { field: 'RealPlatform', minWidth: 120, title: '安装终端类型' },
    { field: 'Account', minWidth: 130, title: '申请调线代理' },
    { field: 'Url', minWidth: 160, title: '申请链接' },
    { field: 'ApplyPlatform', minWidth: 110, title: '申请终端' },
    { field: 'Desc', minWidth: 160, title: '申请备注' },
    { field: 'AgreeDesc', minWidth: 160, title: '操作备注' },
    { field: 'Image', minWidth: 180, slots: { default: 'images' }, title: '上传图片' },
    { field: 'ApproveName', minWidth: 100, title: '操作人' },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '操作时间',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await fetchSpillManageListApi(getQueryParams(page));
          const items = result.Items || [];
          // 旧站分页/申请数量均取 respond.Total
          applyTotal.value = Number(result.Total || 0);
          return {
            items,
            total: Number(
              result.Total || result.Pagination?.MaxCount || items.length,
            ),
          };
        } catch {
          applyTotal.value = 0;
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const auditRemark = ref('');
const auditOpen = ref(false);
const auditStatus = ref(2);
const auditRow = ref<SpillManageItem>();
const auditSubmitting = ref(false);
function handleAudit(row: SpillManageItem, status: number) {
  auditRow.value = row;
  auditStatus.value = status;
  auditRemark.value = '';
  auditOpen.value = true;
}
async function submitAudit() {
  if (auditRow.value?.Id === undefined || auditRow.value.Id === null) return;
  if (!/^[\u4e00-\u9fa5_a-zA-Z0-9，。、]{0,50}$/.test(auditRemark.value)) {
    message.warning('备注限 50 字，仅支持中英文、数字及常用标点');
    return;
  }
  auditSubmitting.value = true;
  try {
    await auditSpillManageApi({
      Desc: auditRemark.value,
      Id: auditRow.value.Id,
      Status: auditStatus.value,
    });
    auditOpen.value = false;
    message.success('操作成功');
    await gridApi.reload();
  } catch {
    // 全局拦截已提示；非法 JSON 等异常避免误关弹窗后假成功
  } finally {
    auditSubmitting.value = false;
  }
}

const summaryItems = computed(() => [
  { label: '申请数量', value: applyTotal.value },
]);

onMounted(() => {
  if (canViewPage.value) {
    gridApi.query();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 溢出管理"
    title="溢出管理"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
            style="width: 230px"
            @press-enter="search"
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterAccount"
            allow-clear
            style="width: 230px"
            @press-enter="search"
            placeholder="请输入申请代理"
          >
            <template #addonBefore>申请代理</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">产品包</span>
          <Select
            v-model:value="filterPackageId"
            allow-clear
            class="w-40"
            :options="packageOptions"
            placeholder="请选择产品包"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="filterStatus"
            allow-clear
            class="w-32"
            :options="[
              { label: '全部', value: 0 },
              { label: '申请中', value: 1 },
              { label: '已通过', value: 2 },
              { label: '已拒绝', value: 3 },
            ]"
            placeholder="请选择状态"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">VIP等级</span>
          <Select
            v-model:value="filterVipLevel"
            class="w-28"
            :options="[{ label: '全部 VIP', value: -1 }, ...Array.from({ length: 11 }, (_, value) => ({ label: `VIP${value}`, value }))]"
            placeholder="请选择VIP等级"
          />
        </Space.Compact>
        <QueryDatetimeRangePicker v-model="filterDateRange" />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="resetQuery">重置</Button>
      </div>

      <SummaryCards :items="summaryItems" />

      <Grid>
        <template #loginAccount="{ row }">
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
        </template>
        <template #status="{ row }">
          <Tag :color="SPILL_STATUS_COLOR[Number(row.Status)] || 'default'">
            {{ SPILL_STATUS_MAP[Number(row.Status)] || row.Status }}
          </Tag>
        </template>
        <template #images="{ row }">
          <Image.PreviewGroup>
            <Image
              v-for="(src, index) in getImageList(row.Image)"
              :key="index"
              :src="src"
              width="52"
              class="mr-1"
            />
          </Image.PreviewGroup>
        </template>
        <template #action="{ row }">
          <Space v-if="canAudit && Number(row.Status) === 1">
            <Button size="small" type="link" @click="handleAudit(row, 2)">
              同意
            </Button>
            <Button
              danger
              size="small"
              type="link"
              @click="handleAudit(row, 3)"
            >
              拒绝
            </Button>
          </Space>
        </template>
      </Grid>
    </Card>
    <Modal
      v-model:open="auditOpen"
      :confirm-loading="auditSubmitting"
      title="审核提示"
      @ok="submitAudit"
    >
      <p>
        此操作将{{ auditStatus === 2 ? '通过' : '拒绝' }}玩家
        {{ auditRow?.PlayerId || auditRow?.LoginAccount }} 的申请，是否继续？
      </p>
      <Input.TextArea v-model:value="auditRemark" :maxlength="50" placeholder="操作备注（最多 50 字）" show-count />
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无溢出管理查看权限" title="403" />
</template>
