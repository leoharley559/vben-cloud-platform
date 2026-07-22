<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Table,
  Tabs,
} from 'ant-design-vue';

import {
  fetchPhoneBlockSettingApi,
  updatePhoneBlockSettingApi,
} from '#/api/gameManage/system-setting';
import { getProjectConfigApi } from '#/api/core/project';
import { useCloudPlatformStore } from '#/store/cloud-platform';

defineOptions({ name: 'CommonSettingPanel' });

interface LangPrompt {
  LangGroupId: number;
  PromptText: string;
}

const cloudStore = useCloudPlatformStore();
const loading = ref(false);
const saving = ref(false);
const addVisible = ref(false);
const setting = ref<Record<string, unknown>>({});
const phoneList = ref<string[]>([]);
const phoneNumber = ref('');
const langPrompts = ref<LangPrompt[]>([]);
const activeLangId = ref<number>();
const langGroups = computed(() =>
  (cloudStore.projectConfig?.LangGroup || []).map((item) => ({
    Id: Number(item.Id),
    Name: String(item.Name || `语言组 ${item.Id}`),
  })),
);
const activePrompt = computed(
  () =>
    langPrompts.value.find(
      (item) => item.LangGroupId === activeLangId.value,
    ) || langPrompts.value[0],
);
const columns = [
  { key: 'index', title: '序号', width: 80 },
  { dataIndex: 'value', key: 'value', title: '手机号前三位' },
  { key: 'action', title: '操作', width: 120 },
];

function parseJson(value: unknown, fallback: unknown) {
  if (value === undefined || value === null || value === '' || value === 'null') {
    return fallback;
  }
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

async function loadData() {
  loading.value = true;
  try {
    if (!cloudStore.projectConfig?.LangGroup?.length) {
      await getProjectConfigApi().catch(() => undefined);
    }
    const data = (await fetchPhoneBlockSettingApi()) || {};
    setting.value = data;
    const value = parseJson(data.Value, { code: [] }) as {
      code?: string[];
    };
    phoneList.value = Array.isArray(value.code) ? value.code.map(String) : [];
    const parsedLang = parseJson(data.LangText, {}) as
      | LangPrompt[]
      | Record<string, LangPrompt>;
    const existing = Array.isArray(parsedLang)
      ? parsedLang
      : Object.values(parsedLang || {});
    const groups =
      langGroups.value.length > 0
        ? langGroups.value
        : existing.map((item) => ({
            Id: Number(item.LangGroupId),
            Name: `语言组 ${item.LangGroupId}`,
          }));
    langPrompts.value = groups.map((group) => {
      const found = existing.find(
        (item) => Number(item.LangGroupId) === group.Id,
      );
      return found
        ? { LangGroupId: group.Id, PromptText: String(found.PromptText || '') }
        : { LangGroupId: group.Id, PromptText: '' };
    });
    activeLangId.value = langPrompts.value[0]?.LangGroupId;
  } finally {
    loading.value = false;
  }
}

async function saveSetting() {
  if (langPrompts.value.length === 0) {
    message.warning('缺少语言组配置，无法保存提示文本');
    return;
  }
  if (langPrompts.value.some((item) => !item.PromptText.trim())) {
    message.warning('请完整填写所有语言组的游戏端提示文本');
    return;
  }
  saving.value = true;
  try {
    const currentValue = parseJson(setting.value.Value, {}) as Record<
      string,
      unknown
    >;
    await updatePhoneBlockSettingApi({
      ...setting.value,
      LangText: JSON.stringify(langPrompts.value),
      Value: JSON.stringify({ ...currentValue, code: phoneList.value }),
    });
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

function addPhone() {
  const value = phoneNumber.value.trim();
  if (!/^\d{3}$/.test(value)) {
    message.warning('手机号段必须为 3 位数字');
    return;
  }
  if (phoneList.value.includes(value)) {
    message.warning('该手机号段已存在');
    return;
  }
  phoneList.value.push(value);
  addVisible.value = false;
  phoneNumber.value = '';
  saveSetting();
}

function removePhone(value: string) {
  Modal.confirm({
    content: `确定删除手机号段 ${value} 吗？`,
    okType: 'danger',
    onOk: async () => {
      phoneList.value = phoneList.value.filter((item) => item !== value);
      await saveSetting();
    },
    title: '删除手机号段',
  });
}

onMounted(loadData);
</script>

<template>
  <div>
    <Card
      class="section-card"
      :loading="loading"
      size="small"
      title="手机号段屏蔽规则"
    >
      <div class="prompt-area">
        <Tabs v-model:active-key="activeLangId">
          <Tabs.TabPane
            v-for="group in langGroups"
            :key="group.Id"
            :tab="group.Name"
          />
        </Tabs>
        <Form v-if="activePrompt" layout="vertical">
          <Form.Item label="游戏端提示文本" required>
            <Input.TextArea
              v-model:value="activePrompt.PromptText"
              :maxlength="500"
              :rows="4"
              show-count
            />
          </Form.Item>
          <Button :loading="saving" type="primary" @click="saveSetting">
            保存提示文本
          </Button>
        </Form>
      </div>
    </Card>

    <Card class="section-card" :bordered="false">
      <div class="table-toolbar">
        <strong>屏蔽手机号段</strong>
        <Button type="primary" @click="addVisible = true">新增号段</Button>
      </div>
      <Table
        :columns="columns"
        :data-source="phoneList.map((value) => ({ value }))"
        :pagination="false"
        row-key="value"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <span v-if="column.key === 'index'">{{ index + 1 }}</span>
          <Button
            v-else-if="column.key === 'action'"
            danger
            size="small"
            @click="removePhone(record.value)"
          >
            删除
          </Button>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="addVisible"
      title="新增手机号段"
      @ok="addPhone"
    >
      <Form layout="vertical">
        <Form.Item label="手机号前三位" required>
          <Input
            v-model:value="phoneNumber"
            :maxlength="3"
            placeholder="请输入 3 位数字"
            @press-enter="addPhone"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.section-card {
  margin-bottom: 14px;
  border-radius: 10px;
}

.prompt-area {
  max-width: 760px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
</style>
