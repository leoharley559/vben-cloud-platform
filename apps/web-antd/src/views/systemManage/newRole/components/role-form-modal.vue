<script lang="ts" setup>
import type { RoleFormModel } from '#/types/system-manage';

import { computed, ref, watch } from 'vue';

import { Form, Input, Modal, Spin, Tree } from 'ant-design-vue';

import { fetchRoleDetailApi } from '#/api/systemManage/new-role';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  buildRolePermissionTree,
  isSystemBuiltinRole,
  mergeRoleCheckedKeys,
  splitCheckedRoleKeys,
} from '#/utils/role-permission-tree';
import { isValidRemark } from '#/views/systemManage/adminManage/utils/admin-form';

defineOptions({ name: 'RoleFormModal' });

const emit = defineEmits<{
  submit: [payload: { form: RoleFormModel; mode: 'create' | 'update' }];
}>();

const visible = ref(false);
const loading = ref(false);
const mode = ref<'create' | 'update'>('create');
const readonly = ref(false);

const formModel = ref<RoleFormModel>({
  Description: '',
  Name: '',
});

const checkedKeys = ref<Array<number | string>>([]);
const halfCheckedKeys = ref<Array<number | string>>([]);

const { adminInfo } = useCloudPermission();

const treeData = computed(() => {
  const nav = adminInfo.value?.Nav || [];
  const subMenus = adminInfo.value?.SubMenus || [];
  return buildRolePermissionTree(nav, subMenus);
});

const modalTitle = computed(() => {
  if (readonly.value) {
    return '查看角色';
  }
  return mode.value === 'create' ? '新建角色' : '编辑角色';
});

function resetForm() {
  formModel.value = {
    Description: '',
    Name: '',
  };
  checkedKeys.value = [];
  halfCheckedKeys.value = [];
  readonly.value = false;
}

async function open(nextMode: 'create' | 'update', id?: number) {
  mode.value = nextMode;
  visible.value = true;
  resetForm();

  if (nextMode === 'create' || !id) {
    return;
  }

  loading.value = true;
  try {
    const detail = await fetchRoleDetailApi(id);
    formModel.value = {
      AdminId: detail.AdminId,
      CreateAdminId: detail.CreateAdminId,
      Description: detail.Description || '',
      Id: detail.Id,
      Name: detail.Name || '',
      ParamIds: detail.ParamIds,
    };
    readonly.value = isSystemBuiltinRole(detail);
    checkedKeys.value = mergeRoleCheckedKeys(detail.MenuIds, detail.SubMenuIds);
    halfCheckedKeys.value = [];
  } finally {
    loading.value = false;
  }
}

function close() {
  visible.value = false;
  resetForm();
}

function handleTreeCheck(
  checked:
    | Array<number | string>
    | { checked: Array<number | string>; halfChecked: Array<number | string> },
) {
  if (Array.isArray(checked)) {
    checkedKeys.value = checked;
    return;
  }
  checkedKeys.value = checked.checked;
  halfCheckedKeys.value = checked.halfChecked;
}

function validateForm() {
  if (!formModel.value.Name?.trim()) {
    throw new Error('请输入角色名称');
  }
  if (!isValidRemark(formModel.value.Description)) {
    throw new Error('备注长度不能超过400字符');
  }
}

function handleConfirm() {
  if (readonly.value) {
    close();
    return;
  }

  try {
    validateForm();
    const mergedKeys = [...checkedKeys.value, ...halfCheckedKeys.value];
    const { menuIds, subMenuIds } = splitCheckedRoleKeys(mergedKeys);
    emit('submit', {
      form: {
        ...formModel.value,
        MenuIds: menuIds,
        SubMenuIds: subMenuIds,
      },
      mode: mode.value,
    });
  } catch (error) {
    Modal.error({
      content: error instanceof Error ? error.message : '表单校验失败',
      title: '提示',
    });
  }
}

watch(visible, (openState) => {
  if (!openState) {
    resetForm();
  }
});

defineExpose({
  close,
  open,
});
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :ok-text="readonly ? '关闭' : '确认'"
    :open="visible"
    :title="modalTitle"
    cancel-text="取消"
    destroy-on-close
    width="760px"
    @cancel="close"
    @ok="handleConfirm"
  >
    <Spin :spinning="loading">
      <Form layout="vertical">
        <Form.Item label="角色名称" required>
          <Input
            v-model:value="formModel.Name"
            :disabled="readonly"
            :maxlength="50"
            placeholder="请输入角色名称"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input
            v-model:value="formModel.Description"
            :disabled="readonly"
            :maxlength="400"
            placeholder="请输入备注"
          />
        </Form.Item>
        <Form.Item label="权限节点">
          <div class="max-h-[420px] overflow-y-auto rounded border p-3">
            <Tree
              v-model:checked-keys="checkedKeys"
              v-model:half-checked-keys="halfCheckedKeys"
              checkable
              :disabled="readonly"
              :field-names="{
                title: 'title',
                key: 'key',
                children: 'children',
              }"
              :tree-data="treeData"
              @check="handleTreeCheck"
            />
          </div>
        </Form.Item>
      </Form>
    </Spin>
  </Modal>
</template>
