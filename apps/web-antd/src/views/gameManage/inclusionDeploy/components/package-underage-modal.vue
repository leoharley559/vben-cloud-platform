<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type {
  PackageId,
  PackageUnderageConfig,
  PackageUnderagePayload,
} from '#/types/package-config';

import { computed, reactive, ref, watch } from 'vue';

import {
  Form,
  InputNumber,
  message,
  Modal,
  Switch,
  Tabs,
} from 'ant-design-vue';

import {
  fetchPackageUnderageConfigApi,
  updatePackageUnderageConfigApi,
} from '#/api/gameManage/package';
import RichTextEditor from '#/components/global/rich-text-editor.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';

type UnderageType = 1 | 2;
type LangEntry = {
  [key: string]: unknown;
  Content: string;
  LangGrouopId?: PackageId;
  LangGroupId: PackageId;
  Logo?: string;
};

const props = defineProps<{
  open: boolean;
  packageId?: PackageId;
  packageName?: string;
  type: UnderageType;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { projectConfig } = useCloudPermission();
const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);
const activeGroup = ref('');
const configId = ref<PackageId>('');
const form = reactive<{
  Age?: number;
  IsOpen: boolean;
  LangText: Record<string, LangEntry>;
}>({
  Age: undefined,
  IsOpen: false,
  LangText: {},
});

const title = computed(
  () =>
    `${props.type === 1 ? '未成年登录设置' : '未成年注册设置'}${
      props.packageName ? ` · ${props.packageName}` : ''
    }`,
);

const languageGroups = computed(() => {
  const groups = projectConfig.value?.LangGroup || [];
  if (groups.length > 0) {
    return groups.map((group) => ({
      id: String(group.Id),
      label:
        String(
          (group as Record<string, unknown>).Name ||
            (Array.isArray(group.Languages)
              ? group.Languages.join(' / ')
              : group.Languages),
        ) || `语言组 ${group.Id}`,
    }));
  }
  return [{ id: '0', label: '默认语言' }];
});

function parseLangText(value: PackageUnderageConfig['LangText']) {
  if (!value) {
    return {};
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed.map((item, index) => [
          String(item.LangGroupId ?? item.LangGrouopId ?? index),
          item,
        ]),
      );
    }
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeLangText(value: PackageUnderageConfig['LangText']) {
  const parsed = parseLangText(value) as Record<string, Partial<LangEntry>>;
  const merged = { ...parsed } as Record<string, LangEntry>;
  languageGroups.value.forEach(({ id }) => {
    const source = parsed[id] || {};
    const groupId = Number.isNaN(Number(id)) ? id : Number(id);
    merged[id] = {
      ...source,
      Content: String(source.Content || ''),
      LangGrouopId: source.LangGrouopId ?? groupId,
      LangGroupId: source.LangGroupId ?? groupId,
      ...(props.type === 1 ? { Logo: String(source.Logo || '') } : {}),
    };
  });
  form.LangText = merged;
}

async function loadConfig() {
  if (!props.packageId) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchPackageUnderageConfigApi({
      Id: props.packageId,
      Type: props.type,
    });
    configId.value = result.Id || '';
    form.Age =
      result.Age === '' || result.Age === undefined
        ? undefined
        : Number(result.Age);
    form.IsOpen = Boolean(result.IsOpen);
    normalizeLangText(result.LangText);
    activeGroup.value = languageGroups.value[0]?.id || '0';
    formRef.value?.clearValidate();
  } finally {
    loading.value = false;
  }
}

function close() {
  emit('update:open', false);
}

function validateAge(_rule: unknown, value?: number) {
  return value === undefined ||
    (Number.isInteger(value) && value >= 1 && value <= 99)
    ? Promise.resolve()
    : Promise.reject(new Error('年龄须为 1 至 99 的整数'));
}

async function submit() {
  if (!props.packageId) {
    return;
  }
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const payload: PackageUnderagePayload = {
      Age: form.Age,
      Id: configId.value,
      IsOpen: form.IsOpen,
      LangText: JSON.stringify(Object.values(form.LangText)),
      PackageId: props.packageId,
      Type: props.type,
    };
    await updatePackageUnderageConfigApi(payload);
    message.success('未成年设置保存成功');
    emit('success');
    close();
  } finally {
    submitting.value = false;
  }
}

watch([() => props.open, () => props.type], ([open]) => {
  if (open) {
    void loadConfig();
  }
});
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    :title="title"
    width="min(760px, calc(100vw - 32px))"
    @cancel="close"
    @ok="submit"
  >
    <Form ref="formRef" :model="form" layout="vertical">
      <div class="grid gap-3 sm:grid-cols-2">
        <Form.Item label="启用设置" name="IsOpen">
          <Switch v-model:checked="form.IsOpen" :disabled="loading" />
        </Form.Item>
        <Form.Item
          label="年龄限制"
          name="Age"
          :rules="[
            { required: form.IsOpen, message: '请输入年龄限制' },
            { validator: validateAge },
          ]"
        >
          <InputNumber
            v-model:value="form.Age"
            :disabled="loading"
            :max="99"
            :min="1"
            :precision="0"
            placeholder="请输入年龄"
            style="width: 100%"
          />
        </Form.Item>
      </div>

      <Tabs v-model:active-key="activeGroup" size="small" type="line">
        <Tabs.TabPane
          v-for="group in languageGroups"
          :key="group.id"
          :tab="group.label"
        >
          <template v-if="form.LangText[group.id]">
            <Form.Item v-if="type === 1" label="Logo">
              <VoucherImageField
                v-model="form.LangText[group.id]!.Logo"
                :disabled="loading"
                dimension-hint="建议 200×200，PNG/JPG/JPEG，不超过 500K"
                :max-size-kb="500"
                :preview-height="100"
                :preview-width="100"
              />
            </Form.Item>
            <Form.Item label="条款及提示内容">
              <RichTextEditor
                v-model="form.LangText[group.id]!.Content"
                :min-height="220"
              />
            </Form.Item>
          </template>
        </Tabs.TabPane>
      </Tabs>
    </Form>
  </Modal>
</template>
