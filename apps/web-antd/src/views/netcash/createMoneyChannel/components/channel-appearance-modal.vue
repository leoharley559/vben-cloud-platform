<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import type { ChannelDetail, ChannelRow } from '#/types/channel-config';
import type { LogoGroupOption } from '#/types/netcash';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  Image,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Tabs,
  Upload,
} from 'ant-design-vue';

import { CHANNEL_UPLOAD_URL } from '#/api/gameManage/channel';
import {
  fetchChannelLogoGroupsApi,
  fetchMoneyChannelDetailApi,
  updateMoneyChannelApi,
} from '#/api/netcash/create-money-channel';
import { useProjectConfig } from '#/composables/use-project-config';

defineOptions({ name: 'ChannelAppearanceModal' });

const props = defineProps<{ open: boolean; row: ChannelRow }>();
const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

type LangAppearance = {
  [key: string]: unknown;
  LangGroupId?: number | string;
  LoadingPictureUrl?: string;
};

const { projectConfig } = useProjectConfig();
const loading = ref(false);
const saving = ref(false);
const activeTab = ref('loading');
const detail = ref<ChannelDetail>({});
const logoGroups = ref<LogoGroupOption[]>([]);
const logoMode = ref<'custom' | 'default'>('default');
const logoGroupId = ref<number | string>();
const countdown = ref(5);
const pictures = reactive(['', '', '', '']);
const langText = ref<Record<string, LangAppearance>>({});

const pictureLabels = [
  { label: 'Android 启动图', size: '1080 × 2340' },
  { label: 'iOS 刘海屏启动图', size: '1080 × 2340' },
  { label: '游戏 Loading 背景图', size: '1080 × 2340' },
  { label: '游戏 Loading 素材图', size: '1080 × 2340' },
];
const countdownOptions = [
  { label: '关闭', value: 0 },
  ...[1, 2, 3, 4, 5].map((value) => ({
    label: `${value} 秒`,
    value,
  })),
];
const resourceBase = computed(() =>
  String(projectConfig.value?.CommonResourceDomainUrl || ''),
);

watch(
  () => props.open,
  (open) => {
    if (open) void initialize();
  },
);

function parseObject(value: unknown) {
  if (value && typeof value === 'object')
    return value as Record<string, LangAppearance>;
  if (typeof value !== 'string' || !value || value === 'null') return {};
  try {
    const parsed = JSON.parse(value) as
      | LangAppearance[]
      | Record<string, LangAppearance>;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed.map((item, index) => [String(item.LangGroupId ?? index), item]),
      );
    }
    return parsed || {};
  } catch {
    return {};
  }
}

function parsePictures(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value) return [];
  try {
    const first = JSON.parse(value);
    if (Array.isArray(first)) return first.map(String);
    if (typeof first === 'string') {
      const second = JSON.parse(first);
      return Array.isArray(second) ? second.map(String) : [];
    }
  } catch {
    // Malformed legacy appearance data is treated as an empty setting.
  }
  return [];
}

function defaultLanguageKey() {
  const groups = projectConfig.value?.LangGroup ?? [];
  return String(groups[0]?.Id ?? Object.keys(langText.value)[0] ?? '0');
}

function splitCountdown(value: string) {
  const [path, query = ''] = value.split('?');
  const parsed = new URLSearchParams(query).get('countdown');
  countdown.value = parsed === null ? 5 : Number(parsed);
  return path || '';
}

async function initialize() {
  if (!props.row.Id) return;
  loading.value = true;
  activeTab.value = 'loading';
  try {
    const [current, logos] = await Promise.all([
      fetchMoneyChannelDetailApi(props.row.Id),
      // 旧接口参数名虽为 ChannelId，实际传渠道记录 Id。
      fetchChannelLogoGroupsApi(props.row.Id),
    ]);
    if (current.Id == null) {
      message.error('渠道详情为空，无法加载外观设置');
      emit('update:open', false);
      return;
    }
    detail.value = { ...current };
    logoGroups.value = logos?.Items ?? [];
    const currentLogo = Number(current?.LogoGroupId ?? 0);
    logoMode.value = currentLogo > 0 ? 'custom' : 'default';
    logoGroupId.value = currentLogo > 0 ? currentLogo : undefined;
    langText.value = parseObject(current?.LangText);
    const appearance = langText.value[defaultLanguageKey()] ?? {};
    const values = parsePictures(appearance.LoadingPictureUrl);
    pictures.splice(
      0,
      pictures.length,
      splitCountdown(String(values[2] || '')),
      String(values[1] || ''),
      '',
      '',
    );
    pictures[0] = String(values[0] || '');
    pictures[1] = String(values[1] || '');
    pictures[2] = splitCountdown(String(values[2] || ''));
    pictures[3] = String(values[3] || '');
  } finally {
    loading.value = false;
  }
}

function absoluteUrl(path: string) {
  if (/^(?:data:|blob:|https?:\/\/)/i.test(path)) return path;
  return `${resourceBase.value}${path}`;
}

function beforeUpload(file: File) {
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    message.error('仅支持 JPEG、JPG、PNG 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size / 1024 / 1024 > 1) {
    message.error('图片大小不能超过 1MB');
    return Upload.LIST_IGNORE;
  }
  return true;
}

function onUpload(index: number, info: UploadChangeParam) {
  if (info.file.status === 'error') {
    message.error('图片上传失败');
    return;
  }
  if (info.file.status !== 'done') return;
  const response = info.file.response as
    | undefined
    | {
        Data?: { url?: string };
        FileName?: string;
        Path?: string;
        Url?: string;
      };
  const url =
    response?.Data?.url ||
    response?.Url ||
    response?.Path ||
    response?.FileName;
  if (!url) return void message.error('上传响应中没有图片地址');
  pictures[index] = url;
  message.success('图片上传成功');
}

function serializedLangText() {
  const key = defaultLanguageKey();
  const next = { ...langText.value };
  next[key] = {
    ...next[key],
    LangGroupId: next[key]?.LangGroupId ?? key,
    LoadingPictureUrl: JSON.stringify([
      pictures[0],
      pictures[1],
      pictures[2] ? `${pictures[2]}?countdown=${countdown.value}` : '',
      pictures[3],
    ]),
  };
  return JSON.stringify(Object.values(next));
}

async function submit() {
  if (logoMode.value === 'custom' && !logoGroupId.value) {
    return void message.error('请选择 Logo 组方案');
  }
  saving.value = true;
  try {
    await updateMoneyChannelApi({
      ...detail.value,
      LangText: serializedLangText(),
      LogoGroupId: logoMode.value === 'default' ? 0 : logoGroupId.value,
      PromoterAdminId: detail.value.AdminId,
    });
    message.success('Loading / Logo 设置已保存');
    emit('update:open', false);
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :mask-closable="false"
    :open="open"
    title="Loading / Logo 设置"
    width="760px"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <Spin :spinning="loading">
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane key="loading" tab="Loading 图">
          <div class="picture-grid">
            <div
              v-for="(item, index) in pictureLabels"
              :key="item.label"
              class="picture-card"
            >
              <b>{{ item.label }}</b>
              <div class="picture-preview">
                <Image
                  v-if="pictures[index]"
                  :src="absoluteUrl(pictures[index]!)"
                />
                <span v-else>未设置</span>
              </div>
              <Space>
                <Upload
                  :action="CHANNEL_UPLOAD_URL"
                  :before-upload="beforeUpload"
                  name="upfile"
                  :show-upload-list="false"
                  @change="(info) => onUpload(index, info)"
                >
                  <Button size="small">上传</Button>
                </Upload>
                <Button
                  v-if="pictures[index]"
                  danger
                  size="small"
                  @click="pictures[index] = ''"
                >
                  删除
                </Button>
              </Space>
              <small>建议尺寸：{{ item.size }}，最大 1MB</small>
            </div>
          </div>
          <Form.Item class="mt-4" label="背景图倒计时">
            <Select
              v-model:value="countdown"
              :options="countdownOptions"
              style="width: 180px"
            />
          </Form.Item>
        </Tabs.TabPane>
        <Tabs.TabPane key="logo" tab="Logo">
          <Form layout="vertical">
            <Form.Item label="Logo 来源">
              <Radio.Group v-model:value="logoMode">
                <Radio value="default">使用产品默认设置</Radio>
                <Radio value="custom">使用自定义 Logo 组</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item v-if="logoMode === 'custom'" label="Logo 组方案">
              <Select
                v-model:value="logoGroupId"
                :options="
                  logoGroups.map((item) => ({
                    label:
                      item.TemplateName ||
                      item.Name ||
                      String(item.LogoGroupId || item.Id || ''),
                    value: item.LogoGroupId ?? item.Id,
                  }))
                "
                placeholder="请选择 Logo 组方案"
                show-search
              />
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Spin>
  </Modal>
</template>

<style scoped>
.picture-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.picture-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.picture-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  overflow: hidden;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  border-radius: 6px;
}

.picture-preview :deep(img) {
  width: 100%;
  height: 160px;
  object-fit: contain;
}

.picture-card small {
  color: hsl(var(--muted-foreground));
}
</style>
