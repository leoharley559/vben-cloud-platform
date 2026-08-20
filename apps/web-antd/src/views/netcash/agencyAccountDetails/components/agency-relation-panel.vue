<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Card,
  Col,
  Radio,
  Row,
  Select,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import {
  fetchRelationDetailListApi,
  fetchRelationSummaryListApi,
} from '#/api/netcash/agency-account-details';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';

const props = defineProps<{ adminId: string }>();
const { checkPermission } = useCloudPermission();
type RelationType = 'device' | 'ip';
type RowData = Record<string, unknown>;

const mode = ref<'detail' | 'summary'>('summary');
/** 对齐旧站：默认今天 00:00（unix 秒）；「全部」用 1949-10-01 */
const createTime = ref(dayjs().startOf('day').unix());
const loading = reactive({ device: false, ip: false });
const rows = reactive<Record<RelationType, RowData[]>>({ device: [], ip: [] });
const pagers = reactive({
  device: { current: 1, pageSize: 20, total: 0 },
  ip: { current: 1, pageSize: 20, total: 0 },
});

const canDevice = computed(() =>
  checkPermission(mode.value === 'summary' ? 11_267 : 11_268),
);
const canIp = computed(() =>
  checkPermission(mode.value === 'summary' ? 11_269 : 11_270),
);
const dateOptions = [
  { label: '全部', value: dayjs('1949-10-01').startOf('day').unix() },
  { label: '今天', value: dayjs().startOf('day').unix() },
  {
    label: '近 1 个月',
    value: dayjs().subtract(30, 'day').startOf('day').unix(),
  },
  {
    label: '近 3 个月',
    value: dayjs().subtract(90, 'day').startOf('day').unix(),
  },
  {
    label: '近半年',
    value: dayjs().subtract(180, 'day').startOf('day').unix(),
  },
  {
    label: '近 1 年',
    value: dayjs().subtract(365, 'day').startOf('day').unix(),
  },
];

const summaryColumns = {
  device: [
    { dataIndex: 'DeviceId', key: 'DeviceId', title: '设备编号' },
    { dataIndex: 'AccountCount', key: 'AccountCount', title: '关联代理数' },
    { dataIndex: 'SumRecharge', key: 'SumRecharge', title: '总提款' },
    { dataIndex: 'LoginCount', key: 'LoginCount', title: '登录次数' },
  ],
  ip: [
    { dataIndex: 'Ip', key: 'Ip', title: '登录 IP' },
    { dataIndex: 'AccountCount', key: 'AccountCount', title: '关联代理数' },
    { dataIndex: 'SumRecharge', key: 'SumRecharge', title: '总提款' },
    { dataIndex: 'LoginCount', key: 'LoginCount', title: '登录次数' },
  ],
};
const detailColumns = {
  device: [
    { dataIndex: 'DeviceId', key: 'DeviceId', title: '设备编号' },
    { dataIndex: 'UserName', key: 'UserName', title: '代理账号' },
    { dataIndex: 'RealName', key: 'RealName', title: '真实姓名' },
    { dataIndex: 'Recharged', key: 'Recharged', title: '总提款' },
    { dataIndex: 'LoginCount', key: 'LoginCount', title: '登录次数' },
  ],
  ip: [
    { dataIndex: 'Ip', key: 'Ip', title: '登录 IP' },
    { dataIndex: 'UserName', key: 'UserName', title: '代理账号' },
    { dataIndex: 'RealName', key: 'RealName', title: '真实姓名' },
    { dataIndex: 'Recharged', key: 'Recharged', title: '总提款' },
    { dataIndex: 'LoginCount', key: 'LoginCount', title: '登录次数' },
  ],
};

function columns(type: RelationType) {
  return mode.value === 'summary' ? summaryColumns[type] : detailColumns[type];
}

function visible(type: RelationType) {
  return type === 'device' ? canDevice.value : canIp.value;
}

async function load(type: RelationType) {
  if (!props.adminId || !visible(type)) {
    rows[type] = [];
    return;
  }
  loading[type] = true;
  try {
    const pager = pagers[type];
    const api =
      mode.value === 'summary'
        ? fetchRelationSummaryListApi
        : fetchRelationDetailListApi;
    const result = await api({
      AdminId: props.adminId,
      CreateTime: createTime.value,
      Keyword: '',
      Page: pager.current,
      PageSize: pager.pageSize,
      Sort: '',
      Type: type === 'device' ? 1 : 2,
    });
    rows[type] = result.Items || [];
    pager.total = Number(result.Pagination?.MaxCount ?? rows[type].length);
  } catch {
    rows[type] = [];
    pagers[type].total = 0;
  } finally {
    loading[type] = false;
  }
}

function loadAll() {
  void load('device');
  void load('ip');
}

function reset() {
  createTime.value = dayjs().startOf('day').unix();
  pagers.device.current = 1;
  pagers.ip.current = 1;
  loadAll();
}

function changePage(
  type: RelationType,
  page: { current?: number; pageSize?: number },
) {
  pagers[type].current = page.current || 1;
  pagers[type].pageSize = page.pageSize || 20;
  void load(type);
}

function exportCurrent() {
  const data = [
    ...rows.device.map((item) => ({ 关联类型: '设备', ...item })),
    ...rows.ip.map((item) => ({ 关联类型: 'IP', ...item })),
  ];
  if (data.length === 0) return;
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(data),
    mode.value === 'summary' ? '关联统计' : '关联明细',
  );
  XLSX.writeFile(
    book,
    `代理关联账号_${props.adminId}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
  );
}

watch(mode, () => {
  pagers.device.current = 1;
  pagers.ip.current = 1;
  loadAll();
});
watch(() => props.adminId, loadAll);
onMounted(loadAll);
</script>

<template>
  <div class="space-y-4">
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <Select v-model:value="createTime" :options="dateOptions" />
        <div class="query-filter-actions">
          <Button type="primary" @click="loadAll">查询</Button>
          <Button @click="reset">重置</Button>
          <Radio.Group v-model:value="mode" button-style="solid">
            <Radio.Button value="summary">统计</Radio.Button>
            <Radio.Button value="detail">详细数据</Radio.Button>
          </Radio.Group>
          <Button @click="exportCurrent">导出当前数据</Button>
        </div>
      </div>
    </div>

    <Row :gutter="[12, 12]">
      <Col v-if="canDevice" :lg="12" :xs="24">
        <Card
          size="small"
          :title="`设备关联号${mode === 'summary' ? '统计' : '明细'}`"
        >
          <Table
            bordered
            :columns="columns('device')"
            :data-source="rows.device"
            :loading="loading.device"
            :pagination="pagers.device"
            :row-key="(row) => String(row.Id ?? row.DeviceId ?? '')"
            :scroll="{ x: 650 }"
            size="small"
            @change="(page) => changePage('device', page)"
          >
            <template #bodyCell="{ column, record }">
              <AgencyAccountLink
                v-if="column.key === 'UserName'"
                :admin-id="resolveAgencyAdminId(record)"
                :username="record.UserName"
              />
              <template
                v-else-if="
                  ['Recharged', 'SumRecharge'].includes(String(column.key))
                "
              >
                {{
                  formatAmountFromCent(Number(record[String(column.key)] || 0))
                }}
              </template>
            </template>
          </Table>
        </Card>
      </Col>
      <Col v-if="canIp" :lg="12" :xs="24">
        <Card
          size="small"
          :title="`IP 关联号${mode === 'summary' ? '统计' : '明细'}`"
        >
          <Table
            bordered
            :columns="columns('ip')"
            :data-source="rows.ip"
            :loading="loading.ip"
            :pagination="pagers.ip"
            :row-key="(row) => String(row.Id ?? row.Ip ?? '')"
            :scroll="{ x: 650 }"
            size="small"
            @change="(page) => changePage('ip', page)"
          >
            <template #bodyCell="{ column, record }">
              <AgencyAccountLink
                v-if="column.key === 'UserName'"
                :admin-id="resolveAgencyAdminId(record)"
                :username="record.UserName"
              />
              <template
                v-else-if="
                  ['Recharged', 'SumRecharge'].includes(String(column.key))
                "
              >
                {{
                  formatAmountFromCent(Number(record[String(column.key)] || 0))
                }}
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>
  </div>
</template>
