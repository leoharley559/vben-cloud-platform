<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  addBindCardIgnorePlayerApi,
  deleteBindCardIgnorePlayerApi,
  fetchBindCardIgnorePlayersApi,
  fetchPlayerBindCardConfigApi,
  resetPlayerBindCardCountApi,
  updatePlayerBindCardConfigApi,
} from '#/api/gameManage/withdraw-rules';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const canView = computed(
  () => checkPermission(10_996) || checkPermission(10_997),
);
const canManageIgnore = computed(() => checkPermission(10_998));
const loading = ref(false);
const saving = ref(false);
const snapshot = ref<Record<string, unknown>>({});
const config = reactive({
  DayMaxBindTimes: 3,
  ForceBindSwitch: 0,
  MaxBindCardNum: 3,
  SkipCheckTimes: 3,
});

async function loadConfig() {
  loading.value = true;
  try {
    const data = await fetchPlayerBindCardConfigApi();
    snapshot.value = { ...data };
    config.DayMaxBindTimes = Number(data.DayMaxBindTimes || 3);
    config.ForceBindSwitch = Number(data.ForceBindSwitch || 0);
    config.MaxBindCardNum = Number(data.MaxBindCardNum || 3);
    config.SkipCheckTimes = Number(data.SkipCheckTimes || 3);
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  if (
    [config.DayMaxBindTimes, config.MaxBindCardNum, config.SkipCheckTimes].some(
      (value) => value < 1 || value > 10,
    )
  ) {
    message.warning('次数和张数请输入 1 至 10');
    return;
  }
  saving.value = true;
  try {
    await updatePlayerBindCardConfigApi({ ...snapshot.value, ...config });
    message.success('保存成功');
    await loadConfig();
  } finally {
    saving.value = false;
  }
}

function changeForceBind(checked: boolean) {
  const previous = config.ForceBindSwitch;
  config.ForceBindSwitch = checked ? 1 : 0;
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}强制绑定？`,
    onCancel: () => (config.ForceBindSwitch = previous),
    onOk: saveConfig,
    title: '提示',
  });
}

function resetCount() {
  Modal.confirm({
    content: '确认重置全服未绑定玩家的每日绑定次数？',
    title: '重置次数',
    onOk: async () => {
      await resetPlayerBindCardCountApi();
      message.success('重置成功');
    },
  });
}

const ignoreOpen = ref(false);
const ignoreLoading = ref(false);
const ignoreRows = ref<Record<string, unknown>[]>([]);
const ignoreTotal = ref(0);
const ignoreQuery = reactive({ Page: 1, PageSize: 20 });
const ignoreColumns = [
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '添加时间' },
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品' },
  { dataIndex: 'HandlerName', key: 'HandlerName', title: '操作人' },
  { key: 'actions', title: '操作', width: 90 },
];
const addOpen = ref(false);
const addSubmitting = ref(false);
const addForm = reactive<{ PackageId?: number | string; PlayerName: string }>({
  PlayerName: '',
});
const productOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '' && item.PackageId != null)
    .map((item) => ({
      label: String(item.PackageName),
      value: item.PackageId as number | string,
    })),
);

async function loadIgnore() {
  ignoreLoading.value = true;
  try {
    const result = await fetchBindCardIgnorePlayersApi(ignoreQuery);
    ignoreRows.value = result.Items;
    ignoreTotal.value = Number(
      result.Pagination.MaxCount || ignoreRows.value.length,
    );
  } finally {
    ignoreLoading.value = false;
  }
}

function openIgnore() {
  ignoreOpen.value = true;
  void loadIgnore();
}

function openAdd() {
  addForm.PlayerName = '';
  addForm.PackageId = undefined;
  addOpen.value = true;
}

async function submitAdd() {
  if (!addForm.PlayerName.trim() || addForm.PackageId === undefined) {
    message.warning('请输入账号并选择产品');
    return;
  }
  addSubmitting.value = true;
  try {
    await addBindCardIgnorePlayerApi({
      PackageId: addForm.PackageId,
      PlayerName: addForm.PlayerName.trim().toLowerCase(),
    });
    message.success('添加成功');
    addOpen.value = false;
    await loadIgnore();
  } finally {
    addSubmitting.value = false;
  }
}

function removeIgnore(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除「${row.LoginAccount || ''}」？`,
    okType: 'danger',
    title: '删除',
    onOk: async () => {
      await deleteBindCardIgnorePlayerApi(String(row.Id));
      message.success('删除成功');
      await loadIgnore();
    },
  });
}

onMounted(loadConfig);
</script>

<template>
  <Card v-if="canView" :loading="loading" size="small" title="银行卡绑定设置">
    <Form layout="vertical">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Form.Item label="最大绑定张数（1-10）">
          <InputNumber
            v-model:value="config.MaxBindCardNum"
            :max="10"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="每日最大绑定重试次数（1-10）">
          <InputNumber
            v-model:value="config.DayMaxBindTimes"
            :max="10"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="跳过检查触发次数（1-10）">
          <InputNumber
            v-model:value="config.SkipCheckTimes"
            :max="10"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
      </div>
      <Space wrap>
        <span>强制绑定开关</span>
        <Switch
          :checked="config.ForceBindSwitch === 1"
          @change="(checked) => changeForceBind(!!checked)"
        />
        <Button :loading="saving" type="primary" @click="saveConfig">
          保存设置
        </Button>
        <Button danger @click="resetCount">重置玩家次数</Button>
        <Button v-if="canManageIgnore" @click="openIgnore">
          跳过检查玩家设置
        </Button>
      </Space>
    </Form>
  </Card>

  <Modal
    v-model:open="ignoreOpen"
    :footer="null"
    title="跳过检查玩家设置"
    width="900px"
  >
    <Button class="mb-3" type="primary" @click="openAdd">添加玩家</Button>
    <Table
      :columns="ignoreColumns"
      :data-source="ignoreRows"
      :loading="ignoreLoading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <PlayerAccountLink
          v-if="column.key === 'LoginAccount'"
          :login-account="String(record.LoginAccount || '')"
          :player-id="record.PlayerId as number | string | undefined"
        />
        <template v-else-if="column.key === 'actions'">
          <Button danger type="link" @click="removeIgnore(record)">删除</Button>
        </template>
      </template>
    </Table>
    <Pagination
      v-if="ignoreTotal > ignoreQuery.PageSize"
      v-model:current="ignoreQuery.Page"
      v-model:page-size="ignoreQuery.PageSize"
      class="mt-3 text-right"
      :total="ignoreTotal"
      @change="loadIgnore"
    />
  </Modal>

  <Modal
    v-model:open="addOpen"
    :confirm-loading="addSubmitting"
    title="添加跳过检查玩家"
    @ok="submitAdd"
  >
    <Form layout="vertical">
      <Form.Item label="游戏账号" required>
        <Input v-model:value="addForm.PlayerName" />
      </Form.Item>
      <Form.Item label="产品" required>
        <Select
          v-model:value="addForm.PackageId"
          :options="productOptions"
          show-search
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
