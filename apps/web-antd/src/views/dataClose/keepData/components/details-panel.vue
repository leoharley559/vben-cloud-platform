<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Breadcrumb,
  Button,
  message,
  Modal,
  Pagination,
  Space,
  Table,
} from 'ant-design-vue';

import {
  exportKeepDataFirstRegCsvApi,
  exportKeepDataOneTimeUserCsvApi,
  exportKeepDataQujianCsvApi,
  fetchKeepDataDauDetailApi,
  fetchKeepDataFirstPayDetailsApi,
  fetchKeepDataFirstRegDetailsApi,
  fetchKeepDataLoginDauDetailApi,
  fetchKeepDataLtvRechargeDetailApi,
  fetchKeepDataOnceUserDetailApi,
  fetchKeepDataOneTimeUserDetailApi,
  fetchKeepDataQujianDetailsApi,
  fetchKeepDataSectionDauDetailApi,
} from '#/api/dataClose/keep-data';
import PassPopup from '#/components/security/pass-popup.vue';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  KEEP_DATA_FIRST_REG_EXPORT_PAGE_ID,
  KEEP_DATA_ONETIME_EXPORT_PAGE_ID,
  KEEP_DATA_QUJIAN_EXPORT_PAGE_ID,
} from '#/utils/security-page-ids';
import { exportRowsToXlsx, formatReportDateTime } from '#/views/dataClose/shared/report-utils';

import {
  type KeepDetailsParam,
  keepDetailsSubTitle,
  keepDetailsTitle,
  type KeepRow,
} from '../utils';

defineOptions({ name: 'KeepDetailsPanel' });

const props = defineProps<{
  param: KeepDetailsParam;
}>();

const emit = defineEmits<{
  back: [];
}>();

const router = useRouter();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const loading = ref(false);
const exportLoading = ref(false);
const list = ref<KeepRow[]>([]);
const total = ref(0);
const page = reactive({ current: 1, pageSize: 20 });
const lastExportQuery = ref<Record<string, unknown>>({});

const securePageId = computed(() => {
  const { page: p, type } = props.param;
  if (p === 'oneTime' && type === 'oneTime') return KEEP_DATA_ONETIME_EXPORT_PAGE_ID;
  if ((type === 'reg' || type === 'new') && p !== 'qujian') {
    return KEEP_DATA_FIRST_REG_EXPORT_PAGE_ID;
  }
  if (p === 'qujian' && type === 'new') return KEEP_DATA_QUJIAN_EXPORT_PAGE_ID;
  return null;
});

const columns = computed<TableColumnType<KeepRow>[]>(() => {
  const cols: TableColumnType<KeepRow>[] = [
    {
      align: 'center',
      customRender: ({ index }) =>
        (page.current - 1) * page.pageSize + index + 1,
      key: 'index',
      title: '#',
      width: 60,
    },
    {
      align: 'center',
      dataIndex: 'LoginAccount',
      key: 'LoginAccount',
      title: '游戏账号',
    },
    {
      align: 'center',
      dataIndex: 'PlayerId',
      key: 'PlayerId',
      title: '玩家ID',
    },
  ];
  if (props.param.type === 'reg' || props.param.type === 'new') {
    cols.push(
      {
        align: 'center',
        dataIndex: 'VipLevel',
        key: 'VipLevel',
        title: 'VIP等级',
      },
      {
        align: 'center',
        customRender: ({ record }) =>
          formatReportDateTime(record.LastTopupTime),
        key: 'LastTopupTime',
        title: '最后存款时间',
      },
    );
  }
  cols.push(
    {
      align: 'center',
      dataIndex: 'ChannelName',
      key: 'ChannelName',
      title: '渠道名称',
    },
    {
      align: 'center',
      dataIndex: 'ChannelId',
      key: 'ChannelId',
      title: '渠道号',
    },
    {
      align: 'center',
      dataIndex: 'PackageName',
      key: 'PackageName',
      title: '产品名称',
    },
    {
      align: 'center',
      dataIndex: 'InviteSite',
      key: 'InviteSite',
      title: '邀请站点',
    },
  );
  if (props.param.page === 'ltv' && props.param.type === 'topUp') {
    cols.push({
      align: 'center',
      customRender: ({ record }) =>
        formatAmountFromCent(Number(record.SumPayMergerMoney || 0)),
      key: 'SumPayMergerMoney',
      title: '充值金额',
    });
  }
  return cols;
});

function buildQuery(isExp = false) {
  const base: Record<string, unknown> = {
    ...props.param,
    Page: page.current,
    PageSize: page.pageSize,
    BeginTime: props.param.date,
    IsExp: isExp,
  };
  delete base.page;
  delete base.type;
  delete base.date;
  delete base.days;
  delete base.reportType;

  const { page: p, type } = props.param;

  switch (p) {
  case 'login': {
    if (type !== 'new') base.Days = type;
  
  break;
  }
  case 'ltv': {
    if (type !== 'new') {
      base.Days = props.param.days;
      base.EndTime = base.BeginTime;
    }
  
  break;
  }
  case 'oneTime': {
    if (type !== 'reg') {
      base.Days = props.param.days;
      base.EndTime = '';
    }
  
  break;
  }
  case 'qujian': {
    const [begin, end] = String(props.param.date || '').split('~');
    base.BeginTime = begin || '';
    base.EndTime = end || '';
    if (type !== 'new') base.Days = type;
  
  break;
  }
  case 'retention': {
    base.EndTime = '';
    if (type !== 'pay' && type !== 'reg' && type !== 'once') {
      base.Days = type;
      base.ReportType = props.param.reportType;
    }
  
  break;
  }
  // No default
  }
  return base;
}

async function fetchDetail(isExp = false) {
  const query = buildQuery(isExp);
  const { page: p, type } = props.param;

  let data: { Items?: KeepRow[] | null; Pagination?: { MaxCount?: number } };

  if (p === 'login') {
    data =
      type === 'new'
        ? await fetchKeepDataFirstRegDetailsApi(query)
        : await fetchKeepDataLoginDauDetailApi(query);
  } else if (p === 'oneTime') {
    data =
      type === 'reg'
        ? await fetchKeepDataFirstRegDetailsApi(query)
        : await fetchKeepDataOneTimeUserDetailApi(query);
  } else if (p === 'qujian') {
    data =
      type === 'new'
        ? await fetchKeepDataQujianDetailsApi(query)
        : await fetchKeepDataSectionDauDetailApi(query);
  } else if (p === 'retention') {
    if (type === 'once') {
      data = await fetchKeepDataOnceUserDetailApi(query);
    } else if (type === 'pay') {
      data = await fetchKeepDataFirstPayDetailsApi(query);
    } else if (type === 'reg') {
      data = await fetchKeepDataFirstRegDetailsApi(query);
    } else {
      data = await fetchKeepDataDauDetailApi(query);
    }
  } else {
    data =
      type === 'new'
        ? await fetchKeepDataFirstRegDetailsApi(query)
        : await fetchKeepDataLtvRechargeDetailApi(query);
  }

  return {
    items: data?.Items || [],
    total: data?.Pagination?.MaxCount || 0,
    query,
  };
}

async function loadList() {
  loading.value = true;
  try {
    const result = await fetchDetail(false);
    list.value = result.items;
    total.value = result.total;
    lastExportQuery.value = result.query;
  } catch {
    list.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSecureExportClick() {
  if (total.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  const pageId = securePageId.value;
  if (pageId == null) return;
  const { Page: _p, PageSize: _ps, IsExp: _e, ...params } = lastExportQuery.value;
  passPopupRef.value?.validate(pageId, params);
}

async function handleSecureExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const pageId = securePageId.value;
    const { Page: _p, PageSize: _ps, IsExp: _e, ...params } = {
      ...lastExportQuery.value,
      ...payload,
    };
    let result: undefined | { Id?: number; Remark?: string; Status?: number };
    if (pageId === KEEP_DATA_ONETIME_EXPORT_PAGE_ID) {
      result = await exportKeepDataOneTimeUserCsvApi(params);
    } else if (pageId === KEEP_DATA_QUJIAN_EXPORT_PAGE_ID) {
      result = await exportKeepDataQujianCsvApi(params);
    } else {
      result = await exportKeepDataFirstRegCsvApi(params);
    }
    if (result?.Id && Number(result.Status) === 0) {
      Modal.confirm({
        content: '导出任务已创建，是否前往导出管理下载？',
        okText: '前往',
        title: '导出成功',
        onOk: () => {
          router.push('/operationalManage/downloadCsvManage').catch(() => {});
        },
      });
      return;
    }
    message.error(String(result?.Remark || '导出失败'));
  } finally {
    exportLoading.value = false;
  }
}

async function handleExcelExport() {
  exportLoading.value = true;
  try {
    const result = await fetchDetail(true);
    if (result.items.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    const isReg = props.param.type === 'reg' || props.param.type === 'new';
    const isLtvTop =
      props.param.page === 'ltv' && props.param.type === 'topUp';
    let headers: string[];
    let fields: string[];
    if (isReg) {
      headers = [
        '游戏账号',
        '玩家ID',
        'VIP等级',
        '最后存款时间',
        '渠道名称',
        '渠道号',
        '产品名称',
        '邀请站点',
      ];
      fields = [
        'LoginAccount',
        'PlayerId',
        'VipLevel',
        'LastTopupTime',
        'ChannelName',
        'ChannelId',
        'PackageName',
        'InviteSite',
      ];
    } else if (isLtvTop) {
      headers = [
        '游戏账号',
        '玩家ID',
        'VIP等级',
        '渠道名称',
        '渠道号',
        '产品名称',
        '邀请站点',
        '充值金额',
      ];
      fields = [
        'LoginAccount',
        'PlayerId',
        'VipLevel',
        'ChannelName',
        'ChannelId',
        'PackageName',
        'InviteSite',
        'SumPayMergerMoney',
      ];
    } else {
      headers = [
        '游戏账号',
        '玩家ID',
        '渠道名称',
        '渠道号',
        '产品名称',
        '邀请站点',
      ];
      fields = [
        'LoginAccount',
        'PlayerId',
        'ChannelName',
        'ChannelId',
        'PackageName',
        'InviteSite',
      ];
    }
    await exportRowsToXlsx(
      result.items,
      headers,
      `${keepDetailsTitle(props.param.page)}-${keepDetailsSubTitle(props.param.type, props.param.days)}`,
      (row) =>
        fields.map((field) => {
          if (field === 'LastTopupTime') {
            return formatReportDateTime(row[field]);
          }
          if (field === 'SumPayMergerMoney') {
            return formatAmountFromCent(Number(row[field] || 0));
          }
          return row[field] ?? '';
        }),
    );
  } finally {
    exportLoading.value = false;
  }
}

watch(
  () => props.param,
  () => {
    page.current = 1;
    void loadList();
  },
  { deep: true },
);

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <Space class="mb-3">
      <Button type="primary" @click="emit('back')">返回</Button>
    </Space>
    <Breadcrumb class="mb-3 text-base">
      <Breadcrumb.Item>{{ keepDetailsTitle(param.page) }}</Breadcrumb.Item>
      <Breadcrumb.Item>
        <span class="text-primary">{{
          keepDetailsSubTitle(param.type, param.days)
        }}</span>
      </Breadcrumb.Item>
      <Breadcrumb.Item>{{ param.date }}</Breadcrumb.Item>
    </Breadcrumb>
    <div class="mb-3 flex justify-end">
      <Button
        v-if="securePageId"
        :loading="exportLoading"
        type="primary"
        @click="handleSecureExportClick"
      >
        后台导出
      </Button>
      <Button
        v-else
        :loading="exportLoading"
        type="primary"
        @click="handleExcelExport"
      >
        导出Excel
      </Button>
    </div>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="PlayerId"
      size="small"
    />
    <div v-if="total > 0" class="mt-3 flex justify-end">
      <Pagination
        v-model:current="page.current"
        v-model:page-size="page.pageSize"
        :total="total"
        show-size-changer
        @change="loadList"
      />
    </div>
    <PassPopup ref="passPopupRef" type="csv" @confirm="handleSecureExport" />
  </div>
</template>
