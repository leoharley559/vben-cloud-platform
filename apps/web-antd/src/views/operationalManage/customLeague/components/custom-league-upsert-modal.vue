<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { preferences } from '@vben/preferences';

import {
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
  Spin,
  Tabs,
} from 'ant-design-vue';

import {
  createCustomLeagueApi,
  fetchCustomLeagueDetailApi,
  fetchCustomLeagueLeagueListApi,
  updateCustomLeagueApi,
} from '#/api/operationManage/league-activity';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';

import {
  buildMatchSource,
  csvToNumberArray,
  ensureLeagueLangMap,
  getSportsBySrc,
  type LeagueLangEntry,
  parseLangText,
  resolveDefaultLangGroupId,
  resolveLangGroupIds,
  resolveLeagueOptionLabel,
  resolveLeagueOptionValue,
  toDateTimeString,
} from './custom-league-shared';

defineOptions({ name: 'CustomLeagueUpsertModal' });

const props = defineProps<{
  leagueId?: number | string;
  mode?: UpsertMode;
}>();

const emit = defineEmits<{ success: [] }>();

type UpsertMode = 'add' | 'edit';

const open = defineModel<boolean>('open', { default: false });

const cloudStore = useCloudPlatformStore();
const { ensureGameConfig, gameConfig } = useGameConfig();
const { packageOptions } = useOperationOptions();

const langGroupIds = computed(() =>
  resolveLangGroupIds(cloudStore.projectConfig),
);
const defaultLangGroupId = computed(() =>
  resolveDefaultLangGroupId(cloudStore.projectConfig),
);

/** 兼容旧站 item[language]：将当前后台语言（如 zh-CN）转换为下划线格式 zh_CN */
const languageKey = computed(() =>
  (preferences.app.locale || '').replace('-', '_'),
);

const loading = ref(false);
const saving = ref(false);
const loadingDetail = ref(false);
const activeLangTab = ref(String(defaultLangGroupId.value));

const leagueList = ref<Array<Record<string, unknown>>>([]);
const leagueListLoading = ref(false);

const packageSelectOptions = computed(() =>
  packageOptions.value.filter((item) => item.PackageId !== ''),
);

function createDefaultForm() {
  return {
    AppImageGif: '',
    AppImageStatic: '',
    EndTime: '' as string,
    GameType: '' as number | string,
    Id: undefined as number | string | undefined,
    LangText: ensureLeagueLangMap(langGroupIds.value),
    LeagueId: '' as number | string,
    PackageIds: [] as number[],
    PcImage: '',
    SportId: '' as number | string,
    StartTime: '' as string,
  };
}

const form = reactive(createDefaultForm());

const modalTitle = computed(() =>
  props.mode === 'edit' ? '编辑杯赛专题' : '新增杯赛专题',
);

const matchSourceOptions = computed(() =>
  buildMatchSource(gameConfig.value.games).map((item) => ({
    label: item.name || String(item.id),
    value: item.id,
  })),
);

const sportOptions = computed(() =>
  getSportsBySrc(gameConfig.value.games, form.GameType).map((item) => ({
    label: item.name || String(item.id),
    value: item.id,
  })),
);

const leagueOptions = computed(() =>
  leagueList.value.map((item) => ({
    label: resolveLeagueOptionLabel(item, languageKey.value),
    value: resolveLeagueOptionValue(item),
  })),
);

async function loadLeagueList() {
  if (form.GameType === '' || form.GameType === undefined) {
    leagueList.value = [];
    return;
  }
  leagueListLoading.value = true;
  try {
    const result = await fetchCustomLeagueLeagueListApi({
      GameType: form.GameType,
      SportId: form.SportId,
    });
    leagueList.value = result.Items || [];
  } catch {
    leagueList.value = [];
  } finally {
    leagueListLoading.value = false;
  }
}

watch(
  () => form.GameType,
  () => {
    if (loadingDetail.value) {
      return;
    }
    form.SportId = '';
    form.LeagueId = '';
    leagueList.value = [];
  },
);

watch(
  () => form.SportId,
  () => {
    if (loadingDetail.value) {
      return;
    }
    form.LeagueId = '';
    void loadLeagueList();
  },
);

function resetForm() {
  Object.assign(form, createDefaultForm());
  leagueList.value = [];
  activeLangTab.value = String(defaultLangGroupId.value);
}

function applyDetail(data: Record<string, unknown>) {
  form.Id = data.Id as number | string;
  form.GameType = (data.GameType ?? '') as number | string;
  form.SportId = (data.SportId ?? '') as number | string;
  form.LeagueId = (data.LeagueId ?? '') as number | string;
  form.PackageIds = csvToNumberArray(
    data.PackageIds as number[] | string | undefined,
  );
  form.StartTime = toDateTimeString(data.StartTime);
  form.EndTime = toDateTimeString(data.EndTime);
  form.PcImage = String(data.PcImage || '');
  form.AppImageStatic = String(data.AppImageStatic || '');
  form.AppImageGif = String(data.AppImageGif || '');
  form.LangText = ensureLeagueLangMap(
    langGroupIds.value,
    parseLangText(data.LangText) as Record<string, LeagueLangEntry>,
  );
}

async function loadDetail() {
  if (!props.leagueId) {
    resetForm();
    return;
  }
  loading.value = true;
  loadingDetail.value = true;
  try {
    const data = await fetchCustomLeagueDetailApi(props.leagueId);
    if (data) {
      applyDetail(data);
    }
  } finally {
    loadingDetail.value = false;
    loading.value = false;
  }
  await loadLeagueList();
}

watch(
  () => [open.value, props.leagueId, props.mode] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }
    void ensureGameConfig();
    activeLangTab.value = String(defaultLangGroupId.value);
    if (props.mode === 'edit') {
      void loadDetail();
    } else {
      resetForm();
    }
  },
);

function validateForm() {
  if (form.GameType === '' || form.GameType === undefined) {
    message.warning('请选择场馆');
    return false;
  }
  if (form.SportId === '' || form.SportId === undefined) {
    message.warning('请选择赛事类型');
    return false;
  }
  if (form.LeagueId === '' || form.LeagueId === undefined) {
    message.warning('请选择联赛赛事');
    return false;
  }
  if (form.PackageIds.length === 0) {
    message.warning('请选择产品');
    return false;
  }
  const defaultName =
    form.LangText[String(defaultLangGroupId.value)]?.LeagueShortName;
  if (!String(defaultName || '').trim()) {
    message.warning('请填写联赛简称');
    activeLangTab.value = String(defaultLangGroupId.value);
    return false;
  }
  return true;
}

function buildSubmitPayload() {
  const payload: Record<string, unknown> = {
    AppImageGif: form.AppImageGif,
    AppImageStatic: form.AppImageStatic,
    EndTime: form.EndTime,
    GameType: form.GameType,
    LangText: JSON.stringify(Object.values(form.LangText)),
    LeagueId: form.LeagueId,
    PackageIds: form.PackageIds,
    PcImage: form.PcImage,
    SportId: form.SportId,
    StartTime: form.StartTime,
  };
  if (props.mode === 'edit' && form.Id !== undefined) {
    payload.Id = form.Id;
  }
  return payload;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  saving.value = true;
  try {
    const payload = buildSubmitPayload();
    await (props.mode === 'edit'
      ? updateCustomLeagueApi(payload)
      : createCustomLeagueApi(payload));
    message.success('保存成功');
    open.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="saving"
    destroy-on-close
    :title="modalTitle"
    width="800px"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <div class="max-h-[75vh] overflow-y-auto pr-2">
        <Form layout="vertical">
          <div class="grid grid-cols-2 gap-3">
            <Form.Item label="场馆" required>
              <Select
                v-model:value="form.GameType"
                :options="matchSourceOptions"
                placeholder="请选择场馆"
                show-search
              />
            </Form.Item>
            <Form.Item label="赛事类型" required>
              <Select
                v-model:value="form.SportId"
                :options="sportOptions"
                placeholder="请选择赛事类型"
                show-search
              />
            </Form.Item>
          </div>

          <Form.Item label="联赛赛事" required>
            <Select
              v-model:value="form.LeagueId"
              allow-clear
              :loading="leagueListLoading"
              :options="leagueOptions"
              placeholder="请选择联赛赛事"
              show-search
              :filter-option="
                (input: string, option: any) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
              "
            />
          </Form.Item>

          <!-- 多语言：联赛简称 -->
          <Tabs v-model:active-key="activeLangTab" type="line" size="small">
            <Tabs.TabPane
              v-for="lgId in langGroupIds"
              :key="String(lgId)"
              :tab="langGroupIds.length > 1 ? `语言组 ${lgId}` : '基本信息'"
            >
              <Form.Item
                label="联赛简称"
                :required="lgId === defaultLangGroupId"
              >
                <Input
                  v-model:value="form.LangText[String(lgId)]!.LeagueShortName"
                  allow-clear
                  placeholder="请输入联赛简称"
                />
              </Form.Item>
            </Tabs.TabPane>
          </Tabs>

          <Form.Item label="产品" required>
            <Select
              v-model:value="form.PackageIds"
              allow-clear
              :field-names="{ label: 'PackageName', value: 'PackageId' }"
              mode="multiple"
              :options="packageSelectOptions"
              placeholder="请选择产品"
              style="width: 100%"
            />
          </Form.Item>

          <Form.Item label="发送日期">
            <div class="flex items-center gap-2">
              <DatePicker
                v-model:value="form.StartTime"
                allow-clear
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="开始时间"
                show-time
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
              <span class="shrink-0 text-gray-500">至</span>
              <DatePicker
                v-model:value="form.EndTime"
                allow-clear
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="结束时间"
                show-time
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </div>
          </Form.Item>

          <div class="mb-2 text-sm font-medium">图标</div>
          <div class="flex flex-wrap gap-6">
            <Form.Item label="PC图标">
              <VoucherImageField
                v-model="form.PcImage"
                dimension-hint="建议尺寸 14 * 14，图片不超过1M"
                :max-size-kb="1024"
              />
            </Form.Item>
            <Form.Item label="APP图标（静态）">
              <VoucherImageField
                v-model="form.AppImageStatic"
                dimension-hint="建议尺寸 36 * 36，图片不超过1M"
                :max-size-kb="1024"
              />
            </Form.Item>
            <Form.Item label="APP图标（动态）">
              <VoucherImageField
                v-model="form.AppImageGif"
                dimension-hint="建议尺寸 36 * 36，图片不超过1M"
                :max-size-kb="1024"
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Spin>
  </Modal>
</template>
