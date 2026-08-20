<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { BackWaterVipConfig } from '#/views/gameManage/backWater/components/back-water-game-config-editor.vue';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  FormItem,
  InputNumber,
  message,
  Result,
  Space,
  Spin,
} from 'ant-design-vue';

import {
  fetchBackWaterSchemeApi,
  fetchBackWaterSchemesApi,
  updateBackWaterSchemeConfigApi,
} from '#/api/gameManage/back-water';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  formatPercentFromStorage,
  formatPercentToStorage,
} from '#/utils/game-config';
import BackWaterGameConfigEditor from '#/views/gameManage/backWater/components/back-water-game-config-editor.vue';

defineOptions({ name: 'AddConfig' });

interface SchemeDetail {
  Config?: BackWaterVipConfig[] | string;
  Id?: number | string;
  Name?: string;
  [key: string]: unknown;
}

interface DisplayConfig extends Omit<BackWaterVipConfig, 'DefaultWater'> {
  DefaultWater?: number;
}

interface RouteContext {
  index?: number;
  schemeId?: number | string;
  vipLevel?: number | string;
}

function readRouteContext(): RouteContext {
  try {
    return JSON.parse(
      sessionStorage.getItem('backWaterAddConfigContext') || '{}',
    ) as RouteContext;
  } catch {
    return {};
  }
}

const savedContext = readRouteContext();
const route = useRoute();
const router = useRouter();
const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(11_100));
const fallbackSchemeId = ref('');
const schemeId = computed(() =>
  String(
    route.query.schemeId ||
      route.query.Id ||
      savedContext.schemeId ||
      fallbackSchemeId.value ||
      '',
  ),
);
const configIndex = computed(() =>
  Number(route.query.index ?? savedContext.index ?? 0),
);
const vipLevel = computed(() =>
  String(route.query.vipLevel ?? savedContext.vipLevel ?? ''),
);
const editorKey = ref(0);
const editorRef = ref<null | { buildConfig?: () => BackWaterVipConfig }>(null);
const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const scheme = ref<SchemeDetail>({});
const rows = ref<BackWaterVipConfig[]>([]);
const resolvedIndex = ref(-1);
const form = reactive<DisplayConfig>({});
const hasRow = computed(() => resolvedIndex.value >= 0);

function isNonNegativeInteger(value: unknown, max?: number) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 && (max === undefined || num <= max);
}

function isPercent(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && num <= 100;
}

const pageTitle = computed(() => {
  const name = scheme.value.Name ? `「${scheme.value.Name}」` : '';
  const vip =
    form.VipLevel === undefined || form.VipLevel === null
      ? ''
      : ` · VIP${form.VipLevel}`;
  return `新增/编辑返水配置${name}${vip}`;
});

const rules = {
  DefaultWater: [
    { message: '请正确输入未设置游戏返水比例', required: true },
    {
      validator: (_rule: unknown, value: unknown) =>
        isPercent(value)
          ? Promise.resolve()
          : Promise.reject(new Error('格式错误,正确输入未设置游戏返水比例')),
    },
  ],
  MaxWater: [
    { message: '请输入每日最高返水', required: true },
    {
      validator: (_rule: unknown, value: unknown) =>
        isNonNegativeInteger(value, 2_100_000_000)
          ? Promise.resolve()
          : Promise.reject(new Error('格式错误,请正确输入每日最高返水')),
    },
  ],
  MinTurnover: [
    { message: '请输入最低流水要求', required: true },
    {
      validator: (_rule: unknown, value: unknown) =>
        isNonNegativeInteger(value)
          ? Promise.resolve()
          : Promise.reject(new Error('格式错误,请正确输入最低流水要求')),
    },
  ],
  MinTurnoverMultiple: [
    { message: '请正确输入领取要求流水倍数', required: true },
    {
      validator: (_rule: unknown, value: unknown) =>
        isNonNegativeInteger(value)
          ? Promise.resolve()
          : Promise.reject(new Error('格式错误,请正确输入领取要求流水倍数')),
    },
  ],
};

function parseConfig(value: SchemeDetail['Config']) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value) as BackWaterVipConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadDetail() {
  loading.value = true;
  resolvedIndex.value = -1;
  try {
    if (!schemeId.value) {
      const schemes = (await fetchBackWaterSchemesApi()) || [];
      fallbackSchemeId.value = String(schemes[0]?.Id || '');
    }
    if (!schemeId.value) {
      message.error('未找到可用的返水方案');
      return;
    }
    const result = (await fetchBackWaterSchemeApi(
      schemeId.value,
    )) as SchemeDetail;
    scheme.value = result;
    rows.value = parseConfig(result.Config);
    let nextIndex =
      vipLevel.value === ''
        ? configIndex.value
        : rows.value.findIndex(
            (item) => String(item.VipLevel) === vipLevel.value,
          );
    if (nextIndex < 0) nextIndex = configIndex.value;
    if (!rows.value[nextIndex] && rows.value.length > 0) {
      nextIndex = 0;
    }
    const row = rows.value[nextIndex];
    if (!row) {
      message.error('未找到对应的 VIP 返水配置');
      return;
    }
    Object.assign(form, structuredClone(row), {
      DefaultWater: Number(formatPercentFromStorage(row.DefaultWater || 0)),
      MaxWater: Number(row.MaxWater || 0) / 100,
      MinTurnover: Number(row.MinTurnover || 0) / 100,
    });
    resolvedIndex.value = nextIndex;
    editorKey.value += 1;
  } catch {
    resolvedIndex.value = -1;
  } finally {
    loading.value = false;
  }
}

function updateGameConfig(value: BackWaterVipConfig) {
  Object.assign(form, {
    Games: value.Games,
    WaterAvg: value.WaterAvg,
    WaterMax: value.WaterMax,
    WaterMin: value.WaterMin,
  });
}

function clearRouteContext() {
  sessionStorage.removeItem('backWaterAddConfigContext');
}

function goBack() {
  clearRouteContext();
  void router.push({
    path: '/gameManage/backWater',
    query: { schemeId: schemeId.value, tab: 'config' },
  });
}

async function save() {
  if (!schemeId.value || resolvedIndex.value < 0) return;
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  const latest = editorRef.value?.buildConfig?.();
  if (latest) {
    updateGameConfig(latest);
  }
  const current = rows.value[resolvedIndex.value];
  if (!current) return;
  const next: BackWaterVipConfig = {
    ...current,
    ...form,
    DefaultWater: formatPercentToStorage(Number(form.DefaultWater)),
    MaxWater: Math.round(Number(form.MaxWater) * 100),
    MinTurnover: Math.round(Number(form.MinTurnover) * 100),
    MinTurnoverMultiple: Number(form.MinTurnoverMultiple || 0),
    VipLevel: current.VipLevel,
  };
  const nextRows = [...rows.value];
  nextRows[resolvedIndex.value] = next;
  saving.value = true;
  try {
    await updateBackWaterSchemeConfigApi({
      Config: JSON.stringify(nextRows),
      Id: schemeId.value,
    });
    message.success('编辑成功');
    goBack();
  } catch {
    // request interceptor already surfaces the error
  } finally {
    saving.value = false;
  }
}

onMounted(loadDetail);
</script>

<template>
  <Result
    v-if="!canView"
    status="403"
    sub-title="无返水配置查看权限"
    title="403"
  />
  <Page v-else auto-content-height :title="pageTitle">
    <Spin :spinning="loading">
      <Card size="small" title="基础配置">
        <Form
          ref="formRef"
          :model="form"
          :rules="rules"
          :label-col="{ style: { width: '180px' } }"
        >
          <div class="base-grid">
            <FormItem label="周期最高返水" name="MaxWater">
              <InputNumber
                v-model:value="form.MaxWater"
                :max="2_100_000_000"
                :min="0"
                :precision="0"
                class="!w-full"
                placeholder="请输入"
              />
            </FormItem>
            <FormItem label="场馆最低流水要求" name="MinTurnover">
              <InputNumber
                v-model:value="form.MinTurnover"
                :min="0"
                :precision="0"
                class="!w-full"
                placeholder="请输入"
              />
            </FormItem>
            <FormItem label="未设置游戏返水比例" name="DefaultWater">
              <InputNumber
                v-model:value="form.DefaultWater"
                :max="100"
                :min="0"
                :precision="2"
                addon-after="%"
                class="!w-full"
                placeholder="请输入"
              />
            </FormItem>
            <FormItem label="提款流水倍数" name="MinTurnoverMultiple">
              <InputNumber
                v-model:value="form.MinTurnoverMultiple"
                :min="0"
                :precision="0"
                addon-after="倍"
                class="!w-full"
                placeholder="请输入"
              />
            </FormItem>
          </div>
        </Form>

        <template v-if="hasRow">
          <div class="section-title">游戏返水比例</div>
          <BackWaterGameConfigEditor
            :key="editorKey"
            ref="editorRef"
            :config="form"
            @change="updateGameConfig"
          />
        </template>

        <div class="footer-actions">
          <Space>
            <Button :loading="saving" type="primary" @click="save">
              保存配置
            </Button>
            <Button @click="goBack">返回</Button>
          </Space>
        </div>
      </Card>
    </Spin>
  </Page>
</template>

<style scoped>
.base-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  gap: 0 24px;
  max-width: 960px;
  margin: 0 auto 18px;
}

.section-title {
  padding-left: 10px;
  margin: 6px 0 16px;
  font-size: 16px;
  font-weight: 600;
  border-left: 3px solid hsl(var(--primary));
}

.footer-actions {
  display: flex;
  justify-content: center;
  padding-top: 22px;
}

@media (max-width: 768px) {
  .base-grid {
    grid-template-columns: 1fr;
  }
}
</style>
