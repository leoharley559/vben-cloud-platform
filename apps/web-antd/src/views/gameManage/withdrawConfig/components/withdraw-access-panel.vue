<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  TimePicker,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  exportWithdrawAccessDetailApi,
  fetchWithdrawAccessDetailApi,
  fetchWithdrawAccessStatisticsApi,
} from '#/api/gameManage/withdraw-data';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatOperationDateTime } from '#/utils/operation-status';
import { VISIT_STATISTIC_EXPORT_PAGE_ID } from '#/utils/security-page-ids';
import {
  formatVisitDurationSeconds,
  formatVisitSource,
  parseProjectConfigOptions,
  percentOf,
  resolveAppTypeLabel,
} from '#/views/operationalManage/components/visit-statistic-shared';

defineOptions({ name: 'WithdrawAccessPanel' });

interface AccessDetailRow {
  AppType?: number | string;
  BeginTime?: number | string;
  EndTime?: number | string;
  Id?: number | string;
  LoginAccount?: string;
  Source?: unknown;
  Vip?: number | string;
  VisitDuration?: number | string;
  [key: string]: unknown;
}

interface StatisticsRow {
  AppVisit?: number;
  GuestVisit?: number;
  H5Visit?: number;
  Source?: string;
  TotalVisit?: number;
  UserVisit?: number;
  VipVisit?: Record<string, number>;
  WebVisit?: number;
  [key: string]: unknown;
}

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canDetail = computed(() => checkPermission(11_962));
const canStatistics = computed(() => checkPermission(11_963));
const canExport = computed(() => checkPermission(11_964));
const canView = computed(() => canDetail.value || canStatistics.value);

const activeTab = ref<'detail' | 'statistics'>('detail');
// 对齐旧站 getBeforeDateTimestamp(1,false)→今日 0 点，getBeforeDateTimestamp()→今日结束
const defaultRange = () =>
  [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs];

const withdrawPageOptions = computed(() => {
  const list = projectConfig.value?.WithdrawTypeList as
    | Array<{
        I18nKey?: string;
        Key?: number | string;
        Name?: string;
        ShowName?: string;
      }>
    | undefined;
  return [
    { label: '全部', value: '' },
    ...(list ?? []).map((item) => ({
      label:
        item.ShowName || item.Name || item.I18nKey || String(item.Key ?? ''),
      value: item.Name || String(item.Key ?? ''),
    })),
  ];
});

const deviceOptions = computed(() =>
  parseProjectConfigOptions(projectConfig.value, 'VisitDeviceModel'),
);
const deviceSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...deviceOptions.value.map((item) => ({
    label: item.Name,
    value: item.Value,
  })),
]);
const vipLevels = computed(() => {
  const list = projectConfig.value?.VIPLevelMap as
    | Array<{ VipLevelId?: number | string; VipLevelName?: string }>
    | undefined;
  return (list ?? []).map((item, index) => ({
    id: item.VipLevelId ?? index,
    name: item.VipLevelName || `VIP ${item.VipLevelId ?? index}`,
  }));
});

const detailLoading = ref(false);
const detailList = ref<AccessDetailRow[]>([]);
const detailTotal = ref(0);
const detailPage = ref(1);
const detailPageSize = ref(20);
const detailSort = ref('');
const playerId = ref('');
const detailKey = ref<number | string>('');
const visitRange = ref<[Dayjs, Dayjs]>(defaultRange());
const leaveRange = ref<[Dayjs, Dayjs] | undefined>();
const durationRange = ref<[Dayjs, Dayjs] | undefined>();
const appType = ref<number | string>('');
const exportLoading = ref(false);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const detailColumns = [
  { key: 'seq', title: '序号', width: 70 },
  {
    dataIndex: 'BeginTime',
    key: 'BeginTime',
    sorter: true,
    title: '访问时间',
    width: 170,
  },
  { dataIndex: 'Source', key: 'Source', title: '访问页面', width: 140 },
  {
    dataIndex: 'EndTime',
    key: 'EndTime',
    sorter: true,
    title: '离开时间',
    width: 170,
  },
  {
    dataIndex: 'VisitDuration',
    key: 'VisitDuration',
    sorter: true,
    title: '访问时长',
    width: 110,
  },
  { dataIndex: 'AppType', key: 'AppType', title: '访问设备', width: 110 },
  {
    dataIndex: 'LoginAccount',
    key: 'LoginAccount',
    sorter: true,
    title: '游戏账号',
    width: 130,
  },
  { dataIndex: 'Vip', key: 'Vip', sorter: true, title: 'VIP 等级', width: 100 },
];

function detailQuery(withPage = true) {
  const query: Record<string, unknown> = {
    AppType: appType.value,
    DurationMax: durationRange.value?.[1]?.format('HH:mm:ss') || '',
    DurationMin: durationRange.value?.[0]?.format('HH:mm:ss') || '',
    Group: 'Withdraw',
    IsDownload: '',
    Key: detailKey.value,
    LeaveBeginTime: leaveRange.value?.[0]?.unix() || '',
    LeaveEndTime: leaveRange.value?.[1]?.unix() || '',
    PlayerId: playerId.value.trim() || '-1',
    Sort: detailSort.value,
    SubGroup: 'Enter',
    VisitBeginTime: visitRange.value?.[0]?.unix() || '',
    VisitEndTime: visitRange.value?.[1]?.unix() || '',
  };
  if (withPage) {
    query.Page = detailPage.value;
    query.PageSize = detailPageSize.value;
  }
  return query;
}

function validateVisitRange() {
  if (visitRange.value[1].diff(visitRange.value[0], 'day', true) > 7) {
    message.warning('访问时间范围不能超过 7 天');
    return false;
  }
  return true;
}

async function loadDetail() {
  if (!canDetail.value || !validateVisitRange()) return;
  detailLoading.value = true;
  try {
    const result = await fetchWithdrawAccessDetailApi(detailQuery());
    detailList.value = result.Items as AccessDetailRow[];
    detailTotal.value = Number(
      result.Pagination?.MaxCount ?? detailList.value.length,
    );
  } finally {
    detailLoading.value = false;
  }
}

function searchDetail() {
  detailPage.value = 1;
  void loadDetail();
}

function resetDetail() {
  playerId.value = '';
  detailKey.value = '';
  visitRange.value = defaultRange();
  leaveRange.value = undefined;
  durationRange.value = undefined;
  appType.value = '';
  detailSort.value = '';
  detailPage.value = 1;
  void loadDetail();
}

function changeDetailPage(nextPage: number, nextPageSize: number) {
  detailPage.value = nextPageSize === detailPageSize.value ? nextPage : 1;
  detailPageSize.value = nextPageSize;
  void loadDetail();
}

const changeDetailSort: NonNullable<TableProps['onChange']> = (
  _pagination,
  _filters,
  sorterValue,
) => {
  const sorter = Array.isArray(sorterValue) ? sorterValue[0] : sorterValue;
  detailSort.value =
    sorter?.order === 'ascend'
      ? String(sorter.field || '')
      : (sorter?.order === 'descend'
        ? `-${String(sorter.field || '')}`
        : '');
  detailPage.value = 1;
  void loadDetail();
};

function openExport() {
  if (detailTotal.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(VISIT_STATISTIC_EXPORT_PAGE_ID, {
    ...detailQuery(false),
  });
}

async function exportDetail(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportWithdrawAccessDetailApi({
      ...detailQuery(false),
      ...payload,
    });
    if (result?.Id && Number(result.Status) === 0) {
      Modal.confirm({
        content: '导出任务已创建，是否前往导出管理下载？',
        okText: '前往',
        title: '导出成功',
        onOk: () =>
          router.push('/operationalManage/downloadCsvManage').catch(() => {}),
      });
    } else {
      message.error(String(result?.Remark || '导出失败'));
    }
  } finally {
    exportLoading.value = false;
  }
}

const statisticsLoading = ref(false);
const statisticsLoaded = ref(false);
const statisticsKey = ref<number | string>('');
const statisticsRange = ref<[Dayjs, Dayjs]>(defaultRange());
const deviceList = ref<StatisticsRow[]>([]);
const userTypeList = ref<StatisticsRow[]>([]);
const vipList = ref<StatisticsRow[]>([]);
const vipTotal = ref<number[]>([]);

const deviceColumns = [
  { dataIndex: 'Source', key: 'Source', title: '访问页面' },
  { dataIndex: 'TotalVisit', key: 'TotalVisit', title: '总访问人次' },
  { dataIndex: 'WebVisit', key: 'WebVisit', title: 'WEB' },
  { dataIndex: 'H5Visit', key: 'H5Visit', title: 'H5' },
  { dataIndex: 'AppVisit', key: 'AppVisit', title: 'APP' },
];
const userColumns = [
  { dataIndex: 'Source', key: 'Source', title: '访问页面' },
  { dataIndex: 'TotalVisit', key: 'TotalVisit', title: '总访问人次' },
  { dataIndex: 'UserVisit', key: 'UserVisit', title: '用户' },
];
const vipColumns = computed(() => [
  { dataIndex: 'Source', key: 'Source', title: '访问页面', width: 140 },
  {
    dataIndex: 'TotalVisit',
    key: 'TotalVisit',
    title: '总访问人数',
    width: 110,
  },
  ...vipLevels.value.map((level) => ({
    key: `vip-${level.id}`,
    title: level.name,
    width: 90,
  })),
]);

function numberValue(row: StatisticsRow, key: string) {
  return Number(row[key] || 0);
}

function sumField(list: StatisticsRow[], key: string) {
  return list.reduce((total, row) => total + numberValue(row, key), 0);
}

function vipValue(row: StatisticsRow, id: number | string) {
  return Number(
    row.VipVisit?.[String(id)] ?? row[`Vip${String(id)}Visit`] ?? 0,
  );
}

function vipSum(id: number | string, index: number) {
  if (vipTotal.value[index] !== undefined) {
    return Number(vipTotal.value[index] || 0);
  }
  return vipList.value.reduce((total, row) => total + vipValue(row, id), 0);
}

async function loadStatistics() {
  if (!canStatistics.value) return;
  if (
    statisticsRange.value[1].diff(statisticsRange.value[0], 'day', true) > 7
  ) {
    message.warning('统计时间范围不能超过 7 天');
    return;
  }
  statisticsLoading.value = true;
  try {
    const result = await fetchWithdrawAccessStatisticsApi({
      Group: 'Withdraw',
      Key: statisticsKey.value,
      SubGroup: 'Enter',
      VisitBeginTime: statisticsRange.value?.[0]?.unix() || '',
      VisitEndTime: statisticsRange.value?.[1]?.unix() || '',
    });
    deviceList.value = result.DeviceList as StatisticsRow[];
    userTypeList.value = result.UserTypeList as StatisticsRow[];
    vipList.value = result.VipList as StatisticsRow[];
    vipTotal.value = result.Total;
    statisticsLoaded.value = true;
  } finally {
    statisticsLoading.value = false;
  }
}

function resetStatistics() {
  statisticsKey.value = '';
  statisticsRange.value = defaultRange();
  void loadStatistics();
}

watch(activeTab, (tab) => {
  if (tab === 'statistics' && !statisticsLoaded.value) {
    void loadStatistics();
  }
});

onMounted(() => {
  activeTab.value = canDetail.value ? 'detail' : 'statistics';
  if (canDetail.value) void loadDetail();
  else if (canStatistics.value) void loadStatistics();
});
</script>

<template>
  <div v-if="canView">
    <Tabs v-model:active-key="activeTab" type="line" size="small">
      <Tabs.TabPane v-if="canDetail" key="detail" tab="明细">
        <OpsListPanel>
          <template #filters>
            <div class="flex flex-col gap-1">
              <Input
                v-model:value="playerId"
                allow-clear
                @press-enter="searchDetail"
                placeholder="请输入游戏账号"
              >
                <template #addonBefore>游戏账号</template>
              </Input>
            </div>
            <div class="flex flex-col gap-1">
              <Space.Compact>
                <span class="query-field-addon">访问页面</span>
                <Select
                  v-model:value="detailKey"
                  :options="withdrawPageOptions"
                  placeholder="请选择访问页面"
                />
              </Space.Compact>
            </div>
            <div class="query-filter-wide">
              <QueryDatetimeRangePicker v-model="visitRange" label="访问时间" />
            </div>
            <div class="query-filter-wide">
              <QueryDatetimeRangePicker v-model="leaveRange" label="离开时间" />
            </div>
            <div class="flex flex-col gap-1">
              <Space.Compact>
                <span class="query-field-addon">访问时长</span>
                <TimePicker.RangePicker
                  v-model:value="durationRange"
                  allow-clear
                  format="HH:mm:ss"
                />
              </Space.Compact>
            </div>
            <div class="flex flex-col gap-1">
              <Space.Compact>
                <span class="query-field-addon">访问设备</span>
                <Select
                  v-model:value="appType"
                  :options="deviceSelectOptions"
                  placeholder="请选择访问设备"
                />
              </Space.Compact>
            </div>
            <div class="query-filter-actions">
              <Button
                type="primary"
                :loading="detailLoading"
                @click="searchDetail"
              >
                查询
              </Button>
              <Button @click="resetDetail">重置</Button>
              <Button
                v-if="canExport"
                :loading="exportLoading"
                @click="openExport"
              >
                导出 Excel
              </Button>
            </div>
          </template>

          <Spin :spinning="detailLoading">
            <Table
              :columns="detailColumns"
              :data-source="detailList"
              :pagination="false"
              :row-key="
                (row) =>
                  String(row.Id ?? `${row.LoginAccount}-${row.BeginTime}`)
              "
              :scroll="{ x: 1000 }"
              size="small"
              @change="changeDetailSort"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'seq'">
                  {{ (detailPage - 1) * detailPageSize + index + 1 }}
                </template>
                <template v-else-if="column.key === 'BeginTime'">
                  {{ formatOperationDateTime(record.BeginTime) }}
                </template>
                <template v-else-if="column.key === 'EndTime'">
                  {{ formatOperationDateTime(record.EndTime) }}
                </template>
                <template v-else-if="column.key === 'Source'">
                  {{ formatVisitSource(record.Source) }}
                </template>
                <template v-else-if="column.key === 'VisitDuration'">
                  {{ formatVisitDurationSeconds(record.VisitDuration) }}
                </template>
                <template v-else-if="column.key === 'AppType'">
                  {{ resolveAppTypeLabel(record.AppType, deviceOptions) }}
                </template>
                <template v-else-if="column.key === 'LoginAccount'">
                  <PlayerAccountLink
                    :login-account="String(record.LoginAccount || '')"
                    :player-id="record.PlayerId as number | string | undefined"
                  />
                </template>
              </template>
            </Table>
            <div v-if="detailTotal > 0" class="mt-3 flex justify-end">
              <Pagination
                :current="detailPage"
                :page-size="detailPageSize"
                :total="detailTotal"
                show-quick-jumper
                show-size-changer
                @change="changeDetailPage"
              />
            </div>
          </Spin>
        </OpsListPanel>
      </Tabs.TabPane>

      <Tabs.TabPane v-if="canStatistics" key="statistics" tab="统计">
        <OpsListPanel>
          <template #filters>
            <div class="flex flex-col gap-1">
              <Space.Compact>
                <span class="query-field-addon">访问页面</span>
                <Select
                  v-model:value="statisticsKey"
                  :options="withdrawPageOptions"
                  placeholder="请选择访问页面"
                />
              </Space.Compact>
            </div>
            <div class="query-filter-wide">
              <QueryDatetimeRangePicker
                v-model="statisticsRange"
                label="统计时间"
              />
            </div>
            <div class="query-filter-actions query-filter-actions-single">
              <Button
                type="primary"
                :loading="statisticsLoading"
                @click="loadStatistics"
              >
                查询
              </Button>
              <Button @click="resetStatistics">重置</Button>
            </div>
</template>

          <Spin :spinning="statisticsLoading">
            <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <Card size="small" title="分端口访问人数">
                <Table
                  :columns="deviceColumns"
                  :data-source="deviceList"
                  :pagination="false"
                  row-key="DeviceType"
                  size="small"
                >
                  <template #summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell :index="0">
                        合计<br />占比
                      </Table.Summary.Cell>
                      <Table.Summary.Cell :index="1">
                        {{ sumField(deviceList, 'TotalVisit') }}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        v-for="(field, index) in [
                          'WebVisit',
                          'H5Visit',
                          'AppVisit',
                        ]"
                        :key="field"
                        :index="index + 2"
                      >
                        {{ sumField(deviceList, field) }}<br />
                        {{
                          percentOf(
                            sumField(deviceList, field),
                            sumField(deviceList, 'TotalVisit'),
                          )
                        }}%
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </template>
                </Table>
              </Card>

              <Card size="small" title="访问用户类型分布">
                <Table
                  :columns="userColumns"
                  :data-source="userTypeList"
                  :pagination="false"
                  row-key="UserType"
                  size="small"
                >
                  <template #summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell :index="0">
                        合计<br />占比
                      </Table.Summary.Cell>
                      <Table.Summary.Cell :index="1">
                        {{ sumField(userTypeList, 'TotalVisit') }}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell :index="2">
                        {{ sumField(userTypeList, 'UserVisit') }}<br />
                        {{
                          percentOf(
                            sumField(userTypeList, 'UserVisit'),
                            sumField(userTypeList, 'TotalVisit'),
                          )
                        }}%
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </template>
                </Table>
              </Card>
            </div>

            <Card class="mt-3" size="small" title="会员等级分布">
              <Table
                :columns="vipColumns"
                :data-source="vipList"
                :pagination="false"
                row-key="VipLevel"
                :scroll="{ x: 900 }"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="String(column.key).startsWith('vip-')">
                    {{ vipValue(record, String(column.key).slice(4)) }}
                  </template>
                </template>
                <template #summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell :index="0">
                      合计<br />占比
                    </Table.Summary.Cell>
                    <Table.Summary.Cell :index="1">
                      {{ sumField(vipList, 'TotalVisit') }}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell
                      v-for="(level, index) in vipLevels"
                      :key="`vip-total-${level.id}`"
                      :index="Number(index) + 2"
                    >
                      {{ vipSum(level.id, index) }}<br />
                      {{
                        percentOf(
                          vipSum(level.id, index),
                          sumField(vipList, 'TotalVisit'),
                        )
                      }}%
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </template>
              </Table>
            </Card>
          </Spin>
        </OpsListPanel>
      </Tabs.TabPane>
    </Tabs>

    <PassPopup ref="passPopupRef" type="csv" @confirm="exportDetail" />
  </div>
  <Empty v-else description="无提现访问记录权限" />
</template>
