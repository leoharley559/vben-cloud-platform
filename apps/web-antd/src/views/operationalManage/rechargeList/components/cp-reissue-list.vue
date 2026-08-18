<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchCpIncompleteOrdersApi,
  fetchCpReissueListApi,
  replaceCpPaymentOrderApi,
} from '#/api/operationManage/recharge-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'RechargeCpReissueList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(13305));
const canReplace = computed(() => checkPermission(13308));

const filterOrderId = ref('');
const filterPlayerId = ref('');
const filterPackageId = ref<number | string>('');
const filterGameOrderId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const replaceOpen = ref(false);
const replaceSaving = ref(false);
const incompleteOptions = ref<Array<{ label: string; value: string }>>([]);
const replaceForm = reactive({
  Id: '' as number | string,
  OrderId: '',
  RealAmount: undefined as number | undefined,
  Remark: '',
});

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

function formatStatus(status?: number | string) {
  const map: Record<number, string> = {
    1: '成功',
    2: '失败',
    3: '处理中',
  };
  return map[Number(status)] || String(status ?? '-');
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AmountType: 1,
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: 0,
    EndTime: end ? end.unix() : '',
    GameOrderId: filterGameOrderId.value,
    OrderId: filterOrderId.value,
    PackageId: filterPackageId.value,
    PlayerId: filterPlayerId.value,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'Status',
      formatter: ({ cellValue }) => formatStatus(cellValue as string),
      minWidth: 90,
      title: '状态',
    },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    {
      field: 'LoginAccount',
      minWidth: 140,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'GameOrderId',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '游戏订单号',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    {
      field: 'Remark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '备注',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 100,
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
        const result = await fetchCpReissueListApi({
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

async function openReplace(row: Record<string, unknown>) {
  replaceForm.Id = row.Id as number | string;
  replaceForm.OrderId = '';
  replaceForm.RealAmount = undefined;
  replaceForm.Remark = '';
  incompleteOptions.value = [];
  replaceOpen.value = true;
  try {
    const result = await fetchCpIncompleteOrdersApi({
      CreateTime: row.CreateTime,
      PayType: row.PayType,
      PlayerId: row.PlayerId,
    });
    incompleteOptions.value = (result?.Items || []).map((item) => ({
      label: String(item.OrderId || item.Id || '-'),
      value: String(item.OrderId || ''),
    }));
  } catch {
    incompleteOptions.value = [];
  }
}

async function submitReplace() {
  if (!replaceForm.Id) {
    return;
  }
  if (!replaceForm.OrderId) {
    message.warning('请选择或填写订单号');
    return;
  }
  if (!replaceForm.RealAmount || replaceForm.RealAmount <= 0) {
    message.warning('请输入补单金额');
    return;
  }
  replaceSaving.value = true;
  try {
    await replaceCpPaymentOrderApi({
      Id: replaceForm.Id,
      OrderId: replaceForm.OrderId,
      RealAmount: Math.round(replaceForm.RealAmount * 100),
      Remark: replaceForm.Remark,
    });
    message.success('补单成功');
    replaceOpen.value = false;
    gridApi.reload();
  } finally {
    replaceSaving.value = false;
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          style="width: 260px"
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          style="width: 210px"
          placeholder="请输入玩家ID"
        >
          <template #addonBefore>玩家ID</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterGameOrderId"
          allow-clear
          style="width: 260px"
          placeholder="请输入游戏订单号"
        >
          <template #addonBefore>游戏订单号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">所属产品</span>
        <Select
          v-model:value="filterPackageId"
          :options="
            packageOptions.map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            }))
          "
          allow-clear
          style="width: 160px"
          placeholder="请选择所属产品"
        />
      </Space.Compact>
      <QueryDatetimeRangePicker v-model="filterDateRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #actions="{ row }">
        <Button
          v-if="canReplace && Number(row.Status) !== 1"
          size="small"
          type="link"
          @click="openReplace(row)"
        >
          补单
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="replaceOpen"
      :confirm-loading="replaceSaving"
      title="CP补单"
      @ok="submitReplace"
    >
      <Form layout="vertical">
        <Form.Item label="关联订单" required>
          <Select
            v-model:value="replaceForm.OrderId"
            :options="incompleteOptions"
            allow-clear
            show-search
            placeholder="选择未完成订单"
            style="width: 100%"
          />
          <Input
            v-model:value="replaceForm.OrderId"
            allow-clear
            class="mt-2"
            placeholder="或手动输入订单号"
          />
        </Form.Item>
        <Form.Item label="补单金额（元）" required>
          <InputNumber
            v-model:value="replaceForm.RealAmount"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="replaceForm.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要权限 13305 才能查看 CP 补单列表"
    title="无权限"
  />
</template>
