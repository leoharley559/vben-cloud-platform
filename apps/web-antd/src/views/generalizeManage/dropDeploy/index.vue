<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { LandingPageItem, LandingResourceItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Image,
  Input,
  message,
  Modal,
  Popconfirm,
  Result,
  Space,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteLandingDeployApi,
  fetchLandingDeployListApi,
  fetchLandingResourceListApi,
} from '#/api/promotion/landing-deploy';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatDateTime, formatLandingDownloadMode } from '#/utils/promotion';

import LandingFormModal from './components/landing-form-modal.vue';

defineOptions({ name: 'DropDeploy' });

const { checkPermission } = useCloudPermission();

const canViewList = computed(() => checkPermission(244));
const canCreate = computed(() => checkPermission(241));
const canEdit = computed(() => checkPermission(242));
const canDelete = computed(() => checkPermission(243));
const canViewPage = computed(() => canViewList.value || canCreate.value);

const filterName = ref('');
const resourceList = ref<LandingResourceItem[]>([]);
const formOpen = ref(false);
const editId = ref<number | string>();
const previewUrl = ref('');

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    Name: filterName.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<LandingPageItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 160,
      title: '创建时间',
    },
    { field: 'Id', minWidth: 100, title: '落地页编号' },
    { field: 'Name', minWidth: 140, title: '模板名称' },
    {
      field: 'Background',
      minWidth: 100,
      slots: { default: 'preview' },
      title: '页面风格',
    },
    {
      field: 'DownloadMode',
      formatter: ({ row }) =>
        formatLandingDownloadMode(row.DownloadMode, row.DownloadTime),
      minWidth: 120,
      title: '下载方式',
    },
    { field: 'Description', minWidth: 180, title: '备注' },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchLandingDeployListApi(getQueryParams(page));
        resourceList.value = result.MoreItems?.Resources || [];
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadResources() {
  const result = await fetchLandingResourceListApi({
    Page: 1,
    PageSize: 50,
    PictureStyle: '',
    PictureType: 1,
  });
  resourceList.value = result.Items || [];
}

function handleCreate() {
  editId.value = undefined;
  formOpen.value = true;
}

function handleEdit(row: LandingPageItem) {
  editId.value = row.Id;
  formOpen.value = true;
}

async function handleDelete(id?: number | string) {
  if (!id) {
    return;
  }
  await deleteLandingDeployApi(id);
  message.success('删除成功');
  gridApi.reload();
}

onMounted(async () => {
  await loadResources();
  if (canViewList.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 落地页配置"
    title="落地页配置"
  >
    <Card>
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterName"
              allow-clear
              placeholder="请输入模板名称"
            >
              <template #addonBefore>模板名称</template>
            </Input>
          </div>
          <div class="query-filter-actions query-filter-actions-single">
            <Button type="primary" @click="gridApi.reload()">查询</Button>
            <Button v-if="canCreate" type="primary" @click="handleCreate">
              新增落地
            </Button>
          </div>
        </div>
      </div>

      <Grid v-if="canViewList">
        <template #preview="{ row }">
          <Button
            size="small"
            type="link"
            @click="previewUrl = row.Background || ''"
          >
            预览
          </Button>
        </template>
        <template #action="{ row }">
          <Space>
            <Button
              v-if="canEdit"
              size="small"
              type="link"
              @click="handleEdit(row)"
            >
              编辑
            </Button>
            <Popconfirm
              v-if="canDelete"
              title="确认删除该落地页？"
              @confirm="handleDelete(row.Id)"
            >
              <Button danger size="small" type="link">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </Grid>
    </Card>

    <LandingFormModal
      v-model:open="formOpen"
      :edit-id="editId"
      :resource-list="resourceList"
      @success="gridApi.reload()"
    />

    <Modal
      :footer="null"
      :open="Boolean(previewUrl)"
      title="页面风格预览"
      @cancel="previewUrl = ''"
    >
      <Image v-if="previewUrl" :src="previewUrl" />
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无落地页配置查看权限" title="403" />
</template>
