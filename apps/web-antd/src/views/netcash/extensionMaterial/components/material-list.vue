<script lang="ts" setup>
import type { UploadChangeParam, UploadProps } from 'ant-design-vue';

import type {
  ExtensionMaterialItem,
  ExtensionMaterialListQuery,
  PromotionConfItem,
  PromotionMaterialPayload,
} from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  DatePicker,
  Empty,
  Form,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Upload,
} from 'ant-design-vue';

import {
  createPromotionMaterialApi,
  deletePromotionMaterialApi,
  fetchExtensionMaterialListApi,
  fetchPromotionConfAllApi,
  updatePromotionMaterialApi,
} from '#/api/netcash/extension-material';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';

defineOptions({ name: 'ExtensionMaterialList' });

type Id = number | string;
interface LangGroup {
  Default?: boolean;
  Id: Id;
  Languages: string[];
  Name: string;
}

const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();
const loading = ref(false);
const saving = ref(false);
const rows = ref<ExtensionMaterialItem[]>([]);
const total = ref(0);
const themes = ref<PromotionConfItem[]>([]);
const sizes = ref<PromotionConfItem[]>([]);
const dateRange = ref();
const modalOpen = ref(false);
const editing = ref(false);
const uploads = ref<string[]>([]);
const pendingUploads = ref(0);
const statusSavingId = ref<Id>();

const query = reactive<ExtensionMaterialListQuery>({
  BeginTime: undefined,
  EndTime: undefined,
  LangGroupId: undefined,
  PackageId: undefined,
  Page: 1,
  PageSize: 20,
  SizeId: undefined,
  Sort: '-CreateTime',
  Status: undefined,
  ThemeId: undefined,
});
const form = reactive<PromotionMaterialPayload>({
  ImagePath: '',
  LangGroupId: undefined,
  NewSize: '',
  NewTheme: '',
  PackageId: undefined,
  SizeId: undefined,
  Status: 1,
  ThemeId: undefined,
  createSize: '1',
  createTheme: '1',
});

const packages = computed(() => {
  const map = new Map<string, { label: string; value: Id }>();
  for (const item of cloudStore.projectConfig?.RealPackageIdNameMap || []) {
    if (item.PackageId === undefined || item.PackageId === null) continue;
    map.set(String(item.PackageId), {
      label: item.PackageName || String(item.PackageId),
      value: item.PackageId,
    });
  }
  return [...map.values()];
});
const langGroups = computed<LangGroup[]>(() =>
  (cloudStore.projectConfig?.LangGroup || [])
    .filter((item) => item.Id !== undefined && item.Id !== null)
    .map((item) => ({
      Default: item.Default,
      Id: item.Id,
      Languages: Array.isArray(item.Languages)
        ? item.Languages.filter(Boolean)
        : String(item.Languages || '')
            .split(/\s*,\s*/)
            .filter(Boolean),
      Name: String(item.Name || `语言组 ${item.Id}`),
    })),
);
const defaultLangGroupId = computed(
  () =>
    langGroups.value.find((item) => item.Default)?.Id ??
    langGroups.value[0]?.Id,
);
const activeLanguages = computed(() => {
  const id = modalOpen.value ? form.LangGroupId : query.LangGroupId;
  return langGroups.value.find((item) => String(item.Id) === String(id))
    ?.Languages;
});
const selectedSizeText = computed(() =>
  form.createSize === '1'
    ? String(
        sizes.value.find((item) => String(item.Id) === String(form.SizeId))
          ?.Value || '',
      )
    : String(form.NewSize || ''),
);
const expectedSize = computed(() => {
  const match = selectedSizeText.value
    .trim()
    .match(/^([1-9]\d*)\s*[*×xX]\s*([1-9]\d*)$/);
  return match ? [Number(match[1]), Number(match[2])] : null;
});

function options(items: PromotionConfItem[]) {
  return items
    .filter((item) => item.Id !== undefined && item.Id !== null)
    .map((item) => ({ label: item.Value || String(item.Id), value: item.Id! }));
}

async function loadOptions() {
  const [themeResult, sizeResult] = await Promise.all([
    fetchPromotionConfAllApi(2),
    fetchPromotionConfAllApi(1),
  ]);
  themes.value = Array.isArray(themeResult?.Items) ? themeResult.Items : [];
  sizes.value = Array.isArray(sizeResult?.Items) ? sizeResult.Items : [];
}

async function loadList() {
  loading.value = true;
  try {
    const result = await fetchExtensionMaterialListApi({ ...query });
    rows.value = Array.isArray(result?.Items) ? result.Items : [];
    total.value = Number(result?.Pagination?.MaxCount ?? rows.value.length ?? 0);
  } finally {
    loading.value = false;
  }
}

function search() {
  if (dateRange.value?.length === 2) {
    query.BeginTime = dateRange.value[0].unix();
    query.EndTime = dateRange.value[1].unix();
  } else {
    query.BeginTime = undefined;
    query.EndTime = undefined;
  }
  query.Page = 1;
  loadList();
}

function resetQuery() {
  Object.assign(query, {
    BeginTime: undefined,
    EndTime: undefined,
    LangGroupId: defaultLangGroupId.value,
    PackageId: undefined,
    Page: 1,
    PageSize: 20,
    SizeId: undefined,
    Sort: '-CreateTime',
    Status: undefined,
    ThemeId: undefined,
  });
  dateRange.value = null;
  loadList();
}

function resetForm() {
  Object.assign(form, {
    Id: undefined,
    Image: '',
    ImagePath: '',
    LangGroupId: defaultLangGroupId.value,
    NewSize: '',
    NewTheme: '',
    PackageId: undefined,
    SizeId: undefined,
    Status: 1,
    ThemeId: undefined,
    createSize: '1',
    createTheme: '1',
  });
  uploads.value = [];
  pendingUploads.value = 0;
}

function openCreate() {
  editing.value = false;
  resetForm();
  modalOpen.value = true;
}

function openEdit(item: ExtensionMaterialItem) {
  editing.value = true;
  resetForm();
  Object.assign(form, {
    Id: item.Id,
    Image: item.ImagePath || item.Image || '',
    ImagePath: item.ImagePath || item.Image || '',
    LangGroupId: item.LangGroupId ?? defaultLangGroupId.value,
    PackageId: item.PackageId,
    SizeId: item.SizeId,
    Status: item.Status ?? 1,
    ThemeId: item.ThemeId,
  });
  uploads.value = item.ImagePath ? [item.ImagePath] : [];
  modalOpen.value = true;
}

function clearChoice(kind: 'size' | 'theme') {
  if (kind === 'theme') {
    form.ThemeId = undefined;
    form.NewTheme = '';
  } else {
    form.SizeId = undefined;
    form.NewSize = '';
    uploads.value = [];
  }
}

async function validateFile(file: File) {
  if (!/\.(jpe?g|png)$/i.test(file.name)) {
    message.warning('仅支持 JPG、JPEG、PNG 格式');
    return Upload.LIST_IGNORE;
  }
  if (file.size >= 2 * 1024 * 1024) {
    message.warning('图片大小必须小于 2MB');
    return Upload.LIST_IGNORE;
  }
  if (uploads.value.length + pendingUploads.value >= 10) {
    message.warning('每次最多上传 10 张图片');
    return Upload.LIST_IGNORE;
  }
  if (!expectedSize.value) {
    message.warning('请先选择或输入有效尺寸，例如 750*1334');
    return Upload.LIST_IGNORE;
  }
  const valid = await new Promise<boolean>((resolve) => {
    const image = document.createElement('img');
    const url = URL.createObjectURL(file);
    image.addEventListener('load', () => {
      URL.revokeObjectURL(url);
      resolve(
        image.width === expectedSize.value?.[0] &&
          image.height === expectedSize.value?.[1],
      );
    });
    image.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(false);
    });
    image.src = url;
  });
  if (!valid) {
    message.warning(
      `图片尺寸必须为 ${expectedSize.value[0]}×${expectedSize.value[1]}`,
    );
    return Upload.LIST_IGNORE;
  }
  pendingUploads.value += 1;
  return true;
}

function handleUpload(info: UploadChangeParam) {
  if (info.file.status === 'done') {
    pendingUploads.value = Math.max(0, pendingUploads.value - 1);
    const response = info.file.response as
      | undefined
      | {
          Code?: number | string;
          Data?: string | { url?: string };
          Msg?: string;
          respond?: { url?: string };
          status?: number | string;
        };
    const path =
      (typeof response?.Data === 'string'
        ? response.Data
        : response?.Data?.url) || response?.respond?.url;
    const ok = String(response?.Code ?? response?.status ?? '') === '200';
    if (ok && path) uploads.value.push(path);
    else message.error(response?.Msg || '图片上传失败');
  } else if (info.file.status === 'error') {
    pendingUploads.value = Math.max(0, pendingUploads.value - 1);
    message.error('图片上传失败');
  }
}

function removeUpload(index: number) {
  uploads.value.splice(index, 1);
}

function validateForm() {
  if (form.PackageId === undefined || form.PackageId === null)
    return '请选择产品';
  if (
    (form.createTheme === '1' &&
      (form.ThemeId === undefined || form.ThemeId === null)) ||
    (form.createTheme === '2' && !String(form.NewTheme || '').trim())
  )
    return '请选择或输入主题';
  if (
    (form.createSize === '1' &&
      (form.SizeId === undefined || form.SizeId === null)) ||
    (form.createSize === '2' && !expectedSize.value)
  )
    return '请选择或输入有效尺寸';
  if (
    (form.LangGroupId === undefined || form.LangGroupId === null) &&
    langGroups.value.length > 0
  )
    return '请选择语言组';
  if (
    form.createTheme === '2' &&
    themes.value.some(
      (item) =>
        String(item.Value || '').trim() === String(form.NewTheme || '').trim(),
    )
  )
    return '主题名称已存在';
  if (
    form.createSize === '2' &&
    sizes.value.some(
      (item) =>
        String(item.Value || '')
          .replaceAll(/[×xX]/g, '*')
          .replaceAll(/\s/g, '') ===
        String(form.NewSize || '')
          .replaceAll(/[×xX]/g, '*')
          .replaceAll(/\s/g, ''),
    )
  )
    return '尺寸已存在';
  if (!editing.value && uploads.value.length === 0) return '请至少上传一张图片';
  return '';
}

async function save() {
  const error = validateForm();
  if (error) {
    message.warning(error);
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await updatePromotionMaterialApi({
        Id: form.Id,
        Image: uploads.value[0] || form.Image || '',
        LangGroupId: form.LangGroupId,
        PackageId: form.PackageId,
        SizeId: form.SizeId,
        Status: form.Status,
        ThemeId: form.ThemeId,
      });
    } else {
      const payload: PromotionMaterialPayload = {
        ...form,
        ImagePath: uploads.value.join(','),
      };
      if (payload.createTheme === '2') {
        payload.NewTheme = payload.NewTheme?.trim();
      }
      if (payload.createSize === '2' && expectedSize.value) {
        payload.NewSize = `${expectedSize.value[0]}*${expectedSize.value[1]}`;
      }
      await createPromotionMaterialApi(payload);
    }
    message.success(editing.value ? '编辑成功' : '新增成功');
    modalOpen.value = false;
    await Promise.all([loadOptions(), loadList()]);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item: ExtensionMaterialItem) {
  if (item.Id === undefined || item.Id === null) return;
  Modal.confirm({
    content: '删除后不可恢复，确定删除该素材吗？',
    okType: 'danger',
    onOk: async () => {
      await deletePromotionMaterialApi(item.Id!);
      message.success('删除成功');
      await loadList();
    },
    title: '删除素材',
  });
}

async function toggleStatus(item: ExtensionMaterialItem, checked: boolean) {
  if (item.Id === undefined || item.Id === null) return;
  statusSavingId.value = item.Id;
  try {
    await updatePromotionMaterialApi({
      Id: item.Id,
      Image: item.ImagePath || item.Image || '',
      LangGroupId: item.LangGroupId,
      PackageId: item.PackageId,
      SizeId: item.SizeId,
      Status: checked ? 1 : 0,
      ThemeId: item.ThemeId,
    });
    item.Status = checked ? 1 : 0;
    message.success(checked ? '素材已启用' : '素材已停用');
  } finally {
    statusSavingId.value = undefined;
  }
}

function downloadImage(item: ExtensionMaterialItem) {
  const path = item.ImagePath || item.Image;
  if (!path) return;
  const anchor = document.createElement('a');
  anchor.href = getServiceImageUrl(path);
  anchor.download = path.split('/').pop() || `material-${item.Id || ''}`;
  anchor.rel = 'noopener';
  anchor.target = '_blank';
  anchor.click();
}

function changePage(page: number, pageSize: number) {
  query.Page = pageSize === query.PageSize ? page : 1;
  query.PageSize = pageSize;
  loadList();
}

onMounted(async () => {
  query.LangGroupId = defaultLangGroupId.value;
  await Promise.all([loadOptions(), loadList()]);
});
</script>

<template>
  <div v-if="checkPermission(10_571)" class="material-page">
    <Card size="small" class="filter-card">
      <div class="filter-grid">
        <Select
          v-model:value="query.PackageId"
          allow-clear
          :options="packages"
          placeholder="产品包"
        />
        <Select
          v-model:value="query.ThemeId"
          allow-clear
          :options="options(themes)"
          placeholder="主题"
        />
        <Select
          v-model:value="query.SizeId"
          allow-clear
          :options="options(sizes)"
          placeholder="尺寸"
        />
        <Select
          v-if="langGroups.length > 0"
          v-model:value="query.LangGroupId"
          allow-clear
          :options="
            langGroups.map((item) => ({ label: item.Name, value: item.Id }))
          "
          placeholder="语言组"
        />
        <Select
          v-model:value="query.Status"
          allow-clear
          :options="[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]"
          placeholder="状态"
        />
        <DatePicker.RangePicker v-model:value="dateRange" show-time />
        <Select
          v-model:value="query.Sort"
          :options="[
            { label: '创建时间倒序', value: '-CreateTime' },
            { label: '创建时间正序', value: 'CreateTime' },
            { label: '排序值正序', value: 'Sort' },
          ]"
        />
        <Space wrap>
          <Button type="primary" :loading="loading" @click="search">查询</Button>
          <Button @click="resetQuery">重置</Button>
          <Button
            v-if="checkPermission(10_574)"
            type="primary"
            ghost
            @click="openCreate"
          >
            添加图片
          </Button>
        </Space>
      </div>
      <div v-if="activeLanguages?.length" class="language-tip">
        当前语言组：{{ activeLanguages.join('、') }}
      </div>
    </Card>

    <Spin :spinning="loading">
      <div v-if="rows.length > 0" class="material-grid">
        <Card
          v-for="item in rows"
          :key="String(item.Id)"
          hoverable
          class="material-card"
          size="small"
        >
          <Image
            :height="220"
            :src="getServiceImageUrl(item.ImagePath || item.Image)"
            width="100%"
            class="material-image"
          />
          <div class="material-info">
            <strong>{{ item.PackageName || `产品 ${item.PackageId ?? '-'}` }}</strong>
            <span>{{ item.ThemeName || '-' }} · {{ item.SizeName || '-' }}</span>
            <span>{{ item.LanguageName || `语言组 ${item.LangGroupId ?? '-'}` }}</span>
            <Tag
              v-if="item.Status !== undefined && item.Status !== null"
              :color="Number(item.Status) === 1 ? 'success' : 'default'"
            >
              {{ Number(item.Status) === 1 ? '启用' : '停用' }}
            </Tag>
            <Switch
              v-if="
                checkPermission(10_575) &&
                item.Status !== undefined &&
                item.Status !== null
              "
              :checked="Number(item.Status) === 1"
              :loading="String(statusSavingId) === String(item.Id)"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked) => toggleStatus(item, Boolean(checked))"
            />
          </div>
          <Space wrap>
            <Button size="small" @click="downloadImage(item)">下载</Button>
            <Button
              v-if="checkPermission(10_575)"
              size="small"
              type="primary"
              @click="openEdit(item)"
            >
              编辑
            </Button>
            <Button
              v-if="checkPermission(10_576)"
              danger
              size="small"
              @click="confirmDelete(item)"
            >
              删除
            </Button>
          </Space>
        </Card>
      </div>
      <Empty v-else-if="!loading" description="暂无推广素材" />
    </Spin>

    <div v-if="total > 0" class="pagination">
      <Pagination
        :current="query.Page"
        :page-size="query.PageSize"
        :page-size-options="['10', '20', '50', '100']"
        :show-total="(value: number) => `共 ${value} 条`"
        :total="total"
        show-size-changer
        @change="changePage"
        @show-size-change="changePage"
      />
    </div>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="saving"
      :title="editing ? '编辑素材' : '新增素材'"
      width="820px"
      @ok="save"
    >
      <div class="modal-scroll">
        <Form :label-col="{ span: 5 }">
          <Form.Item label="产品包" required>
            <Select v-model:value="form.PackageId" :options="packages" />
          </Form.Item>
          <Form.Item label="主题" required>
            <Radio.Group
              v-model:value="form.createTheme"
              @change="clearChoice('theme')"
            >
              <Radio value="1">选择已有</Radio>
              <Radio v-if="!editing" value="2">新增主题</Radio>
            </Radio.Group>
            <Select
              v-if="form.createTheme === '1'"
              v-model:value="form.ThemeId"
              class="choice-control"
              :options="options(themes)"
            />
            <Input
              v-else
              v-model:value="form.NewTheme"
              class="choice-control"
              :maxlength="100"
              placeholder="请输入主题名称"
            />
          </Form.Item>
          <Form.Item label="尺寸" required>
            <Radio.Group
              v-model:value="form.createSize"
              @change="clearChoice('size')"
            >
              <Radio value="1">选择已有</Radio>
              <Radio v-if="!editing" value="2">新增尺寸</Radio>
            </Radio.Group>
            <Select
              v-if="form.createSize === '1'"
              v-model:value="form.SizeId"
              class="choice-control"
              :options="options(sizes)"
              @change="uploads = []"
            />
            <Input
              v-else
              v-model:value="form.NewSize"
              class="choice-control"
              placeholder="宽*高，例如 750*1334"
              @change="uploads = []"
            />
          </Form.Item>
          <Form.Item v-if="langGroups.length > 0" label="语言组" required>
            <Select
              v-model:value="form.LangGroupId"
              :options="
                langGroups.map((item) => ({
                  label: item.Name,
                  value: item.Id,
                }))
              "
            />
            <div v-if="activeLanguages?.length" class="language-tip">
              包含语言：{{ activeLanguages.join('、') }}
            </div>
          </Form.Item>
          <Form.Item label="状态">
            <Radio.Group v-model:value="form.Status">
              <Radio :value="1">启用</Radio>
              <Radio :value="0">停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            :label="editing ? '素材预览' : '上传图片'"
            :required="!editing"
          >
            <div class="upload-grid">
              <div
                v-for="(path, index) in uploads"
                :key="`${path}-${index}`"
                class="upload-item"
              >
                <Image :src="getServiceImageUrl(path)" :width="110" />
                <Button
                  v-if="!editing"
                  danger
                  size="small"
                  @click="removeUpload(index)"
                >
                  移除
                </Button>
              </div>
              <Upload
                v-if="!editing && uploads.length < 10"
                :action="getUploadMd5ImageUrl()"
                :before-upload="validateFile as UploadProps['beforeUpload']"
                :show-upload-list="false"
                accept=".jpg,.jpeg,.png"
                name="upfile"
                @change="handleUpload"
              >
                <Button :loading="pendingUploads > 0">
                  上传图片（最多10张）
                </Button>
              </Upload>
            </div>
            <div class="language-tip">
              JPG/PNG，小于 2MB，尺寸必须严格等于 {{ selectedSizeText || '所选尺寸' }}
            </div>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  </div>
  <Empty v-else description="无素材列表查看权限（10571）" />
</template>

<style scoped>
.material-page { display: flex; flex-direction: column; gap: 14px; }
.filter-card { border-radius: 10px; }
.filter-grid { display: grid; grid-template-columns: repeat(4, minmax(150px, 1fr)); gap: 10px; align-items: center; }
.language-tip { margin-top: 6px; font-size: 12px; color: hsl(var(--muted-foreground)); }
.material-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
.material-card { min-width: 0; border-radius: 10px; }
.material-image { object-fit: contain; background: hsl(var(--muted) / 25%); }
.material-info { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; margin: 10px 0; font-size: 13px; }
.pagination { display: flex; justify-content: flex-end; }
.choice-control { width: 100%; margin-top: 10px; }
.modal-scroll { max-height: 70vh; padding-right: 8px; overflow: auto; }
.upload-grid { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.upload-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
@media (max-width: 1100px) { .filter-grid { grid-template-columns: repeat(2, minmax(150px, 1fr)); } }
@media (max-width: 640px) { .filter-grid { grid-template-columns: 1fr; } }
</style>
