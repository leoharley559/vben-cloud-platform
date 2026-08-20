<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  RelationQueryItem,
  RelationQueryTotal,
} from '#/types/relation-query';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportRelationQueryApi,
  fetchRelationQueryListApi,
} from '#/api/operationManage/relation-query';
import ChannelSelect from '#/components/global/channel-select.vue';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { RELATION_QUERY_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

defineOptions({ name: 'OperationalRelationQuery' });

const LOGIN_ACCOUNT_RE = /^[a-zA-Z0-9]{4,20}$/;

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewPage = computed(() => checkPermission(10_023));

/**
 * 对齐旧站 relationQuery：getBeforeDateStr(1)～getBeforeDateStr(1,false)
 * （GLOBAL days-1，参数 1 实际为今天）
 */
const defaultRange = getTodayRangeSeconds();
const totalData = ref<RelationQueryTotal>({});
const summaryItems = computed(() => [
  { label: '游戏账号总计', value: totalData.value.PlayerCount || 0 },
  { label: 'IP总计', value: totalData.value.IpCount || 0 },
  { label: '设备号总计', value: totalData.value.DeviceIdCount || 0 },
]);
const totalCount = ref(0);
const tableRows = ref<RelationQueryItem[]>([]);
const exportLoading = ref(false);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const filterLoginAccount = ref('');
/** 对齐旧站：默认全部产品 PackageId='' */
const filterPackageId = ref<number | string>('');
const filterInviterLoginAccount = ref('');
const filterDeviceId = ref('');
const filterLoginIp = ref('');
const filterLoginAddress = ref('');
const filterLoginPlatform = ref('');
/** 0 模糊 / 1 精准 */
const channelSearchType = ref(0);
const filterChannelIds = ref<Array<number | string>>([]);
const filterChannelExact = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);
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

function normalizeLoginAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

function getChannelParams() {
  if (channelSearchType.value === 0) {
    const joined = filterChannelIds.value.length > 0
      ? filterChannelIds.value.join(',')
      : '';
    return {
      ChannelIds: joined,
      ChannelSearch: joined,
      ChannelSearchType: 0,
    };
  }
  const exact = filterChannelExact.value.trim();
  return {
    ChannelIds: exact,
    ChannelSearch: exact,
    ChannelSearchType: 1,
  };
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    DeviceId: filterDeviceId.value.trim(),
    EndTime: end ? end.unix() : '',
    InviterLoginAccount: filterInviterLoginAccount.value.trim(),
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value),
    LoginAddress: filterLoginAddress.value.trim(),
    LoginIp: filterLoginIp.value.trim(),
    LoginPlatform: filterLoginPlatform.value.trim(),
    PackageId: filterPackageId.value,
    ...getChannelParams(),
  };
}

function validateBeforeQuery() {
  const account = normalizeLoginAccount(filterLoginAccount.value);
  if (account && !LOGIN_ACCOUNT_RE.test(account)) {
    message.warning('游戏账号格式不正确（4-20位字母或数字）');
    return false;
  }
  return true;
}

const gridOptions: VxeTableGridOptions<RelationQueryItem> = {
  columns: [
    { type: 'seq', title: '序号', width: 70 },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    {
      field: 'IsAgent',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '是' : '否'),
      minWidth: 90,
      title: '是否代理',
    },
    {
      field: 'InviterLoginAccount',
      formatter: ({ cellValue }) =>
        !cellValue || Number(cellValue) === 0 ? '-' : String(cellValue),
      minWidth: 120,
      title: '上级代理',
    },
    { field: 'LoginPlatform', minWidth: 110, title: '登录设备' },
    {
      field: 'DeviceId',
      minWidth: 220,
      showOverflow: 'tooltip',
      title: '设备号',
    },
    { field: 'LoginIp', minWidth: 130, title: '登录IP' },
    {
      field: 'LoginAddress',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '登录地址',
    },
    {
      field: 'LoginTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '登录时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRelationQueryListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        totalData.value = result?.Total || {};
        totalCount.value = Number(result?.Pagination?.MaxCount || 0);
        const items = result?.Items || [];
        tableRows.value = items;
        return {
          items,
          total: totalCount.value,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  if (!validateBeforeQuery()) {
    return;
  }
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterInviterLoginAccount.value = '';
  filterDeviceId.value = '';
  filterLoginIp.value = '';
  filterLoginAddress.value = '';
  filterLoginPlatform.value = '';
  channelSearchType.value = 0;
  filterChannelIds.value = [];
  filterChannelExact.value = '';
  filterPackageId.value = '';
  const range = getTodayRangeSeconds();
  filterDateRange.value = [
    dayjs.unix(range.BeginTime),
    dayjs.unix(range.EndTime),
  ];
  handleSearch();
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  if (!validateBeforeQuery()) {
    return;
  }
  passPopupRef.value?.validate(RELATION_QUERY_EXPORT_PAGE_ID, {
    ...getQueryParams(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportRelationQueryApi({
      ...getQueryParams(),
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
    message.error(String(result?.Remark || '导出失败'));
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewPage.value) {
    handleSearch();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 关联号查询"
    title="关联号查询"
  >
    <Card>
      <OpsListPanel>
        <template #filters>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterLoginAccount"
              allow-clear
              @press-enter="handleSearch"
              @blur="
                filterLoginAccount = normalizeLoginAccount(filterLoginAccount)
              "
              placeholder="请输入游戏账号"
            >
              <template #addonBefore>游戏账号</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">所属产品</span>
              <Select
                v-model:value="filterPackageId"
                allow-clear
                show-search
                :options="packageSelectOptions"
                :filter-option="
                  (input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                "
                placeholder="请选择所属产品"
              />
            </Space.Compact>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterInviterLoginAccount"
              allow-clear
              placeholder="请输入上级代理"
            >
              <template #addonBefore>上级代理</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterDeviceId"
              allow-clear
              placeholder="请输入设备号"
            >
              <template #addonBefore>设备号</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterLoginIp"
              allow-clear
              placeholder="请输入登录IP"
            >
              <template #addonBefore>登录IP</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <Select
                class="query-auto-select"
                :popup-match-select-width="false"
                v-model:value="channelSearchType"
                :options="[
                  { label: '渠道模糊', value: 0 },
                  { label: '渠道精准', value: 1 },
                ]"
              />
              <ChannelSelect
                v-if="channelSearchType === 0"
                v-model="filterChannelIds"
                placeholder="请输入渠道号"
              />
              <Input
                v-else
                v-model:value="filterChannelExact"
                allow-clear
                placeholder="请输入渠道"
              />
            </Space.Compact>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterLoginAddress"
              allow-clear
              placeholder="请输入登录地址"
            >
              <template #addonBefore>登录地址</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterLoginPlatform"
              allow-clear
              placeholder="请输入登录设备"
            >
              <template #addonBefore>登录设备</template>
            </Input>
          </div>
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker
              v-model="filterDateRange"
              label="登录时间"
            />
          </div>
          <div class="query-filter-actions">
            <Button :loading="loading" type="primary" @click="handleSearch">
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
            <Button :loading="exportLoading" @click="handleExportClick">
              导出 Excel
            </Button>
          </div>
        </template>

        <template #summary>
          <SummaryCards :items="summaryItems" />
        </template>

        <Grid>
          <template #loginAccount="{ row }">
            <PlayerAccountLink
              :login-account="String(row.LoginAccount || '')"
              :player-id="row.PlayerId as number | string | undefined"
            />
          </template>
        </Grid>
      </OpsListPanel>
    </Card>

    <PassPopup ref="passPopupRef" type="csv" @confirm="handleExport" />
  </Page>

  <Page v-else auto-content-height title="关联号查询">
    <Result
      status="403"
      sub-title="需要权限 10023 才能查看关联号查询"
      title="无权限"
    />
  </Page>
</template>
