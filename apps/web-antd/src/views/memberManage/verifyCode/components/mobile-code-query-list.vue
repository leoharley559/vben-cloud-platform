<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MobileVerifyCodeListItem } from '#/types/mobile-verify-code';

import { computed, ref } from 'vue';

import { Button, Input, Select, Space, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchMobileVerifyCodeListApi } from '#/api/memberManage/mobile-verify-code';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';

import GenerateMobileCodeModal from './generate-mobile-code-modal.vue';
import MobileVerifyWhitelistModal from './mobile-verify-whitelist-modal.vue';

defineOptions({ name: 'MobileCodeQueryList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canWhitelist = computed(() => checkPermission(12565));

const generateOpen = ref(false);
const whitelistOpen = ref(false);
const hasSearched = ref(false);

const filterLoginAccount = ref('');
const filterPhoneNum = ref('');
const filterPackageId = ref<number | string>('');

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' as number | string },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);

function normalizeLoginAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
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

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  return {
    // 对齐旧站 keyup：账号转小写去空格
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value) || undefined,
    PackageId: filterPackageId.value === '' ? undefined : filterPackageId.value,
    PhoneNum: filterPhoneNum.value.trim() || undefined,
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<MobileVerifyCodeListItem> = {
  columns: [
    { type: 'seq', title: '序号', width: 60 },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    { field: 'PhoneNum', minWidth: 130, title: '手机号' },
    { field: 'LoginAccount', minWidth: 130, slots: { default: 'loginAccount' }, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'VerifyCode', minWidth: 100, title: '验证码' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        if (!hasSearched.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchMobileVerifyCodeListApi({
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
  if (!filterLoginAccount.value.trim() && !filterPhoneNum.value.trim()) {
    message.warning('请至少输入游戏账号或手机号');
    return;
  }
  hasSearched.value = true;
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPhoneNum.value = '';
  filterPackageId.value = '';
  hasSearched.value = false;
  gridApi.grid?.loadData([]);
}
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">游戏账号</span>
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="请输入"
          style="width: 160px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">产品</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
          :options="packageSelectOptions"
          placeholder="全部产品"
          style="width: 160px"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">手机号</span>
        <Input
          v-model:value="filterPhoneNum"
          allow-clear
          placeholder="请输入"
          style="width: 180px"
          @press-enter="handleSearch"
        />
      </div>
      <Button :loading="loading" type="primary" @click="handleSearch">
        查询
      </Button>
      <Button @click="handleReset">重置</Button>
      <Button @click="generateOpen = true">后台生成验证码</Button>
      <Button v-if="canWhitelist" type="primary" @click="whitelistOpen = true">
        白名单设置
      </Button>
    </template>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
    </Grid>

    <GenerateMobileCodeModal v-model:open="generateOpen" />
    <MobileVerifyWhitelistModal v-model:open="whitelistOpen" />
  </OpsListPanel>
</template>
