<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HandRecordItem, LandingPageItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Result,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createHandRecordApi,
  deleteHandRecordApi,
  fetchHandRecordListApi,
  fetchLandingPageListApi,
  updateHandRecordApi,
} from '#/api/promotion/promote-data';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';

import PromoteDataSearch from './promote-data-search.vue';

defineOptions({ name: 'DataWriteList' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canViewTable = computed(() => checkPermission(10904));
const canAdd = computed(() => checkPermission(10905));
const canEdit = computed(() => checkPermission(10906));
const canDelete = computed(() => checkPermission(10907));

const searchRef = ref<InstanceType<typeof PromoteDataSearch>>();
const landingOptions = ref<LandingPageItem[]>([]);
const formOpen = ref(false);
const formLoading = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const editingId = ref<number | string>();

const formChannelId = ref<number | string>();
const formReportDate = ref<dayjs.Dayjs>();
const formTemplateId = ref<number | string>();
const formCostMoney = ref('');
const formExposureNum = ref('');
const formClickNum = ref('');
const formUv = ref('');
const formIp = ref('');
const formDownNum = ref('');

const channelOptions = computed(() => {
  const list = (projectConfig.value?.ChildChannelInfo || []) as Array<{
    ChannelId?: number | string;
    ChannelName?: string;
  }>;
  return list.map((item) => ({
    label: item.ChannelName || String(item.ChannelId),
    value: item.ChannelId,
  }));
});

function getLandingName(id?: number | string) {
  const target = landingOptions.value.find(
    (item) => String(item.Id) === String(id),
  );
  return target?.Name || String(id || '-');
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const base = searchRef.value?.buildPayload() || {
    AdminIds: '',
    BeginTime: '',
    ChannelIds: [],
    EndTime: '',
    TemplateId: '',
  };
  return {
    ...base,
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

function openForm(mode: 'add' | 'edit', row?: HandRecordItem) {
  formMode.value = mode;
  editingId.value = row?.Id;
  formChannelId.value = row?.ChannelId;
  formReportDate.value = row?.ReportDate ? dayjs(row.ReportDate) : dayjs();
  formTemplateId.value = row?.TemplateId;
  formCostMoney.value = row?.CostMoney ? String(row.CostMoney) : '';
  formExposureNum.value = row?.ExposureNum ? String(row.ExposureNum) : '';
  formClickNum.value = row?.ClickNum ? String(row.ClickNum) : '';
  formUv.value = row?.Uv ? String(row.Uv) : '';
  formIp.value = row?.Ip ? String(row.Ip) : '';
  formDownNum.value = row?.DownNum ? String(row.DownNum) : '';
  formOpen.value = true;
}

async function handleSubmit() {
  if (!formChannelId.value || !formReportDate.value || !formTemplateId.value) {
    message.warning('请填写必填项');
    return;
  }
  formLoading.value = true;
  try {
    const payload = {
      ChannelId: formChannelId.value,
      ClickNum: Number(formClickNum.value || 0),
      CostMoney: Number(formCostMoney.value || 0),
      DownNum: Number(formDownNum.value || 0),
      ExposureNum: Number(formExposureNum.value || 0),
      Id: editingId.value,
      Ip: Number(formIp.value || 0),
      ReportDate: formReportDate.value.format('YYYY-MM-DD'),
      TemplateId: formTemplateId.value,
      Uv: Number(formUv.value || 0),
    };
    if (formMode.value === 'add') {
      await createHandRecordApi(payload);
      message.success('新增成功');
    } else {
      await updateHandRecordApi(payload);
      message.success('编辑成功');
    }
    formOpen.value = false;
    gridApi.reload();
  } finally {
    formLoading.value = false;
  }
}

function handleDelete(row: HandRecordItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确认删除该数据填写记录？',
    onOk: async () => {
      await deleteHandRecordApi(row.Id!);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除确认',
  });
}

const gridOptions: VxeTableGridOptions<HandRecordItem> = {
  columns: [
    { field: 'ReportDate', minWidth: 120, title: '日期' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    {
      field: 'TemplateId',
      formatter: ({ cellValue }) => getLandingName(cellValue),
      minWidth: 140,
      title: '落地页',
    },
    { field: 'CostMoney', minWidth: 100, title: '投放金额' },
    { field: 'ExposureNum', minWidth: 100, title: '曝光' },
    { field: 'ClickNum', minWidth: 100, title: '点击' },
    { field: 'Uv', minWidth: 80, title: 'UV' },
    { field: 'Ip', minWidth: 80, title: 'IP' },
    { field: 'DownNum', minWidth: 100, title: '下载' },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 140,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchHandRecordListApi(getQueryParams(page));
        return {
          items: result.Items || [],
          total: Number(result.Pagination?.MaxCount || 0),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

onMounted(async () => {
  if (!canViewTable.value) {
    return;
  }
  const landingResult = await fetchLandingPageListApi();
  landingOptions.value = landingResult.Items || [];
  gridApi.reload();
});
</script>

<template>
  <div v-if="canViewTable">
    <PromoteDataSearch ref="searchRef" show-landing @search="gridApi.reload()">
      <Button v-if="canAdd" type="primary" @click="openForm('add')">
        新增数据
      </Button>
    </PromoteDataSearch>
    <Grid>
      <template #actions="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openForm('edit', row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="formOpen"
      :confirm-loading="formLoading"
      :title="formMode === 'add' ? '新增数据填写' : '编辑数据填写'"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <Form.Item label="渠道号" required>
          <Select
            v-model:value="formChannelId"
            :options="channelOptions"
            placeholder="请选择"
          />
        </Form.Item>
        <Form.Item label="日期" required>
          <DatePicker v-model:value="formReportDate" class="w-full" />
        </Form.Item>
        <Form.Item label="落地页" required>
          <Select
            v-model:value="formTemplateId"
            :options="
              landingOptions.map((item) => ({
                label: item.Name,
                value: item.Id,
              }))
            "
            placeholder="请选择"
          />
        </Form.Item>
        <Form.Item label="投放金额">
          <Input v-model:value="formCostMoney" />
        </Form.Item>
        <Form.Item label="曝光">
          <Input v-model:value="formExposureNum" />
        </Form.Item>
        <Form.Item label="点击">
          <Input v-model:value="formClickNum" />
        </Form.Item>
        <Form.Item label="UV">
          <Input v-model:value="formUv" />
        </Form.Item>
        <Form.Item label="IP">
          <Input v-model:value="formIp" />
        </Form.Item>
        <Form.Item label="下载">
          <Input v-model:value="formDownNum" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  <Result v-else status="403" sub-title="无数据填写查看权限" title="403" />
</template>
