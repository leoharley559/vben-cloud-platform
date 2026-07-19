<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { computed, ref, watch } from 'vue';

import { Button, Image, Modal, Space, Upload, message } from 'ant-design-vue';

import { updateEasyRechargeImageApi } from '#/api/operationManage/easy-recharge';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  getServiceImageUrl,
  getUploadMd5ImageUrl,
  splitImagePaths,
} from '#/utils/media';

defineOptions({ name: 'EasyRechargeVoucherCell' });

const props = defineProps<{
  gameOrderId?: string;
  id?: number | string;
  imageUrl?: string;
}>();

const emit = defineEmits<{
  success: [];
}>();

const { checkPermission } = useCloudPermission();

const canPreview = computed(() => checkPermission(11731));
const canEdit = computed(() => checkPermission(11730));

const previewOpen = ref(false);
const editOpen = ref(false);
const saving = ref(false);
const previewImages = ref<string[]>([]);
const uploadedPaths = ref<string[]>([]);
const previewFileList = ref<string[]>([]);

const imageCount = computed(() => splitImagePaths(props.imageUrl).length);

watch(editOpen, (open) => {
  if (!open) {
    return;
  }
  uploadedPaths.value = splitImagePaths(props.imageUrl);
  previewFileList.value = uploadedPaths.value.map((path) =>
    getServiceImageUrl(path),
  );
});

function openPreview() {
  previewImages.value = splitImagePaths(props.imageUrl).map((path) =>
    getServiceImageUrl(path),
  );
  previewOpen.value = true;
}

function openEdit() {
  editOpen.value = true;
}

function handleUploadChange(info: UploadChangeParam) {
  const response = info.file.response as
    | { Code?: number | string; Data?: { url?: string }; Msg?: string }
    | undefined;

  if (info.file.status === 'done') {
    if (String(response?.Code) === '200' && response?.Data?.url) {
      uploadedPaths.value.push(response.Data.url);
      previewFileList.value.push(getServiceImageUrl(response.Data.url));
      return;
    }
    message.error(response?.Msg || '图片上传失败');
  }
}

function beforeUpload(file: File) {
  const extension = /\.(?:jpg|jpeg|png)$/i.test(file.name);
  if (!extension) {
    message.error('仅支持 JPG/PNG 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size / 1024 / 1024 >= 20) {
    message.error('图片大小不能超过 20MB');
    return Upload.LIST_IGNORE;
  }
  if (uploadedPaths.value.length >= 5) {
    message.error('最多上传 5 张图片');
    return Upload.LIST_IGNORE;
  }
  return true;
}

async function handleSaveImage() {
  if (!props.id || !props.gameOrderId) {
    return;
  }
  if (!uploadedPaths.value.length) {
    message.warning('请先上传凭证图片');
    return;
  }

  saving.value = true;
  try {
    await updateEasyRechargeImageApi({
      GameOrderId: props.gameOrderId,
      Id: props.id,
      ImageUrl: uploadedPaths.value.join(','),
    });
    message.success('凭证保存成功');
    editOpen.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Space v-if="canPreview || canEdit" :size="4">
    <Button
      v-if="canPreview && imageCount"
      size="small"
      type="link"
      @click="openPreview"
    >
      预览({{ imageCount }})
    </Button>
    <Button v-if="canEdit" size="small" type="link" @click="openEdit">
      {{ imageUrl ? '编辑' : '上传' }}
    </Button>
  </Space>
  <span v-else>{{ imageUrl ? '有凭证' : '-' }}</span>

  <Modal
    v-model:open="previewOpen"
    :footer="null"
    title="凭证预览"
    width="720px"
  >
    <div class="flex flex-wrap gap-3">
      <Image
        v-for="(url, index) in previewImages"
        :key="`${url}-${index}`"
        :src="url"
        :width="160"
      />
    </div>
  </Modal>

  <Modal
    v-model:open="editOpen"
    :confirm-loading="saving"
    title="上传凭证"
    @ok="handleSaveImage"
  >
    <Upload
      :action="getUploadMd5ImageUrl()"
      list-type="picture-card"
      name="upfile"
      :show-upload-list="false"
      @change="handleUploadChange"
      :before-upload="beforeUpload"
    >
      <div v-if="previewFileList.length < 5">上传</div>
    </Upload>
    <div class="mt-3 flex flex-wrap gap-3">
      <Image
        v-for="(url, index) in previewFileList"
        :key="`${url}-${index}`"
        :src="url"
        :width="100"
      />
    </div>
  </Modal>
</template>
