<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Result,
  Space,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addDrawmoneyBlackApi,
  deleteDrawmoneyAccountApi,
  editDrawmoneyBlackApi,
  fetchDrawmoneyBlacklistApi,
} from '#/api/netcash/drawmoney-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'DrawmoneyBlacklistPanel' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(10_163));

const keyword = ref('');
const formOpen = ref(false);
const editing = ref(false);
const form = reactive({
  Account: '',
  CreateAccount: '',
  Desc: '',
  Id: '',
});

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue as string),
      minWidth: 160,
      title: '日期',
    },
    {
      field: 'BlackAccount',
      minWidth: 140,
      slots: { default: 'blackAccount' },
      title: '代理账号',
    },
    { field: 'Desc', minWidth: 180, title: '备注' },
    { field: 'CreateAccount', minWidth: 120, title: '创建人' },
    {
      field: 'actions',
      slots: { default: 'actions' },
      title: '操作',
      width: 150,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await fetchDrawmoneyBlacklistApi({
            Keyword: keyword.value,
            Page: page.currentPage,
            PageSize: page.pageSize,
          });
          return {
            items: result?.Items || [],
            total: Number(result?.Pagination?.MaxCount || 0),
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [BlackGrid, blackGridApi] = useVbenVxeGrid({ gridOptions });

function editBlack(row?: Record<string, unknown>) {
  editing.value = !!row;
  Object.assign(form, {
    Account: row?.BlackAccount || '',
    CreateAccount: row?.CreateAccount || '',
    Desc: row?.Desc || '',
    Id: row?.Id || '',
  });
  formOpen.value = true;
}

function resetAndReload() {
  keyword.value = '';
  blackGridApi.reload();
}

async function saveBlack() {
  if (!form.Account) {
    message.warning('代理账号必填');
    return;
  }
  try {
    const data = { Account: form.Account, Desc: form.Desc, Id: form.Id };
    await (editing.value ? editDrawmoneyBlackApi(data) : addDrawmoneyBlackApi(data));
    formOpen.value = false;
    message.success('保存成功');
    blackGridApi.reload();
  } catch {
    /* */
  }
}

function removeBlack(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除「${row.BlackAccount}」？`,
    onOk: async () => {
      try {
        await deleteDrawmoneyAccountApi(row.Id as string);
        message.success('删除成功');
        blackGridApi.reload();
      } catch {
        /* */
      }
    },
    title: '删除黑名单',
  });
}
</script>

<template>
  <Result
    v-if="!canView"
    status="403"
    sub-title="无提款黑名单查看权限"
    title="403"
  />
  <div v-else>
    <Space class="mb-3">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="keyword"
          style="width: 220px"
          allow-clear
          placeholder="请输入关键词"
        >
          <template #addonBefore>关键词</template>
        </Input>
      </div>
      <Button type="primary" @click="blackGridApi.reload()">查询</Button>
      <Button @click="resetAndReload">重置</Button>
      <Button v-if="checkPermission(10165)" type="primary" @click="editBlack()">
        新增黑名单
      </Button>
    </Space>

    <BlackGrid>
      <template #blackAccount="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.BlackAccount"
        />
      </template>
      <template #actions="{ row }">
        <Button
          v-if="checkPermission(10166)"
          type="link"
          @click="editBlack(row)"
        >
          编辑
        </Button>
        <Button
          v-if="checkPermission(10167)"
          danger
          type="link"
          @click="removeBlack(row)"
        >
          删除
        </Button>
      </template>
    </BlackGrid>

    <Modal
      v-model:open="formOpen"
      :title="editing ? '编辑黑名单' : '新增黑名单'"
      @ok="saveBlack"
    >
      <Form layout="vertical">
        <Form.Item label="代理账号" required>
          <Input v-model:value="form.Account" />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="form.Desc" :maxlength="50" />
        </Form.Item>
        <Form.Item v-if="editing" label="创建人">
          <Input v-model:value="form.CreateAccount" disabled />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
