<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Button, Form, Input, Modal, message } from 'ant-design-vue';

import {
  fetchChannelDetailApi,
  fetchSonPromoterChannelListApi,
  updateChannelInviteCodeApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';

defineOptions({ name: 'ChannelManagePanel' });

interface ChannelRow {
  AdminId?: number | string;
  ChannelId?: number | string;
  ChannelName?: string;
  Id?: number | string;
  InvitationCode?: string;
  PromoterAdminId?: number | string;
  PromoterAdminName?: string;
  PromoterAdminUserName?: string;
}

const { checkPermission } = useCloudPermission();
const canEdit = computed(
  () => checkPermission(12302) || checkPermission(12303),
);

const filterUsername = ref('');
const editVisible = ref(false);
const saving = ref(false);
const form = reactive({
  ChannelName: '',
  Id: '' as number | string,
  InvitationCode: '',
  detail: null as null | Record<string, unknown>,
});

const gridOptions: VxeTableGridOptions<ChannelRow> = {
  columns: [
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    { field: 'ChannelName', minWidth: 140, title: '渠道名称' },
    { field: 'PromoterAdminUserName', minWidth: 120, slots: { default: 'promoterUsername' }, title: '代理账号' },
    { field: 'PromoterAdminName', minWidth: 120, title: '代理名称' },
    { field: 'InvitationCode', minWidth: 120, title: '邀请码' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 110,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchSonPromoterChannelListApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
          Username: filterUsername.value,
        });
        const items = (result.Items || []) as unknown as ChannelRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function openEdit(row: ChannelRow) {
  const id = row.Id || row.ChannelId;
  if (!id) {
    message.error('缺少渠道 ID');
    return;
  }
  saving.value = true;
  try {
    const detail = await fetchChannelDetailApi(id);
    form.Id = id;
    form.ChannelName = String(detail.ChannelName || row.ChannelName || id);
    form.InvitationCode = String(
      detail.InvitationCode ?? row.InvitationCode ?? '',
    );
    form.detail = detail;
    editVisible.value = true;
  } finally {
    saving.value = false;
  }
}

async function submitEdit() {
  if (!form.InvitationCode.trim()) {
    message.error('请输入邀请码');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...(form.detail || {}),
      InvitationCode: form.InvitationCode.trim(),
      PromoterAdminId:
        form.detail?.AdminId ||
        form.detail?.PromoterAdminId ||
        form.detail?.AdminID,
      ReqPathType: 2,
    };
    await updateChannelInviteCodeApi(payload);
    message.success('邀请码已更新');
    editVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleSearch() {
  gridApi.reload();
}
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterUsername"
          allow-clear
          style="width: 240px"
          @press-enter="handleSearch"
          placeholder="请输入代理账号"
        >
          <template #addonBefore>代理账号</template>
        </Input>
      </div>
      <Button type="primary" @click="handleSearch">查询</Button>
    </div>
    <div class="mb-3 text-xs text-gray-400">
      已支持邀请码编辑；打包/短链/登录注册配置待下一迭代。
    </div>
    <Grid>
      <template #promoterUsername="{ row }">
        <AgencyAccountLink
          :admin-id="
            resolveAgencyAdminId(row, 'PromoterAdminId', 'AdminId')
          "
          :username="row.PromoterAdminUserName"
        />
      </template>
      <template #action="{ row }">
        <Button v-if="canEdit" size="small" @click="openEdit(row)">
          邀请码
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑邀请码"
      @ok="submitEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="渠道">
          <Input :value="form.ChannelName" disabled />
        </Form.Item>
        <Form.Item label="邀请码" required>
          <Input
            v-model:value="form.InvitationCode"
            placeholder="请输入邀请码"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
