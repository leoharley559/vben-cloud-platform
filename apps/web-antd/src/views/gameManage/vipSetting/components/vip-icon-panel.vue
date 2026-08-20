<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Image,
  Input,
  message,
  Modal,
  Radio,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createVipIconTemplateApi,
  deleteVipIconTemplateApi,
  fetchVipIconsApi,
  fetchVipIconTemplateListApi,
  resetVipIconTemplateApi,
  updateVipIconApi,
  updateVipIconTemplateApi,
} from '#/api/gameManage/vip-setting';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getServiceImageUrl } from '#/utils/media';

import VipAssetField from './vip-asset-field.vue';

defineOptions({ name: 'VipIconPanel' });

type IconRow = Record<string, number | string | undefined>;
interface Template {
  TemplateId: number | string;
  TemplateName: string;
}

const imageColumns = [
  'BasicIcon',
  'Badge',
  'BadgeUnqualified',
  'ChatroomEntryBg',
];
const bulletFields = [
  'BulletScreenSfxHead',
  'BulletScreenSfxBody',
  'BulletScreenSfxTail',
];
const editFields = [
  {
    hint: 'PNG/JPG，500KB 内，建议 36×18',
    key: 'BasicIcon',
    label: 'VIP 图标',
    required: true,
  },
  {
    hint: 'PNG/JPG，500KB 内，建议 75×85',
    key: 'Badge',
    label: 'VIP 徽章（符合）',
    required: true,
  },
  {
    hint: 'PNG/JPG，500KB 内，建议 75×85',
    key: 'BadgeUnqualified',
    label: 'VIP 徽章（不符合）',
    required: true,
  },
  {
    hint: 'PNG/JPG，500KB 内，建议 210×40',
    key: 'ChatroomEntryBg',
    label: '聊天室入口背景图',
  },
  {
    accept: '.svga,.gif',
    hint: 'SVGA/GIF，500KB 内，建议 160×160；SVGA 需 2.0+',
    image: false,
    key: 'ChatroomEntrySfx',
    label: '聊天室入口特效',
  },
  {
    hint: 'PNG/JPG，500KB 内，建议 64×112',
    key: 'BulletScreenSfxHead',
    label: '弹幕特效（前段）',
  },
  {
    hint: 'PNG/JPG，500KB 内，建议 416×112',
    key: 'BulletScreenSfxBody',
    label: '弹幕特效（中段）',
  },
  {
    hint: 'PNG/JPG，500KB 内，建议 96×112',
    key: 'BulletScreenSfxTail',
    label: '弹幕特效（后段）',
  },
];
const columns: TableColumnsType<IconRow> = [
  { key: 'index', title: '序号', width: 60 },
  { key: 'VipLevel', title: 'VIP 等级', width: 100 },
  { key: 'BasicIcon', title: 'VIP 图标', width: 130 },
  { key: 'Badge', title: 'VIP 徽章（符合）', width: 150 },
  { key: 'BadgeUnqualified', title: 'VIP 徽章（不符合）', width: 160 },
  { key: 'ChatroomEntryBg', title: '聊天室入口背景图', width: 170 },
  { key: 'ChatroomEntrySfx', title: '聊天室入口特效', width: 160 },
  { key: 'bullet', title: '弹幕特效', width: 220 },
  { key: 'ColorCode', title: '欢迎语色码', width: 140 },
  { fixed: 'right', key: 'action', title: '操作', width: 90 },
];

const { checkPermission } = useCloudPermission();
const loading = ref(false);
const saving = ref(false);
const templates = ref<Template[]>([]);
const activeId = ref<number | string>(1);
const rows = ref<IconRow[]>([]);
const form = reactive<IconRow>({});
const editVisible = ref(false);
const templateVisible = ref(false);
const templateMode = ref<'create' | 'edit'>('create');
const templateName = ref('');
const currentTemplate = computed(() =>
  templates.value.find(
    (item) => String(item.TemplateId) === String(activeId.value),
  ),
);
const defaultTemplate = computed(() => Number(activeId.value) === 1);

async function loadTemplates() {
  const data = await fetchVipIconTemplateListApi();
  const list = Array.isArray(data) ? data : [];
  // 方案列表偶发夹带图标字段，按 TemplateId 去重
  const map = new Map<string, Template>();
  for (const item of list) {
    const row = item as Template;
    if (row?.TemplateId === undefined || row?.TemplateId === null) continue;
    const key = String(row.TemplateId);
    if (!map.has(key)) {
      map.set(key, {
        TemplateId: row.TemplateId,
        TemplateName: row.TemplateName || `方案 ${row.TemplateId}`,
      });
    }
  }
  templates.value = [...map.values()];
  if (
    !templates.value.some(
      (item) => String(item.TemplateId) === String(activeId.value),
    )
  ) {
    activeId.value = templates.value[0]?.TemplateId || 1;
  }
}
async function loadRows() {
  loading.value = true;
  try {
    const data = await fetchVipIconsApi({ TemplateId: activeId.value });
    rows.value = Array.isArray(data) ? (data as IconRow[]) : [];
  } finally {
    loading.value = false;
  }
}
function openEdit(row: IconRow) {
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, structuredClone(row));
  form.ColorCode ||= '#999999';
  editVisible.value = true;
}
async function saveIcon() {
  if (
    !form.BasicIcon ||
    !form.Badge ||
    !form.BadgeUnqualified ||
    !form.ColorCode
  ) {
    message.warning('VIP 图标、符合/不符合徽章和欢迎语色码为必填项');
    return;
  }
  saving.value = true;
  try {
    await updateVipIconApi({ ...form });
    editVisible.value = false;
    message.success('编辑成功');
    await loadRows();
  } finally {
    saving.value = false;
  }
}
function openTemplate(mode: 'create' | 'edit') {
  templateMode.value = mode;
  templateName.value =
    mode === 'edit' ? currentTemplate.value?.TemplateName || '' : '';
  templateVisible.value = true;
}
async function saveTemplate() {
  const name = templateName.value.trim();
  if (!name) {
    message.warning('请输入方案名称');
    return;
  }
  saving.value = true;
  try {
    await (templateMode.value === 'create'
      ? createVipIconTemplateApi({ TemplateName: name })
      : updateVipIconTemplateApi({
          TemplateId: activeId.value,
          TemplateName: name,
        }));
    templateVisible.value = false;
    message.success('保存成功');
    await loadTemplates();
    await loadRows();
  } finally {
    saving.value = false;
  }
}
function removeTemplate() {
  Modal.confirm({
    content: '删除后不可恢复，确定删除当前方案吗？',
    okType: 'danger',
    onOk: async () => {
      await deleteVipIconTemplateApi({ TemplateId: activeId.value });
      activeId.value = 1;
      await loadTemplates();
      await loadRows();
      message.success('删除成功');
    },
    title: '删除方案',
  });
}
function resetTemplate() {
  Modal.confirm({
    content: '当前方案的图标将恢复为默认值，确定继续吗？',
    onOk: async () => {
      await resetVipIconTemplateApi({ TemplateId: activeId.value });
      await loadRows();
      message.success('恢复成功');
    },
    title: '恢复默认值',
  });
}
onMounted(async () => {
  await loadTemplates();
  await loadRows();
});
</script>

<template>
  <Card class="scheme-card" size="small">
    <div class="toolbar">
      <Radio.Group
        v-model:value="activeId"
        button-style="solid"
        @change="loadRows"
      >
        <Radio.Button
          v-for="item in templates"
          :key="item.TemplateId"
          :value="item.TemplateId"
        >
          {{ item.TemplateName }}
        </Radio.Button>
      </Radio.Group>
      <Button
        v-if="checkPermission(13_158)"
        type="primary"
        @click="openTemplate('create')"
      >
        新增自定义方案
      </Button>
    </div>
    <div v-if="currentTemplate" class="scheme-info">
      <Space>
        <span class="scheme-label">方案名称</span>
        <strong>{{ currentTemplate.TemplateName }}</strong>
        <Button
          v-if="!defaultTemplate && checkPermission(13_159)"
          size="small"
          @click="openTemplate('edit')"
        >
          修改名称
        </Button>
        <Button
          v-if="!defaultTemplate && checkPermission(13_160)"
          danger
          size="small"
          @click="removeTemplate"
        >
          删除方案
        </Button>
      </Space>
      <Button v-if="checkPermission(13_162)" @click="resetTemplate">
恢复默认值
</Button>
    </div>
  </Card>
  <Table
    bordered
    :columns="columns"
    :data-source="rows"
    :loading="loading"
    :pagination="false"
    :row-key="(row) => `${row.TemplateId}-${row.VipLevel ?? ''}`"
    :scroll="{ x: 1400 }"
    size="small"
  >
    <template #bodyCell="{ column, record, index }">
      <span v-if="column.key === 'index'">{{ index + 1 }}</span>
      <span v-else-if="column.key === 'VipLevel'">VIP{{ record.VipLevel ?? index }}</span>
      <template v-else-if="imageColumns.includes(String(column.key))">
        <Image
          v-if="record[String(column.key)]"
          :height="72"
          :src="getServiceImageUrl(record[String(column.key)])"
          :width="100"
          style="object-fit: contain"
        />
        <span v-else>-</span>
      </template>
      <a
        v-else-if="column.key === 'ChatroomEntrySfx' && record.ChatroomEntrySfx"
        :href="getServiceImageUrl(record.ChatroomEntrySfx)"
        target="_blank"
      >
        查看 SVGA/GIF
      </a>
      <Space v-else-if="column.key === 'bullet'" size="small">
        <Image
          v-for="key in bulletFields"
          :key="key"
          :height="64"
          :src="getServiceImageUrl(record[key])"
          :width="48"
          style="object-fit: contain"
        />
      </Space>
      <div v-else-if="column.key === 'ColorCode'" class="color-cell">
        <i :style="{ background: record.ColorCode }"></i>{{ record.ColorCode || '-' }}
      </div>
      <Button
        v-else-if="column.key === 'action' && checkPermission(13_161)"
        size="small"
        type="primary"
        @click="openEdit(record)"
      >
        编辑
      </Button>
    </template>
  </Table>

  <Modal
    v-model:open="editVisible"
    :confirm-loading="saving"
    title="编辑 VIP 图标"
    width="920px"
    @ok="saveIcon"
  >
    <div class="form-scroll">
      <Form :label-col="{ span: 5 }">
        <Form.Item
          v-for="item in editFields"
          :key="item.key"
          :label="item.label"
          :required="item.required"
        >
          <VipAssetField
            v-model="form[item.key] as string"
            :accept="item.accept"
            :hint="item.hint"
            :image="item.image"
          />
        </Form.Item>
        <Form.Item label="欢迎语色码" required>
          <div class="color-row">
            <input v-model="form.ColorCode" class="native-color" type="color" />
            <Input
              v-model:value="form.ColorCode as string"
              style="width: 140px"
            />
          </div>
        </Form.Item>
      </Form>
    </div>
  </Modal>
  <Modal
    v-model:open="templateVisible"
    :confirm-loading="saving"
    :title="templateMode === 'create' ? '新增自定义方案' : '修改方案名称'"
    @ok="saveTemplate"
  >
    <Form layout="vertical">
      <Form.Item label="方案名称" required>
        <Input
          v-model:value="templateName"
          :maxlength="50"
          placeholder="请输入方案名称"
          @press-enter="saveTemplate"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.scheme-card {
  margin-bottom: 14px;
  border-radius: 10px;
}

.toolbar,
.scheme-info {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.toolbar {
  align-items: flex-start;
}

.scheme-info {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid hsl(var(--border));
}

.scheme-label {
  padding: 7px 12px;
  color: white;
  background: hsl(var(--primary));
  border-radius: 6px 0 0 6px;
}

.color-cell,
.color-row {
  display: flex;
  gap: 9px;
  align-items: center;
}

.color-cell i {
  width: 20px;
  height: 20px;
  border: 1px solid hsl(var(--border));
}

.native-color {
  width: 42px;
  height: 34px;
  padding: 2px;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.form-scroll {
  max-height: 72vh;
  padding-right: 10px;
  overflow: auto;
}
</style>
