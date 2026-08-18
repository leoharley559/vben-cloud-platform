<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  message,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';

import {
  batchIssueVoucherApi,
  exportVoucherIssueRecordApi,
  fetchVoucherIssueRecordApi,
  issueVoucherApi,
} from '#/api/operationManage/voucher';
import { queryPlayerByAccountApi } from '#/api/operationManage/player';
import PassPopup from '#/components/security/pass-popup.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { VOUCHER_ISSUE_RECORD_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import { formatVoucherDateTime, resolveVoucherName } from './voucher-shared';

defineOptions({ name: 'VoucherPayoutPanel' });

const props = defineProps<{
  voucher: {
    Id: number | string;
    LangText?: unknown;
    Type?: number;
  };
}>();

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const canSingle = computed(() => checkPermission(13445));
const canBatch = computed(() => checkPermission(13446));
const canExportIssue = computed(() => checkPermission(13448));

const payoutTabs = computed(() => {
  const tabs: Array<{ key: string; label: string }> = [];
  if (canSingle.value) {
    tabs.push({ key: 'single', label: '单人发放' });
  }
  if (canBatch.value) {
    tabs.push({ key: 'batch', label: '批量发放' });
  }
  tabs.push({ key: 'record', label: '发放记录' });
  return tabs;
});

const activeTab = ref('single');

watch(
  payoutTabs,
  (tabs) => {
    if (!tabs.some((item) => item.key === activeTab.value)) {
      activeTab.value = tabs[0]?.key || 'record';
    }
  },
  { immediate: true },
);

const voucherLabel = computed(
  () => `${resolveVoucherName(props.voucher.LangText)}(${props.voucher.Id})`,
);

/* ---------- 单人发放 ---------- */
const singleForm = reactive({
  Desc: '',
  LoginAccount: '',
  PackageId: undefined as number | string | undefined,
  PlayerId: '',
  PlayerLabel: '',
  Quantity: 1,
});
const singleSearching = ref(false);
const singleSubmitting = ref(false);

async function searchSinglePlayer() {
  const account = singleForm.LoginAccount.trim();
  if (!account) {
    message.warning('请输入玩家账号');
    return;
  }
  singleSearching.value = true;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: account.toLowerCase().replaceAll(/\s/g, ''),
      PackageId: singleForm.PackageId,
    });
    const first = result?.Items?.[0] as
      | { LoginAccount?: string; PlayerId?: number | string }
      | undefined;
    if (!first?.PlayerId) {
      singleForm.PlayerId = '';
      singleForm.PlayerLabel = '';
      message.warning('未找到玩家');
      return;
    }
    singleForm.PlayerId = String(first.PlayerId);
    singleForm.PlayerLabel = `${first.LoginAccount || account} / ${first.PlayerId}`;
  } finally {
    singleSearching.value = false;
  }
}

function resetSingle() {
  singleForm.LoginAccount = '';
  singleForm.PackageId = undefined;
  singleForm.PlayerId = '';
  singleForm.PlayerLabel = '';
  singleForm.Quantity = 1;
  singleForm.Desc = '';
}

async function submitSingle() {
  if (!singleForm.PlayerId) {
    message.warning('请先查询并选择玩家');
    return;
  }
  if (!singleForm.Quantity || singleForm.Quantity < 1) {
    message.warning('请输入发放数量');
    return;
  }
  singleSubmitting.value = true;
  try {
    await issueVoucherApi({
      Desc: singleForm.Desc,
      PlayerId: singleForm.PlayerId,
      Quantity: singleForm.Quantity,
      VoucherId: props.voucher.Id,
      VoucherType: props.voucher.Type,
    });
    message.success('发放成功');
    resetSingle();
  } finally {
    singleSubmitting.value = false;
  }
}

/* ---------- 批量发放 ---------- */
const batchText = ref('');
const batchDesc = ref('');
const batchSubmitting = ref(false);

function resetBatch() {
  batchText.value = '';
  batchDesc.value = '';
}

async function submitBatch() {
  const lines = batchText.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 1) {
    message.warning('请按行输入：玩家ID,数量');
    return;
  }
  const playerIds: string[] = [];
  const quantities: string[] = [];
  for (const line of lines) {
    const [pid, qty] = line.split(/[,，\s]+/);
    if (!pid || !qty || Number(qty) < 1) {
      message.warning(`格式错误：${line}（应为 玩家ID,数量）`);
      return;
    }
    playerIds.push(pid);
    quantities.push(String(Math.floor(Number(qty))));
  }
  batchSubmitting.value = true;
  try {
    await batchIssueVoucherApi({
      Desc: batchDesc.value,
      PlayerIds: playerIds.join(','),
      Quantities: quantities.join(','),
      VoucherId: props.voucher.Id,
      VoucherType: props.voucher.Type,
    });
    message.success('批量发放已提交');
    resetBatch();
  } finally {
    batchSubmitting.value = false;
  }
}

/* ---------- 发放记录 ---------- */
const filterLoginAccount = ref('');
const filterVipLevel = ref<number | string>(-1);
const filterRegRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const filterIssueRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const exportLoading = ref(false);
const totalCount = ref(0);

function buildIssueQuery(page: { currentPage: number; pageSize: number }) {
  const [regBegin, regEnd] = filterRegRange.value || [];
  const [issueBegin, issueEnd] = filterIssueRange.value || [];
  return {
    IssueEndTime: issueEnd ? issueEnd.unix() : '',
    IssueStartTime: issueBegin ? issueBegin.unix() : '',
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    RegEndTime: regEnd ? regEnd.unix() : '',
    RegStartTime: regBegin ? regBegin.unix() : '',
    VipLevel:
      filterVipLevel.value === -1 || filterVipLevel.value === ''
        ? ''
        : filterVipLevel.value,
    VoucherId: props.voucher.Id,
  };
}

function buildIssueExportQuery() {
  const { Page: _page, PageSize: _size, ...rest } = buildIssueQuery({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

const issueGridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { type: 'seq', minWidth: 60, title: '序号' },
    { field: 'PlayerInfo', minWidth: 140, title: '玩家账号' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'RegTime',
      formatter: ({ cellValue, row }) =>
        formatVoucherDateTime(
          (cellValue as number) || (row.RegisterTime as number),
        ),
      minWidth: 160,
      title: '注册时间',
    },
    {
      field: 'VoucherInfo',
      minWidth: 160,
      title: '票券信息',
    },
    { field: 'Quantity', minWidth: 100, title: '发放数量' },
    {
      field: 'IssueTime',
      formatter: ({ cellValue }) => formatVoucherDateTime(cellValue as number),
      minWidth: 160,
      title: '发放时间',
    },
    { field: 'Status', minWidth: 100, title: '发放状态' },
    { field: 'Desc', minWidth: 140, title: '备注' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchVoucherIssueRecordApi(buildIssueQuery(page));
        const items = result.Items || [];
        totalCount.value = Number(result.Pagination?.MaxCount || items.length);
        return { items, total: totalCount.value };
      },
    },
  },
};

const [IssueGrid, issueGridApi] = useVbenVxeGrid({
  gridOptions: issueGridOptions,
});

watch(activeTab, (tab) => {
  if (tab === 'record') {
    issueGridApi.reload();
  }
});

function handleIssueSearch() {
  issueGridApi.reload();
}

function handleIssueReset() {
  filterLoginAccount.value = '';
  filterVipLevel.value = -1;
  filterRegRange.value = undefined;
  filterIssueRange.value = undefined;
  issueGridApi.reload();
}

function handleIssueExportClick() {
  if (!canExportIssue.value) {
    return;
  }
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(VOUCHER_ISSUE_RECORD_EXPORT_PAGE_ID, {
    ...buildIssueExportQuery(),
  });
}

async function handleIssueExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportVoucherIssueRecordApi({
      ...buildIssueExportQuery(),
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
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group v-model:value="activeTab" button-style="solid">
        <Radio.Button
          v-for="item in payoutTabs"
          :key="item.key"
          :value="item.key"
        >
          {{ item.label }}
        </Radio.Button>
      </Radio.Group>
    </div>

    <div v-if="activeTab === 'single'" class="max-w-xl">
      <div class="mb-3 text-base font-medium">玩家信息</div>
      <Space class="mb-4" wrap>
        <Space.Compact>
          <span class="query-field-addon">产品包</span>
          <Select
            v-model:value="singleForm.PackageId"
            allow-clear
            class="w-40"
            :field-names="{ label: 'PackageName', value: 'PackageId' }"
            :options="packageOptions"
            placeholder="请选择产品包"
          />
        </Space.Compact>
        <Input
          v-model:value="singleForm.LoginAccount"
          allow-clear
          style="width: 180px"
          @press-enter="searchSinglePlayer"
          placeholder="请输入玩家账号"
        />
        <Button :loading="singleSearching" @click="searchSinglePlayer">
          查询玩家
        </Button>
      </Space>
      <div v-if="singleForm.PlayerLabel" class="mb-4 text-sm text-gray-600">
        已选：{{ singleForm.PlayerLabel }}
      </div>

      <div class="mb-3 text-base font-medium">手动发放票券</div>
      <Form layout="vertical">
        <Form.Item label="票券信息">
          <Input :value="voucherLabel" disabled />
        </Form.Item>
        <Form.Item label="发放数量">
          <InputNumber
            v-model:value="singleForm.Quantity"
            :min="1"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input
            v-model:value="singleForm.Desc"
            allow-clear
            placeholder="备注"
          />
        </Form.Item>
        <Space>
          <Button
            :loading="singleSubmitting"
            type="primary"
            @click="submitSingle"
          >
            确认发放
          </Button>
          <Button @click="resetSingle">重置</Button>
        </Space>
      </Form>
    </div>

    <div v-else-if="activeTab === 'batch'" class="max-w-xl">
      <div class="mb-3 text-base font-medium">批量发放</div>
      <Form layout="vertical">
        <Form.Item label="票券信息">
          <Input :value="voucherLabel" disabled />
        </Form.Item>
        <Form.Item label="玩家列表（每行：玩家ID,数量）">
          <Input.TextArea
            v-model:value="batchText"
            :rows="8"
            placeholder="例如：&#10;10001,1&#10;10002,2"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="batchDesc" allow-clear placeholder="备注" />
        </Form.Item>
        <Space>
          <Button
            :loading="batchSubmitting"
            type="primary"
            @click="submitBatch"
          >
            确认发放
          </Button>
          <Button @click="resetBatch">重置</Button>
        </Space>
      </Form>
    </div>

    <div v-else-if="activeTab === 'record'">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div class="flex flex-wrap items-end gap-2">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
            style="width: 220px"
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
          <Space.Compact>
            <span class="query-field-addon">VIP</span>
            <Select
              v-model:value="filterVipLevel"
              class="w-28"
              :options="VIP_LEVEL_OPTIONS"
              placeholder="请选择VIP"
            />
          </Space.Compact>
          <QueryDatetimeRangePicker v-model="filterRegRange" label="注册时间" />
          <QueryDatetimeRangePicker v-model="filterIssueRange" label="发放时间" />
          <Space>
            <Button type="primary" @click="handleIssueSearch">查询</Button>
            <Button @click="handleIssueReset">重置</Button>
          </Space>
        </div>
        <Button
          v-if="canExportIssue"
          :loading="exportLoading"
          type="primary"
          @click="handleIssueExportClick"
        >
          导出
        </Button>
      </div>
      <IssueGrid />
      <PassPopup
        ref="passPopupRef"
        type="csv"
        @confirm="handleIssueExport"
      />
    </div>
  </div>
</template>
