<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  AdminDialogMode,
  AdminFormModel,
  AdminListItem,
  CloudRoleOption,
} from '#/types/system-manage';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Dropdown, Menu, message, Modal, Result, Tag } from 'ant-design-vue';

import { getProjectConfigApi } from '#/api';
import {
  createAdminApi,
  deleteAdminApi,
  fetchAdminDetailApi,
  fetchAdminListApi,
  updateAdminApi,
} from '#/api/systemManage/admin';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ListSearchBar from '#/components/global/list-search-bar.vue';
import type { ListSearchParams } from '#/components/global/list-search-bar.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { ADMIN_MANAGE_SECURITY_PAGE_ID } from '#/components/security/security-utils';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatReportDateTime } from '#/views/dataClose/shared/report-utils';
import {
  parseAdminDetail,
  serializeAdminPayload,
} from '#/views/systemManage/adminManage/utils/admin-form';

import AdminFormModal from './components/admin-form-modal.vue';

defineOptions({ name: 'SystemAdminManage' });

const { adminInfo, checkPermission } = useCloudPermission();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const adminFormModalRef = ref<InstanceType<typeof AdminFormModal>>();
const searchLoading = ref(false);

const pendingMode = ref<AdminDialogMode>('create');
const pendingForm = ref<AdminFormModel | null>(null);
const pendingDeleteId = ref<number>();

const canViewList = computed(() => checkPermission(10_018) || checkPermission(10_019));
const canViewTable = computed(() => checkPermission(10_018));
const canAdd = computed(() => checkPermission(10_019));
const canEdit = computed(() => checkPermission(10_020));
const canDelete = computed(() => checkPermission(10_021));
const canSwitchStatus = computed(() => checkPermission(10_022));

const roleOptions = computed<CloudRoleOption[]>(() => {
  const list = adminInfo.value?.CRole;
  return Array.isArray(list) ? list : [];
});

/** 对齐旧站 SearchTypeTwo：全部 / 账户账号 → Keyword */
const searchOptions = [
  { label: '全部', value: 'All' },
  { label: '账户账号', value: 'Username' },
];

const listQuery = reactive({
  BeginTime: '' as number | string,
  EndTime: '' as number | string,
  Keyword: '',
  Sort: '',
  Status: '' as number | string,
});

function formatRoleNames(role?: string) {
  if (!role) {
    return '-';
  }
  const names: string[] = [];
  for (const id of role.split(',')) {
    const trimmed = id.trim();
    if (!trimmed) {
      continue;
    }
    const matched = roleOptions.value.find((item) => String(item.Id) === trimmed);
    if (matched?.Name) {
      names.push(matched.Name);
    }
  }
  return names.length > 0 ? names.join('，') : role;
}

function statusText(status?: number) {
  return status === 1 ? '启用' : '停用';
}

const gridOptions: VxeTableGridOptions<AdminListItem> = {
  columns: [
    {
      field: 'Status',
      filters: [
        { label: '启用', value: 1 },
        { label: '停用', value: 2 },
      ],
      filterMultiple: true,
      slots: { default: 'status' },
      title: '状态',
      width: 100,
    },
    {
      field: 'LoginType',
      slots: { default: 'loginType' },
      title: '谷歌验证',
      width: 100,
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatReportDateTime(cellValue),
      sortable: true,
      title: '创建时间',
      width: 170,
    },
    {
      field: 'Role',
      formatter: ({ cellValue }) => formatRoleNames(cellValue),
      minWidth: 120,
      title: '角色',
    },
    { field: 'Username', minWidth: 120, title: '登录账号' },
    { field: 'Name', minWidth: 100, title: '昵称' },
    {
      field: 'Note',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '备注',
    },
    { field: 'CreateUsername', minWidth: 100, title: '创建人' },
    { field: 'HandlerUsername', minWidth: 100, title: '操作人' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 100,
    },
  ],
  filterConfig: {
    remote: true,
  },
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page, sort, filters }) => {
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = sortOrder === 'asc' ? String(sortField) : `-${String(sortField)}`;
        }
        listQuery.Sort = sortParam;

        // 对齐旧站表头 Status 列 filters → Status CSV
        const statusFilter = (filters || []).find((item) => item.field === 'Status');
        const statusValues = (statusFilter?.values || []) as Array<number | string>;
        listQuery.Status = statusValues.length > 0 ? statusValues.join(',') : '';

        searchLoading.value = true;
        try {
          const result = await fetchAdminListApi({
            BeginTime: listQuery.BeginTime || '',
            EndTime: listQuery.EndTime || '',
            Keyword: listQuery.Keyword || '',
            Page: page.currentPage,
            PageSize: page.pageSize,
            Sort: listQuery.Sort,
            Status: listQuery.Status,
          });
          return {
            items: result?.Items || [],
            total: result?.Pagination?.MaxCount || 0,
          };
        } catch {
          message.error('查询失败');
          return { items: [], total: 0 };
        } finally {
          searchLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'Id',
  },
  sortConfig: {
    remote: true,
  },
  toolbarConfig: {
    refresh: true,
    search: false,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});

function reloadList() {
  void gridApi.reload();
}

function handleSearch(params: ListSearchParams) {
  // 旧站 All / Username 均写入 Keyword
  listQuery.Keyword = params.Keyword || '';
  listQuery.BeginTime = params.BeginTime || '';
  listQuery.EndTime = params.EndTime || '';
  void gridApi.reload();
}

function handleResetSearch() {
  listQuery.Keyword = '';
  listQuery.BeginTime = '';
  listQuery.EndTime = '';
  listQuery.Sort = '';
  listQuery.Status = '';
  // 同步清空表头 Status 筛选，避免重置后仍按旧 filter 请求
  try {
    gridApi.grid?.clearFilter?.();
  } catch {
    /* ignore */
  }
}

function requestSecureConfirm() {
  passPopupRef.value?.validate(ADMIN_MANAGE_SECURITY_PAGE_ID);
}

function handleCreate() {
  adminFormModalRef.value?.open('create');
}

function handleEdit(row: AdminListItem) {
  adminFormModalRef.value?.open('update', row.Id);
}

function handleDelete(row: AdminListItem) {
  Modal.confirm({
    cancelText: '取消',
    content: `确认删除账号「${row.Username || row.Id}」吗？`,
    okText: '确认',
    okType: 'danger',
    title: '删除确认',
    onOk: () => {
      pendingMode.value = 'delete';
      pendingDeleteId.value = row.Id;
      requestSecureConfirm();
    },
  });
}

async function handleSwitchStatus(row: AdminListItem, status: number) {
  const actionText = status === 1 ? '启用' : '停用';
  Modal.confirm({
    cancelText: '取消',
    content: `确认${actionText}账号「${row.Username || row.Id}」吗？`,
    okText: '确认',
    title: `${actionText}确认`,
    onOk: async () => {
      try {
        const detail = await fetchAdminDetailApi(row.Id);
        pendingForm.value = parseAdminDetail(detail as unknown as AdminFormModel);
        pendingForm.value.Status = status;
        pendingMode.value = status === 1 ? 'startUse' : 'endUse';
        requestSecureConfirm();
      } catch {
        message.error(`获取账号详情失败，无法${actionText}`);
      }
    },
  });
}

function handleFormSubmit(payload: { form: AdminFormModel; mode: AdminDialogMode }) {
  pendingForm.value = payload.form;
  pendingMode.value = payload.mode;
  requestSecureConfirm();
}

async function submitWithValidCode(validCode?: string) {
  try {
    if (pendingMode.value === 'delete') {
      if (!pendingDeleteId.value) {
        return;
      }
      await deleteAdminApi(pendingDeleteId.value, validCode || '');
      message.success('删除成功');
    } else if (pendingForm.value) {
      const apiMode = pendingMode.value === 'create' ? 'create' : 'update';
      const payload = serializeAdminPayload(pendingForm.value, apiMode);
      if (validCode) {
        payload.ValidCode = validCode;
      }

      if (pendingMode.value === 'create') {
        await createAdminApi(payload);
        message.success('新建成功');
      } else {
        await updateAdminApi(payload);
        message.success(
          pendingMode.value === 'startUse'
            ? '启用成功'
            : pendingMode.value === 'endUse'
              ? '停用成功'
              : '编辑成功',
        );
      }
      adminFormModalRef.value?.close();
    }

    await getProjectConfigApi();
    reloadList();
  } catch {
    // 错误提示由 request 拦截器处理
  } finally {
    pendingForm.value = null;
    pendingDeleteId.value = undefined;
  }
}

async function handlePassConfirm(data: Record<string, unknown>) {
  await submitWithValidCode(String(data.ValidCode || ''));
}

onMounted(() => {
  if (canViewTable.value) {
    void gridApi.reload();
  }
});
</script>

<template>
  <Page v-if="canViewList" auto-content-height description="系统管理 · 员工账号" title="员工账号">
    <Card>
      <div v-if="canViewTable" class="bg-card rounded-md p-4">
        <ListSearchBar
          :loading="searchLoading"
          :options="searchOptions"
          :show-add="canAdd"
          add-text="新建账号"
          date-label="创建时间"
          keyword-placeholder="请输入"
          show-date-time
          @add="handleCreate"
          @reset="handleResetSearch"
          @search="handleSearch"
        />

        <Grid>
          <template #status="{ row }">
            <Tag :color="row.Status === 1 ? 'success' : 'error'">
              {{ statusText(row.Status) }}
            </Tag>
          </template>

          <template #loginType="{ row }">
            <Tag :color="row.LoginType === 3 ? 'success' : 'error'">
              {{ row.LoginType === 3 ? '已绑定' : '未绑定' }}
            </Tag>
          </template>

          <template #action="{ row }">
            <Dropdown :trigger="['click']">
              <a class="text-primary">操作</a>
              <template #overlay>
                <Menu>
                  <Menu.Item v-if="canEdit" @click="handleEdit(row)"> 编辑 </Menu.Item>
                  <Menu.Item
                    v-if="canSwitchStatus && row.Status === 1"
                    @click="handleSwitchStatus(row, 2)"
                  >
                    停用
                  </Menu.Item>
                  <Menu.Item
                    v-if="canSwitchStatus && row.Status === 2"
                    @click="handleSwitchStatus(row, 1)"
                  >
                    启用
                  </Menu.Item>
                  <Menu.Item v-if="canDelete" danger @click="handleDelete(row)"> 删除 </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </Grid>
      </div>

      <Result
        v-else
        status="403"
        sub-title="您有菜单权限但无列表查看权限（10018）"
        title="无权限"
      />

      <AdminFormModal ref="adminFormModalRef" @submit="handleFormSubmit" />
      <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />
    </Card>
  </Page>

  <Page v-else auto-content-height title="员工账号">
    <Result status="403" sub-title="需要权限 10018 或 10019 才能访问此页面" title="无权限" />
  </Page>
</template>
