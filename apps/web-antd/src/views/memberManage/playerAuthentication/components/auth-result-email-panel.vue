<script lang="ts" setup>
import type {
  PlayerAuthLangTextItem,
  PlayerAuthSettingItem,
} from '#/types/player-authentication';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Switch,
  Tabs,
} from 'ant-design-vue';

import {
  fetchPlayerAuthSettingApi,
  updatePlayerAuthImageApi,
  updatePlayerAuthSwitchApi,
} from '#/api/memberManage/player-authentication';
import { useProjectConfig } from '#/composables/use-project-config';

defineOptions({ name: 'AuthResultEmailPanel' });

const emit = defineEmits<{ reload: [] }>();

const { projectConfig } = useProjectConfig();

const loading = ref(false);
const saving = ref(false);
const switchEnabled = ref(false);
const activeLangTab = ref<string>('');
const langTextMap = ref<Record<string, PlayerAuthLangTextItem>>({});

const langGroups = computed(
  () => projectConfig.value?.LangGroup?.filter((item) => item.Id) || [],
);

function resolveConfig(config: PlayerAuthSettingItem['Config']) {
  if (!config) {
    return {};
  }
  if (typeof config === 'string') {
    try {
      return JSON.parse(config) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return config;
}

function parseLangText(raw: PlayerAuthSettingItem['LangText']) {
  if (!raw || raw === 'null') {
    return {} as Record<string, PlayerAuthLangTextItem>;
  }

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {};
    }
  }

  const map: Record<string, PlayerAuthLangTextItem> = {};
  // 接口可能返回「按语言组 Id 的对象」或「数组」（旧站保存后为数组）
  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      const row = item as PlayerAuthLangTextItem;
      if (row?.LangGroupId !== undefined && row?.LangGroupId !== null) {
        map[String(row.LangGroupId)] = row;
      }
    });
    return map;
  }
  if (parsed && typeof parsed === 'object') {
    Object.entries(parsed as Record<string, PlayerAuthLangTextItem>).forEach(
      ([key, item]) => {
        const row = item || {};
        const id = row.LangGroupId ?? key;
        map[String(id)] = { ...row, LangGroupId: id };
      },
    );
    return map;
  }
  return {};
}

function initLangTextMap(existing?: Record<string, PlayerAuthLangTextItem>) {
  const next: Record<string, PlayerAuthLangTextItem> = {};
  langGroups.value.forEach((group) => {
    const id = String(group.Id);
    next[id] = existing?.[id] || {
      ApproveContent: '',
      ApproveTitle: '',
      LangGroupId: group.Id,
      RejectContent: '',
      RejectTitle: '',
    };
  });
  langTextMap.value = next;
  activeLangTab.value = String(langGroups.value[0]?.Id || '');
}

async function loadSetting() {
  loading.value = true;
  try {
    const result = await fetchPlayerAuthSettingApi();
    const item = (result?.Items || []).find((row) => row.SubType === 1004);
    if (!item) {
      initLangTextMap();
      switchEnabled.value = false;
      return;
    }
    const config = resolveConfig(item.Config);
    switchEnabled.value = Boolean(config.IsOpen);
    initLangTextMap(parseLangText(item.LangText));
  } finally {
    loading.value = false;
  }
}

async function handleSwitchChange(checked: boolean | number | string) {
  const next = Boolean(checked);
  Modal.confirm({
    content: `确认${next ? '开启' : '关闭'}身份验证结果通知？`,
    onCancel: loadSetting,
    onOk: async () => {
      await updatePlayerAuthSwitchApi({ IsOpen: next ? 1 : 0, SubType: 1004 });
      message.success('操作成功');
      emit('reload');
      await loadSetting();
    },
    title: '开关确认',
  });
}

async function handleSave() {
  saving.value = true;
  try {
    await updatePlayerAuthImageApi({
      LangText: JSON.stringify(Object.values(langTextMap.value)),
      SubType: 1004,
    });
    message.success('保存成功');
    emit('reload');
  } finally {
    saving.value = false;
  }
}

watch(langGroups, () => {
  if (Object.keys(langTextMap.value).length === 0) {
    initLangTextMap();
  }
});

onMounted(loadSetting);
</script>

<template>
  <div class="mt-8 border-t pt-6">
    <div class="mb-4 flex items-center gap-3">
      <span class="font-medium">身份验证结果通知</span>
      <Switch
        :checked="switchEnabled"
        :loading="loading"
        @change="handleSwitchChange"
      />
    </div>

    <Tabs v-model:active-key="activeLangTab" type="line" size="small">
      <Tabs.TabPane
        v-for="group in langGroups"
        :key="String(group.Id)"
        :tab="String(group.Name || group.LangName || `语言组 ${group.Id}`)"
      >
        <Form v-if="langTextMap[String(group.Id)]" layout="vertical">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <Form.Item label="验证通过邮件标题" required>
                <Input
                  v-model:value="langTextMap[String(group.Id)]!.ApproveTitle"
                />
              </Form.Item>
              <Form.Item label="验证通过邮件内容" required>
                <Input.TextArea
                  v-model:value="langTextMap[String(group.Id)]!.ApproveContent"
                  :rows="5"
                />
              </Form.Item>
            </div>
            <div>
              <Form.Item label="验证拒绝邮件标题" required>
                <Input
                  v-model:value="langTextMap[String(group.Id)]!.RejectTitle"
                />
              </Form.Item>
              <Form.Item label="验证拒绝邮件内容" required>
                <Input.TextArea
                  v-model:value="langTextMap[String(group.Id)]!.RejectContent"
                  :rows="5"
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Tabs.TabPane>
    </Tabs>

    <div class="mt-4 text-center">
      <Button :loading="saving" type="primary" @click="handleSave">
        保存邮件模板
      </Button>
    </div>
  </div>
</template>
