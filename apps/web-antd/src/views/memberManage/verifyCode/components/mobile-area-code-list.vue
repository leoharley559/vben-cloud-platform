<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PhoneAreaCodeListItem } from '#/types/phone-area-code';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  Modal,
  Result,
  Space,
  Switch,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPhoneAreaCodeListApi,
  resetPhoneAreaCodeDefaultApi,
  sortPhoneAreaCodeApi,
  switchPhoneAreaCodeFrequentlyApi,
  switchPhoneAreaCodeStatusApi,
} from '#/api/memberManage/mobile-verify-code';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatCountryName } from '#/utils/phone-area-code';

defineOptions({ name: 'MobileAreaCodeList' });

const { checkPermission } = useCloudPermission();

const canView = computed(() => checkPermission(11921));
const canSwitchStatus = computed(() => checkPermission(11923));
const canSwitchFrequently = computed(() => checkPermission(11926));
const canResetDefault = computed(() => checkPermission(11928));
const canBatchSwitch = computed(() => checkPermission(11929));

const filterCountryName = ref('');
const filterDialingCode = ref('');
const frequentCount = ref(0);
const selectedKeys = ref<string[]>([]);

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
    CountryName: filterCountryName.value.trim() || undefined,
    DialingCode: filterDialingCode.value.trim() || undefined,
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<PhoneAreaCodeListItem> = {
  checkboxConfig: { highlight: true, range: true },
  columns: [
    { type: 'checkbox', width: 50 },
    { type: 'seq', title: '序号', width: 60 },
    {
      field: 'CountryName',
      formatter: ({ row }) => formatCountryName(row),
      minWidth: 140,
      title: '国家名称',
    },
    { field: 'DialingCode', minWidth: 100, title: '区码' },
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'FrequentlyUsed',
      minWidth: 180,
      slots: { default: 'frequently' },
      title: '常用区码',
    },
    { field: 'UpdateBy', minWidth: 100, title: '操作人' },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '操作时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPhoneAreaCodeListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        frequentCount.value = Number(result?.FrequentCount || 0);
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: PhoneAreaCodeListItem[] }) => {
      selectedKeys.value = records
        .map((item) => item.Key)
        .filter(Boolean) as string[];
    },
    checkboxChange: ({ records }: { records: PhoneAreaCodeListItem[] }) => {
      selectedKeys.value = records
        .map((item) => item.Key)
        .filter(Boolean) as string[];
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);

function reload() {
  gridApi.reload();
}

function handleSearch() {
  selectedKeys.value = [];
  reload();
}

function handleReset() {
  filterCountryName.value = '';
  filterDialingCode.value = '';
  selectedKeys.value = [];
  reload();
}

async function handleStatusChange(
  row: PhoneAreaCodeListItem,
  checked: boolean,
) {
  if (!row.Key || !canSwitchStatus.value) {
    return;
  }
  const status = checked ? 1 : 0;
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}【${formatCountryName(row)}】状态？`,
    onCancel: reload,
    onOk: async () => {
      await switchPhoneAreaCodeStatusApi({ Key: row.Key!, Status: status });
      message.success('操作成功');
      reload();
    },
    title: '提示',
  });
}

async function handleFrequentlyChange(
  row: PhoneAreaCodeListItem,
  checked: boolean,
) {
  if (!row.Key || !canSwitchFrequently.value) {
    return;
  }
  const frequentlyUsed = checked ? 1 : 0;
  Modal.confirm({
    content: `确认${checked ? '设为' : '取消'}常用区码【${formatCountryName(row)}】？`,
    onCancel: reload,
    onOk: async () => {
      await switchPhoneAreaCodeFrequentlyApi({
        FrequentlyUsed: frequentlyUsed,
        Key: row.Key!,
      });
      message.success('操作成功');
      reload();
    },
    title: '提示',
  });
}

async function handleBatchStatus(status: number) {
  if (!selectedKeys.value.length) {
    return;
  }
  Modal.confirm({
    content: `确认批量${status === 1 ? '开启' : '关闭'}所选区码？`,
    onOk: async () => {
      await switchPhoneAreaCodeStatusApi({
        Key: selectedKeys.value.join(','),
        Status: status,
      });
      message.success('操作成功');
      selectedKeys.value = [];
      reload();
    },
    title: '提示',
  });
}

async function handleResetDefault() {
  Modal.confirm({
    content: '确认恢复默认区码配置？',
    onOk: async () => {
      await resetPhoneAreaCodeDefaultApi();
      message.success('操作成功');
      reload();
    },
    title: '提示',
  });
}

async function moveRow(row: PhoneAreaCodeListItem, direction: -1 | 1) {
  const tableData = gridApi.grid?.getTableData().fullData as
    | PhoneAreaCodeListItem[]
    | undefined;
  if (!tableData || !row.Id) {
    return;
  }
  const index = tableData.findIndex((item) => item.Id === row.Id);
  const target = tableData[index + direction];
  if (!target?.Id) {
    return;
  }
  await sortPhoneAreaCodeApi({ Id1: row.Id, Id2: target.Id });
  reload();
}

onMounted(() => {
  if (canView.value) {
    reload();
  }
});
</script>

<template>
  <OpsListPanel v-if="canView">
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterCountryName"
          allow-clear
          placeholder="请输入"
          style="width: 240px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>国家名称</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterDialingCode"
          allow-clear
          placeholder="请输入"
          style="width: 200px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>区码</template>
        </Input>
      </div>
      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button
          v-if="canBatchSwitch"
          :disabled="!selectedKeys.length"
          type="primary"
          @click="handleBatchStatus(1)"
        >
          一键开启
        </Button>
        <Button
          v-if="canBatchSwitch"
          :disabled="!selectedKeys.length"
          danger
          @click="handleBatchStatus(0)"
        >
          一键关闭
        </Button>
        <Button v-if="canResetDefault" @click="handleResetDefault">
          恢复默认
        </Button>
      </Space>
    </template>

    <Grid>
      <template #status="{ row }">
        <Switch
          :checked="Number(row.Status) === 1"
          :disabled="!canSwitchStatus"
          @change="(checked) => handleStatusChange(row, Boolean(checked))"
        />
      </template>
      <template #frequently="{ row }">
        <div class="flex items-center gap-2">
          <Switch
            :checked="Number(row.FrequentlyUsed) === 1"
            :disabled="
              !canSwitchFrequently ||
              Number(row.Status) === 0 ||
              (frequentCount > 9 && Number(row.FrequentlyUsed) === 0) ||
              (frequentCount <= 1 && Number(row.FrequentlyUsed) === 1)
            "
            @change="(checked) => handleFrequentlyChange(row, Boolean(checked))"
          />
          <template v-if="Number(row.FrequentlyUsed) === 1">
            <Space>
              <Button size="small" @click="moveRow(row, -1)">上移</Button>
              <Button size="small" @click="moveRow(row, 1)">下移</Button>
            </Space>
          </template>
        </div>
      </template>
    </Grid>
  </OpsListPanel>
  <Result v-else status="403" sub-title="无区码管理查看权限" title="403" />
</template>
