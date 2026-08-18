<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BankCardListItem } from '#/types/bank-card';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Checkbox,
  Input,
  Space,
  Tooltip,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteBankCardApi,
  fetchBankCardListApi,
} from '#/api/memberManage/bank-card';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useProjectConfig } from '#/composables/use-project-config';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatBankCode } from '#/utils/bank-card';

import CardFormModal from './card-form-modal.vue';

defineOptions({ name: 'CardManageList' });

/** 与旧站 GoogleCode page-id=8 一致 */
const BANK_CARD_SECURITY_PAGE_ID = 8;

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canView = computed(() => checkPermission(11469));
const canAdd = computed(() => checkPermission(11470));
const canDelete = computed(() => checkPermission(11471));
const canEdit = computed(() => checkPermission(11472));

const defaultBegin = dayjs().subtract(1, 'month').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterLoginAccount = ref('');
const filterBankCardNum = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);

const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingRow = ref<BankCardListItem | null>(null);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const deletingRow = ref<BankCardListItem | null>(null);
const deleteAddBlacklist = ref(false);
const deleting = ref(false);

const bankList = computed(
  () =>
    (projectConfig.value?.BankList as Array<{
      BankCode?: string;
      BankName?: string;
    }>) || [],
);

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

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BankCardNum: filterBankCardNum.value.trim() || undefined,
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    // 对齐旧站 keyup：账号转小写去空格
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value) || undefined,
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<BankCardListItem> = {
  columns: [
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'RealName', minWidth: 110, title: '开户姓名' },
    { field: 'BankCardNum', minWidth: 180, title: '银行卡号' },
    {
      field: 'BankCode',
      formatter: ({ cellValue }) => formatBankCode(cellValue, bankList.value),
      minWidth: 140,
      title: '银行名称',
    },
    {
      field: 'remark',
      minWidth: 80,
      slots: { default: 'remark' },
      title: '备注',
    },
    {
      field: 'BankCardTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '添加时间',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 120,
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
        const result = await fetchBankCardListApi({
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
  filterLoginAccount.value = '';
  filterBankCardNum.value = '';
  filterDateRange.value = [defaultBegin, defaultEnd];
  gridApi.reload();
}

function openCreate() {
  formMode.value = 'create';
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: BankCardListItem) {
  formMode.value = 'edit';
  editingRow.value = row;
  formOpen.value = true;
}

function openDelete(row: BankCardListItem) {
  deletingRow.value = row;
  deleteAddBlacklist.value = false;
  passPopupRef.value?.prompt(BANK_CARD_SECURITY_PAGE_ID);
}

async function confirmDelete(extra: Record<string, unknown> = {}) {
  if (!deletingRow.value?.Id) {
    return;
  }
  deleting.value = true;
  try {
    await deleteBankCardApi(deletingRow.value.Id, {
      IsBlack: deleteAddBlacklist.value,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    });
    message.success('删除成功');
    deletingRow.value = null;
    gridApi.reload();
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  if (canView.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <OpsListPanel v-if="canView">
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterBankCardNum"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入银行卡号"
        >
          <template #addonBefore>银行卡号</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" label="添加时间" />
        </div>
        <div class="query-filter-actions">
          <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button v-if="canAdd" type="primary" @click="openCreate">
          新增银行卡
        </Button>
      </Space>
        </div>
      </template>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #remark="{ row }">
        <Tooltip
          v-if="row.MerchantOrderNo && row.ThirdPartyUserId"
          :title="`专项账号: ${row.MerchantOrderNo || '-'} / 三方专项: ${row.ThirdPartyUserId || '-'}`"
        >
          <span class="cursor-pointer text-primary">详情</span>
        </Tooltip>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="openDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <CardFormModal
      v-model:open="formOpen"
      :mode="formMode"
      :row="editingRow"
      @success="gridApi.reload()"
    />

    <PassPopup
      ref="passPopupRef"
      prompt-msg="确认删除该银行卡记录？"
      title="删除银行卡"
      @confirm="confirmDelete"
    >
      <template #extra>
        <Checkbox v-model:checked="deleteAddBlacklist" class="mt-3">
          删除并加入黑名单
        </Checkbox>
      </template>
    </PassPopup>
  </OpsListPanel>
</template>
