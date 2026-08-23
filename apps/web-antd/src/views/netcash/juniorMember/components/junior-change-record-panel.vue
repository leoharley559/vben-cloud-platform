<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { Column, Option } from '../shared';

import { computed, onMounted, reactive, ref } from 'vue';

import { Button, Input, message, Select, Space, Table } from 'ant-design-vue';

import { fetchJuniorMemberChangeRecordApi } from '#/api/netcash/junior-member';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

import { mapPackageOptions, writeWorkbook } from '../shared';

defineOptions({ name: 'JuniorChangeRecordPanel' });

const { projectConfig } = useCloudPermission();

const packageOptions = computed<Option[]>(() =>
  mapPackageOptions(projectConfig.value?.RealPackageIdNameMap),
);

const recordLoading = ref(false);
const recordExportLoading = ref(false);
const recordRows = ref<Record<string, any>[]>([]);
const recordTotal = ref(0);
const recordPage = ref(1);
const recordPageSize = ref(20);
const recordFilters = reactive({
  LoginAccount: '',
  PackageId: undefined as number | string | undefined,
  Time: undefined as [Dayjs, Dayjs] | undefined,
});
const recordColumns: Column[] = [
  { dataIndex: 'CreateTime', title: '时间', width: 170 },
  { dataIndex: 'LoginAccount', title: '游戏账号', width: 140 },
  { dataIndex: 'PackageName', title: '所属产品', width: 140 },
  { dataIndex: 'FromChannelId', title: '原渠道', width: 150 },
  { dataIndex: 'FromUsername', title: '原代理', width: 130 },
  { dataIndex: 'ToChannelId', title: '目标渠道', width: 150 },
  { dataIndex: 'ToUsername', title: '目标代理', width: 130 },
  { dataIndex: 'Note', title: '备注', width: 180 },
  { dataIndex: 'HandlerName', title: '操作人', width: 120 },
];

function recordQuery(extra: Record<string, unknown> = {}) {
  return {
    BeginTime: recordFilters.Time?.[0]?.startOf('day').unix() ?? '',
    EndTime: recordFilters.Time?.[1]?.endOf('day').unix() ?? '',
    LoginAccount: recordFilters.LoginAccount.trim().toLowerCase(),
    PackageId: recordFilters.PackageId ?? '',
    Page: recordPage.value,
    PageSize: recordPageSize.value,
    ...extra,
  };
}

async function loadRecords() {
  const account = recordFilters.LoginAccount.trim();
  if (account && !/^[a-zA-Z0-9]{4,20}$/.test(account)) {
    message.warning('游戏账号须为 4-20 位英文字母或数字');
    return;
  }
  recordLoading.value = true;
  try {
    const result = await fetchJuniorMemberChangeRecordApi(recordQuery());
    recordRows.value = result.Items || [];
    recordTotal.value = Number(result.Pagination.MaxCount || 0);
  } finally {
    recordLoading.value = false;
  }
}

async function exportRecords() {
  recordExportLoading.value = true;
  try {
    const result = await fetchJuniorMemberChangeRecordApi(
      recordQuery({
        IsExp: true,
        Page: 1,
        PageSize: Math.max(recordTotal.value + 1, 1),
      }),
    );
    if (!result.Items?.length) {
      message.info('暂无可导出数据');
      return;
    }
    writeWorkbook(
      result.Items.map((row) =>
        Object.fromEntries(
          recordColumns.map((column) => [
            String(column.title),
            column.dataIndex === 'CreateTime'
              ? formatNetcashDateTime(row.CreateTime as number)
              : String(row[String(column.dataIndex)] ?? '-'),
          ]),
        ),
      ),
      '下级成员变更记录',
    );
  } finally {
    recordExportLoading.value = false;
  }
}

onMounted(() => {
  loadRecords();
});
</script>

<template>
  <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="recordFilters.LoginAccount"
          allow-clear
          @press-enter="loadRecords"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">产品包</span>
        <Select
          v-model:value="recordFilters.PackageId"
          allow-clear
          :options="packageOptions"
          placeholder="请选择产品包"
        />
      </Space.Compact>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker v-model="recordFilters.Time" />
      </div>
      <div class="query-filter-actions">
        <Button
          type="primary"
          @click="
            recordPage = 1;
            loadRecords();
          "
          >
查询
</Button>
        <Button
          @click="
            Object.assign(recordFilters, {
              LoginAccount: '',
              PackageId: undefined,
              Time: undefined,
            });
            recordPage = 1;
            loadRecords();
          "
        >
          重置
        </Button>
        <Button :loading="recordExportLoading" @click="exportRecords">
导出 Excel
</Button>
      </div>
    </div>
  </div>
  <Table
    :columns="recordColumns"
    :data-source="recordRows"
    :loading="recordLoading"
    :pagination="{
      current: recordPage,
      pageSize: recordPageSize,
      showSizeChanger: true,
        pageSizeOptions: [...TABLE_ANT_PAGE_SIZE_OPTIONS],
      total: recordTotal,
    }"
    row-key="Id"
    :scroll="{ x: 1300 }"
    size="small"
    bordered
    @change="
      (pagination) => {
        recordPage = pagination.current || 1;
        recordPageSize = pagination.pageSize || 20;
        loadRecords();
      }
    "
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'CreateTime'">
        {{ formatNetcashDateTime(record.CreateTime) }}
      </template>
      <template v-else>
        {{ record[String(column.dataIndex)] ?? '-' }}
      </template>
    </template>
  </Table>
</template>
