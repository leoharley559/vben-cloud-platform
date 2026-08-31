<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { vipLevelGridColumn } from '#/utils/vip-level';

import {
  exportVoucherDetailRecordApi,
  fetchVoucherDetailRecordApi,
  fetchVoucherListAllApi,
} from '#/api/operationManage/voucher';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import VipLevelTag from '#/components/global/vip-level-tag.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { ACTIVITY_TYPE_OPTIONS, VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { VOUCHER_DETAIL_RECORD_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import {
  deriveActivityName,
  formatVoucherAmount,
  formatVoucherDateTime,
  formatVoucherType,
  resolveVoucherName,
  VOUCHER_STATUS_FILTER_OPTIONS,
  VOUCHER_STATUS_OPTIONS,
} from './voucher-shared';

defineOptions({ name: 'VoucherRecordPanel' });

const props = defineProps<{
  /** 详情弹窗内按票券 ID 过滤 */
  voucherId?: number | string;
}>();

const router = useRouter();
const { packageOptions } = useOperationOptions();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const filterLoginAccount = ref('');
const filterVipLevel = ref<number | string>(-1);
const filterPackageId = ref<number | string>('');
const filterRegDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const filterReceiveDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const filterActivityType = ref<number | string>(-1);
const filterActivityName = ref('');
const filterStatus = ref<number | string>('');
const exportLoading = ref(false);
const totalCount = ref(0);

const voucherNameMap = ref<Record<string, string>>({});
const voucherTypeMap = ref<Record<string, string>>({});

const activityTypeOptions = ACTIVITY_TYPE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}));

const vipOptions = VIP_LEVEL_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}));

const packageFilterOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

async function loadVoucherMaps() {
  const result = await fetchVoucherListAllApi();
  const items = result.Items || [];
  voucherNameMap.value = Object.fromEntries(
    items.map((item) => [String(item.Id), resolveVoucherName(item.LangText)]),
  );
  voucherTypeMap.value = Object.fromEntries(
    items.map((item) => [
      String(item.Id),
      formatVoucherType(item.Type as number),
    ]),
  );
}

onMounted(() => {
  void loadVoucherMaps();
});

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [regBegin, regEnd] = filterRegDateRange.value || [];
  const [recvBegin, recvEnd] = filterReceiveDateRange.value || [];
  return {
    ActivityName: filterActivityName.value.trim(),
    ActivityType:
      filterActivityType.value === -1 || filterActivityType.value === ''
        ? ''
        : filterActivityType.value,
    EndReceiveVoucherTime: recvEnd ? recvEnd.unix() : '',
    EndRegisterTime: regEnd ? regEnd.unix() : '',
    Id: props.voucherId ?? '',
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    PackageId: filterPackageId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    StartReceiveVoucherTime: recvBegin ? recvBegin.unix() : '',
    StartRegisterTime: regBegin ? regBegin.unix() : '',
    Status: filterStatus.value === '' ? '' : filterStatus.value,
    VipLevel:
      filterVipLevel.value === -1 || filterVipLevel.value === ''
        ? ''
        : filterVipLevel.value,
  };
}

function buildExportQuery() {
  const {
    Page: _page,
    PageSize: _size,
    ...rest
  } = buildQuery({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { type: 'seq', minWidth: 60, title: '序号' },
    {
      field: 'LoginAccount',
      minWidth: 120,
      slots: { default: 'loginAccount' },
      title: '玩家账号',
    },
    { ...vipLevelGridColumn },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'RegisterTime',
      formatter: ({ cellValue }) => formatVoucherDateTime(cellValue as number),
      minWidth: 160,
      title: '注册时间',
    },
    {
      field: 'ReceiveVoucherTime',
      formatter: ({ cellValue }) => formatVoucherDateTime(cellValue as number),
      minWidth: 160,
      title: '获取时间',
    },
    {
      field: 'ReceiveRewardTime',
      formatter: ({ cellValue }) => formatVoucherDateTime(cellValue as number),
      minWidth: 160,
      title: '领奖时间',
    },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) =>
        ACTIVITY_TYPE_OPTIONS.find((item) => item.value === Number(cellValue))
          ?.label ||
        cellValue ||
        '-',
      minWidth: 120,
      title: '活动类型',
    },
    {
      field: 'ActivityName',
      formatter: ({ row }) =>
        deriveActivityName(row.ActivityType as number | string, row.LangText) ||
        '-',
      minWidth: 140,
      title: '活动名称',
    },
    {
      field: 'VoucherType',
      formatter: ({ row }) =>
        voucherTypeMap.value[String(row.VoucherId)] ||
        formatVoucherType(row.Type as number),
      minWidth: 120,
      title: '票券类型',
    },
    {
      field: 'VoucherName',
      formatter: ({ row }) =>
        voucherNameMap.value[String(row.VoucherId)] || '-',
      minWidth: 140,
      title: '票券名称',
    },
    {
      field: 'VoucherId',
      minWidth: 90,
      title: '票券ID',
    },
    {
      field: 'DepositProgress',
      formatter: ({ row }) =>
        Number(row.DepositTarget) === 0
          ? '-'
          : formatVoucherAmount(row.DepositProgress as number),
      minWidth: 100,
      title: '存款进度',
    },
    {
      field: 'BetProgress',
      formatter: ({ row }) =>
        Number(row.BetTarget) === 0
          ? '-'
          : formatVoucherAmount(row.BetProgress as number),
      minWidth: 100,
      title: '投注进度',
    },
    {
      field: 'Bonus',
      formatter: ({ cellValue }) => formatVoucherAmount(cellValue as number),
      minWidth: 100,
      title: '奖励金额',
    },
    {
      field: 'WaterReward',
      formatter: ({ row, cellValue }) =>
        Number(row.RewardType) === 1 ? String(cellValue ?? '-') : '-',
      minWidth: 90,
      title: '流水倍数',
    },
    {
      field: 'Status',
      fixed: 'right',
      minWidth: 100,
      slots: { default: 'status' },
      title: '票券状态',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchVoucherDetailRecordApi(buildQuery(page));
        const items = result.Items || [];
        totalCount.value = Number(result.Pagination?.MaxCount || items.length);
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

function handleReset() {
  filterLoginAccount.value = '';
  filterVipLevel.value = -1;
  filterPackageId.value = '';
  filterRegDateRange.value = undefined;
  filterReceiveDateRange.value = undefined;
  filterActivityType.value = -1;
  filterActivityName.value = '';
  filterStatus.value = '';
  gridApi.reload();
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(VOUCHER_DETAIL_RECORD_EXPORT_PAGE_ID, {
    ...buildExportQuery(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportVoucherDetailRecordApi({
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
    message.error(String(result?.Remark || '导出失败'));
  } finally {
    exportLoading.value = false;
  }
}

function statusMeta(value?: number | string) {
  return VOUCHER_STATUS_OPTIONS.find(
    (item) => Number(item.value) === Number(value),
  );
}
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
            placeholder="请输入玩家账号"
          >
            <template #addonBefore>玩家账号</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">VIP等级</span>
          <Select
            v-model:value="filterVipLevel"
            allow-clear
            :options="vipOptions"
            placeholder="请选择VIP等级"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">所属产品</span>
          <Select
            v-model:value="filterPackageId"
            allow-clear
            :options="packageFilterOptions"
            placeholder="请选择所属产品"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="filterRegDateRange"
            label="注册时间"
          />
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="filterReceiveDateRange"
            label="领取时间"
          />
        </div>
        <Space.Compact>
          <span class="query-field-addon">活动类型</span>
          <Select
            v-model:value="filterActivityType"
            allow-clear
            :options="activityTypeOptions"
            placeholder="请选择活动类型"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterActivityName"
            allow-clear
            placeholder="请输入活动名称"
          >
            <template #addonBefore>活动名称</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">票券状态</span>
          <Select
            v-model:value="filterStatus"
            allow-clear
            :options="VOUCHER_STATUS_FILTER_OPTIONS"
            placeholder="请选择票券状态"
          />
        </Space.Compact>
        <div class="query-filter-actions">
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
          <Button :loading="exportLoading" @click="handleExportClick">
            导出 Excel
          </Button>
        </div>
      </div>
    </div>

    <Grid>
      <template #vipLevel="{ row }">
        <VipLevelTag :level="row.VipLevel" />
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
      <template #status="{ row }">
        <Tag :color="statusMeta(Number(row.Status))?.color || 'default'">
          {{ statusMeta(Number(row.Status))?.label || row.Status || '-' }}
        </Tag>
      </template>
    </Grid>

    <PassPopup ref="passPopupRef" type="csv" @confirm="handleExport" />
  </div>
</template>
