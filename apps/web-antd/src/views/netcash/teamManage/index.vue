<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Result,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  addTeamDeputyApi,
  createTeamApi,
  dissolveTeamApi,
  fetchTeamDeputyListApi,
  fetchTeamListApi,
  fetchTeamPrincipalListApi,
  fetchTeamRecordListApi,
  moveTeamDeputyApi,
  removeTeamDeputyApi,
  updateTeamApi,
} from '#/api/netcash/team-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'TeamManage' });
type Row = Record<string, unknown>;
type Option = { label: string; raw?: Row; value: number | string };

const { checkPermission } = useCloudPermission();
const canEnterManage = computed(() => checkPermission(11_487));
const canViewList = computed(() => checkPermission(11_488));
const canTransfer = computed(() => checkPermission(11_490));
const canCreate = computed(() => checkPermission(11_491));
const canEdit = computed(() => checkPermission(11_492));
const canDissolve = computed(() => checkPermission(11_493));
const canRemoveDeputy = computed(() => checkPermission(11_494));
const canAddDeputy = computed(() => checkPermission(11_495));
const canViewRecord = computed(() => checkPermission(11_496));
/** 操作记录列表数据权：旧站 getList 用 11497；勿再绑 serviceWorkTime(11821，客服工时误挂) */
const canViewRecordList = computed(() => checkPermission(11_497));
const canViewPage = computed(() => canEnterManage.value || canViewRecord.value);
const activeTab = ref('manage');

const teamLoading = ref(false);
const teamRows = ref<Row[]>([]);
const teamTotal = ref(0);
const teamQuery = reactive({
  BeginTime: dayjs().subtract(1, 'month').startOf('day').unix(),
  EndTime: dayjs().endOf('day').unix(),
  Keyword: '',
  Page: 1,
  PageSize: 20,
  Sort: '',
  SubUserName: '',
  TeamName: '',
  Type: -1,
  Username: '',
});
const teamDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(1, 'month'),
  dayjs(),
]);
const teamColumns = [
  { key: 'index', title: '序号', width: 65 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '创建时间', width: 170 },
  { dataIndex: 'TeamName', key: 'TeamName', title: '团队名称' },
  { dataIndex: 'Username', key: 'Username', title: '主线账号' },
  { dataIndex: 'Deputys', key: 'Deputys', title: '副线数量', width: 100 },
  { dataIndex: 'Members', key: 'Members', title: '总成员数', width: 100 },
  { dataIndex: 'Type', key: 'Type', title: '团队类型', width: 110 },
  { dataIndex: 'Remark', key: 'Remark', title: '备注' },
  { key: 'actions', fixed: 'right' as const, title: '操作', width: 280 },
];

function setTeamDates() {
  teamQuery.BeginTime = teamDateRange.value?.[0]?.startOf('day').unix() || 0;
  teamQuery.EndTime = teamDateRange.value?.[1]?.endOf('day').unix() || 0;
}
async function loadTeams() {
  if (!canViewList.value) return;
  setTeamDates();
  teamLoading.value = true;
  try {
    const result = await fetchTeamListApi(teamQuery);
    teamRows.value = result?.Items || [];
    teamTotal.value = Number(
      result?.Pagination?.MaxCount || teamRows.value.length,
    );
  } catch {
    teamRows.value = [];
    teamTotal.value = 0;
  } finally {
    teamLoading.value = false;
  }
}
function searchTeams() {
  teamQuery.Page = 1;
  loadTeams();
}
function resetTeams() {
  Object.assign(teamQuery, {
    Keyword: '',
    Page: 1,
    Sort: '',
    SubUserName: '',
    TeamName: '',
    Type: -1,
    Username: '',
  });
  teamDateRange.value = [dayjs().subtract(1, 'month'), dayjs()];
  loadTeams();
}

const principalOptions = ref<Option[]>([]);
const principalLoading = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
async function searchPrincipals(keyword = '') {
  principalLoading.value = true;
  try {
    // 对齐旧站：首屏仅 IsTeamSearch；远程搜索带 Username（无强制分页上限）
    const result = await fetchTeamPrincipalListApi({
      IsTeamSearch: 1,
      ...(keyword ? { Username: keyword } : {}),
      Page: 1,
      PageSize: 9999,
    });
    principalOptions.value = (result?.Items || []).map((item) => ({
      label: `${item.Username || item.AdminId}${item.Name ? ` / ${item.Name}` : ''}`,
      raw: item,
      value: item.AdminId as number | string,
    }));
  } catch {
    principalOptions.value = [];
  } finally {
    principalLoading.value = false;
  }
}
function remotePrincipalSearch(keyword: string) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => searchPrincipals(keyword), 250);
}

const teamModalOpen = ref(false);
const teamSubmitting = ref(false);
const isCreate = ref(true);
const teamForm = reactive({
  AdminId: undefined as number | string | undefined,
  Id: '' as number | string,
  MainUsername: '',
  Remark: '',
  TeamName: '',
  Type: 1,
});
function openCreateModal() {
  isCreate.value = true;
  Object.assign(teamForm, {
    AdminId: undefined,
    Id: '',
    MainUsername: '',
    Remark: '',
    TeamName: '',
    Type: 1,
  });
  teamModalOpen.value = true;
  searchPrincipals();
}
function openEditModal(row: Row) {
  isCreate.value = false;
  Object.assign(teamForm, {
    AdminId: row.AdminId as number | string,
    Id: row.Id as number | string,
    MainUsername: String(row.Username || ''),
    Remark: String(row.Remark || ''),
    TeamName: String(row.TeamName || ''),
    Type: Number(row.Type || 1),
  });
  teamModalOpen.value = true;
}
async function submitTeam() {
  if (isCreate.value && !teamForm.AdminId)
    return void message.warning('请选择主线账号');
  if (!teamForm.TeamName.trim()) return void message.warning('请输入团队名称');
  teamSubmitting.value = true;
  try {
    if (isCreate.value) {
      await createTeamApi({
        AdminId: teamForm.AdminId,
        Remark: teamForm.Remark,
        TeamName: teamForm.TeamName.trim(),
        Type: teamForm.Type,
      });
    } else {
      await updateTeamApi({
        Id: teamForm.Id,
        Remark: teamForm.Remark,
        TeamName: teamForm.TeamName.trim(),
        Type: teamForm.Type,
      });
    }
    message.success('操作成功');
    teamModalOpen.value = false;
    loadTeams();
  } catch {
    // 全局拦截已提示
  } finally {
    teamSubmitting.value = false;
  }
}
function dissolve(row: Row) {
  if (Number(row.Deputys ?? 0) > 0)
    return void message.warning('请先移除副线后再解散团队');
  Modal.confirm({
    content: `确认解散团队「${row.TeamName || ''}」？`,
    okType: 'danger',
    title: '解散团队',
    onOk: async () => {
      try {
        await dissolveTeamApi(row.Id as number | string);
        message.success('解散成功');
        loadTeams();
      } catch {
        // 全局拦截已提示
      }
    },
  });
}

const deputyModalOpen = ref(false);
const deputySubmitting = ref(false);
const deputyForm = reactive({
  AdminId: undefined as number | string | undefined,
  Name: '',
  TeamId: '' as number | string,
  TeamName: '',
});
function openAddDeputy(row: Row) {
  Object.assign(deputyForm, {
    AdminId: undefined,
    Name: '',
    TeamId: row.Id,
    TeamName: row.TeamName,
  });
  deputyModalOpen.value = true;
  searchPrincipals();
}
function selectDeputy(adminId: number | string) {
  deputyForm.Name = String(
    principalOptions.value.find((item) => String(item.value) === String(adminId))
      ?.raw?.Name || '',
  );
}
async function submitDeputy() {
  if (!deputyForm.AdminId) return void message.warning('请选择副线账号');
  deputySubmitting.value = true;
  try {
    await addTeamDeputyApi({
      AdminId: deputyForm.AdminId,
      TeamId: deputyForm.TeamId,
    });
    message.success('添加成功');
    deputyModalOpen.value = false;
    loadTeams();
  } catch {
    // 全局拦截已提示
  } finally {
    deputySubmitting.value = false;
  }
}

const detailOpen = ref(false);
const detailLoading = ref(false);
const detailTeam = ref<Row>();
const detailRows = ref<Row[]>([]);
const detailColumns = [
  { dataIndex: 'TeamCreateTime', key: 'TeamCreateTime', title: '加入时间', width: 170 },
  { dataIndex: 'Username', key: 'Username', title: '副线账号' },
  { dataIndex: 'Name', key: 'Name', title: '姓名' },
  { dataIndex: 'Members', key: 'Members', title: '成员数' },
  { key: 'actions', title: '操作', width: 100 },
];
async function openDetail(row: Row) {
  if (Number(row.Deputys ?? 0) <= 0)
    return void message.warning('该团队暂无副线');
  detailTeam.value = row;
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    const result = await fetchTeamDeputyListApi({
      Page: 1,
      PageSize: 1000,
      TeamId: row.Id,
    });
    detailRows.value = result?.Items || [];
  } catch {
    detailRows.value = [];
  } finally {
    detailLoading.value = false;
  }
}
function removeDeputy(row: Row) {
  Modal.confirm({
    content: `确认移除副线「${row.Username || ''}」？`,
    okType: 'danger',
    title: '移除副线',
    onOk: async () => {
      try {
        await removeTeamDeputyApi(row.AdminId as number | string);
        message.success('移除成功');
        detailRows.value = detailRows.value.filter(
          (item) => String(item.AdminId) !== String(row.AdminId),
        );
        if (!detailRows.value.length) detailOpen.value = false;
        loadTeams();
      } catch {
        // 全局拦截已提示
      }
    },
  });
}

const transferOpen = ref(false);
const transferSubmitting = ref(false);
const deputyOptions = ref<Option[]>([]);
const transferForm = reactive({
  AdminId: undefined as number | string | undefined,
  FromTeamId: '' as number | string,
  FromTeamName: '',
  MainUsername: '',
  Members: '',
  Name: '',
  ToMainUsername: '',
  ToTeamId: undefined as number | string | undefined,
});
const transferTeamOptions = computed<Option[]>(() =>
  teamRows.value
    .filter((item) => String(item.Id) !== String(transferForm.FromTeamId))
    .map((item) => ({
      label: `${item.TeamName || ''} / ${item.Username || ''}`,
      raw: item,
      value: item.Id as number | string,
    })),
);
async function openTransfer() {
  Object.assign(transferForm, {
    AdminId: undefined,
    FromTeamId: '',
    FromTeamName: '',
    MainUsername: '',
    Members: '',
    Name: '',
    ToMainUsername: '',
    ToTeamId: undefined,
  });
  transferOpen.value = true;
  try {
    const result = await fetchTeamDeputyListApi({
      Page: 1,
      PageSize: 100_000,
      TeamId: '',
    });
    deputyOptions.value = (result?.Items || []).map((item) => ({
      label: `${item.Username || item.AdminId} / ${item.TeamName || ''}`,
      raw: item,
      value: item.AdminId as number | string,
    }));
  } catch {
    deputyOptions.value = [];
  }
  if (!teamRows.value.length) await loadTeams();
}
function selectTransferDeputy(adminId: number | string) {
  const row = deputyOptions.value.find(
    (item) => String(item.value) === String(adminId),
  )?.raw;
  if (!row) return;
  Object.assign(transferForm, {
    FromTeamId: row.TeamId,
    FromTeamName: row.TeamName,
    MainUsername: row.MainUsername,
    Members: String(row.Members ?? ''),
    Name: String(row.Name || ''),
    ToMainUsername: '',
    ToTeamId: undefined,
  });
}
function selectTransferTeam(teamId: number | string) {
  transferForm.ToMainUsername = String(
    transferTeamOptions.value.find((item) => String(item.value) === String(teamId))
      ?.raw?.Username || '',
  );
}
async function submitTransfer() {
  if (!transferForm.AdminId || !transferForm.ToTeamId)
    return void message.warning('请选择副线和转入团队');
  transferSubmitting.value = true;
  try {
    await moveTeamDeputyApi({
      AdminId: transferForm.AdminId,
      FromTeamId: transferForm.FromTeamId,
      ToTeamId: transferForm.ToTeamId,
    });
    message.success('转移成功');
    transferOpen.value = false;
    loadTeams();
  } catch {
    // 全局拦截已提示
  } finally {
    transferSubmitting.value = false;
  }
}

const recordLoading = ref(false);
const recordLoaded = ref(false);
const recordRows = ref<Row[]>([]);
const recordTotal = ref(0);
const recordQuery = reactive({
  BeginTime: dayjs().subtract(1, 'month').startOf('day').unix(),
  EndTime: dayjs().endOf('day').unix(),
  Operate: 0,
  Page: 1,
  PageSize: 20,
  Sort: '',
  SubName: '',
  TeamName: '',
  Username: '',
});
const recordDates = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(1, 'month'),
  dayjs(),
]);
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
  let params: Row = {};
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
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value ?? '')),
    String(row.LogTemplate),
  );
}
async function loadRecords() {
  if (!canViewRecordList.value) return;
  recordQuery.BeginTime = recordDates.value?.[0]?.startOf('day').unix() || 0;
  recordQuery.EndTime = recordDates.value?.[1]?.endOf('day').unix() || 0;
  recordLoading.value = true;
  try {
    const result = await fetchTeamRecordListApi(recordQuery);
    recordRows.value = result?.Items || [];
    recordTotal.value = Number(
      result?.Pagination?.MaxCount || recordRows.value.length,
    );
    recordLoaded.value = true;
  } catch {
    recordRows.value = [];
    recordTotal.value = 0;
  } finally {
    recordLoading.value = false;
  }
}
function onTabChange(key: string | number) {
  if (key === 'record' && !recordLoaded.value) loadRecords();
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
  recordDates.value = [dayjs().subtract(1, 'month'), dayjs()];
  loadRecords();
}

onMounted(() => {
  if (canEnterManage.value) {
    activeTab.value = 'manage';
    loadTeams();
  } else if (canViewRecord.value) {
    activeTab.value = 'record';
    loadRecords();
  }
});
</script>

<template>
  <Page v-if="canViewPage" auto-content-height title="团队管理">
    <Card>
      <Tabs v-model:active-key="activeTab" size="small" @change="onTabChange">
        <Tabs.TabPane v-if="canEnterManage" key="manage" tab="团队列表">
          <div class="mb-4 flex flex-wrap items-center gap-2">
            <Input v-model:value="teamQuery.TeamName" allow-clear placeholder="团队名称" style="width: 220px">
              <template #addonBefore>团队名称</template>
            </Input>
            <Input v-model:value="teamQuery.Username" allow-clear placeholder="主线账号" style="width: 220px">
              <template #addonBefore>主线账号</template>
            </Input>
            <Input v-model:value="teamQuery.SubUserName" allow-clear placeholder="副线账号" style="width: 220px">
              <template #addonBefore>副线账号</template>
            </Input>
            <Select
              v-model:value="teamQuery.Type"
              :options="[{ label: '全部类型', value: -1 }, { label: '普通团队', value: 1 }, { label: '正式团队', value: 2 }]"
              style="width: 130px"
            />
            <DatePicker.RangePicker v-model:value="teamDateRange" />
            <Button type="primary" @click="searchTeams">查询</Button>
            <Button @click="resetTeams">重置</Button>
            <Button v-if="canTransfer" @click="openTransfer">转移副线</Button>
            <Button v-if="canCreate" type="primary" @click="openCreateModal">新增团队</Button>
          </div>
          <Table
            v-if="canViewList"
            :columns="teamColumns"
            :data-source="teamRows"
            :loading="teamLoading"
            :pagination="false"
            row-key="Id"
            :scroll="{ x: 1250 }"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">{{ (teamQuery.Page - 1) * teamQuery.PageSize + index + 1 }}</template>
              <AgencyAccountLink
                v-else-if="column.key === 'Username'"
                :admin-id="resolveAgencyAdminId(record)"
                :username="record.Username"
              />
              <template v-else-if="column.key === 'CreateTime'">{{ formatNetcashDateTime(record.CreateTime) }}</template>
              <template v-else-if="column.key === 'Deputys'">
                <Button type="link" size="small" @click="openDetail(record)">{{ record.Deputys ?? 0 }}</Button>
              </template>
              <template v-else-if="column.key === 'Type'">
                <Tag>{{ Number(record.Type) === 1 ? '普通团队' : Number(record.Type) === 2 ? '正式团队' : record.Type }}</Tag>
              </template>
              <template v-else-if="column.key === 'actions'">
                <Space :size="0">
                  <Button v-if="canAddDeputy" type="link" size="small" @click="openAddDeputy(record)">添加副线</Button>
                  <Button type="link" size="small" @click="openDetail(record)">查看副线</Button>
                  <Button v-if="canEdit" type="link" size="small" @click="openEditModal(record)">编辑</Button>
                  <Button v-if="canDissolve" danger type="link" size="small" :disabled="Number(record.Deputys ?? 0) > 0" @click="dissolve(record)">解散</Button>
                </Space>
              </template>
            </template>
          </Table>
          <Result
            v-else
            status="403"
            sub-title="无团队列表查看权限（11488）"
            title="403"
          />
          <Pagination
            v-if="canViewList && teamTotal"
            v-model:current="teamQuery.Page"
            v-model:page-size="teamQuery.PageSize"
            class="mt-4 text-right"
            :show-size-changer="true"
            :total="teamTotal"
            @change="loadTeams"
          />
        </Tabs.TabPane>

        <Tabs.TabPane v-if="canViewRecord" key="record" tab="操作记录">
          <template v-if="canViewRecordList">
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <Input v-model:value="recordQuery.TeamName" allow-clear placeholder="团队名称" style="width: 220px">
                <template #addonBefore>团队名称</template>
              </Input>
              <Input v-model:value="recordQuery.Username" allow-clear placeholder="主线账号" style="width: 220px">
                <template #addonBefore>主线账号</template>
              </Input>
              <Input v-model:value="recordQuery.SubName" allow-clear placeholder="副线账号" style="width: 220px">
                <template #addonBefore>副线账号</template>
              </Input>
              <Select
                v-model:value="recordQuery.Operate"
                :options="[
                  { label: '全部操作', value: 0 }, { label: '新增团队', value: 1 },
                  { label: '添加副线', value: 2 }, { label: '移除副线', value: 3 },
                  { label: '转移副线', value: 4 }, { label: '编辑团队', value: 5 },
                  { label: '解散团队', value: 6 },
                ]"
                style="width: 130px"
              />
              <DatePicker.RangePicker v-model:value="recordDates" />
              <Button type="primary" @click="recordQuery.Page = 1; loadRecords()">查询</Button>
              <Button @click="resetRecords">重置</Button>
            </div>
            <Table
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
                <template v-else-if="column.key === 'Note'">{{ recordContent(record) }}</template>
                <template v-else-if="column.key === 'CreateTime'">{{ formatNetcashDateTime(record.CreateTime) }}</template>
              </template>
            </Table>
            <Pagination
              v-if="recordTotal"
              v-model:current="recordQuery.Page"
              v-model:page-size="recordQuery.PageSize"
              class="mt-4 text-right"
              :show-size-changer="true"
              :total="recordTotal"
              @change="loadRecords"
            />
          </template>
          <Result
            v-else
            status="403"
            sub-title="无团队操作记录数据权限（11497）"
            title="403"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal v-model:open="teamModalOpen" :confirm-loading="teamSubmitting" :title="isCreate ? '新增团队' : '编辑团队'" @ok="submitTeam">
      <Form layout="vertical">
        <Form.Item label="主线账号" required>
          <Select
            v-if="isCreate"
            v-model:value="teamForm.AdminId"
            :filter-option="false"
            :loading="principalLoading"
            :options="principalOptions"
            placeholder="输入账号远程查询"
            show-search
            style="width: 100%"
            @focus="searchPrincipals()"
            @search="remotePrincipalSearch"
          />
          <Input v-else v-model:value="teamForm.MainUsername" disabled />
        </Form.Item>
        <Form.Item label="团队名称" required><Input v-model:value="teamForm.TeamName" /></Form.Item>
        <Form.Item label="团队类型" required>
          <Select v-model:value="teamForm.Type" :options="[{ label: '普通团队', value: 1 }, { label: '正式团队', value: 2 }]" />
        </Form.Item>
        <Form.Item label="备注"><Input.TextArea v-model:value="teamForm.Remark" :rows="3" /></Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="deputyModalOpen" :confirm-loading="deputySubmitting" title="添加副线" @ok="submitDeputy">
      <Form layout="vertical">
        <Form.Item label="团队名称"><Input v-model:value="deputyForm.TeamName" disabled /></Form.Item>
        <Form.Item label="副线账号" required>
          <Select
            v-model:value="deputyForm.AdminId"
            :filter-option="false"
            :loading="principalLoading"
            :options="principalOptions"
            placeholder="输入账号远程查询"
            show-search
            style="width: 100%"
            @focus="searchPrincipals()"
            @search="remotePrincipalSearch"
            @change="(value) => selectDeputy(value as number | string)"
          />
        </Form.Item>
        <Form.Item label="副线姓名"><Input v-model:value="deputyForm.Name" disabled /></Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="detailOpen" :footer="null" :title="`副线明细 · ${detailTeam?.TeamName || ''}`" width="760px">
      <Table :columns="detailColumns" :data-source="detailRows" :loading="detailLoading" :pagination="false" row-key="AdminId" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'TeamCreateTime'">{{ formatNetcashDateTime(record.TeamCreateTime) }}</template>
          <AgencyAccountLink
            v-else-if="column.key === 'Username'"
            :admin-id="resolveAgencyAdminId(record)"
            :username="record.Username"
          />
          <template v-else-if="column.key === 'actions'">
            <Button v-if="canRemoveDeputy" danger type="link" size="small" @click="removeDeputy(record)">移除</Button>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal v-model:open="transferOpen" :confirm-loading="transferSubmitting" title="转移副线" @ok="submitTransfer">
      <Form layout="vertical">
        <Form.Item label="副线账号" required>
          <Select
            v-model:value="transferForm.AdminId"
            :options="deputyOptions"
            placeholder="请选择副线"
            show-search
            style="width: 100%"
            @change="(value) => selectTransferDeputy(value as number | string)"
          />
        </Form.Item>
        <Form.Item label="副线姓名"><Input v-model:value="transferForm.Name" disabled /></Form.Item>
        <Form.Item label="副线成员数"><Input v-model:value="transferForm.Members" disabled /></Form.Item>
        <Form.Item label="转出团队"><Input v-model:value="transferForm.FromTeamName" disabled /></Form.Item>
        <Form.Item label="原主线"><Input v-model:value="transferForm.MainUsername" disabled /></Form.Item>
        <Form.Item label="转入团队" required>
          <Select
            v-model:value="transferForm.ToTeamId"
            :options="transferTeamOptions"
            placeholder="请选择转入团队"
            show-search
            style="width: 100%"
            @change="(value) => selectTransferTeam(value as number | string)"
          />
        </Form.Item>
        <Form.Item label="转入主线"><Input v-model:value="transferForm.ToMainUsername" disabled /></Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无团队管理查看权限" title="403" />
</template>
