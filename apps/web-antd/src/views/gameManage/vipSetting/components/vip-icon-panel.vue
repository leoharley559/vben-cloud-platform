<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Spin,
  Table,
  Upload,
  message,
} from 'ant-design-vue';

import {
  addVipIconsTemplateApi,
  deleteVipIconsTemplateApi,
  fetchVipIconTemplateListApi,
  fetchVipIconsApi,
  resetVipIconsTemplateApi,
  updateVipIconsApi,
  updateVipIconsTemplateNameApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';

defineOptions({ name: 'VipIconPanel' });

interface TemplateItem {
  TemplateId: number | string;
  TemplateName: string;
}

interface IconRow {
  Badge?: string;
  BadgeUnqualified?: string;
  BasicIcon?: string;
  BulletScreenSfxBody?: string;
  BulletScreenSfxHead?: string;
  BulletScreenSfxTail?: string;
  ChatroomEntryBg?: string;
  ChatroomEntrySfx?: string;
  ColorCode?: string;
  TemplateId?: number | string;
  TemplateName?: string;
  VipLevel?: number | string;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();
const canAdd = computed(() => checkPermission(13158));
const canRename = computed(() => checkPermission(13159));
const canDelete = computed(() => checkPermission(13160));
const canEditIcon = computed(() => checkPermission(13161));
const canReset = computed(() => checkPermission(13162));

const loading = ref(false);
const saving = ref(false);
const templates = ref<TemplateItem[]>([]);
const chooseScheme = ref<number | string>('');
const tableData = ref<IconRow[]>([]);

const schemeModalOpen = ref(false);
const editModalOpen = ref(false);
const schemeForm = reactive({
  name: '',
  title: '新增自定义方案',
  type: 'add' as 'add' | 'edit',
});
const editForm = reactive<IconRow>({
  Badge: '',
  BadgeUnqualified: '',
  BasicIcon: '',
  ColorCode: '#999999',
  VipLevel: '',
});

const imageFields = [
  { key: 'BasicIcon', label: '基础图标', required: true },
  { key: 'Badge', label: '徽章', required: true },
  { key: 'BadgeUnqualified', label: '未达徽章', required: true },
] as const;

const columns = [
  { dataIndex: 'VipLevel', key: 'VipLevel', title: 'VIP等级', width: 90 },
  {
    key: 'BasicIcon',
    title: '基础图标',
    width: 100,
  },
  { key: 'Badge', title: '徽章', width: 100 },
  { key: 'BadgeUnqualified', title: '未达徽章', width: 100 },
  { dataIndex: 'ColorCode', key: 'ColorCode', title: '色值', width: 100 },
  { key: 'action', title: '操作', width: 90 },
];

const currentTemplate = computed(() =>
  templates.value.find(
    (item) => String(item.TemplateId) === String(chooseScheme.value),
  ),
);

const isDefaultTemplate = computed(() => Number(chooseScheme.value) === 1);

function normalizeTemplates(data: unknown): TemplateItem[] {
  const list = Array.isArray(data)
    ? data
    : ((data as { Items?: unknown[] })?.Items ?? []);
  return (list as Array<Record<string, unknown>>).map((item) => ({
    TemplateId: (item.TemplateId ?? item.Id) as number | string,
    TemplateName: String(item.TemplateName ?? item.Name ?? ''),
  }));
}

async function loadTemplates(preferId?: number | string) {
  loading.value = true;
  try {
    const data = await fetchVipIconTemplateListApi();
    templates.value = normalizeTemplates(data);
    if (!templates.value.length) {
      chooseScheme.value = '';
      tableData.value = [];
      return;
    }
    const prefer =
      preferId !== undefined &&
      templates.value.some(
        (item) => String(item.TemplateId) === String(preferId),
      )
        ? preferId
        : templates.value[0]!.TemplateId;
    chooseScheme.value = prefer;
    const iconData = await fetchVipIconsApi({ TemplateId: prefer });
    tableData.value = Array.isArray(iconData) ? iconData : [];
  } finally {
    loading.value = false;
  }
}

async function handleSchemeChange(value: number | string) {
  chooseScheme.value = value;
  loading.value = true;
  try {
    const data = await fetchVipIconsApi({ TemplateId: value });
    tableData.value = Array.isArray(data) ? data : [];
  } finally {
    loading.value = false;
  }
}

async function loadIcons() {
  if (chooseScheme.value === '' || chooseScheme.value === undefined) {
    tableData.value = [];
    return;
  }
  loading.value = true;
  try {
    const data = await fetchVipIconsApi({ TemplateId: chooseScheme.value });
    tableData.value = Array.isArray(data) ? data : [];
  } finally {
    loading.value = false;
  }
}

function openAddScheme() {
  schemeForm.type = 'add';
  schemeForm.title = '新增自定义方案';
  schemeForm.name = '';
  schemeModalOpen.value = true;
}

function openRenameScheme() {
  schemeForm.type = 'edit';
  schemeForm.title = '修改方案名称';
  schemeForm.name = currentTemplate.value?.TemplateName || '';
  schemeModalOpen.value = true;
}

async function submitScheme() {
  const name = schemeForm.name.trim();
  if (!name) {
    message.warning('请输入方案名称');
    return;
  }
  saving.value = true;
  try {
    if (schemeForm.type === 'add') {
      await addVipIconsTemplateApi({ TemplateName: name });
      message.success('新增成功');
      schemeModalOpen.value = false;
      await loadTemplates();
    } else {
      await updateVipIconsTemplateNameApi({
        TemplateId: chooseScheme.value,
        TemplateName: name,
      });
      message.success('重命名成功');
      schemeModalOpen.value = false;
      await loadTemplates(chooseScheme.value);
    }
  } finally {
    saving.value = false;
  }
}

function handleDelete() {
  Modal.confirm({
    content: `确认删除方案「${currentTemplate.value?.TemplateName}」？`,
    onOk: async () => {
      await deleteVipIconsTemplateApi({ TemplateId: chooseScheme.value });
      message.success('删除成功');
      await loadTemplates();
    },
    title: '删除方案',
  });
}

function handleReset() {
  Modal.confirm({
    content: '确认将该方案恢复为默认值？',
    onOk: async () => {
      await resetVipIconsTemplateApi({ TemplateId: chooseScheme.value });
      message.success('已恢复默认值');
      await loadIcons();
    },
    title: '恢复默认值',
  });
}

function openEdit(row: IconRow) {
  Object.assign(editForm, {
    ...row,
    ColorCode: row.ColorCode || '#999999',
  });
  editModalOpen.value = true;
}

function beforeUpload(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !['jpg', 'jpeg', 'png'].includes(ext)) {
    message.warning('仅支持 JPG/PNG 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size > 500 * 1024) {
    message.warning('图片大小不能超过 500KB');
    return Upload.LIST_IGNORE;
  }
  return true;
}

function handleUploadChange(key: string, info: UploadChangeParam) {
  const response = info.file.response as
    | { Code?: number | string; Data?: { url?: string }; Msg?: string }
    | undefined;
  if (info.file.status === 'done') {
    if (String(response?.Code) === '200' && response?.Data?.url) {
      editForm[key] = response.Data.url;
      return;
    }
    message.error(response?.Msg || '图片上传失败');
  }
}

async function submitEdit() {
  for (const field of imageFields) {
    if (field.required && !editForm[field.key]) {
      message.warning(`请上传${field.label}`);
      return;
    }
  }
  if (!editForm.ColorCode) {
    message.warning('请填写色值');
    return;
  }
  saving.value = true;
  try {
    await updateVipIconsApi({ ...editForm });
    message.success('保存成功');
    editModalOpen.value = false;
    await loadIcons();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadTemplates();
});
</script>

<template>
  <Spin :spinning="loading">
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Radio.Group
        v-if="templates.length"
        :value="chooseScheme"
        button-style="solid"
        option-type="button"
        @update:value="handleSchemeChange"
      >
        <Radio.Button
          v-for="item in templates"
          :key="item.TemplateId"
          :value="item.TemplateId"
        >
          {{ item.TemplateName }}
        </Radio.Button>
      </Radio.Group>
      <Button v-if="canAdd" type="primary" @click="openAddScheme">
        新增方案
      </Button>
    </div>

    <div v-if="currentTemplate" class="mb-4 flex flex-wrap items-center gap-2">
      <span class="rounded bg-blue-500 px-3 py-1 text-white">方案名称</span>
      <span class="rounded border border-blue-500 px-3 py-1">
        {{ currentTemplate.TemplateName }}
      </span>
      <Space>
        <Button
          v-if="canRename && !isDefaultTemplate"
          size="small"
          @click="openRenameScheme"
        >
          重命名
        </Button>
        <Button
          v-if="canDelete && !isDefaultTemplate"
          danger
          size="small"
          @click="handleDelete"
        >
          删除
        </Button>
        <Button v-if="canReset" size="small" @click="handleReset">
          恢复默认值
        </Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="tableData"
      :pagination="false"
      row-key="VipLevel"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template
          v-if="
            column.key === 'BasicIcon' ||
            column.key === 'Badge' ||
            column.key === 'BadgeUnqualified'
          "
        >
          <img
            v-if="record[column.key]"
            :alt="String(column.key)"
            class="h-10 w-10 rounded border object-contain"
            :src="getServiceImageUrl(String(record[column.key]))"
          />
          <span v-else class="text-gray-400">-</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            v-if="canEditIcon"
            size="small"
            type="link"
            @click="openEdit(record)"
          >
            编辑
          </Button>
        </template>
      </template>
    </Table>

    <div class="mt-3 text-xs text-gray-400">
      已支持方案 CRUD、恢复默认、基础图标/徽章/色值编辑；聊天室 SVGA
      特效待下一迭代。
    </div>

    <Modal
      v-model:open="schemeModalOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="schemeForm.title"
      @ok="submitScheme"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="方案名称" required>
          <Input
            v-model:value="schemeForm.name"
            maxlength="40"
            placeholder="请输入方案名称"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editModalOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="`编辑 VIP${editForm.VipLevel} 图标`"
      width="560px"
      @ok="submitEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item
          v-for="field in imageFields"
          :key="field.key"
          :label="field.label"
          :required="field.required"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="editForm[field.key]"
              alt=""
              class="h-14 w-14 rounded border object-contain"
              :src="getServiceImageUrl(String(editForm[field.key]))"
            />
            <Upload
              :action="getUploadMd5ImageUrl()"
              :before-upload="beforeUpload"
              :show-upload-list="false"
              @change="(info) => handleUploadChange(field.key, info)"
            >
              <Button size="small">
                {{ editForm[field.key] ? '重新上传' : '上传' }}
              </Button>
            </Upload>
            <Button
              v-if="editForm[field.key]"
              danger
              size="small"
              @click="editForm[field.key] = ''"
            >
              删除
            </Button>
          </div>
        </Form.Item>
        <Form.Item label="色值" required>
          <div class="flex items-center gap-2">
            <input v-model="editForm.ColorCode" type="color" class="h-8 w-10" />
            <Input v-model:value="editForm.ColorCode" style="width: 140px" />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </Spin>
</template>
