<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import {
  createGameEmailApi,
  fetchGameEmailDetailApi,
  updateGameEmailApi,
} from '#/api/operationManage/game-notice';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'GameEmailFormModal' });

const props = withDefaults(
  defineProps<{
    open: boolean;
    readonly?: boolean;
    rowId?: number | string | null;
  }>(),
  { readonly: false },
);

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const submitting = ref(false);
const loading = ref(false);

const langGroups = computed(
  () => projectConfig.value?.LangGroup?.filter((item) => item.Id) || [],
);

const defaultLangGroupId = computed(() => langGroups.value[0]?.Id ?? 1);

const isEdit = computed(() => !!props.rowId);
const isReadonly = computed(() => !!props.readonly);
const modalTitle = computed(() => {
  if (isReadonly.value) {
    return '查看邮件';
  }
  return isEdit.value ? '编辑邮件' : '新增邮件';
});

const form = reactive({
  Content: '',
  Icon: 0,
  Id: undefined as number | string | undefined,
  PackageIds: [] as Array<number | string>,
  PlayerList: '',
  SendTime: undefined as Dayjs | undefined,
  Title: '',
  Type: 0,
});

const typeOptions = [
  { label: '通知', value: 0 },
  { label: '活动', value: 1 },
];

const iconOptions = [
  { label: '普通', value: 0 },
  { label: '重要', value: 1 },
];

function resetForm() {
  form.Id = undefined;
  form.Type = 0;
  form.Icon = 0;
  form.PackageIds = [];
  form.PlayerList = '';
  form.Title = '';
  form.Content = '';
  // 对齐旧站：新建默认不设发送时间（空=不立即发）
  form.SendTime = undefined;
}

function normalizePlayerList(value: string) {
  return value
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(',');
}

function isRichTextEmpty(html: string) {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return !text;
}

function parseLangText(raw: unknown): { Content?: string; Title?: string } {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const first = Object.values(
      raw as Record<string, Record<string, unknown>>,
    )[0];
    return {
      Content: String(first?.Content || ''),
      Title: String(first?.Title || ''),
    };
  }
  let list: Array<Record<string, unknown>> = [];
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw) as Array<Record<string, unknown>>;
    } catch {
      return {};
    }
  } else if (Array.isArray(raw)) {
    list = raw as Array<Record<string, unknown>>;
  }
  const first = list[0];
  return {
    Content: String(first?.Content || ''),
    Title: String(first?.Title || ''),
  };
}

async function loadDetail(id: number | string) {
  loading.value = true;
  try {
    const detail = await fetchGameEmailDetailApi(id);
    const lang = parseLangText(detail.LangText);
    form.Id = detail.Id as number | string;
    form.Type = Number(detail.Type ?? 0);
    form.Icon = Number(detail.Icon ?? 0);
    form.Title = lang.Title || String(detail.Title || '');
    form.Content = lang.Content || '';
    form.PlayerList = String(detail.PlayerList || '');
    const packages = detail.PackageIds ?? detail.Packages;
    if (Array.isArray(packages)) {
      form.PackageIds = packages as Array<number | string>;
    } else if (typeof packages === 'string' && packages) {
      form.PackageIds = packages.split(',').filter(Boolean);
    } else {
      form.PackageIds = [];
    }
    form.SendTime = detail.SendTime
      ? dayjs.unix(Number(detail.SendTime))
      : undefined;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.rowId],
  async ([open]) => {
    if (!open) {
      return;
    }
    resetForm();
    if (props.rowId) {
      await loadDetail(props.rowId);
    }
  },
);

function closeModal() {
  emit('update:open', false);
}

function buildPayload() {
  const sendUnix = form.SendTime ? form.SendTime.unix() : 0;
  const now = dayjs().unix();
  const langText = [
    {
      Content: form.Content,
      LangGroupId: defaultLangGroupId.value,
      Title: form.Title.trim(),
    },
  ];
  const payload: Record<string, unknown> = {
    Icon: form.Icon,
    LangText: JSON.stringify(langText),
    PackageIds: form.PackageIds,
    PlayerList: normalizePlayerList(form.PlayerList),
    // 无发送时间时不视为立即发送
    SendNow: Boolean(form.SendTime) && sendUnix <= now,
    SendTime: sendUnix,
    Type: form.Type,
  };
  if (isEdit.value && form.Id) {
    payload.Id = form.Id;
  } else {
    payload.Hash = createRequestHash();
  }
  return payload;
}

async function handleSubmit() {
  if (isReadonly.value) {
    closeModal();
    return;
  }
  if (!form.Title.trim()) {
    message.warning('请填写邮件标题');
    return;
  }
  if (isRichTextEmpty(form.Content)) {
    message.warning('请填写邮件内容');
    return;
  }
  if (!normalizePlayerList(form.PlayerList) && !form.PackageIds.length) {
    message.warning('请填写收件账号或选择产品包');
    return;
  }
  submitting.value = true;
  try {
    const payload = buildPayload();
    if (isEdit.value) {
      await updateGameEmailApi(payload);
      message.success('邮件已更新');
    } else {
      await createGameEmailApi(payload);
      message.success('邮件已创建');
    }
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :ok-button-props="isReadonly ? { style: { display: 'none' } } : undefined"
    :open="open"
    :title="modalTitle"
    :width="640"
    cancel-text="关闭"
    destroy-on-close
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form :label-col="{ span: 5 }" class="mt-2" layout="horizontal">
      <Form.Item label="邮件类型" required>
        <Select
          v-model:value="form.Type"
          :disabled="isReadonly"
          :options="typeOptions"
        />
      </Form.Item>
      <Form.Item label="重要程度">
        <Select
          v-model:value="form.Icon"
          :disabled="isReadonly"
          :options="iconOptions"
        />
      </Form.Item>
      <Form.Item label="产品包">
        <Select
          v-model:value="form.PackageIds"
          :disabled="isReadonly"
          :loading="loading"
          :options="
            packageOptions.map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            }))
          "
          allow-clear
          mode="multiple"
          placeholder="空=按账号；可选产品包"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="收件账号">
        <Input.TextArea
          v-model:value="form.PlayerList"
          :disabled="isReadonly"
          :rows="3"
          allow-clear
          placeholder="多个账号用逗号或换行分隔"
        />
      </Form.Item>
      <Form.Item label="发送时间">
        <DatePicker
          v-model:value="form.SendTime"
          :disabled="isReadonly"
          show-time
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="标题" required>
        <Input
          v-model:value="form.Title"
          :disabled="isReadonly"
          allow-clear
          placeholder="邮件标题"
        />
      </Form.Item>
      <Form.Item label="内容" required>
        <RichTextEditor
          v-model="form.Content"
          :disabled="isReadonly"
          placeholder="请输入邮件内容"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
