<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Input,
  Pagination,
  Result,
  Select,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchTeamRecordListApi } from '#/api/netcash/team-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatNetcashDateTime } from '#/utils/netcash';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

defineOptions({ name: 'TeamRecordPanel' });
type Row = Record<string, unknown>;

const { checkPermission } = useCloudPermission();
/** 操作记录列表数据权：旧站 getList 用 11497；勿再绑 serviceWorkTime(11821，客服工时误挂) */
const canViewRecordList = computed(() => checkPermission(11_497));

function currentMonthRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const range = getCurrentMonthRangeSeconds();
  return [dayjs.unix(range.BeginTime), dayjs.unix(range.EndTime)];
}

const recordLoading = ref(false);
const recordRows = ref<Row[]>([]);
const recordTotal = ref(0);
const defaultMonth = getCurrentMonthRangeSeconds();
const recordQuery = reactive({
  BeginTime: defaultMonth.BeginTime,
  EndTime: defaultMonth.EndTime,
  Operate: 0,
  Page: 1,
  PageSize: 20,
  Sort: '',
  SubName: '',
  TeamName: '',
  Username: '',
});
const recordDates = ref<[dayjs.Dayjs, dayjs.Dayjs]>(currentMonthRange());
const recordColumns = [
  { dataIndex: 'TeamName', key: 'TeamName', title: '团队名称' },
  { dataIndex: 'Username', key: 'Username', title: '主线账号' },
  { dataIndex: 'SubUsername', key: 'SubUsername', title: '副线账号' },
  { dataIndex: 'LogType', key: 'LogType', title: '操作类型' },
  { key: 'Note', title: '操作内容', width: 260 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '操作时间', width: 170 },
  { dataIndex: 'Handler', key: 'Handler', title: '操作人' },
];
function recordContent(row: Row) {
  if (!row.LogTemplate || !row.Params) return String(row.Note || '');
  let params: Row;
  try {
    params =
      typeof row.Params === 'string'
        ? JSON.parse(row.Params)
        : (row.Params as Row);
  } catch {
    return String(row.Note || '');
  }
  if (Number(row.TemplateId) === 872 && params.TeamType !== undefined) {
    params.TeamType = Number(params.TeamType) === 1 ? '普通团队' : '正式团队';
  }
  let text = String(row.LogTemplate);
  for (const [key, value] of Object.entries(params)) {
    text = text.replaceAll(`{${key}}`, String(value ?? ''));
  }
  return text;
}
async function loadRecords() {
  if (!canViewRecordList.value) return;
  recordQuery.BeginTime = recordDates.value?.[0]?.unix() || 0;
  recordQuery.EndTime = recordDates.value?.[1]?.unix() || 0;
  recordLoading.value = true;
  try {
    const result = await fetchTeamRecordListApi(recordQuery);
    recordRows.value = result?.Items || [];
    recordTotal.value = Number(
      result?.Pagination?.MaxCount || recordRows.value.length,
    );
  } catch {
    recordRows.value = [];
    recordTotal.value = 0;
  } finally {
    recordLoading.value = false;
  }
}
function searchRecords() {
  recordQuery.Page = 1;
  loadRecords();
}
function resetRecords() {
  Object.assign(recordQuery, {
    Operate: 0,
    Page: 1,
    Sort: '',
    SubName: '',
    TeamName: '',
    Username: '',
  });
  recordDates.value = currentMonthRange();
  loadRecords();
}

onMounted(() => {
  loadRecords();
});
</script>

<template>
  <template v-if="canViewRecordList">
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="recordQuery.TeamName"
            allow-clear
            placeholder="请输入团队名称"
          >
            <template #addonBefore>团队名称</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="recordQuery.Username"
            allow-clear
            placeholder="请输入主线账号"
          >
            <template #addonBefore>主线账号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="recordQuery.SubName"
            allow-clear
            placeholder="请输入副线账号"
          >
            <template #addonBefore>副线账号</template>
          </Input>
        </div>
        <Select
          v-model:value="recordQuery.Operate"
          :options="[
            { label: '全部操作', value: 0 },
            { label: '新增团队', value: 1 },
            { label: '添加副线', value: 2 },
            { label: '移除副线', value: 3 },
            { label: '转移副线', value: 4 },
            { label: '编辑团队', value: 5 },
            { label: '解散团队', value: 6 },
          ]"
        />
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="recordDates" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="searchRecords">查询</Button>
          <Button @click="resetRecords">重置</Button>
        </div>
      </div>
    </div>
    <Table
      bordered
      :columns="recordColumns"
      :data-source="recordRows"
      :loading="recordLoading"
      :pagination="false"
      row-key="Id"
      :scroll="{ x: 1100 }"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <AgencyAccountLink
          v-if="column.key === 'Username'"
          :admin-id="resolveAgencyAdminId(record)"
          :username="record.Username"
        />
        <AgencyAccountLink
          v-else-if="column.key === 'SubUsername'"
          :admin-id="resolveAgencyAdminId(record, 'SubAdminId')"
          :username="record.SubUsername"
        />
        <template v-else-if="column.key === 'Note'">
{{
          recordContent(record)
        }}
</template>
        <template v-else-if="column.key === 'CreateTime'">
{{
          formatNetcashDateTime(record.CreateTime)
        }}
</template>
      </template>
    </Table>
    <Pagination
      v-if="recordTotal"
      v-model:current="recordQuery.Page"
      v-model:page-size="recordQuery.PageSize"
      class="mt-4 text-right"
      :show-size-changer="true"
      :total="recordTotal"
      :page-size-options="TABLE_ANT_PAGE_SIZE_OPTIONS"
      @change="loadRecords"
      />
  </template>
  <Result
    v-else
    status="403"
    sub-title="无团队操作记录数据权限（11497）"
    title="403"
  />
</template>
