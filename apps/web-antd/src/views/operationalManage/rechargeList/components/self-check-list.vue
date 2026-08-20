<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SelfCheckListItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchSelfCheckGameSwitchApi,
  fetchSelfCheckListApi,
  handleSelfCheckOrderApi,
  updateSelfCheckGameSwitchApi,
} from '#/api/operationManage/recharge-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  formatSelfCheckStatus,
  getSelfCheckStatusColor,
  SELF_CHECK_STATUS_OPTIONS,
} from '#/utils/recharge-self-check';

import SelfCheckActionModal from './self-check-action-modal.vue';
import SelfCheckDetailModal from './self-check-detail-modal.vue';
import SelfCheckEntryImageModal from './self-check-entry-image-modal.vue';

defineOptions({ name: 'SelfCheckListPanel' });

const { adminInfo, checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(12_260));
const canTakeOrder = computed(() => checkPermission(12_262));
const canGameSwitch = computed(() => checkPermission(12_263));
const canEntryImage = computed(() => checkPermission(12_719));

const operatorName = computed(() =>
  String(adminInfo.value?.Account || adminInfo.value?.AdminName || ''),
);

const defaultRange = getYesterdayRangeSeconds();
const gameSwitchStatus = ref(false);
const gameSwitchLoading = ref(false);
const actionOpen = ref(false);
const actionType = ref<1 | 2 | 4>(1);
const actionRow = ref<null | SelfCheckListItem>(null);
const detailOpen = ref(false);
const detailRow = ref<null | SelfCheckListItem>(null);
const entryImageOpen = ref(false);

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterGameOrderIdOrigin = ref('');
const filterOrderId = ref('');
const filterStatus = ref<number | string>();
const filterReviewName = ref('');
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
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    GameOrderIdOrigin: filterGameOrderIdOrigin.value,
    LoginAccount: filterLoginAccount.value,
    OrderId: filterOrderId.value,
    PackageIds: filterPackageId.value,
    ReviewName: filterReviewName.value,
    Status: filterStatus.value ?? '',
  };
}

const gridOptions: VxeTableGridOptions<SelfCheckListItem> = {
  columns: [
    {
      field: 'Status',
      fixed: 'left',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    { field: 'GameOrderId', minWidth: 180, title: '查单编号' },
    { field: 'GameOrderIdOrigin', minWidth: 180, title: '游戏订单编号' },
    { field: 'OrderId', minWidth: 180, title: '订单编号' },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    {
      field: 'RealAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '实际充值',
    },
    { field: 'TakerName', minWidth: 120, title: '接单账号' },
    {
      field: 'TakerDateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '接单时间',
    },
    { field: 'WaitingTime', minWidth: 110, title: '等待时长(秒)' },
    { field: 'ReviewName', minWidth: 120, title: '操作人' },
    {
      field: 'ReviewRemark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '处理备注',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchSelfCheckListApi({
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

async function loadGameSwitch() {
  if (!canGameSwitch.value) {
    return;
  }
  try {
    const result = await fetchSelfCheckGameSwitchApi();
    const switchValue =
      (result as { SelfReviewConfig?: { DialogSwitch?: number } })
        ?.SelfReviewConfig?.DialogSwitch ??
      (result as { respond?: { SelfReviewConfig?: { DialogSwitch?: number } } })
        ?.respond?.SelfReviewConfig?.DialogSwitch;
    gameSwitchStatus.value = Number(switchValue) === 1;
  } catch {
    // checkconfig 当前环境会返回 10021，不影响列表主流程
  }
}

async function submitGameSwitch(checked: boolean) {
  const previous = gameSwitchStatus.value;
  gameSwitchStatus.value = checked;
  gameSwitchLoading.value = true;
  const nextValue = checked ? 1 : 0;
  try {
    await updateSelfCheckGameSwitchApi({ DialogSwitch: nextValue });
    message.success('开关更新成功');
  } catch {
    gameSwitchStatus.value = previous;
  } finally {
    gameSwitchLoading.value = false;
  }
}

async function submitTakeOrder(row: SelfCheckListItem) {
  await handleSelfCheckOrderApi({
    Action: 't',
    GameOrderId: row.GameOrderId,
    GameOrderIdOrigin: row.GameOrderIdOrigin,
    OrderId: row.OrderId,
    PlayerId: row.PlayerId,
    ReviewName: operatorName.value,
  });
  message.success('接单成功');
  openDetail(row);
  gridApi.reload();
}

async function handleTakeOrder(row: SelfCheckListItem) {
  await submitTakeOrder(row);
}

function handleGrabOrder(row: SelfCheckListItem) {
  Modal.confirm({
    title: '确认抢单',
    content: `当前接单账号为 ${row.TakerName || '-'}，确认抢单？`,
    onOk: async () => {
      await submitTakeOrder(row);
    },
  });
}

function openAction(row: SelfCheckListItem, type: 1 | 2 | 4) {
  actionRow.value = row;
  actionType.value = type;
  actionOpen.value = true;
}

function openDetail(row: SelfCheckListItem) {
  detailRow.value = row;
  detailOpen.value = true;
}

function handleAddRecordFromDetail() {
  if (!detailRow.value) {
    return;
  }
  openAction(detailRow.value, 4);
}

onMounted(() => {
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  if (canViewTable.value) {
    gridApi.reload();
    loadGameSwitch();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div
        v-if="canGameSwitch"
        class="flex items-center gap-2 rounded border px-3 py-2"
      >
        <span>游戏端入口开关</span>
        <Switch
          :checked="gameSwitchStatus"
          :loading="gameSwitchLoading"
          @update:checked="(value) => void submitGameSwitch(!!value)"
        />
      </div>
      <Button v-if="canEntryImage" @click="entryImageOpen = true">
        入口图片设置
      </Button>
    </div>

    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
            @press-enter="gridApi.reload()"
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
            v-model:value="filterGameOrderIdOrigin"
            allow-clear
            placeholder="请输入游戏订单"
          >
            <template #addonBefore>游戏订单</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterOrderId"
            allow-clear
            placeholder="请输入订单编号"
          >
            <template #addonBefore>订单编号</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="filterStatus"
            allow-clear
            :options="SELF_CHECK_STATUS_OPTIONS"
            placeholder="请选择状态"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterReviewName"
            allow-clear
            placeholder="请输入操作人"
          >
            <template #addonBefore>操作人</template>
          </Input>
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
            查询
          </Button>
        </div>
      </div>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="getSelfCheckStatusColor(row.Status)">
          {{ formatSelfCheckStatus(row.Status) }}
        </Tag>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :player-id="row.PlayerId"
        />
      </template>
      <template #actions="{ row }">
        <Space :size="0" wrap>
          <Button
            v-if="canTakeOrder && Number(row.Status) === 1"
            size="small"
            type="link"
            @click="handleTakeOrder(row)"
          >
            接单
          </Button>
          <template v-if="Number(row.Status) === 4">
            <Button
              v-if="row.TakerName !== operatorName"
              size="small"
              type="link"
              @click="handleGrabOrder(row)"
            >
              抢单
            </Button>
            <template v-if="row.TakerName === operatorName">
              <Button size="small" type="link" @click="openAction(row, 1)">
                补分
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="openAction(row, 2)"
              >
                拒绝
              </Button>
            </template>
          </template>
          <Button size="small" type="link" @click="openDetail(row)">
            处理记录
          </Button>
        </Space>
      </template>
    </Grid>

    <SelfCheckActionModal
      v-model:open="actionOpen"
      :action-type="actionType"
      :operator-name="operatorName"
      :row="actionRow"
      @success="gridApi.reload()"
    />
    <SelfCheckDetailModal
      v-model:open="detailOpen"
      :row="detailRow"
      @add-record="handleAddRecordFromDetail"
    />
    <SelfCheckEntryImageModal v-model:open="entryImageOpen" />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12260 才能查看自助查单"
    title="无权限"
  />
</template>
