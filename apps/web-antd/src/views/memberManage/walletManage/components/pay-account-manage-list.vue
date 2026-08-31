<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BankCardListItem } from '#/types/bank-card';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Checkbox,
  Input,
  message,
  Modal,
  Space,
  Spin,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteBankCardApi,
  fetchBankCardListApi,
} from '#/api/memberManage/bank-card';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { parsePlayerPayAccountList } from '#/utils/bank-card';

import PayAccountFormModal from './pay-account-form-modal.vue';

defineOptions({ name: 'PayAccountManageList' });

const props = defineProps<{
  resourceType: 'alipay' | 'wechat';
}>();

/** 与银行卡一致，PageId=8 */
const PAY_ACCOUNT_SECURITY_PAGE_ID = 8;

const { checkPermission } = useCloudPermission();

const canView = computed(() => checkPermission(11_469));
const canAdd = computed(() => checkPermission(11_470));
const canDelete = computed(() => checkPermission(11_471));
const canEdit = computed(() => checkPermission(11_472));

const titleLabel = computed(() =>
  props.resourceType === 'alipay' ? '支付宝' : '微信',
);
const accountType = computed(() => (props.resourceType === 'alipay' ? 1 : 2));
const nameColumnField =
  props.resourceType === 'alipay' ? 'AlipayName' : 'WechatName';
const accountColumnField =
  props.resourceType === 'alipay' ? 'AlipayAccount' : 'WechatAccount';
const labelText = props.resourceType === 'alipay' ? '支付宝' : '微信';

const filterLoginAccount = ref('');
const filterAccount = ref('');
const filterName = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingRow = ref<BankCardListItem | null>(null);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const deletingRow = ref<BankCardListItem | null>(null);
const deleteAddBlacklist = ref(false);
const deleting = ref(false);

const qrPreviewOpen = ref(false);
const qrPreviewLoading = ref(false);
const qrPreview = reactive({
  account: '',
  name: '',
  url: '',
});

function resolveRowAccount(row: BankCardListItem) {
  if (props.resourceType === 'alipay') {
    return String(row.AlipayAccount || row.Account || '').trim();
  }
  return String(row.WechatAccount || row.Account || '').trim();
}

function resolveRowName(row: BankCardListItem) {
  if (props.resourceType === 'alipay') {
    return String(row.AlipayName || row.Name || '').trim();
  }
  return String(row.WechatName || row.Name || '').trim();
}

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
    Account: filterAccount.value.trim(),
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value),
    Name: filterName.value.trim(),
    ResourceType: props.resourceType,
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
    {
      field: nameColumnField,
      minWidth: 120,
      title: `${labelText}名`,
    },
    {
      field: accountColumnField,
      minWidth: 180,
      title: `${labelText}账号`,
    },
    {
      field: 'BankCardTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '添加时间',
    },
    {
      field: 'qrCode',
      minWidth: 90,
      slots: { default: 'qrCode' },
      title: '收款码',
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
          items: parsePlayerPayAccountList(result, props.resourceType),
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
  filterAccount.value = '';
  filterName.value = '';
  filterDateRange.value = undefined;
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
  passPopupRef.value?.prompt(PAY_ACCOUNT_SECURITY_PAGE_ID);
}

async function openQrPreview(row: BankCardListItem) {
  const playerId = row.PlayerId;
  const targetAccount = resolveRowAccount(row);
  if (!playerId) {
    message.warning('缺少玩家ID，无法查询收款码');
    return;
  }
  if (!targetAccount) {
    message.warning('缺少账号，无法查询收款码');
    return;
  }

  qrPreview.name = resolveRowName(row);
  qrPreview.account = targetAccount;
  qrPreview.url = '';
  qrPreviewOpen.value = true;
  qrPreviewLoading.value = true;

  try {
    const result = await fetchBankCardListApi({
      Page: 1,
      PageSize: 50,
      PlayerId: playerId,
      ResourceType: props.resourceType,
    });
    const items = parsePlayerPayAccountList(result, props.resourceType);
    const matched = items.find(
      (item) => resolveRowAccount(item) === targetAccount,
    );
    if (matched) {
      qrPreview.name = resolveRowName(matched) || qrPreview.name;
      qrPreview.url = String(matched.QrCodeUrl || '').trim();
    }
  } finally {
    qrPreviewLoading.value = false;
  }
}

async function confirmDelete(extra: Record<string, unknown> = {}) {
  if (!deletingRow.value?.Id) {
    return;
  }
  deleting.value = true;
  try {
    await deleteBankCardApi({
      AccountType: accountType.value,
      Id: deletingRow.value.Id,
      IsBlack: deleteAddBlacklist.value,
      ResourceType: 'withdrawal_account',
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
          placeholder="请输入游戏账号"
          @press-enter="handleSearch"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterAccount"
          allow-clear
          placeholder="请输入账号"
          @press-enter="handleSearch"
        >
          <template #addonBefore>{{ titleLabel }}账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterName"
          allow-clear
          placeholder="请输入名称"
          @press-enter="handleSearch"
        >
          <template #addonBefore>{{ titleLabel }}名</template>
        </Input>
      </div>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker v-model="filterDateRange" label="添加时间" />
      </div>
      <div class="query-filter-actions">
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </div>
    </template>

    <div
      v-if="canAdd"
      class="mb-2 flex flex-wrap items-center justify-end gap-2"
    >
      <Button type="primary" @click="openCreate">
        新增{{ titleLabel }}
      </Button>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
      <template #qrCode="{ row }">
        <Button size="small" type="link" @click="openQrPreview(row)">
          查看
        </Button>
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

    <PayAccountFormModal
      v-model:open="formOpen"
      :mode="formMode"
      :resource-type="resourceType"
      :row="editingRow"
      @success="gridApi.reload()"
    />

    <Modal
      v-model:open="qrPreviewOpen"
      :footer="null"
      destroy-on-close
      :title="`${titleLabel}收款码`"
      width="420px"
    >
      <Spin :spinning="qrPreviewLoading">
        <div class="space-y-3 pt-1">
          <div class="text-sm">
            <div>账号名：{{ qrPreview.name || '-' }}</div>
            <div class="mt-1">账号：{{ qrPreview.account || '-' }}</div>
          </div>
          <div
            class="flex min-h-[200px] items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50 p-4"
          >
            <img
              v-if="qrPreview.url"
              :alt="`${qrPreview.name || titleLabel}收款码`"
              class="max-h-[280px] max-w-full object-contain"
              :src="qrPreview.url"
            />
            <span v-else-if="!qrPreviewLoading" class="text-sm text-gray-400">
              玩家暂未上传
            </span>
          </div>
        </div>
      </Spin>
    </Modal>

    <PassPopup
      ref="passPopupRef"
      :prompt-msg="`确认删除该${titleLabel}记录？`"
      :title="`删除${titleLabel}`"
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
