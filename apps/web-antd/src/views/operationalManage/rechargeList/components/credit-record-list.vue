<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerCreditRecordItem } from '#/types/player-detail';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  Result,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { fetchPlayerCreditRecordListApi } from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  CREDIT_WALLET_TYPE_OPTIONS,
  formatCreditStatus,
  formatCreditWalletType,
  getCreditStatusColor,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'RechargeCreditRecordList' });

const { checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(11829));
const canExport = computed(() => checkPermission(11830));

const defaultRange = getYesterdayRangeSeconds();
const exportLoading = ref(false);

const filterPlayerAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterReferenceId = ref('');
const filterWalletType = ref(0);
const filterAccountName = ref('');
const filterDataSearchType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
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

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AccountName: filterAccountName.value,
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: filterDataSearchType.value,
    EndTime: end ? end.unix() : '',
    IsBO: 1,
    PackageId: filterPackageId.value,
    PlayerAccount: filterPlayerAccount.value,
    PlayerInfo: 1,
    ReferenceId: filterReferenceId.value,
    WalletType: filterWalletType.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerCreditRecordItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'ReferenceId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'WalletType',
      formatter: ({ cellValue }) => formatCreditWalletType(cellValue),
      minWidth: 110,
      title: '操作类型',
    },
    {
      field: 'ReferenceAccount',
      minWidth: 120,
      title: '游戏账号',
    },
    {
      field: 'VipLevel',
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'PackageName',
      minWidth: 120,
      title: '所属产品',
    },
    {
      field: 'ChannelName',
      minWidth: 120,
      title: '渠道名称',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '操作金额',
    },
    {
      field: 'WithdrawWaterMultiply',
      minWidth: 100,
      title: '提款流水',
    },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '操作时间',
    },
    {
      field: 'AdminAccount',
      minWidth: 120,
      title: '操作人',
    },
    {
      field: 'Remarks',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '备注',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerCreditRecordListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterPlayerAccount.value = '';
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  filterReferenceId.value = '';
  filterWalletType.value = 0;
  filterAccountName.value = '';
  filterDataSearchType.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlayerCreditRecordListApi({
      ...getQueryParams(),
      IsExp: true,
      Page: 1,
      PageSize: 10000,
    });
    const items = result?.Items || [];
    if (!items.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      items,
      [
        { header: '状态', value: (row) => formatCreditStatus(row.Status) },
        { header: '订单编号', value: (row) => String(row.ReferenceId || '-') },
        {
          header: '操作类型',
          value: (row) => formatCreditWalletType(row.WalletType),
        },
        {
          header: '游戏账号',
          value: (row) => String(row.ReferenceAccount || '-'),
        },
        { header: 'VIP等级', value: (row) => String(row.VipLevel ?? '-') },
        { header: '所属产品', value: (row) => String(row.PackageName || '-') },
        { header: '渠道名称', value: (row) => String(row.ChannelName || '-') },
        {
          header: '操作金额',
          value: (row) => formatAmountFromCent(row.Amount),
        },
        {
          header: '提款流水',
          value: (row) => String(row.WithdrawWaterMultiply ?? '-'),
        },
        {
          header: '操作时间',
          value: (row) => formatDateTime(row.UpdateTime),
        },
        { header: '操作人', value: (row) => String(row.AdminAccount || '-') },
        { header: '备注', value: (row) => String(row.Remarks || '-') },
      ],
      '充值列表-代存记录',
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerAccount"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>

      <Space.Compact>
        <span class="query-field-addon">产品</span>
        <Select
          v-model:value="filterPackageId"
          :options="
            packageOptions
              .filter((item) => item.PackageId !== '')
              .map((item) => ({
                label: item.PackageName,
                value: item.PackageId,
              }))
          "
          placeholder="请选择产品"
        />
      </Space.Compact>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterReferenceId"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>

      <Space.Compact>
        <span class="query-field-addon">钱包类型</span>
        <Select
          v-model:value="filterWalletType"
          :options="CREDIT_WALLET_TYPE_OPTIONS"
          placeholder="请选择钱包类型"
        />
      </Space.Compact>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterAccountName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入操作人"
        >
          <template #addonBefore>操作人</template>
        </Input>
      </div>

      <Space.Compact>
        <span class="query-field-addon">数据类型</span>
        <Select
          v-model:value="filterDataSearchType"
          :options="memberTypeOptions"
          placeholder="请选择数据类型"
        />
      </Space.Compact>

      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions">
          <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
          导出
        </Button>
      </Space>
        </div>
    </div>
  </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="getCreditStatusColor(row.Status)">
          {{ formatCreditStatus(row.Status) }}
        </Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 11829 才能查看代存记录"
    title="无权限"
  />
</template>
