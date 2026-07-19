<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  AdminDialogMode,
  AdminFormModel,
  AdminListItem,
  CloudRoleOption,
} from '#/types/system-manage';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Dropdown,
  Menu,
  message,
  Modal,
  Result,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createAdminApi,
  deleteAdminApi,
  fetchAdminDetailApi,
  fetchAdminListApi,
  updateAdminApi,
} from '#/api/systemManage/admin';
import { getProjectConfigApi } from '#/api';
import PassPopup from '#/components/security/pass-popup.vue';
import { ADMIN_MANAGE_SECURITY_PAGE_ID } from '#/components/security/security-utils';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  parseAdminDetail,
  serializeAdminPayload,
} from '#/views/systemManage/adminManage/utils/admin-form';

import AdminFormModal from './components/admin-form-modal.vue';

defineOptions({ name: 'SystemAdminManage' });

const { adminInfo, checkPermission } = useCloudPermission();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const adminFormModalRef = ref<InstanceType<typeof AdminFormModal>>();

const pendingMode = ref<AdminDialogMode>('create');
const pendingForm = ref<AdminFormModel | null>(null);
const pendingDeleteId = ref<number>();

const canViewList = computed(
  () => checkPermission(10018) || checkPermission(10019),
);
const canViewTable = computed(() => checkPermission(10018));
const canAdd = computed(() => checkPermission(10019));
const canEdit = computed(() => checkPermission(10020));
const canDelete = computed(() => checkPermission(10021));
const canSwitchStatus = computed(() => checkPermission(10022));

const roleOptions = computed<CloudRoleOption[]>(() => {
  const list = adminInfo.value?.CRole;
  return Array.isArray(list) ? list : [];
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
    const matched = roleOptions.value.find(
      (item) => String(item.Id) === trimmed,
    );
    if (matched?.Name) {
      names.push(matched.Name);
    }
  }
  return names.length > 0 ? names.join('，') : role;
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value;
}

function statusText(status?: number) {
  return status === 1 ? '启用' : '停用';
}

const formOptions: VbenFormProps = {
  collapsed: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '账号 / 关键词',
      },
      fieldName: 'Keyword',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '全部', value: '' },
          { label: '启用', value: '1' },
          { label: '停用', value: '2' },
        ],
        placeholder: '状态',
      },
      fieldName: 'Status',
      label: '状态',
    },
  ],
  showCollapseButton: false,
  submitOnChange: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const gridOptions: VxeTableGridOptions<AdminListItem> = {
  columns: [
    {
      field: 'Status',
      slots: { default: 'status' },
      title: '状态',
      width: 90,
    },
    {
      field: 'LoginType',
      slots: { default: 'loginType' },
      title: '谷歌验证',
      width: 100,
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDate(cellValue),
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
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }, formValues) => {
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        const result = await fetchAdminListApi({
          BeginTime: '',
          EndTime: '',
          Keyword: formValues?.Keyword || '',
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
          Status: formValues?.Status || '',
        });

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  rowConfig: {
    keyField: 'Id',
  },
  toolbarConfig: {
    refresh: true,
    search: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

function reloadList() {
  gridApi.reload();
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
      const detail = await fetchAdminDetailApi(row.Id);
      pendingForm.value = parseAdminDetail(detail as unknown as AdminFormModel);
      pendingForm.value.Status = status;
      pendingMode.value = status === 1 ? 'startUse' : 'endUse';
      requestSecureConfirm();
    },
  });
}

function handleFormSubmit(payload: {
  form: AdminFormModel;
  mode: AdminDialogMode;
}) {
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
</script>

<template>
  <Page
    v-if="canViewList"
    auto-content-height
    description="系统管理 · 员工账号"
    title="员工账号"
  >
    <Grid v-if="canViewTable">
      <template #toolbar-actions>
        <Button v-if="canAdd" type="primary" @click="handleCreate">
          新建账号
        </Button>
      </template>

      <template #status="{ row }">
        <Tag :color="row.Status === 1 ? 'success' : 'error'">
          {{ statusText(row.Status) }}
        </Tag>
      </template>

      <template #loginType="{ row }">
        <Tag :color="row.LoginType === 3 ? 'success' : 'default'">
          {{ row.LoginType === 3 ? '已绑定' : '未绑定' }}
        </Tag>
      </template>

      <template #action="{ row }">
        <Dropdown :trigger="['click']">
          <a class="text-primary">操作</a>
          <template #overlay>
            <Menu>
              <Menu.Item v-if="canEdit" @click="handleEdit(row)">
                编辑
              </Menu.Item>
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
              <Menu.Item v-if="canDelete" danger @click="handleDelete(row)">
                删除
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </template>
    </Grid>

    <Result
      v-else
      status="403"
      sub-title="您有菜单权限但无列表查看权限（10018）"
      title="无权限"
    />

    <AdminFormModal ref="adminFormModalRef" @submit="handleFormSubmit" />
    <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />
  </Page>

  <Page v-else auto-content-height title="员工账号">
    <Result
      status="403"
      sub-title="需要权限 10018 或 10019 才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
