<script lang="ts" setup>
import type { RoleFormModel } from '#/types/system-manage';
import type { RoleTreeNode } from '#/utils/role-permission-tree';

import { computed, nextTick, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  Modal,
  Spin,
  Tree,
  message,
} from 'ant-design-vue';

import {
  fetchRoleDetailApi,
  fetchRoleParamListApi,
  saveRoleParamApi,
} from '#/api/systemManage/new-role';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  buildRolePermissionTree,
  isSystemBuiltinRole,
  mergeRoleCheckedKeys,
  splitCheckedRoleKeys,
} from '#/utils/role-permission-tree';
import { isValidRemark } from '#/views/systemManage/adminManage/utils/admin-form';

defineOptions({ name: 'RoleFormModal' });

interface RoleParamItem {
  Id: number;
  Name: string;
  Type?: number;
}

const emit = defineEmits<{
  submit: [payload: { form: RoleFormModel; mode: 'create' | 'update' }];
}>();

const visible = ref(false);
const loading = ref(false);
const mode = ref<'create' | 'update'>('create');
const readonly = ref(false);
/** 对齐旧站：回显勾选时先 check-strictly，避免级联改写已保存节点 */
const treeCheckStrictly = ref(false);

const formModel = ref<RoleFormModel>({
  Description: '',
  Name: '',
  ParamIds: [],
});

const checkedKeys = ref<Array<number | string>>([]);
const halfCheckedKeys = ref<Array<number | string>>([]);

const paramDrawerOpen = ref(false);
const paramLoading = ref(false);
const paramSaving = ref(false);
const paramList = ref<RoleParamItem[]>([]);
const paramTemp = ref<{
  Id: number;
  Params: number[];
  RoleId?: number;
}>({
  Id: 0,
  Params: [],
});

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

const type3Params = computed(() =>
  paramList.value.filter((item) => Number(item.Type) === 3),
);

const paramIdsModel = computed({
  get: () => {
    const raw = formModel.value.ParamIds;
    if (Array.isArray(raw)) {
      return raw.map(Number);
    }
    if (!raw) {
      return [] as number[];
    }
    return String(raw)
      .split(',')
      .map(Number)
      .filter((item) => !Number.isNaN(item));
  },
  set: (value: number[]) => {
    formModel.value.ParamIds = value;
  },
});

function resetForm() {
  formModel.value = {
    Description: '',
    Name: '',
    ParamIds: [],
  };
  checkedKeys.value = [];
  halfCheckedKeys.value = [];
  readonly.value = false;
  treeCheckStrictly.value = false;
  closeParamDrawer();
}

function closeParamDrawer() {
  paramDrawerOpen.value = false;
  paramList.value = [];
  paramTemp.value = { Id: 0, Params: [] };
}

function parseIdList(value?: string | number[] | Array<number | string>) {
  if (Array.isArray(value)) {
    return value.map(Number).filter((item) => !Number.isNaN(item));
  }
  if (!value) {
    return [] as number[];
  }
  return String(value)
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item) && item !== 0);
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
      ParamIds: parseIdList(detail.ParamIds),
    };
    readonly.value = isSystemBuiltinRole(detail);
    // 对齐旧站 handleUpdate：先严格勾选再恢复级联
    treeCheckStrictly.value = true;
    checkedKeys.value = mergeRoleCheckedKeys(detail.MenuIds, detail.SubMenuIds);
    halfCheckedKeys.value = [];
    await nextTick();
    treeCheckStrictly.value = false;
  } catch {
    message.error('加载角色详情失败');
    close();
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
  if (readonly.value) {
    return;
  }
  if (Array.isArray(checked)) {
    checkedKeys.value = checked;
    return;
  }
  checkedKeys.value = checked.checked;
  halfCheckedKeys.value = checked.halfChecked;
}

async function handleOpenDesParams(node: RoleTreeNode, event?: Event) {
  event?.stopPropagation?.();
  event?.preventDefault?.();

  if (node.PubliceId !== 'SubMenu' || Number(node.HaveDesData) !== 1) {
    return;
  }
  if (!formModel.value.Id && mode.value === 'update') {
    message.warning('请先保存角色后再配置脱敏参数');
    return;
  }

  paramLoading.value = true;
  paramDrawerOpen.value = true;
  const roleId = formModel.value.Id || 0;
  try {
    const data = (await fetchRoleParamListApi({
      RoleId: roleId,
      SubMenuId: node.Id,
    })) as {
      ParamsList?: RoleParamItem[] | null;
      RoleParams?: { Id?: number; Params?: string } | null;
    };

    paramList.value = data?.ParamsList ?? [];
    paramTemp.value = {
      Id: data?.RoleParams?.Id || 0,
      Params: parseIdList(data?.RoleParams?.Params),
      RoleId: roleId,
    };
  } catch {
    paramList.value = [];
    paramTemp.value = { Id: 0, Params: [], RoleId: roleId };
  } finally {
    paramLoading.value = false;
  }
}

async function handleSaveParams() {
  if (readonly.value) {
    return;
  }
  if (!formModel.value.Id) {
    message.warning('新建角色请先保存角色，再配置脱敏参数');
    return;
  }

  paramSaving.value = true;
  try {
    await saveRoleParamApi({
      Id: paramTemp.value.Id || 0,
      ParamIds: paramIdsModel.value,
      Params: paramTemp.value.Params,
      RoleId: formModel.value.Id,
    });
    message.success('保存成功');
    closeParamDrawer();
  } catch {
    // 错误提示由 request 拦截器处理
  } finally {
    paramSaving.value = false;
  }
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
        ParamIds: paramIdsModel.value,
        SubMenuIds: subMenuIds,
      },
      mode: mode.value,
    });
  } catch (error) {
    Modal.error({
      content: error instanceof Error ? error.message : '表单校验失败',
      title: '提示',
    });
    return Promise.reject(error);
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
              :checked-keys="checkedKeys"
              :check-strictly="treeCheckStrictly"
              :half-checked-keys="halfCheckedKeys"
              checkable
              :field-names="{
                title: 'title',
                key: 'key',
                children: 'children',
              }"
              :tree-data="treeData"
              @check="handleTreeCheck"
            >
              <template #title="node">
                <span class="inline-flex items-center gap-1">
                  <span>{{ node.title }}</span>
                  <Button
                    v-if="Number(node.HaveDesData) === 1"
                    class="!px-1"
                    size="small"
                    type="link"
                    @click.stop="handleOpenDesParams(node as RoleTreeNode, $event)"
                  >
                    脱敏
                  </Button>
                </span>
              </template>
            </Tree>
          </div>
        </Form.Item>
      </Form>
    </Spin>
  </Modal>

  <Drawer
    :open="paramDrawerOpen"
    destroy-on-close
    placement="right"
    title="脱敏字段设置"
    width="520"
    @close="closeParamDrawer"
  >
    <Spin :spinning="paramLoading">
      <template v-if="paramList.length > 0">
        <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div class="mb-2 font-medium text-red-500">下发脱敏字段</div>
            <Checkbox.Group
              v-model:value="paramIdsModel"
              :disabled="readonly"
              class="flex flex-col gap-2"
            >
              <Checkbox
                v-for="item in type3Params"
                :key="item.Id"
                :value="item.Id"
              >
                {{ item.Name }}
              </Checkbox>
            </Checkbox.Group>
            <div
              v-if="type3Params.length === 0"
              class="text-sm text-gray-400"
            >
              暂无 Type=3 参数
            </div>
          </div>

          <div v-if="mode === 'update'">
            <div class="mb-2 font-medium text-red-500">已配置脱敏回显</div>
            <Checkbox.Group
              v-model:value="paramTemp.Params"
              :disabled="readonly"
              class="flex flex-col gap-2"
            >
              <Checkbox
                v-for="item in paramList"
                :key="`all-${item.Id}`"
                :value="item.Id"
              >
                {{ item.Name }}
              </Checkbox>
            </Checkbox.Group>
          </div>
        </div>

        <div class="mt-6 flex justify-center gap-2">
          <Button
            v-if="mode === 'update' && !readonly"
            :loading="paramSaving"
            type="primary"
            @click="handleSaveParams"
          >
            保存
          </Button>
          <Button @click="closeParamDrawer">关闭</Button>
        </div>
      </template>
      <div v-else class="py-10 text-center text-gray-500">暂无参数数据</div>
    </Spin>
  </Drawer>
</template>
