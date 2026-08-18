<script lang="ts" setup>
import type { TableColumnsType, UploadChangeParam } from 'ant-design-vue';

import { computed, onBeforeUnmount, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Image,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import { CHANNEL_UPLOAD_URL } from '#/api/gameManage/channel';
import {
  bindEnterpriseChannelApi,
  createEnterprisePackageApi,
  deleteEnterprisePackageApi,
  fetchEnterpriseChannelsApi,
  fetchEnterprisePackageGamesApi,
  fetchEnterprisePackageListApi,
  fetchEnterpriseStepApi,
  unbindEnterpriseChannelApi,
  updateEnterprisePackageApi,
} from '#/api/gameManage/package-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'EnterprisePackagePanel' });

interface GameRow {
  BindChannel?: number | string;
  Icon?: number | string;
  Id: number | string;
  PackageName?: string;
  PictureIp?: string;
  [key: string]: unknown;
}

interface EnterpriseRow {
  CountIosNum?: number;
  CountLoginNum?: number;
  CreateTime?: number | string;
  Id: number | string;
  IosName?: string;
  IosVersion?: string;
  Status?: number;
}

const { checkPermission, projectConfig } = useCloudPermission();
const canViewGames = computed(() => checkPermission(12_355));
const canViewProcess = computed(() => checkPermission(10_973));
const canViewList = computed(() => checkPermission(12_387));
const canUpdate = computed(() => checkPermission(12_388));
const canDelete = computed(() => checkPermission(12_393));

const gameQuery = reactive({ PackageName: '', Page: 1, PageSize: 5 });
const games = ref<GameRow[]>([]);
const gameTotal = ref(0);
const gameLoading = ref(false);
const selectedGame = ref<GameRow>();
const channels = ref<Array<Record<string, unknown>>>([]);
const enterpriseRows = ref<EnterpriseRow[]>([]);
const stepInfo = ref<Record<string, unknown>>({});
const detailLoading = ref(false);
const bindVisible = ref(false);
const bindChannelId = ref<number | string>('');
const bindLoading = ref(false);
const uploadVisible = ref(false);
const uploadMode = ref<'create' | 'update'>('create');
const uploadLoading = ref(false);
const uploadForm = reactive({
  Id: '' as number | string,
  IosName: '',
  IosUploadUrl: '',
});
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let stepPollTimer: ReturnType<typeof setTimeout> | undefined;

const maxPage = computed(() =>
  Math.max(1, Math.ceil(gameTotal.value / gameQuery.PageSize)),
);
const resourceBase = computed(() =>
  String(projectConfig.value?.CommonResourceDomainUrl || ''),
);

const enterpriseColumns: TableColumnsType<EnterpriseRow> = [
  { dataIndex: 'IosName', key: 'IosName', title: '企业包名称' },
  { dataIndex: 'IosVersion', key: 'IosVersion', title: '版本' },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '创建/上传时间' },
  { dataIndex: 'Status', key: 'Status', title: '状态' },
  { dataIndex: 'CountIosNum', key: 'CountIosNum', title: '直属推广分配' },
  { dataIndex: 'CountLoginNum', key: 'CountLoginNum', title: '昨日活跃' },
  {
    dataIndex: 'actions',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 180,
  },
];

function absoluteResource(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${resourceBase.value}${path}`;
}

function statusText(status?: number) {
  const map: Record<number, string> = {
    0: '处理中',
    1: '正常',
    2: '掉签',
    3: '版本过低',
    4: '异常',
  };
  return map[Number(status)] || '-';
}

function statusColor(status?: number) {
  const map: Record<number, string> = {
    0: 'processing',
    1: 'green',
    2: 'orange',
    3: 'red',
    4: 'red',
  };
  return map[Number(status)] || 'default';
}

function mergeGameResources(
  rows: Array<Record<string, unknown>>,
  resources: Array<Record<string, unknown>>,
) {
  return rows.map((row) => {
    const resource = resources.find(
      (item) => String(item.Id) === String(row.Icon),
    );
    return {
      ...row,
      PictureIp: resource?.PictureIp || '',
    } as GameRow;
  });
}

async function loadGames(selectFirst = true) {
  if (!canViewGames.value) return;
  gameLoading.value = true;
  try {
    const result = await fetchEnterprisePackageGamesApi(gameQuery);
    const resources = Array.isArray(result.MoreItems?.Resources)
      ? (result.MoreItems.Resources as Array<Record<string, unknown>>)
      : [];
    games.value = mergeGameResources(result.Items || [], resources);
    gameTotal.value = Number(result.Pagination?.MaxCount || games.value.length);
    if (
      selectFirst ||
      !games.value.some(
        (item) => String(item.Id) === String(selectedGame.value?.Id),
      )
    ) {
      selectedGame.value = games.value[0];
    }
    if (selectedGame.value) {
      await loadSelectedGame();
    } else {
      clearSelectedDetail();
    }
  } finally {
    gameLoading.value = false;
  }
}

function clearSelectedDetail() {
  clearTimeout(pollTimer);
  clearTimeout(stepPollTimer);
  channels.value = [];
  enterpriseRows.value = [];
  stepInfo.value = {};
}

async function loadSelectedGame() {
  if (!selectedGame.value) return;
  detailLoading.value = true;
  clearTimeout(pollTimer);
  clearTimeout(stepPollTimer);
  try {
    const packageId = selectedGame.value.Id;
    const tasks: Promise<unknown>[] = [];
    if (canViewList.value) {
      tasks.push(
        fetchEnterprisePackageListApi(packageId).then((result) => {
          enterpriseRows.value = (result.Items || []) as unknown as EnterpriseRow[];
          if (enterpriseRows.value.some((item) => Number(item.Status) === 0)) {
            pollTimer = setTimeout(() => void loadSelectedGame(), 30_000);
          }
        }),
      );
    }
    if (canViewProcess.value) {
      tasks.push(
        fetchEnterpriseStepApi(packageId).then((result) => {
          stepInfo.value = result.Items || {};
          if (!stepInfo.value.DownUrl) {
            stepPollTimer = setTimeout(
              () => void loadSelectedGame(),
              30_000,
            );
          }
        }),
        fetchEnterpriseChannelsApi(packageId).then((result) => {
          channels.value = result;
        }),
      );
    }
    await Promise.all(tasks);
  } finally {
    detailLoading.value = false;
  }
}

async function selectGame(row: GameRow) {
  selectedGame.value = row;
  await loadSelectedGame();
}

async function previousGames() {
  if (gameQuery.Page <= 1) return;
  gameQuery.Page -= 1;
  await loadGames();
}

async function nextGames() {
  if (gameQuery.Page >= maxPage.value) return;
  gameQuery.Page += 1;
  await loadGames();
}

function searchGames() {
  gameQuery.Page = 1;
  void loadGames();
}

function resetGames() {
  gameQuery.PackageName = '';
  gameQuery.Page = 1;
  void loadGames();
}

function openBind() {
  if (!selectedGame.value) {
    message.warning('请先选择产品');
    return;
  }
  bindChannelId.value = '';
  bindVisible.value = true;
}

async function submitBind() {
  if (!selectedGame.value || bindChannelId.value === '') {
    message.warning('请选择默认渠道');
    return;
  }
  bindLoading.value = true;
  try {
    await bindEnterpriseChannelApi({
      ChannelId: bindChannelId.value,
      PackageId: selectedGame.value.Id,
    });
    message.success('绑定成功');
    bindVisible.value = false;
    await loadSelectedGame();
  } finally {
    bindLoading.value = false;
  }
}

function confirmUnbind() {
  if (!selectedGame.value) return;
  Modal.confirm({
    content: '确认重置企业母包并解除当前默认渠道吗？',
    okButtonProps: { danger: true },
    okText: '确认重置',
    title: '操作确认',
    async onOk() {
      await unbindEnterpriseChannelApi({
        ...selectedGame.value,
        BindChannel: '',
      });
      message.success('重置成功');
      await loadSelectedGame();
    },
  });
}

function openUpload(mode: 'create' | 'update', row?: EnterpriseRow) {
  uploadMode.value = mode;
  uploadForm.Id = row?.Id || '';
  uploadForm.IosName = '';
  uploadForm.IosUploadUrl = '';
  uploadVisible.value = true;
}

function openUploadFromTable(
  mode: 'create' | 'update',
  row: Record<string, unknown>,
) {
  openUpload(mode, row as unknown as EnterpriseRow);
}

function handleUploadChange(info: UploadChangeParam) {
  uploadLoading.value = info.file.status === 'uploading';
  if (info.file.status === 'done') {
    const response = info.file.response as
      | undefined
      | {
          Data?: { title?: string; url?: string };
          FileName?: string;
          Path?: string;
          Url?: string;
          title?: string;
        };
    const url =
      response?.Data?.url ||
      response?.Url ||
      response?.Path ||
      response?.FileName ||
      '';
    uploadForm.IosUploadUrl = String(url);
    uploadForm.IosName = String(
      response?.Data?.title || response?.title || info.file.name || '',
    );
    uploadLoading.value = false;
    if (url) {
      message.success('文件上传成功');
    } else {
      message.error('上传响应中没有文件地址');
    }
  } else if (info.file.status === 'error') {
    uploadLoading.value = false;
    message.error('文件上传失败');
  }
}

async function submitUpload() {
  if (!selectedGame.value || !uploadForm.IosUploadUrl) {
    message.warning('请先上传 IPA 文件');
    return;
  }
  uploadLoading.value = true;
  try {
    await (uploadMode.value === 'create'
      ? createEnterprisePackageApi({
          IosName: uploadForm.IosName,
          IosUploadUrl: uploadForm.IosUploadUrl,
          PackageId: selectedGame.value.Id,
        })
      : updateEnterprisePackageApi({
          Id: uploadForm.Id,
          IosName: uploadForm.IosName,
          IosUploadUrl: uploadForm.IosUploadUrl,
        }));
    message.success(uploadMode.value === 'create' ? '上传成功' : '更新成功');
    uploadVisible.value = false;
    await loadSelectedGame();
  } finally {
    uploadLoading.value = false;
  }
}

function confirmDelete(row: EnterpriseRow) {
  Modal.confirm({
    content: `确认删除企业包“${row.IosName || row.Id}”吗？`,
    okButtonProps: { danger: true },
    okText: '删除',
    title: '删除确认',
    async onOk() {
      await deleteEnterprisePackageApi(row.Id);
      message.success('删除成功');
      await loadSelectedGame();
    },
  });
}

function confirmDeleteFromTable(row: Record<string, unknown>) {
  confirmDelete(row as unknown as EnterpriseRow);
}

onBeforeUnmount(() => {
  clearTimeout(pollTimer);
  clearTimeout(stepPollTimer);
});

void loadGames();
</script>

<template>
  <div>
    <Alert
      v-if="!canViewGames"
      message="当前账号无企业包产品列表权限"
      show-icon
      type="warning"
    />
    <template v-else>
      <div class="query-panel">
        <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
                <div class="flex flex-col gap-1">
            <Input
              v-model:value="gameQuery.PackageName"
              allow-clear
              class="!w-[280px]"
              @press-enter="searchGames"
              placeholder="请输入游戏名称"
            >
              <template #addonBefore>游戏名称</template>
            </Input>
          </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" :loading="gameLoading" @click="searchGames">
            查询
          </Button>
          <Button @click="resetGames">重置</Button>
        </div>
    </div>
  </div>
      </div>

      <section class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">游戏列表</div>
            <div class="section-subtitle">
              选择产品后查看企业母包流程及已上传企业包
            </div>
          </div>
          <Space>
            <Button :disabled="gameQuery.Page <= 1" @click="previousGames">
              上一页
            </Button>
            <span class="text-xs text-gray-400">
              {{ gameQuery.Page }} / {{ maxPage }}
            </span>
            <Button :disabled="gameQuery.Page >= maxPage" @click="nextGames">
              下一页
            </Button>
          </Space>
        </div>
        <div v-if="games.length > 0" class="game-grid">
          <Card
            v-for="game in games"
            :key="game.Id"
            class="game-card"
            hoverable
            :class="[
              String(game.Id) === String(selectedGame?.Id)
                ? 'game-card-active'
                : '',
            ]"
            @click="selectGame(game)"
          >
            <div class="flex items-center gap-3">
              <Image
                :fallback="undefined"
                :preview="false"
                :src="absoluteResource(game.PictureIp)"
                :width="64"
                class="game-icon"
              />
              <div class="min-w-0">
                <div class="truncate text-base font-semibold">
                  {{ game.PackageName || game.Id }}
                </div>
                <div class="mt-1 text-xs text-gray-400">iOS 企业包</div>
              </div>
            </div>
          </Card>
        </div>
        <Empty v-else description="暂无游戏" />
      </section>

      <section v-if="selectedGame && canViewProcess" class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">iOS 企业包流程</div>
            <div class="section-subtitle">
              {{ selectedGame.PackageName || selectedGame.Id }}
            </div>
          </div>
        </div>
        <Table
          :data-source="[
            {
              key: 1,
              note: '下载 iOS 母包',
              step: '步骤 1',
            },
            {
              key: 2,
              note: '联系第三方签名服务或平台客服',
              step: '步骤 2',
            },
            {
              key: 3,
              note: '上传签名后的企业包',
              step: '步骤 3',
            },
          ]"
          :loading="detailLoading"
          :pagination="false"
          size="middle"
        >
          <Table.Column data-index="step" title="步骤" width="110" />
          <Table.Column data-index="note" title="说明" />
          <Table.Column title="母包版本" width="140">
            <template #default="{ index }">
              <template v-if="index === 0">
                <span v-if="stepInfo.BindChannel">{{ stepInfo.Version }}</span>
                <Tag v-else color="red">未设置</Tag>
              </template>
            </template>
          </Table.Column>
          <Table.Column title="更新要求" width="140">
            <template #default="{ index }">
              <template v-if="index === 0 && stepInfo.BindChannel">
                {{
                  Number(stepInfo.IosUpdateRule) === 1
                    ? '不更新'
                    : Number(stepInfo.IosUpdateRule) === 2
                      ? '选择更新'
                      : Number(stepInfo.IosUpdateRule) === 3
                        ? '强制更新'
                        : '-'
                }}
              </template>
            </template>
          </Table.Column>
          <Table.Column title="操作" width="220">
            <template #default="{ index }">
              <Space v-if="index === 0">
                <Button
                  v-if="stepInfo.BindChannel && stepInfo.DownUrl"
                  danger
                  size="small"
                  @click="confirmUnbind"
                >
                  重置
                </Button>
                <Button
                  v-if="stepInfo.BindChannel"
                  :disabled="!stepInfo.DownUrl"
                  size="small"
                  type="primary"
                >
                  <a
                    v-if="stepInfo.DownUrl"
                    :href="String(stepInfo.DownUrl)"
                    target="_blank"
                  >
                    下载
                  </a>
                  <span v-else>母包打包中</span>
                </Button>
                <Button
                  v-else
                  size="small"
                  type="primary"
                  @click="openBind"
                >
                  前往设置
                </Button>
              </Space>
              <span v-else-if="index === 1">联系第三方（或平台客服）</span>
              <Button
                v-else
                :disabled="!stepInfo.DownUrl"
                size="small"
                type="primary"
                @click="openUpload('create')"
              >
                上传
              </Button>
            </template>
          </Table.Column>
        </Table>
      </section>

      <section v-if="selectedGame" class="section-card">
        <div class="section-header">
          <div>
            <div class="section-title">我的 iOS 企业包</div>
            <div class="section-subtitle">状态为处理中时每 30 秒自动刷新</div>
          </div>
        </div>
        <Alert
          v-if="!canViewList"
          message="当前账号无企业包列表权限"
          show-icon
          type="warning"
        />
        <Table
          v-else
          :columns="enterpriseColumns"
          :data-source="enterpriseRows"
          :loading="detailLoading"
          :pagination="false"
          row-key="Id"
          :scroll="{ x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'CreateTime'">
              {{ formatOperationDateTime(record.CreateTime) }}
            </template>
            <template v-else-if="column.key === 'Status'">
              <Tag :color="statusColor(record.Status)">
                {{ statusText(record.Status) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button
                  v-if="canUpdate"
                  size="small"
                  type="link"
                  @click="openUploadFromTable('update', record)"
                >
                  更新企业包
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
      </section>
    </template>

    <Modal
      v-model:open="bindVisible"
      :confirm-loading="bindLoading"
      title="企业母包设置"
      @ok="submitBind"
    >
      <Form class="pt-3" layout="vertical">
        <Form.Item label="绑定默认渠道" required>
          <Select
            v-model:value="bindChannelId"
            :field-names="{ label: 'ChannelName', value: 'ChannelId' }"
            :options="channels"
            placeholder="请选择渠道"
          />
        </Form.Item>
        <Alert
          message="绑定用于生成企业母包；确认后如需变更，请先执行重置。"
          show-icon
          type="info"
        />
      </Form>
    </Modal>

    <Modal
      v-model:open="uploadVisible"
      :confirm-loading="uploadLoading"
      :title="uploadMode === 'create' ? '上传企业包' : '更新企业包'"
      @ok="submitUpload"
    >
      <div class="py-4">
        <Upload.Dragger
          :action="CHANNEL_UPLOAD_URL"
          accept=".ipa"
          name="upfile"
          :max-count="1"
          @change="handleUploadChange"
        >
          <p class="text-base">拖拽 IPA 文件到此处，或点击选择文件</p>
          <p class="text-xs text-gray-400">仅支持上传 .ipa 文件</p>
        </Upload.Dragger>
        <Alert
          v-if="uploadForm.IosUploadUrl"
          class="mt-3"
          :message="`已上传：${uploadForm.IosName}`"
          show-icon
          type="success"
        />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.query-panel {
  padding: 18px;
  margin-bottom: 18px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.section-card {
  padding: 18px;
  margin-top: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.section-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.game-card {
  cursor: pointer;
  border: 2px solid transparent;
}

.game-card-active {
  border-color: hsl(var(--primary));
  box-shadow: 0 4px 16px hsl(var(--primary) / 15%);
}

.game-icon {
  overflow: hidden;
  border-radius: 12px;
}

@media (max-width: 1200px) {
  .game-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .game-grid {
    grid-template-columns: 1fr;
  }
}
</style>
