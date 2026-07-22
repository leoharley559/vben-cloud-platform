<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Result,
  Select,
  Switch,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createWhiteListApi,
  createWhiteListUserApi,
  deleteWhiteListApi,
  deleteWhiteListUserApi,
  fetchWhiteListApi,
  fetchWhiteListPickUsersApi,
  fetchWhiteListUsersApi,
  updateWhiteListApi,
  updateWhiteListRemarkApi,
  updateWhiteListUserApi,
  updateWhiteListUserRemarkApi,
} from '#/api/operationManage/white-list';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { createRequestHash } from '#/utils/crypto';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'WhiteListPanel' });

const props = defineProps<{
  /** 从使用者跳转 IP 列表时预填 WhiteUsername */
  initialWhiteUsername?: string;
  mode: 'ip' | 'user';
}>();

const emit = defineEmits<{
  changed: [];
  consumedUsername: [];
  jumpToIp: [name: string];
}>();

interface WhiteRow {
  AddUserName?: string;
  AdminName?: string;
  AgentIdName?: string;
  CreateTime?: number | string;
  ExpirationTime?: number | string;
  ExpiredTime?: number | string;
  Id: number | string;
  Ip?: string;
  Name?: string;
  Quantity?: number | string;
  Remark?: string;
  Status?: number;
  UserName?: string;
  WhiteIp?: string;
  WhiteUsername?: string;
}

const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();

/** 列表门禁对齐旧站 white.vue / users.vue */
const canViewList = computed(() =>
  props.mode === 'ip' ? checkPermission(10_216) : checkPermission(10_221),
);

const canCreateIp = computed(() => checkPermission(10_217));
const canDeleteIp = computed(() => checkPermission(10_219));
const canToggleIp = computed(() => checkPermission(10_220));
const canRemarkIp = computed(() => checkPermission(10_218));
const canCreateUser = computed(() => checkPermission(10_222));
const canDeleteUser = computed(() => checkPermission(10_224));
const canRemarkUser = computed(() => checkPermission(10_223));
const canToggleUser = computed(() => checkPermission(10_225));

const isIp = computed(() => props.mode === 'ip');

const filterWhiteIp = ref('');
const filterWhiteUsername = ref('');
const filterUserName = ref('');
const filterStatus = ref<number | string>('');
const modalOpen = ref(false);
const remarkOpen = ref(false);
const submitting = ref(false);
const actionId = ref<number | string>();
const pickUsers = ref<Array<{ label: string; value: number | string }>>([]);

const statusOptions = [
  { label: '全部', value: '' },
  { label: '开', value: 1 },
  { label: '关', value: 2 },
];

const form = reactive({
  ExpirationTime: undefined as dayjs.Dayjs | undefined,
  IpWhiteUserId: undefined as number | string | undefined,
  Name: '',
  Remark: '',
  WhiteIp: '',
});

const remarkForm = reactive({
  Id: '' as number | string,
  Remark: '',
});

function getAdminMeta() {
  const info = cloudStore.adminInfo as Record<string, unknown> | null;
  const admin = (info?.Admin as Record<string, unknown>) || info || {};
  return {
    AgentId:
      admin.AgentId ?? cloudStore.projectConfig?.AccountTeamInfo?.AgentId ?? '',
    WhiteDomain: String(admin.WhiteDomain || ''),
  };
}

function displayUserName(row: WhiteRow) {
  return String(row.WhiteUsername || row.UserName || row.Name || '') || '管理员';
}

function displayCreator(row: WhiteRow) {
  return String(
    row.AddUserName || row.AdminName || row.AgentIdName || '',
  ) || '管理员';
}

function buildQuery(page: { currentPage: number; pageSize: number }) {
  if (isIp.value) {
    return {
      Page: page.currentPage,
      PageSize: page.pageSize,
      Sort: '',
      Status: filterStatus.value,
      WhiteIp: filterWhiteIp.value.trim(),
      WhiteUsername: filterWhiteUsername.value.trim(),
    };
  }
  return {
    // 对齐旧站 users.vue listQuery.Name（非 Username）
    Name: filterUserName.value.trim(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    Sort: '',
    Status: filterStatus.value,
  };
}

const gridOptions: VxeTableGridOptions<WhiteRow> = {
  columns: isIp.value
    ? [
        {
          field: 'Status',
          slots: { default: 'status' },
          title: '状态',
          width: 90,
        },
        {
          field: 'WhiteIp',
          formatter: ({ cellValue, row }) => String(cellValue || row.Ip || '-'),
          minWidth: 140,
          title: 'IP地址',
        },
        {
          field: 'WhiteUsername',
          slots: { default: 'whiteUsername' },
          minWidth: 120,
          title: '使用者',
        },
        { field: 'Remark', minWidth: 140, title: '备注' },
        {
          field: 'CreateTime',
          formatter: ({ cellValue }) =>
            formatOperationDateTime(cellValue as string),
          minWidth: 160,
          title: '创建时间',
        },
        {
          field: 'ExpirationTime',
          formatter: ({ cellValue, row }) =>
            formatOperationDateTime((cellValue ?? row.ExpiredTime) as string),
          minWidth: 160,
          title: '过期时间',
        },
        {
          field: 'AddUserName',
          formatter: ({ row }) => displayCreator(row),
          minWidth: 120,
          title: '创建人',
        },
        {
          field: 'action',
          fixed: 'right',
          slots: { default: 'action' },
          title: '操作',
          width: 160,
        },
      ]
    : [
        {
          field: 'Status',
          slots: { default: 'status' },
          title: '状态',
          width: 90,
        },
        {
          field: 'Name',
          slots: { default: 'userName' },
          minWidth: 140,
          title: '使用者',
        },
        {
          field: 'Quantity',
          formatter: ({ cellValue }) => String(cellValue ?? 0),
          minWidth: 100,
          title: '已分配IP',
        },
        { field: 'Remark', minWidth: 160, title: '备注' },
        {
          field: 'CreateTime',
          formatter: ({ cellValue }) =>
            formatOperationDateTime(cellValue as string),
          minWidth: 160,
          title: '创建时间',
        },
        {
          field: 'AddUserName',
          formatter: ({ row }) => displayCreator(row),
          minWidth: 120,
          title: '创建人',
        },
        {
          field: 'action',
          fixed: 'right',
          slots: { default: 'action' },
          title: '操作',
          width: 160,
        },
      ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = isIp.value
          ? await fetchWhiteListApi(buildQuery(page))
          : await fetchWhiteListUsersApi(buildQuery(page));
        const items = (result.Items || []) as unknown as WhiteRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadPickUsers() {
  try {
    const data = await fetchWhiteListPickUsersApi({});
    const list = Array.isArray(data)
      ? data
      : (data as { Items?: Record<string, unknown>[] }).Items || [];
    pickUsers.value = list.map((item) => ({
      label: String(item.Name || item.UserName || item.Id),
      value: (item.Id as number | string) ?? '',
    }));
  } catch {
    pickUsers.value = [];
  }
}

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterWhiteIp.value = '';
  filterWhiteUsername.value = '';
  filterUserName.value = '';
  filterStatus.value = '';
  gridApi.reload();
}

function openCreate() {
  form.WhiteIp = '';
  form.Name = '';
  form.Remark = '';
  form.IpWhiteUserId = undefined;
  form.ExpirationTime = undefined;
  modalOpen.value = true;
}

async function submitCreate() {
  const meta = getAdminMeta();
  if (isIp.value) {
    if (!form.WhiteIp.trim()) {
      message.warning('请输入 IP');
      return;
    }
    if (
      form.IpWhiteUserId === undefined ||
      form.IpWhiteUserId === null ||
      form.IpWhiteUserId === ''
    ) {
      message.warning('请选择使用者');
      return;
    }
    if (!form.ExpirationTime) {
      message.warning('请选择过期时间');
      return;
    }
  } else if (!form.Name.trim()) {
    message.warning('请输入使用者名称');
    return;
  }

  submitting.value = true;
  try {
    if (isIp.value) {
      await createWhiteListApi({
        AgentId: meta.AgentId,
        ExpirationTime: String(form.ExpirationTime!.unix()),
        Hash: createRequestHash(),
        IpWhiteUserId: form.IpWhiteUserId,
        Remark: form.Remark,
        WhiteDomain: meta.WhiteDomain,
        WhiteIp: form.WhiteIp.trim(),
      });
    } else {
      await createWhiteListUserApi({
        AgentId: meta.AgentId,
        Hash: createRequestHash(),
        Name: form.Name.trim(),
        Remark: form.Remark,
      });
    }
    message.success('新增成功');
    modalOpen.value = false;
    await gridApi.reload();
    emit('changed');
    if (isIp.value) {
      void loadPickUsers();
    }
  } finally {
    submitting.value = false;
  }
}

function handleToggle(row: WhiteRow, checked: boolean | number | string) {
  const next = Number(checked) === 1 || checked === true ? 1 : 2;
  const prev = Number(row.Status) === 1 ? 1 : 2;
  const label = isIp.value
    ? String(row.WhiteIp || row.Ip || row.Id)
    : String(row.Name || row.UserName || row.Id);
  const content =
    next === 1 ? `确认开启「${label}」？` : `确认关闭「${label}」？`;

  Modal.confirm({
    content,
    onCancel: () => {
      row.Status = prev;
    },
    onOk: async () => {
      actionId.value = row.Id;
      try {
        if (isIp.value) {
          await updateWhiteListApi({ Id: row.Id, Status: next });
        } else {
          await updateWhiteListUserApi({ Id: row.Id, Status: next });
        }
        row.Status = next;
        message.success('状态已更新');
        emit('changed');
      } catch {
        row.Status = prev;
      } finally {
        actionId.value = undefined;
      }
    },
    title: '提示',
  });
}

function openRemark(row: WhiteRow) {
  remarkForm.Id = row.Id;
  remarkForm.Remark = String(row.Remark || '');
  remarkOpen.value = true;
}

async function submitRemark() {
  submitting.value = true;
  try {
    if (isIp.value) {
      await updateWhiteListRemarkApi({
        Id: remarkForm.Id,
        Remark: remarkForm.Remark,
      });
    } else {
      await updateWhiteListUserRemarkApi({
        Id: remarkForm.Id,
        Remark: remarkForm.Remark,
      });
    }
    message.success('备注已更新');
    remarkOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function handleDelete(row: WhiteRow) {
  Modal.confirm({
    content: isIp.value
      ? `确认删除 IP「${row.WhiteIp || row.Ip}」？`
      : `确认删除使用者「${row.Name || row.UserName}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        if (isIp.value) {
          await deleteWhiteListApi(row.Id);
        } else {
          await deleteWhiteListUserApi(row.Id);
        }
        message.success('删除成功');
        await gridApi.reload();
        emit('changed');
        if (isIp.value) {
          void loadPickUsers();
        }
      } finally {
        actionId.value = undefined;
      }
    },
    title: '删除确认',
  });
}

function handleUserNameClick(row: WhiteRow) {
  const name = String(row.Name || row.UserName || '').trim();
  if (!name) {
    return;
  }
  emit('jumpToIp', name);
}

watch(
  () => props.initialWhiteUsername,
  (name) => {
    if (!isIp.value || !name) {
      return;
    }
    filterWhiteUsername.value = name;
    emit('consumedUsername');
    gridApi.reload();
  },
);

onMounted(() => {
  if (isIp.value) {
    void loadPickUsers();
    if (props.initialWhiteUsername) {
      filterWhiteUsername.value = props.initialWhiteUsername;
      emit('consumedUsername');
    }
  }
  if (canViewList.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewList">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <template v-if="isIp">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">IP地址</span>
          <Input
            v-model:value="filterWhiteIp"
            allow-clear
            placeholder="请输入 IP"
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">使用者</span>
          <Input
            v-model:value="filterWhiteUsername"
            allow-clear
            placeholder="请输入使用者"
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </div>
      </template>
      <div v-else class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">使用者</span>
        <Input
          v-model:value="filterUserName"
          allow-clear
          placeholder="请输入使用者名称"
          style="width: 200px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          placeholder="全部"
          style="width: 120px"
          :options="statusOptions"
        />
      </div>
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
      <Button
        v-if="(isIp && canCreateIp) || (!isIp && canCreateUser)"
        @click="openCreate"
      >
        新增
      </Button>
    </div>
    <Grid>
      <template #status="{ row }">
        <Switch
          :checked="Number(row.Status) === 1"
          :disabled="isIp ? !canToggleIp : !canToggleUser"
          :loading="actionId === row.Id"
          checked-children="开"
          un-checked-children="关"
          @change="(checked) => handleToggle(row, checked as boolean)"
        />
      </template>
      <template #whiteUsername="{ row }">
        {{ displayUserName(row) }}
      </template>
      <template #userName="{ row }">
        <Button type="link" class="!px-0" @click="handleUserNameClick(row)">
          {{ row.Name || row.UserName || '-' }}
        </Button>
      </template>
      <template #action="{ row }">
        <div class="flex flex-wrap gap-1">
          <Button
            v-if="(isIp && canRemarkIp) || (!isIp && canRemarkUser)"
            size="small"
            @click="openRemark(row)"
          >
            备注
          </Button>
          <Button
            v-if="(isIp && canDeleteIp) || (!isIp && canDeleteUser)"
            danger
            size="small"
            :loading="actionId === row.Id"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </div>
      </template>
    </Grid>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      destroy-on-close
      :title="isIp ? '新增 IP 白名单' : '新增使用者'"
      @ok="submitCreate"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item v-if="isIp" label="IP地址" required>
          <Input v-model:value="form.WhiteIp" placeholder="请输入 IP" />
        </Form.Item>
        <Form.Item v-if="isIp" label="使用者" required>
          <Select
            v-model:value="form.IpWhiteUserId"
            class="w-full"
            :options="pickUsers"
            placeholder="请选择使用者"
          />
        </Form.Item>
        <Form.Item v-if="isIp" label="过期时间" required>
          <DatePicker
            v-model:value="form.ExpirationTime"
            class="w-full"
            show-time
          />
        </Form.Item>
        <Form.Item v-if="!isIp" label="使用者名称" required>
          <Input v-model:value="form.Name" placeholder="请输入名称" />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="form.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="remarkOpen"
      :confirm-loading="submitting"
      destroy-on-close
      title="修改备注"
      @ok="submitRemark"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="备注">
          <Input.TextArea v-model:value="remarkForm.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  <Result
    v-else
    status="403"
    :sub-title="isIp ? '无 IP 白名单列表权限' : '无使用者列表权限'"
    title="403"
  />
</template>
