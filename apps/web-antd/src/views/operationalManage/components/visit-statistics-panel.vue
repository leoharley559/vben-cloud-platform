<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Button, message, Select, Space, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchNoticeStatisticListApi } from '#/api/operationManage/game-notice';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useProjectConfig } from '#/composables/use-project-config';
import { getTodayRangeSeconds } from '#/utils/date-range';

import {
  createRangeDayLimiter,
  parseProjectConfigOptions,
  percentOf,
} from './visit-statistic-shared';

defineOptions({ name: 'VisitStatisticsPanel' });

const props = withDefaults(
  defineProps<{
    canLoad?: boolean;
    dropdownKey: 'DialogDropDownList' | 'MailDropDownList';
    group: 'Dialog' | 'Mail';
    /** 公告统计显示游客列；邮件统计旧站已注释游客列 */
    showGuestVisit?: boolean;
    titleId: number | string;
  }>(),
  {
    showGuestVisit: true,
  },
);

interface StatRow {
  [key: string]: unknown;
  AppVisit?: number;
  GuestVisit?: number;
  H5Visit?: number;
  Source?: string;
  TotalVisit?: number;
  UserVisit?: number;
  Vip0Visit?: number;
  Vip1Visit?: number;
  Vip2Visit?: number;
  Vip3Visit?: number;
  Vip4Visit?: number;
  Vip5Visit?: number;
  Vip6Visit?: number;
  Vip7Visit?: number;
  Vip8Visit?: number;
  Vip9Visit?: number;
  Vip10Visit?: number;
  WebVisit?: number;
}

const { projectConfig } = useProjectConfig();
const loading = ref(false);
const deviceList = ref<StatRow[]>([]);
const userTypeList = ref<StatRow[]>([]);
const vipList = ref<StatRow[]>([]);

/** 对齐旧站 noticeStatistics：默认今天；统计时间 limit-number=7 */
const defaultRange = getTodayRangeSeconds();
const visitRangeLimit = createRangeDayLimiter(7);
const filterSubGroup = ref<number | string>('');
const filterVisitRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const pageSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...parseProjectConfigOptions(projectConfig.value, props.dropdownKey).map(
    (item) => ({
      label: item.Name,
      value: item.Value,
    }),
  ),
]);

function num(row: StatRow, key: keyof StatRow) {
  return Number(row[key] || 0);
}

function sumField(list: StatRow[], key: keyof StatRow) {
  return list.reduce((acc, row) => acc + num(row, key), 0);
}

const deviceColumns = [
  { dataIndex: 'Source', key: 'Source', title: '访问页面' },
  { dataIndex: 'TotalVisit', key: 'TotalVisit', title: '总访问人次' },
  { dataIndex: 'WebVisit', key: 'WebVisit', title: 'WEB' },
  { dataIndex: 'H5Visit', key: 'H5Visit', title: 'H5' },
  { dataIndex: 'AppVisit', key: 'AppVisit', title: 'APP' },
];

const userTypeColumns = computed(() => {
  const cols = [
    { dataIndex: 'Source', key: 'Source', title: '访问页面' },
    { dataIndex: 'TotalVisit', key: 'TotalVisit', title: '总访问人次' },
  ];
  if (props.showGuestVisit) {
    cols.push({
      dataIndex: 'GuestVisit',
      key: 'GuestVisit',
      title: '游客',
    });
  }
  cols.push({ dataIndex: 'UserVisit', key: 'UserVisit', title: '用户' });
  return cols;
});

const vipColumns = [
  { dataIndex: 'Source', key: 'Source', title: '访问页面', width: 120 },
  {
    dataIndex: 'TotalVisit',
    key: 'TotalVisit',
    title: '总访问人数',
    width: 100,
  },
  ...Array.from({ length: 11 }, (_, i) => ({
    dataIndex: `Vip${i}Visit`,
    key: `Vip${i}Visit`,
    title: `VIP ${i}`,
    width: 80,
  })),
];

async function loadData() {
  if (props.canLoad === false) {
    deviceList.value = [];
    userTypeList.value = [];
    vipList.value = [];
    return;
  }
  const [begin, end] = filterVisitRange.value || [];
  loading.value = true;
  try {
    const result = await fetchNoticeStatisticListApi({
      Group: props.group,
      Key: props.titleId,
      SubGroup: filterSubGroup.value,
      VisitBeginTime: begin ? begin.startOf('day').unix() : '',
      VisitEndTime: end ? end.endOf('day').unix() : '',
    });
    deviceList.value = (result.DeviceList || []) as StatRow[];
    userTypeList.value = (result.UserTypeList || []) as StatRow[];
    vipList.value = (result.VipList || []) as StatRow[];
  } catch {
    deviceList.value = [];
    userTypeList.value = [];
    vipList.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  if (props.canLoad === false) {
    message.warning('无访问统计查询权限');
    return;
  }
  if (!filterVisitRange.value?.[0] || !filterVisitRange.value?.[1]) {
    message.warning('请选择统计时间');
    return;
  }
  if (visitRangeLimit.isRangeTooLong(filterVisitRange.value)) {
    message.warning('统计时间跨度不能超过 7 天');
    return;
  }
  loadData();
}

function handleReset() {
  filterSubGroup.value = '';
  visitRangeLimit.clearSelecting();
  const range = getTodayRangeSeconds();
  filterVisitRange.value = [
    dayjs.unix(range.BeginTime),
    dayjs.unix(range.EndTime),
  ];
  handleSearch();
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">访问页面</span>
          <Select
            v-model:value="filterSubGroup"
            show-search
            :options="pageSelectOptions"
            :filter-option="
              (input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
            placeholder="请选择访问页面"
          />
        </Space.Compact>
      </div>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker
          v-model="filterVisitRange"
          label="统计时间（最多 7 天）"
          precision="date"
          :disabled-date="visitRangeLimit.disabledDate"
        />
      </div>
      <div class="query-filter-actions query-filter-actions-single">
        <Button type="primary" :loading="loading" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </div>
</template>

    <div v-if="canLoad === false" class="py-10 text-center text-gray-400">
      无访问统计查询权限
    </div>

    <template v-else>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          class="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <div class="border-b px-3 py-2 text-sm font-medium">分端口分布</div>
          <Table
            size="small"
            :columns="deviceColumns"
            :data-source="deviceList"
            :loading="loading"
            :pagination="false"
            row-key="DeviceType"
            :scroll="{ x: true }"
          >
            <template #summary>
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell :index="0">
                    <div class="leading-5">合计<br />占比</div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="1">
                    {{ sumField(deviceList, 'TotalVisit') }}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="2">
                    <div class="leading-5">
                      {{ sumField(deviceList, 'WebVisit') }}<br />
                      {{
                        percentOf(
                          sumField(deviceList, 'WebVisit'),
                          sumField(deviceList, 'TotalVisit'),
                        )
                      }}%
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="3">
                    <div class="leading-5">
                      {{ sumField(deviceList, 'H5Visit') }}<br />
                      {{
                        percentOf(
                          sumField(deviceList, 'H5Visit'),
                          sumField(deviceList, 'TotalVisit'),
                        )
                      }}%
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="4">
                    <div class="leading-5">
                      {{ sumField(deviceList, 'AppVisit') }}<br />
                      {{
                        percentOf(
                          sumField(deviceList, 'AppVisit'),
                          sumField(deviceList, 'TotalVisit'),
                        )
                      }}%
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            </template>
          </Table>
        </div>

        <div
          class="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <div class="border-b px-3 py-2 text-sm font-medium">用户类型分布</div>
          <Table
            size="small"
            :columns="userTypeColumns"
            :data-source="userTypeList"
            :loading="loading"
            :pagination="false"
            row-key="UserType"
            :scroll="{ x: true }"
          >
            <template #summary>
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell :index="0">
                    <div class="leading-5">合计<br />占比</div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="1">
                    {{ sumField(userTypeList, 'TotalVisit') }}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell v-if="showGuestVisit" :index="2">
                    <div class="leading-5">
                      {{ sumField(userTypeList, 'GuestVisit') }}<br />
                      {{
                        percentOf(
                          sumField(userTypeList, 'GuestVisit'),
                          sumField(userTypeList, 'TotalVisit'),
                        )
                      }}%
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="showGuestVisit ? 3 : 2">
                    <div class="leading-5">
                      {{ sumField(userTypeList, 'UserVisit') }}<br />
                      {{
                        percentOf(
                          sumField(userTypeList, 'UserVisit'),
                          sumField(userTypeList, 'TotalVisit'),
                        )
                      }}%
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            </template>
          </Table>
        </div>
      </div>

      <div
        class="mt-4 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700"
      >
        <div class="border-b px-3 py-2 text-sm font-medium">会员等级分布</div>
        <Table
          size="small"
          :columns="vipColumns"
          :data-source="vipList"
          :loading="loading"
          :pagination="false"
          row-key="VipLevel"
          :scroll="{ x: 1200 }"
        >
          <template #summary>
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell :index="0">
                  <div class="leading-5">合计<br />占比</div>
                </Table.Summary.Cell>
                <Table.Summary.Cell :index="1">
                  {{ sumField(vipList, 'TotalVisit') }}
                </Table.Summary.Cell>
                <Table.Summary.Cell
                  v-for="i in 11"
                  :key="`vip-sum-${i - 1}`"
                  :index="i + 1"
                >
                  <div class="leading-5">
                    {{ sumField(vipList, `Vip${i - 1}Visit`) }}<br />
                    {{
                      percentOf(
                        sumField(vipList, `Vip${i - 1}Visit`),
                        sumField(vipList, 'TotalVisit'),
                      )
                    }}%
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          </template>
        </Table>
      </div>
    </template>
  </OpsListPanel>
</template>
