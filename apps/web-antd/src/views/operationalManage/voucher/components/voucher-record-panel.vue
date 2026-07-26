<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';

import {
  exportVoucherDetailRecordApi,
  fetchVoucherDetailRecordApi,
  fetchVoucherListAllApi,
} from '#/api/operationManage/voucher';
import PassPopup from '#/components/security/pass-popup.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { ACTIVITY_TYPE_OPTIONS, VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { VOUCHER_DETAIL_RECORD_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import {
  VOUCHER_STATUS_FILTER_OPTIONS,
  VOUCHER_STATUS_OPTIONS,
  deriveActivityName,
  formatVoucherAmount,
  formatVoucherDateTime,
  formatVoucherType,
  resolveVoucherName,
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
    EndReceiveVoucherTime: recvEnd ? recvEnd.endOf('day').unix() : '',
    EndRegisterTime: regEnd ? regEnd.endOf('day').unix() : '',
    Id: props.voucherId ?? '',
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    PackageId: filterPackageId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    StartReceiveVoucherTime: recvBegin ? recvBegin.startOf('day').unix() : '',
    StartRegisterTime: regBegin ? regBegin.startOf('day').unix() : '',
    Status: filterStatus.value === '' ? '' : filterStatus.value,
    VipLevel:
      filterVipLevel.value === -1 || filterVipLevel.value === ''
        ? ''
        : filterVipLevel.value,
  };
}

function buildExportQuery() {
  const { Page: _page, PageSize: _size, ...rest } = buildQuery({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { type: 'seq', minWidth: 60, title: '序号' },
    { field: 'LoginAccount', minWidth: 120, slots: { default: 'loginAccount' }, title: '玩家账号' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
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
    <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div class="flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="玩家账号"
          style="width: 220px"
        >
          <template #addonBefore>玩家账号</template>
        </Input>
        <Select
          v-model:value="filterVipLevel"
          allow-clear
          class="w-28"
          :options="vipOptions"
          placeholder="VIP等级"
        />
        <Select
          v-model:value="filterPackageId"
          allow-clear
          class="w-36"
          :options="packageFilterOptions"
          placeholder="所属产品"
        />
        <DatePicker.RangePicker
          v-model:value="filterRegDateRange"
          placeholder="['注册开始','注册结束']"
        />
        <DatePicker.RangePicker
          v-model:value="filterReceiveDateRange"
          placeholder="['获取开始','获取结束']"
        />
        <Select
          v-model:value="filterActivityType"
          allow-clear
          class="w-32"
          :options="activityTypeOptions"
          placeholder="活动类型"
        />
        <Input
          v-model:value="filterActivityName"
          allow-clear
          placeholder="活动名称"
          style="width: 220px"
        >
          <template #addonBefore>活动名称</template>
        </Input>
        <Select
          v-model:value="filterStatus"
          allow-clear
          class="w-28"
          :options="VOUCHER_STATUS_FILTER_OPTIONS"
          placeholder="票券状态"
        />
        <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>
      <Button
        :loading="exportLoading"
        type="primary"
        @click="handleExportClick"
      >
        导出
      </Button>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #status="{ row }">
        <Tag :color="statusMeta(row.Status)?.color || 'default'">
          {{ statusMeta(row.Status)?.label || row.Status || '-' }}
        </Tag>
      </template>
    </Grid>

    <PassPopup
      ref="passPopupRef"
      type="csv"
      @confirm="handleExport"
    />
  </div>
</template>
