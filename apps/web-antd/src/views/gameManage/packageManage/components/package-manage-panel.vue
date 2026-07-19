<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Button, Form, Input, Modal, message } from 'ant-design-vue';

import {
  fetchPackageListApi,
  updatePackageDescriptionApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'PackageManagePanel' });

interface PackageRow {
  ChannelCount?: number;
  Description?: string;
  Id: number | string;
  PackageId?: number | string;
  PackageName?: string;
  Status?: number;
}

const { checkPermission } = useCloudPermission();
const canEdit = computed(
  () => checkPermission(12355) || checkPermission(13189),
);

const editVisible = ref(false);
const saving = ref(false);
const form = reactive({
  Description: '',
  Id: '' as number | string,
  PackageName: '',
});

const gridOptions: VxeTableGridOptions<PackageRow> = {
  columns: [
    { field: 'PackageName', minWidth: 140, title: '包名' },
    { field: 'PackageId', minWidth: 90, title: '包ID' },
    { field: 'ChannelCount', minWidth: 90, title: '渠道数' },
    {
      field: 'Description',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '备注',
    },
    {
      field: 'Status',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '启用' : '停用'),
      minWidth: 90,
      title: '状态',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 100,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPackageListApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const items = (result.Items || []) as unknown as PackageRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function openEdit(row: PackageRow) {
  form.Id = row.Id;
  form.PackageName = String(row.PackageName || row.PackageId || '');
  form.Description = String(row.Description || '');
  editVisible.value = true;
}

async function submitEdit() {
  saving.value = true;
  try {
    await updatePackageDescriptionApi({
      Description: form.Description,
      Id: form.Id,
    });
    message.success('备注已保存');
    editVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <div class="mb-3 text-xs text-gray-400">
      已支持包体备注编辑；上传/签名/详情待下一迭代。
    </div>
    <Grid>
      <template #action="{ row }">
        <Button v-if="canEdit" size="small" @click="openEdit(row)">
          备注
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑包体备注"
      @ok="submitEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="包名">
          <Input :value="form.PackageName" disabled />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea
            v-model:value="form.Description"
            :rows="4"
            placeholder="请输入备注"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
