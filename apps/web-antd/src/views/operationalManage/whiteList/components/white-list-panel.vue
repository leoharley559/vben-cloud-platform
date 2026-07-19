<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
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
  updateWhiteListUserRemarkApi,
} from '#/api/operationManage/white-list';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { createRequestHash } from '#/utils/crypto';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'WhiteListPanel' });

const props = defineProps<{
  mode: 'ip' | 'user';
}>();

interface WhiteRow {
  ExpirationTime?: number | string;
  Id: number | string;
  Name?: string;
  Remark?: string;
  Status?: number;
  WhiteIp?: string;
  WhiteUsername?: string;
  UserName?: string;
  Ip?: string;
  ExpiredTime?: number | string;
  AdminName?: string;
  AddUserName?: string;
}

const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();

const canCreateIp = computed(() => checkPermission(10217));
const canDeleteIp = computed(() => checkPermission(10219));
const canToggleIp = computed(() => checkPermission(10220));
const canRemarkIp = computed(() => checkPermission(10218));
const canCreateUser = computed(() => checkPermission(10222));
const canDeleteUser = computed(() => checkPermission(10224));
const canRemarkUser = computed(() => checkPermission(10223));

const filterKeyword = ref('');
const modalOpen = ref(false);
const remarkOpen = ref(false);
const submitting = ref(false);
const actionId = ref<number | string>();
const pickUsers = ref<Array<{ label: string; value: number | string }>>([]);

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

const isIp = computed(() => props.mode === 'ip');

const gridOptions = computed<VxeTableGridOptions<WhiteRow>>(() => ({
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
          formatter: ({ cellValue, row }) =>
            String(cellValue || row.UserName || '-'),
          minWidth: 120,
          title: '使用者',
        },
        { field: 'Remark', minWidth: 140, title: '备注' },
        {
          field: 'ExpirationTime',
          formatter: ({ cellValue, row }) =>
            formatOperationDateTime((cellValue ?? row.ExpiredTime) as string),
          minWidth: 160,
          title: '过期时间',
        },
        {
          field: 'AddUserName',
          formatter: ({ cellValue, row }) =>
            String(cellValue || row.AdminName || '-'),
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
          field: 'Name',
          formatter: ({ cellValue, row }) =>
            String(cellValue || row.UserName || '-'),
          minWidth: 140,
          title: '使用者',
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
          formatter: ({ cellValue, row }) =>
            String(cellValue || row.AdminName || '-'),
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
          ? await fetchWhiteListApi({
              Page: page.currentPage,
              PageSize: page.pageSize,
              WhiteIp: filterKeyword.value,
              WhiteUsername: '',
            })
          : await fetchWhiteListUsersApi({
              Page: page.currentPage,
              PageSize: page.pageSize,
              Username: filterKeyword.value,
            });
        const items = (result.Items || []) as unknown as WhiteRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
}));

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions: gridOptions.value });

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
  submitting.value = true;
  try {
    if (isIp.value) {
      if (!form.WhiteIp.trim()) {
        message.warning('请输入 IP');
        return;
      }
      await createWhiteListApi({
        AgentId: meta.AgentId,
        ExpirationTime: form.ExpirationTime ? form.ExpirationTime.unix() : '',
        Hash: createRequestHash(),
        IpWhiteUserId: form.IpWhiteUserId || '',
        Remark: form.Remark,
        WhiteDomain: meta.WhiteDomain,
        WhiteIp: form.WhiteIp.trim(),
      });
    } else {
      if (!form.Name.trim()) {
        message.warning('请输入使用者名称');
        return;
      }
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
  } finally {
    submitting.value = false;
  }
}

async function handleToggle(row: WhiteRow, checked: boolean | number | string) {
  const next = Number(checked) === 1 || checked === true ? 1 : 2;
  actionId.value = row.Id;
  try {
    await updateWhiteListApi({ Id: row.Id, Status: next });
    message.success('状态已更新');
    await gridApi.reload();
  } finally {
    actionId.value = undefined;
  }
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
      } finally {
        actionId.value = undefined;
      }
    },
    title: '删除确认',
  });
}

onMounted(() => {
  if (isIp.value) {
    void loadPickUsers();
  }
  gridApi.reload();
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterKeyword"
        allow-clear
        :placeholder="isIp ? 'IP / 使用者' : '使用者名称'"
        style="width: 220px"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
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
          :disabled="!canToggleIp"
          :loading="actionId === row.Id"
          checked-children="开"
          un-checked-children="关"
          @change="(checked) => handleToggle(row, checked as boolean)"
        />
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
        <Form.Item v-if="isIp" label="使用者">
          <Select
            v-model:value="form.IpWhiteUserId"
            allow-clear
            class="w-full"
            :options="pickUsers"
            placeholder="可选"
          />
        </Form.Item>
        <Form.Item v-if="isIp" label="过期时间">
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
</template>
