<script lang="ts" setup>
import { computed, onMounted, reactive, watch } from 'vue';

import { Card, Col, Row, Table } from 'ant-design-vue';

import {
  fetchLoginInfoListApi,
  fetchLoginIpListApi,
} from '#/api/netcash/agency-account-details';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';

const props = defineProps<{ adminId: string }>();
const { checkPermission } = useCloudPermission();

type RowData = Record<string, unknown>;
type PanelKey = 'device' | 'history' | 'ip';

const canDevice = computed(() => checkPermission(11_263));
const canIp = computed(() => checkPermission(11_264));
const canHistory = computed(() => checkPermission(11_265));
const loading = reactive<Record<PanelKey, boolean>>({
  device: false,
  history: false,
  ip: false,
});
const rows = reactive<Record<PanelKey, RowData[]>>({
  device: [],
  history: [],
  ip: [],
});
const pagers = reactive<
  Record<PanelKey, { current: number; pageSize: number; total: number }>
>({
  device: { current: 1, pageSize: 20, total: 0 },
  history: { current: 1, pageSize: 20, total: 0 },
  ip: { current: 1, pageSize: 20, total: 0 },
});

const columns: Record<PanelKey, Array<Record<string, unknown>>> = {
  device: [
    { dataIndex: 'DeviceId', key: 'DeviceId', title: '设备编号' },
    { dataIndex: 'Count', key: 'Count', title: '登录次数', width: 100 },
  ],
  ip: [
    { dataIndex: 'Ip', key: 'Ip', title: '登录 IP' },
    { dataIndex: 'Address', key: 'Address', title: '地区' },
    { dataIndex: 'Count', key: 'Count', title: '登录次数', width: 100 },
  ],
  history: [
    { dataIndex: 'Date', key: 'Date', title: '登录时间', width: 170 },
    { dataIndex: 'Ip', key: 'Ip', title: '登录 IP' },
    { dataIndex: 'IpName', key: 'IpName', title: '地区' },
    { dataIndex: 'LoginPlatform', key: 'LoginPlatform', title: '设备类型' },
  ],
};

function visible(key: PanelKey) {
  return key === 'device'
    ? canDevice.value
    : (key === 'ip'
      ? canIp.value
      : canHistory.value);
}

async function load(key: PanelKey) {
  if (!props.adminId || !visible(key)) return;
  loading[key] = true;
  try {
    const pager = pagers[key];
    const query = {
      AdminId: props.adminId,
      Keyword: '',
      LType: key === 'device' ? 2 : 1,
      Page: pager.current,
      PageSize: pager.pageSize,
      Sort: '',
    };
    const result =
      key === 'history'
        ? await fetchLoginIpListApi(query)
        : await fetchLoginInfoListApi(query);
    rows[key] = result.Items || [];
    pager.total = Number(result.Pagination?.MaxCount ?? rows[key].length);
  } catch {
    rows[key] = [];
    pagers[key].total = 0;
  } finally {
    loading[key] = false;
  }
}

function changePage(
  key: PanelKey,
  page: { current?: number; pageSize?: number },
) {
  pagers[key].current = page.current || 1;
  pagers[key].pageSize = page.pageSize || 20;
  void load(key);
}

function loadAll() {
  (['device', 'ip', 'history'] as PanelKey[]).forEach((key) => void load(key));
}

watch(() => props.adminId, loadAll);
onMounted(loadAll);
</script>

<template>
  <Row :gutter="[12, 12]">
    <Col v-if="canDevice" :lg="8" :xs="24">
      <Card size="small" title="登录设备统计">
        <Table
          bordered
          :columns="columns.device"
          :data-source="rows.device"
          :loading="loading.device"
          :pagination="pagers.device"
          :row-key="(row) => String(row.DeviceId || '-')"
          size="small"
          @change="(page) => changePage('device', page)"
        />
      </Card>
    </Col>
    <Col v-if="canIp" :lg="8" :xs="24">
      <Card size="small" title="登录 IP 统计">
        <Table
          bordered
          :columns="columns.ip"
          :data-source="rows.ip"
          :loading="loading.ip"
          :pagination="pagers.ip"
          :row-key="(row) => String(row.Ip || '-')"
          size="small"
          @change="(page) => changePage('ip', page)"
        />
      </Card>
    </Col>
    <Col v-if="canHistory" :lg="8" :xs="24">
      <Card size="small" title="登录 IP / 设备明细">
        <Table
          bordered
          :columns="columns.history"
          :data-source="rows.history"
          :loading="loading.history"
          :pagination="pagers.history"
          :row-key="(row, index) => String(row.Id || index)"
          :scroll="{ x: 650 }"
          size="small"
          @change="(page) => changePage('history', page)"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'Date'">
              {{ formatNetcashDateTime(record.Date) }}
            </template>
          </template>
        </Table>
      </Card>
    </Col>
  </Row>
</template>
