<script lang="ts" setup>
import type {
  FormInstance,
  TableColumnsType,
  UploadFile,
} from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type {
  PackageManageId,
  ShelfPlatform,
} from '#/api/gameManage/package-manage';

import { computed, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';

import { getProjectConfigApi } from '#/api/core/project';
import {
  fetchChannelCountriesApi,
  fetchChannelIosEnterprisePackagesApi,
  fetchChannelPackageOptionsApi,
} from '#/api/gameManage/channel';
import {
  createShelfPackageApi,
  deleteShelfPackageApi,
  fetchShelfPackageListApi,
  updateShelfPackageApi,
} from '#/api/gameManage/package-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';
import { formatOperationDateTime } from '#/utils/operation-status';

import ShelfAnalyticsModal from './shelf-analytics-modal.vue';

defineOptions({ name: 'ShelfPackagePanel' });

const props = defineProps<{ platform: ShelfPlatform }>();

interface ShelfRow {
  AppName?: string;
  AppPackageConfigId: PackageManageId;
  AppUploadUrl?: string;
  AppUrl?: string;
  BanCountries?: string;
  BanCountryInstallOpt?: number;
  CreateTime?: number | string;
  EnterprisePackageId?: PackageManageId;
  FirebaseSecret?: string;
  IsAnalyticsSet?: boolean;
  PackageId?: PackageManageId;
  ThirdCustomIosUrl?: string;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();
const isIos = computed(() => props.platform === 'ios');
const canView = computed(() =>
  checkPermission(isIos.value ? 13_189 : 13_190),
);
const canCreate = computed(() =>
  checkPermission(isIos.value ? 13_193 : 13_194),
);
const canEdit = computed(() =>
  checkPermission(isIos.value ? 13_198 : 13_201),
);
const canDelete = computed(() =>
  checkPermission(isIos.value ? 13_195 : 13_196),
);

const filters = reactive({
  AppName: '',
  AppUrl: '',
  DateRange: undefined as [Dayjs, Dayjs] | undefined,
});
const rows = ref<ShelfRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const listLoading = ref(false);
const formVisible = ref(false);
const formMode = ref<'create' | 'update'>('create');
const formLoading = ref(false);
const formRef = ref<FormInstance>();
const packageOptions = ref<Array<Record<string, unknown>>>([]);
const countryOptions = ref<Array<Record<string, unknown>>>([]);
const enterpriseOptions = ref<Array<Record<string, unknown>>>([]);
const analyticsVisible = ref(false);
const analyticsId = ref<PackageManageId>();
const firebaseFiles = ref<UploadFile[]>([]);
const countrySelectOptions = computed(() =>
  countryOptions.value.map((item) => {
    const gameName = String(item.FieldNameForGame || '');
    const adminName = String(item.FieldName || '');
    return {
      ...item,
      DisplayName: [gameName, adminName].filter(Boolean).join('-'),
    };
  }),
);

const model = reactive({
  AppName: '',
  AppPackageConfigId: 0 as PackageManageId,
  AppUploadUrl: '',
  AppUrl: '',
  BanCountries: [] as Array<number | string>,
  BanCountryInstallOpt: 3,
  EnterprisePackageId: '' as PackageManageId,
  FirebaseSecret: '',
  PackageId: '' as PackageManageId,
  ThirdCustomIosUrl: '',
});

const columns: TableColumnsType<ShelfRow> = [
  { dataIndex: 'seq', key: 'seq', title: '序号', width: 70 },
  { dataIndex: 'AppName', key: 'AppName', title: '上架包名称' },
  { dataIndex: 'AppUrl', key: 'AppUrl', title: '上架包编码' },
  { dataIndex: 'analytics', key: 'analytics', title: '数据统计', width: 120 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '创建时间', width: 175 },
  {
    dataIndex: 'actions',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 160,
  },
];

const formRules = computed(() => ({
  AppName: [{ message: '请输入上架包名称', required: true }],
  AppUploadUrl: [{ message: '请输入上架包地址', required: true }],
  AppUrl: [{ message: '请输入上架包编码', required: true }],
  ...(isIos.value
    ? { PackageId: [{ message: '请选择使用产品', required: true }] }
    : {}),
}));

function buildQuery() {
  const [begin, end] = filters.DateRange || [];
  return {
    AppName: filters.AppName.trim(),
    AppUrl: filters.AppUrl.trim(),
    BeginTime: begin?.startOf('day').unix() || '',
    EndTime: end?.endOf('day').unix() || '',
    Page: page.value,
    PageSize: pageSize.value,
    Sort: '',
  };
}

async function loadList() {
  if (!canView.value) return;
  listLoading.value = true;
  try {
    const result = await fetchShelfPackageListApi(
      props.platform,
      buildQuery(),
    );
    rows.value = (result.Items || []) as ShelfRow[];
    total.value = Number(result.Pagination?.MaxCount || rows.value.length);
  } finally {
    listLoading.value = false;
  }
}

async function loadOptions() {
  const tasks: Promise<unknown>[] = [
    fetchChannelPackageOptionsApi().then((result) => {
      packageOptions.value = result;
    }),
    fetchChannelCountriesApi({ Page: 1, PageSize: 9999 }).then((result) => {
      countryOptions.value = result.Items || [];
    }),
  ];
  await Promise.all(tasks);
}

async function loadEnterpriseOptions(packageId: PackageManageId) {
  enterpriseOptions.value = [];
  if (!packageId) return;
  const result = await fetchChannelIosEnterprisePackagesApi(packageId);
  enterpriseOptions.value = result.Items || [];
  if (
    model.EnterprisePackageId &&
    !enterpriseOptions.value.some(
      (item) => String(item.Id) === String(model.EnterprisePackageId),
    )
  ) {
    model.EnterprisePackageId = '';
  }
}

function handleSearch() {
  page.value = 1;
  void loadList();
}

function handleReset() {
  filters.AppName = '';
  filters.AppUrl = '';
  filters.DateRange = undefined;
  page.value = 1;
  void loadList();
}

function resetModel() {
  Object.assign(model, {
    AppName: '',
    AppPackageConfigId: 0,
    AppUploadUrl: '',
    AppUrl: '',
    BanCountries: [],
    BanCountryInstallOpt: 3,
    EnterprisePackageId: '',
    FirebaseSecret: '',
    PackageId: '',
    ThirdCustomIosUrl: '',
  });
  firebaseFiles.value = [];
}

function openCreate() {
  formMode.value = 'create';
  resetModel();
  formVisible.value = true;
}

function openEdit(row: ShelfRow) {
  formMode.value = 'update';
  Object.assign(model, {
    ...row,
    BanCountries: row.BanCountries
      ? row.BanCountries.split(',').map(Number)
      : [],
    BanCountryInstallOpt: Number(row.BanCountryInstallOpt || 3),
    EnterprisePackageId: row.EnterprisePackageId || '',
    FirebaseSecret: String(row.FirebaseSecret || ''),
    PackageId: row.PackageId || '',
    ThirdCustomIosUrl: String(row.ThirdCustomIosUrl || ''),
  });
  firebaseFiles.value = [];
  formVisible.value = true;
  if (isIos.value && model.PackageId) {
    void loadEnterpriseOptions(model.PackageId);
  }
}

function openEditFromTable(row: Record<string, unknown>) {
  openEdit(row as unknown as ShelfRow);
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

async function submitForm() {
  await formRef.value?.validate();
  if (
    isIos.value &&
    model.BanCountryInstallOpt === 1 &&
    !validUrl(model.ThirdCustomIosUrl)
  ) {
    message.warning('请输入正确的三方超级签地址');
    return;
  }
  if (
    isIos.value &&
    model.BanCountryInstallOpt === 2 &&
    !model.EnterprisePackageId
  ) {
    message.warning('请选择企业包');
    return;
  }
  const payload: Record<string, unknown> = {
    ...model,
    BanCountries: model.BanCountries.join(','),
  };
  if (model.BanCountryInstallOpt === 1) {
    payload.EnterprisePackageId = '';
    payload.IosPackageId = '';
  } else if (model.BanCountryInstallOpt === 2) {
    payload.IosPackageId = '';
    payload.ThirdCustomIosUrl = '';
  } else {
    payload.EnterprisePackageId = '';
    payload.IosPackageId = '';
    payload.ThirdCustomIosUrl = '';
  }
  formLoading.value = true;
  try {
    if (formMode.value === 'create') {
      payload.Hash = createRequestHash();
      await createShelfPackageApi(props.platform, payload);
      message.success('新增成功');
      page.value = 1;
    } else {
      await updateShelfPackageApi(props.platform, payload);
      message.success('编辑成功');
    }
    formVisible.value = false;
    await Promise.all([loadList(), getProjectConfigApi()]);
  } finally {
    formLoading.value = false;
  }
}

function confirmDelete(row: ShelfRow) {
  Modal.confirm({
    content: `确认删除上架包“${row.AppName || row.AppPackageConfigId}”吗？`,
    okButtonProps: { danger: true },
    okText: '删除',
    title: '删除确认',
    async onOk() {
      await deleteShelfPackageApi(props.platform, row.AppPackageConfigId);
      message.success('删除成功');
      await Promise.all([loadList(), getProjectConfigApi()]);
    },
  });
}

function confirmDeleteFromTable(row: Record<string, unknown>) {
  confirmDelete(row as unknown as ShelfRow);
}

function openAnalytics(row: ShelfRow) {
  analyticsId.value = row.AppPackageConfigId;
  analyticsVisible.value = true;
}

function openAnalyticsFromTable(row: Record<string, unknown>) {
  openAnalytics(row as unknown as ShelfRow);
}

function handlePackageChange(value: unknown) {
  void loadEnterpriseOptions(value as PackageManageId);
}

async function readFirebaseFile(file: UploadFile) {
  const raw = file.originFileObj;
  if (!raw) return false;
  try {
    model.FirebaseSecret = await raw.text();
    firebaseFiles.value = [file];
    message.success('推送配置文件已读取');
  } catch {
    message.error('JSON 文件读取失败');
  }
  return false;
}

function changePage(nextPage: number, nextSize: number) {
  page.value = nextPage;
  pageSize.value = nextSize;
  void loadList();
}

void loadOptions();
void loadList();
</script>

<template>
  <div>
    <Alert
      v-if="!canView"
      :message="`当前账号无${isIos ? 'iOS' : 'Android'}上架包查看权限`"
      show-icon
      type="warning"
    />
    <template v-else>
      <div class="query-panel">
        <div class="query-fields">
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filters.AppName"
              allow-clear
              @press-enter="handleSearch"
              style="width: 220px"
              placeholder="请输入上架包名称"
            >
              <template #addonBefore>上架包名称</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filters.AppUrl"
              allow-clear
              @press-enter="handleSearch"
              style="width: 220px"
              placeholder="请输入上架包编码"
            >
              <template #addonBefore>上架包编码</template>
            </Input>
          </div>
          <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filters.DateRange" />
        </div>
        </div>
        <div class="query-actions">
          <Space>
            <Button type="primary" :loading="listLoading" @click="handleSearch">
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
            <Button v-if="canCreate" type="primary" ghost @click="openCreate">
              新增
            </Button>
          </Space>
        </div>
      </div>

      <div class="table-card">
        <Table
          :columns="columns"
          :data-source="rows"
          :loading="listLoading"
          :pagination="{
            current: page,
            pageSize,
            showSizeChanger: true,
            total,
          }"
          row-key="AppPackageConfigId"
          :scroll="{ x: 900 }"
          @change="(pagination) => changePage(pagination.current || 1, pagination.pageSize || 20)"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'seq'">
              {{ (page - 1) * pageSize + index + 1 }}
            </template>
            <template v-else-if="column.key === 'analytics'">
              <Button type="link" @click="openAnalyticsFromTable(record)">
                <Tag :color="record.IsAnalyticsSet ? 'green' : 'red'">
                  {{ record.IsAnalyticsSet ? '已设置' : '未设置' }}
                </Tag>
              </Button>
            </template>
            <template v-else-if="column.key === 'CreateTime'">
              {{ formatOperationDateTime(record.CreateTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="openEditFromTable(record)"
                >
                  编辑
                </Button>
                <Button
                  v-if="canDelete"
                  danger
                  size="small"
                  type="link"
                  @click="confirmDeleteFromTable(record)"
                >
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </template>

    <Modal
      v-model:open="formVisible"
      :confirm-loading="formLoading"
      destroy-on-close
      :title="formMode === 'create' ? '新增上架包' : '编辑上架包'"
      width="900px"
      @cancel="resetModel"
      @ok="submitForm"
    >
      <Form
        ref="formRef"
        class="pt-3"
        layout="vertical"
        :model="model"
        :rules="formRules"
      >
        <div class="form-grid">
          <Form.Item v-if="isIos" label="使用产品" name="PackageId">
            <Select
              v-model:value="model.PackageId"
              :disabled="formMode === 'update'"
              :field-names="{ label: 'PackageName', value: 'Id' }"
              :options="packageOptions"
              placeholder="请选择产品"
              show-search
              @change="handlePackageChange"
            />
          </Form.Item>
          <Form.Item label="上架包名称" name="AppName">
            <Input
              v-model:value="model.AppName"
              :maxlength="500"
              placeholder="请输入上架包名称"
            />
          </Form.Item>
          <Form.Item label="上架包编码" name="AppUrl">
            <Input
              v-model:value="model.AppUrl"
              :maxlength="500"
              placeholder="请输入上架包编码"
            />
          </Form.Item>
          <Form.Item label="上架包地址" name="AppUploadUrl">
            <Input
              v-model:value="model.AppUploadUrl"
              placeholder="请输入上架包上传/下载地址"
            />
            <div class="field-hint">请填写可直接访问的完整下载地址</div>
          </Form.Item>
          <Form.Item label="推送配置文件">
            <div class="mb-2">
              <Tag :color="model.FirebaseSecret ? 'green' : 'red'">
                {{ model.FirebaseSecret ? '已设置' : '未设置' }}
              </Tag>
            </div>
            <Upload
              v-model:file-list="firebaseFiles"
              accept=".json,application/json"
              :before-upload="readFirebaseFile"
              :max-count="1"
            >
              <Button>导入 JSON 文件</Button>
            </Upload>
            <div class="field-hint">目前仅支持 Firebase 推送配置</div>
          </Form.Item>
        </div>

        <template v-if="isIos">
          <div class="section-title">屏蔽区域与安装方式</div>
          <div class="form-grid mt-4">
            <Form.Item label="屏蔽区域设置">
              <Select
                v-model:value="model.BanCountries"
                :field-names="{
                  label: 'DisplayName',
                  value: 'Id',
                }"
                mode="multiple"
                :options="countrySelectOptions"
                placeholder="请选择屏蔽区域"
                show-search
              />
            </Form.Item>
            <Form.Item label="屏蔽区域安装选项">
              <Radio.Group v-model:value="model.BanCountryInstallOpt">
                <Space direction="vertical">
                  <Radio :value="3">不可安装</Radio>
                  <Radio :value="1">三方超级签地址</Radio>
                  <Radio :value="2">企业包</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              v-if="model.BanCountryInstallOpt === 1"
              label="三方超级签地址"
              required
            >
              <Input
                v-model:value="model.ThirdCustomIosUrl"
                placeholder="例如：https://example.com"
              />
            </Form.Item>
            <Form.Item
              v-if="model.BanCountryInstallOpt === 2"
              label="企业包选择"
              required
            >
              <Select
                v-model:value="model.EnterprisePackageId"
                :field-names="{ label: 'IosName', value: 'Id' }"
                :options="enterpriseOptions"
                placeholder="请选择企业包"
              />
            </Form.Item>
          </div>
        </template>
      </Form>
    </Modal>

    <ShelfAnalyticsModal
      v-model:open="analyticsVisible"
      :id="analyticsId"
      :platform="platform"
      @saved="loadList"
    />
  </div>
</template>

<style scoped>
.query-panel {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  margin-bottom: 18px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.query-fields {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 12px;
}

.query-actions {
  flex: none;
}

.table-card {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.section-title {
  padding-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px dashed hsl(var(--border));
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

@media (max-width: 900px) {
  .query-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .query-fields,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
