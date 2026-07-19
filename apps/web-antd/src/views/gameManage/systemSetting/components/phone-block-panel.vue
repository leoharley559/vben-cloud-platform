<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Modal, Switch, Tag, message } from 'ant-design-vue';

import { fetchPhoneBlockListApi, updatePhoneBlockApi } from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'PhoneBlockPanel' });

interface PhoneBlockRow {
  CountryCode?: string;
  CountryName?: string;
  Id?: number | string;
  IsBlock?: boolean | number;
  Key?: string;
}

const { checkPermission } = useCloudPermission();
const canSwitch = () => checkPermission(12240);

const actionKey = ref<string>();

const gridOptions: VxeTableGridOptions<PhoneBlockRow> = {
  columns: [
    { field: 'CountryCode', minWidth: 100, title: '区号' },
    { field: 'CountryName', minWidth: 140, title: '国家/地区' },
    {
      field: 'IsBlock',
      slots: { default: 'isBlock' },
      title: '屏蔽',
      width: 120,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 50 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPhoneBlockListApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const items = (result.Items || []) as unknown as PhoneBlockRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function rowKey(row: PhoneBlockRow) {
  return String(row.Key || row.CountryCode || row.Id || '');
}

function isBlocked(row: PhoneBlockRow) {
  return row.IsBlock === true || Number(row.IsBlock) === 1;
}

function handleSwitch(row: PhoneBlockRow, checked: boolean) {
  const prev = isBlocked(row);
  const next = checked;
  Modal.confirm({
    content: `确认${next ? '屏蔽' : '解除屏蔽'}区号 ${row.CountryCode || ''}？`,
    onCancel: () => {
      row.IsBlock = prev ? 1 : 0;
    },
    onOk: async () => {
      actionKey.value = rowKey(row);
      try {
        await updatePhoneBlockApi({
          CountryCode: row.CountryCode,
          IsBlock: next,
          Key: row.Key || row.CountryCode,
        });
        message.success('操作成功');
        await gridApi.reload();
      } catch {
        row.IsBlock = prev ? 1 : 0;
      } finally {
        actionKey.value = undefined;
      }
    },
    title: '提示',
  });
}
</script>

<template>
  <div>
    <div class="mb-3 text-xs text-gray-400">
      区号屏蔽开关；号段规则/提示文案编辑待下一迭代。
    </div>
    <Grid>
      <template #isBlock="{ row }">
        <Switch
          v-if="canSwitch()"
          :checked="isBlocked(row)"
          :loading="actionKey === rowKey(row)"
          checked-children="屏蔽"
          un-checked-children="正常"
          @change="(checked) => handleSwitch(row, !!checked)"
        />
        <Tag v-else :color="isBlocked(row) ? 'error' : 'success'">
          {{ isBlocked(row) ? '已屏蔽' : '未屏蔽' }}
        </Tag>
      </template>
    </Grid>
  </div>
</template>
