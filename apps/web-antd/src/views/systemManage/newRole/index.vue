<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RoleFormModel, RoleListItem } from '#/types/system-manage';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Dropdown,
  Menu,
  message,
  Modal,
  Result,
  Tag,
} from 'ant-design-vue';

import { getProjectConfigApi, getUserInfoApi } from '#/api';
import {
  createRoleApi,
  deleteRoleApi,
  fetchRoleListApi,
  updateRoleApi,
} from '#/api/systemManage/new-role';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ListSearchBar from '#/components/global/list-search-bar.vue';
import type { ListSearchParams } from '#/components/global/list-search-bar.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { isSystemBuiltinRole } from '#/utils/role-permission-tree';

import RoleFormModal from './components/role-form-modal.vue';

defineOptions({ name: 'SystemNewRole' });

const { checkPermission } = useCloudPermission();
const userStore = useUserStore();
const roleFormModalRef = ref<InstanceType<typeof RoleFormModal>>();
const searchLoading = ref(false);

const canViewList = computed(
  () => checkPermission(10_005) || checkPermission(10_006),
);
const canViewTable = computed(() => checkPermission(10_005));
const canAdd = computed(() => checkPermission(10_006));
const canEdit = computed(() => checkPermission(10_007));
const canViewBuiltin = computed(() => checkPermission(10_008));
const canDelete = computed(() => checkPermission(10_009));

/** 对齐旧站 SearchTypeTwo：全部 / 角色名称 → Keyword；无日期 */
const searchOptions = [
  { label: '全部', value: 'All' },
  { label: '角色名称', value: 'Name' },
];

const listQuery = reactive({
  Keyword: '',
});

const gridOptions: VxeTableGridOptions<RoleListItem> = {
  columns: [
    { field: 'Id', title: 'ID', width: 90 },
    { field: 'Name', minWidth: 180, title: '角色名称' },
    {
      field: 'Description',
      minWidth: 220,
      showOverflow: 'tooltip',
      title: '备注',
    },
    {
      field: 'type',
      slots: { default: 'type' },
      title: '类型',
      width: 110,
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
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        searchLoading.value = true;
        try {
          const result = await fetchRoleListApi({
            Keyword: listQuery.Keyword || '',
            Page: page.currentPage,
            PageSize: page.pageSize,
          });
          return {
            items: result?.Items || [],
            total: result?.Pagination?.MaxCount || 0,
          };
        } catch {
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
  // 旧站 All / Name 均写入 Keyword
  listQuery.Keyword = params.Keyword || '';
  void gridApi.reload();
}

function handleResetSearch() {
  listQuery.Keyword = '';
}

async function refreshSessionAfterRoleChange() {
  const [userInfo] = await Promise.all([
    getUserInfoApi(),
    getProjectConfigApi(),
  ]);
  userStore.setUserInfo(userInfo);
}

function canOpenEditor(row: RoleListItem) {
  if (isSystemBuiltinRole(row)) {
    return canViewBuiltin.value;
  }
  return canEdit.value;
}

function getEditorLabel(row: RoleListItem) {
  return isSystemBuiltinRole(row) ? '查看' : '编辑';
}

function handleCreate() {
  roleFormModalRef.value?.open('create');
}

function handleEdit(row: RoleListItem) {
  roleFormModalRef.value?.open('update', row.Id);
}

function handleDelete(row: RoleListItem) {
  if (isSystemBuiltinRole(row)) {
    message.warning('系统内置角色不可删除');
    return;
  }

  Modal.confirm({
    cancelText: '取消',
    content: `确认删除角色「${row.Name}」吗？`,
    okText: '确认',
    okType: 'danger',
    title: '删除确认',
    onOk: async () => {
      await deleteRoleApi(row.Id);
      message.success('删除成功');
      await refreshSessionAfterRoleChange();
      reloadList();
    },
  });
}

async function handleFormSubmit(payload: {
  form: RoleFormModel;
  mode: 'create' | 'update';
}) {
  const data = {
    ...payload.form,
    Description: payload.form.Description || '',
    Name: payload.form.Name.trim(),
  };

  try {
    if (payload.mode === 'create') {
      await createRoleApi(data);
      message.success('新建成功');
    } else {
      await updateRoleApi(data);
      message.success('编辑成功');
    }

    roleFormModalRef.value?.close();
    await refreshSessionAfterRoleChange();
    reloadList();
  } catch {
    // 错误由请求拦截器提示；保留弹窗便于修改后重试
  }
}

onMounted(() => {
  if (canViewTable.value) {
    void gridApi.reload();
  }
});
</script>

<template>
  <Page
    v-if="canViewList"
    auto-content-height
    description="系统管理 · 角色管理"
    title="角色管理"
  >
    <div v-if="canViewTable" class="bg-card rounded-md p-4">
      <ListSearchBar
        :loading="searchLoading"
        :options="searchOptions"
        :show-add="canAdd"
        :show-date-time="false"
        add-text="新建角色"
        keyword-placeholder="请输入"
        @add="handleCreate"
        @reset="handleResetSearch"
        @search="handleSearch"
      />

      <Grid>
        <template #type="{ row }">
          <Tag :color="isSystemBuiltinRole(row) ? 'blue' : 'default'">
            {{ isSystemBuiltinRole(row) ? '系统内置' : '自定义' }}
          </Tag>
        </template>

        <template #action="{ row }">
          <Dropdown :trigger="['click']">
            <a class="text-primary">操作</a>
            <template #overlay>
              <Menu>
                <Menu.Item v-if="canOpenEditor(row)" @click="handleEdit(row)">
                  {{ getEditorLabel(row) }}
                </Menu.Item>
                <Menu.Item
                  v-if="canDelete && !isSystemBuiltinRole(row)"
                  danger
                  @click="handleDelete(row)"
                >
                  删除
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </template>
      </Grid>
    </div>

    <Result
      v-else
      status="403"
      sub-title="您有菜单权限但无列表查看权限（10005）"
      title="无权限"
    />

    <RoleFormModal ref="roleFormModalRef" @submit="handleFormSubmit" />
  </Page>

  <Page v-else auto-content-height title="角色管理">
    <Result
      status="403"
      sub-title="需要权限 10005 或 10006 才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
