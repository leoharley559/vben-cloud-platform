<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tabs,
  message,
} from 'ant-design-vue';

import {
  addTeamDeputyApi,
  createTeamApi,
  dissolveTeamApi,
  fetchTeamDeputyListApi,
  fetchTeamListApi,
  fetchTeamRecordListApi,
  moveTeamDeputyApi,
  removeTeamDeputyApi,
  updateTeamApi,
} from '#/api/netcash/team-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'TeamManage' });

const { checkPermission } = useCloudPermission();
const canViewManage = computed(() => checkPermission(11_488));
const canViewRecord = computed(() => checkPermission(11_489));
const canCreate = computed(() => checkPermission(11_491));
const canEdit = computed(() => checkPermission(11_492));
const canDissolve = computed(() => checkPermission(11_493));
const canRemoveDeputy = computed(() => checkPermission(11_494));
const canAddDeputy = computed(() => checkPermission(11_495));
const canTransfer = computed(() => checkPermission(11_490));
const canViewPage = computed(() => canViewManage.value || canViewRecord.value);
const activeTab = ref('manage');

const gridRef = ref<InstanceType<typeof NetcashGridPanel>>();

const manageConfig = computed<NetcashGridConfig>(() => ({
  actionWidth: 260,
  columns: [
    { field: 'TeamName', title: '团队名称' },
    { field: 'Username', title: '主线账号' },
    {
      field: 'Type',
      formatter: (value) =>
        Number(value) === 1
          ? '普通团队'
          : Number(value) === 2
            ? '特殊团队'
            : String(value ?? '-'),
      title: '团队类型',
    },
    {
      field: 'CreateTime',
      formatter: (value) => formatNetcashDateTime(value as string),
      title: '创建时间',
    },
    { field: 'SubUserCount', title: '副线数量' },
    { field: 'Remark', title: '备注' },
  ],
  fetchApi: (query) => fetchTeamListApi(query as never),
  filters: ['team', 'username', 'date'],
  showActions: true,
}));

const recordConfig: NetcashGridConfig = {
  columns: [
    { field: 'TeamName', title: '团队名称' },
    { field: 'Operator', title: '操作人' },
    { field: 'Action', title: '操作类型' },
    {
      field: 'CreateTime',
      formatter: (value) => formatNetcashDateTime(value as string),
      title: '操作时间',
    },
    { field: 'Desc', title: '说明' },
  ],
  fetchApi: (query) => fetchTeamRecordListApi(query as never),
  filters: ['team', 'date'],
};

const teamModalOpen = ref(false);
const teamSubmitting = ref(false);
const isCreate = ref(true);
const teamForm = reactive({
  AdminId: '',
  Id: '' as number | string,
  Remark: '',
  TeamName: '',
  Type: 1,
});

const teamTypeOptions = [
  { label: '普通团队', value: 1 },
  { label: '特殊团队', value: 2 },
];

function openCreateModal() {
  isCreate.value = true;
  teamForm.Id = '';
  teamForm.AdminId = '';
  teamForm.TeamName = '';
  teamForm.Type = 1;
  teamForm.Remark = '';
  teamModalOpen.value = true;
}

function openEditModal(row: Record<string, unknown>) {
  isCreate.value = false;
  teamForm.Id = String(row.Id ?? '');
  teamForm.AdminId = String(row.Username ?? '');
  teamForm.TeamName = String(row.TeamName ?? '');
  teamForm.Type = Number(row.Type ?? 1);
  teamForm.Remark = String(row.Remark ?? '');
  teamModalOpen.value = true;
}

async function submitTeamModal() {
  if (isCreate.value && !String(teamForm.AdminId).trim()) {
    message.warning('请输入主线账号 AdminId');
    return;
  }
  if (!teamForm.TeamName.trim()) {
    message.warning('请输入团队名称');
    return;
  }
  teamSubmitting.value = true;
  try {
    if (isCreate.value) {
      await createTeamApi({
        AdminId: String(teamForm.AdminId).trim(),
        Remark: teamForm.Remark,
        TeamName: teamForm.TeamName.trim(),
        Type: teamForm.Type,
      });
    } else {
      await updateTeamApi({
        Id: teamForm.Id,
        Remark: teamForm.Remark,
        TeamName: teamForm.TeamName.trim(),
        Type: teamForm.Type,
      });
    }
    message.success('操作成功');
    teamModalOpen.value = false;
    gridRef.value?.reload();
  } finally {
    teamSubmitting.value = false;
  }
}

function handleDissolve(row: Record<string, unknown>) {
  if (Number(row.Deputys || row.SubUserCount || 0) !== 0) {
    message.warning('请先移除副线后再解散');
    return;
  }
  Modal.confirm({
    content: `确认解散团队「${row.TeamName || ''}」？`,
    okType: 'danger',
    title: '解散团队',
    onOk: async () => {
      await dissolveTeamApi(String(row.Id));
      message.success('已解散');
      gridRef.value?.reload();
    },
  });
}

const deputyModalOpen = ref(false);
const deputySubmitting = ref(false);
const deputyForm = reactive({
  AdminId: '',
  TeamId: '' as number | string,
  TeamName: '',
});

function openAddDeputyModal(row: Record<string, unknown>) {
  deputyForm.TeamId = String(row.Id ?? '');
  deputyForm.TeamName = String(row.TeamName ?? '');
  deputyForm.AdminId = '';
  deputyModalOpen.value = true;
}

async function submitDeputyModal() {
  if (!deputyForm.AdminId.trim()) {
    message.warning('请输入副线代理 AdminId');
    return;
  }
  deputySubmitting.value = true;
  try {
    await addTeamDeputyApi({
      AdminId: deputyForm.AdminId.trim(),
      TeamId: deputyForm.TeamId,
    });
    message.success('已添加副线');
    deputyModalOpen.value = false;
    gridRef.value?.reload();
  } finally {
    deputySubmitting.value = false;
  }
}

const transferModalOpen = ref(false);
const transferSubmitting = ref(false);
const deputyOptions = ref<
  Array<{ label: string; raw: Record<string, unknown>; value: number | string }>
>([]);
const teamOptions = ref<Array<{ label: string; value: number | string }>>([]);
const transferForm = reactive({
  AdminId: undefined as number | string | undefined,
  FromTeamId: '' as number | string,
  FromTeamName: '',
  MainUsername: '',
  Members: '',
  Name: '',
  ToTeamId: undefined as number | string | undefined,
});

async function openTransferModal() {
  transferForm.AdminId = undefined;
  transferForm.FromTeamId = '';
  transferForm.FromTeamName = '';
  transferForm.MainUsername = '';
  transferForm.Members = '';
  transferForm.Name = '';
  transferForm.ToTeamId = undefined;
  transferModalOpen.value = true;
  const [deputyResult, teamResult] = await Promise.all([
    fetchTeamDeputyListApi({ Page: 1, PageSize: 100_000, TeamId: '' }),
    fetchTeamListApi({ Page: 1, PageSize: 1000 } as never),
  ]);
  deputyOptions.value = (deputyResult.Items || []).map((item) => ({
    label: `${item.Username || item.AdminId} (${item.TeamName || ''})`,
    raw: item,
    value: item.AdminId as number | string,
  }));
  teamOptions.value = (teamResult.Items || []).map((item) => ({
    label: `${item.TeamName || ''} / ${item.Username || ''}`,
    value: item.Id as number | string,
  }));
}

function onTransferDeputyChange(adminId: number | string) {
  const found = deputyOptions.value.find((item) => item.value === adminId);
  if (!found) {
    return;
  }
  const raw = found.raw;
  transferForm.Name = String(raw.Name || '');
  transferForm.Members = String(raw.Members ?? '');
  transferForm.FromTeamName = String(raw.TeamName || '');
  transferForm.FromTeamId = String(raw.TeamId ?? '');
  transferForm.MainUsername = String(raw.MainUsername || '');
  if (String(transferForm.ToTeamId) === transferForm.FromTeamId) {
    transferForm.ToTeamId = undefined;
  }
}

const filteredTeamOptions = computed(() =>
  teamOptions.value.filter(
    (item) => String(item.value) !== String(transferForm.FromTeamId),
  ),
);

async function submitTransferModal() {
  if (!transferForm.AdminId) {
    message.warning('请选择副线账号');
    return;
  }
  if (!transferForm.ToTeamId) {
    message.warning('请选择转入团队');
    return;
  }
  transferSubmitting.value = true;
  try {
    await moveTeamDeputyApi({
      AdminId: transferForm.AdminId,
      FromTeamId: transferForm.FromTeamId,
      ToTeamId: transferForm.ToTeamId,
    });
    message.success('转移成功');
    transferModalOpen.value = false;
    gridRef.value?.reload();
  } finally {
    transferSubmitting.value = false;
  }
}

const detailModalOpen = ref(false);
const detailLoading = ref(false);
const detailTeamName = ref('');
const detailRows = ref<Record<string, unknown>[]>([]);
const detailColumns = [
  { dataIndex: 'Username', key: 'Username', title: '副线账号' },
  { dataIndex: 'Name', key: 'Name', title: '姓名' },
  { dataIndex: 'Members', key: 'Members', title: '下级人数' },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function openDetailModal(row: Record<string, unknown>) {
  const count = Number(row.Deputys || row.SubUserCount || 0);
  if (count <= 0) {
    message.warning('该团队暂无副线');
    return;
  }
  detailTeamName.value = String(row.TeamName || '');
  detailModalOpen.value = true;
  detailLoading.value = true;
  try {
    const result = await fetchTeamDeputyListApi({
      Page: 1,
      PageSize: 1000,
      TeamId: row.Id,
    });
    detailRows.value = result.Items || [];
  } finally {
    detailLoading.value = false;
  }
}

function handleRemoveDeputy(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认移除副线「${row.Username || row.AdminId || ''}」？`,
    okType: 'danger',
    title: '移除副线',
    onOk: async () => {
      await removeTeamDeputyApi(String(row.AdminId));
      message.success('已移除');
      detailRows.value = detailRows.value.filter(
        (item) => String(item.AdminId) !== String(row.AdminId),
      );
      gridRef.value?.reload();
      if (detailRows.value.length === 0) {
        detailModalOpen.value = false;
      }
    },
  });
}

onMounted(() => {
  if (canViewManage.value) {
    activeTab.value = 'manage';
  } else if (canViewRecord.value) {
    activeTab.value = 'record';
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 团队管理"
    title="团队管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canViewManage" key="manage" tab="团队列表">
          <div class="mb-4 flex flex-wrap gap-2">
            <Button v-if="canCreate" type="primary" @click="openCreateModal">
              新增团队
            </Button>
            <Button v-if="canTransfer" @click="openTransferModal">
              转移副线
            </Button>
          </div>
          <NetcashGridPanel
            v-if="activeTab === 'manage'"
            ref="gridRef"
            :config="manageConfig"
          >
            <template #actions="{ row }">
              <Space :size="0">
                <Button
                  v-if="canAddDeputy"
                  size="small"
                  type="link"
                  @click="openAddDeputyModal(row)"
                >
                  添加副线
                </Button>
                <Button size="small" type="link" @click="openDetailModal(row)">
                  副线明细
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="openEditModal(row)"
                >
                  编辑
                </Button>
                <Button
                  v-if="canDissolve"
                  danger
                  size="small"
                  type="link"
                  @click="handleDissolve(row)"
                >
                  解散
                </Button>
              </Space>
            </template>
          </NetcashGridPanel>
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canViewRecord" key="record" tab="操作记录">
          <NetcashGridPanel
            v-if="activeTab === 'record'"
            :config="recordConfig"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="teamModalOpen"
      :confirm-loading="teamSubmitting"
      :title="isCreate ? '新增团队' : '编辑团队'"
      @ok="submitTeamModal"
    >
      <Form layout="vertical">
        <Form.Item :label="isCreate ? '主线 AdminId' : '主线账号'" required>
          <Input
            v-model:value="teamForm.AdminId"
            :disabled="!isCreate"
            :placeholder="isCreate ? '请输入主线代理 AdminId' : ''"
          />
        </Form.Item>
        <Form.Item label="团队名称" required>
          <Input
            v-model:value="teamForm.TeamName"
            placeholder="请输入团队名称"
          />
        </Form.Item>
        <Form.Item label="团队类型" required>
          <Select
            v-model:value="teamForm.Type"
            :options="teamTypeOptions"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="teamForm.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="deputyModalOpen"
      :confirm-loading="deputySubmitting"
      title="添加副线"
      @ok="submitDeputyModal"
    >
      <Form layout="vertical">
        <Form.Item label="团队名称">
          <Input v-model:value="deputyForm.TeamName" disabled />
        </Form.Item>
        <Form.Item label="副线 AdminId" required>
          <Input
            v-model:value="deputyForm.AdminId"
            placeholder="请输入副线代理 AdminId"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="transferModalOpen"
      :confirm-loading="transferSubmitting"
      title="转移副线"
      @ok="submitTransferModal"
    >
      <Form layout="vertical">
        <Form.Item label="副线账号" required>
          <Select
            v-model:value="transferForm.AdminId"
            :options="deputyOptions"
            allow-clear
            placeholder="请选择副线"
            show-search
            style="width: 100%"
            :filter-option="
              (input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
            @change="
              (value) => onTransferDeputyChange(value as number | string)
            "
          />
        </Form.Item>
        <Form.Item label="姓名">
          <Input v-model:value="transferForm.Name" disabled />
        </Form.Item>
        <Form.Item label="原团队">
          <Input v-model:value="transferForm.FromTeamName" disabled />
        </Form.Item>
        <Form.Item label="原主线">
          <Input v-model:value="transferForm.MainUsername" disabled />
        </Form.Item>
        <Form.Item label="转入团队" required>
          <Select
            v-model:value="transferForm.ToTeamId"
            :options="filteredTeamOptions"
            allow-clear
            placeholder="请选择转入团队"
            show-search
            style="width: 100%"
            :filter-option="
              (input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="detailModalOpen"
      :footer="null"
      :title="`副线明细 · ${detailTeamName}`"
      width="720px"
    >
      <Table
        :columns="detailColumns"
        :data-source="detailRows"
        :loading="detailLoading"
        :pagination="false"
        row-key="AdminId"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <Button
              v-if="canRemoveDeputy"
              danger
              size="small"
              type="link"
              @click="handleRemoveDeputy(record as Record<string, unknown>)"
            >
              移除
            </Button>
            <span v-else>-</span>
          </template>
        </template>
      </Table>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无团队管理查看权限" title="403" />
</template>
