<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { computed, ref, watch } from 'vue';

import { Button, Image, Modal, Tabs, Upload, message } from 'ant-design-vue';

import {
  fetchSelfCheckEntryImageApi,
  updateSelfCheckEntryImageApi,
} from '#/api/operationManage/recharge-extra';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';

defineOptions({ name: 'SelfCheckEntryImageModal' });

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { adminInfo } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const loading = ref(false);
const saving = ref(false);
const activeLangGroupId = ref<number | string>('');
const imageMap = ref<Record<string, string>>({});

const langGroups = computed(
  () => projectConfig.value?.LangGroup?.filter((item) => item.Id) || [],
);

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    activeLangGroupId.value = langGroups.value[0]?.Id ?? '';
    await loadImages();
  },
);

async function loadImages() {
  loading.value = true;
  try {
    const admin = adminInfo.value as Record<string, unknown> | undefined;
    const agentId =
      admin?.AdminId ||
      (admin?.Admin as Record<string, unknown>)?.Id ||
      admin?.Id;
    const result = await fetchSelfCheckEntryImageApi({
      AgentId: agentId,
    });
    const items =
      (
        result as {
          Items?: Array<{ IconImage?: string; LangGroupId?: number }>;
        }
      )?.Items ||
      (
        result as {
          respond?: {
            Items?: Array<{ IconImage?: string; LangGroupId?: number }>;
          };
        }
      )?.respond?.Items ||
      [];
    const nextMap: Record<string, string> = {};
    items.forEach((item) => {
      if (item.LangGroupId !== undefined) {
        nextMap[String(item.LangGroupId)] = String(item.IconImage || '');
      }
    });
    imageMap.value = nextMap;
  } finally {
    loading.value = false;
  }
}

function closeModal() {
  emit('update:open', false);
}

function handleUploadChange(info: UploadChangeParam) {
  const response = info.file.response as
    | { Code?: number | string; Data?: { url?: string }; Msg?: string }
    | undefined;
  if (info.file.status === 'done') {
    if (String(response?.Code) === '200' && response?.Data?.url) {
      imageMap.value[String(activeLangGroupId.value)] = response.Data.url;
      return;
    }
    message.error(response?.Msg || '图片上传失败');
  }
}

function beforeUpload(file: File) {
  const extension = /\.gif$/i.test(file.name);
  if (!extension) {
    message.error('仅支持 GIF 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size / 1024 / 1024 >= 2) {
    message.error('图片大小不能超过 2MB');
    return Upload.LIST_IGNORE;
  }
  return true;
}

async function handleSave() {
  saving.value = true;
  try {
    const params = langGroups.value.map((group) => ({
      IconImage: imageMap.value[String(group.Id)] || '',
      LangGroupid: group.Id,
    }));
    await updateSelfCheckEntryImageApi({
      Params: JSON.stringify(params),
    });
    message.success('保存成功');
    closeModal();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    title="自助查单入口图片"
    width="720px"
    @cancel="closeModal"
    @ok="handleSave"
  >
    <div v-if="loading" class="py-8 text-center text-gray-500">加载中...</div>
    <div v-else>
      <Tabs v-model:active-key="activeLangGroupId" type="line" size="small">
        <Tabs.TabPane
          v-for="group in langGroups"
          :key="String(group.Id)"
          :tab="String(group.Languages || group.Id)"
        />
      </Tabs>

      <div class="mt-4 flex items-start gap-4">
        <Upload
          :action="getUploadMd5ImageUrl()"
          :before-upload="beforeUpload"
          :show-upload-list="false"
          name="upfile"
          @change="handleUploadChange"
        >
          <Button type="primary">上传 GIF</Button>
        </Upload>
        <Button
          v-if="imageMap[String(activeLangGroupId)]"
          danger
          @click="imageMap[String(activeLangGroupId)] = ''"
        >
          清除
        </Button>
      </div>

      <div v-if="imageMap[String(activeLangGroupId)]" class="mt-4">
        <Image
          :src="getServiceImageUrl(imageMap[String(activeLangGroupId)])"
          :width="160"
        />
      </div>
    </div>
  </Modal>
</template>
