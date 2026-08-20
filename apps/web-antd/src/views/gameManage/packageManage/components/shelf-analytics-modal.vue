<script lang="ts" setup>
import type {
  PackageManageId,
  ShelfPlatform,
} from '#/api/gameManage/package-manage';
import type { PackageAnalyticsConfig } from '#/api/gameManage/package-settings';

import { reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal, Switch, Tabs } from 'ant-design-vue';

import {
  fetchShelfAnalyticsApi,
  updateShelfAnalyticsApi,
} from '#/api/gameManage/package-manage';

defineOptions({ name: 'ShelfAnalyticsModal' });

const props = defineProps<{
  id?: PackageManageId;
  open: boolean;
  platform: ShelfPlatform;
}>();
const emit = defineEmits<{
  saved: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const activeTab = ref('adjust');
const raw = ref<PackageAnalyticsConfig>({});
const form = reactive({
  Adjust: {
    AdjustAppToken: '',
    AdjustEventTokenCompleteRegister: '',
    AdjustEventTokenFirstDeposit: '',
    AdjustEventTokenFirstOpen: '',
    AdjustEventTokenInitiatedCheckout: '',
    AdjustEventTokenLogin: '',
    AdjustEventTokenPurchase: '',
    AdjustFBPixelId: '',
    AdjustS2SToken: '',
  },
  AppsFlyer: {
    AppsFlyerAndroidAppName: '',
    AppsFlyerAndroidDevKey: '',
    AppsFlyerIOSAppName: '',
    AppsFlyerIOSDevKey: '',
    AppsFlyerPCBBID: '',
    AppsFlyerPCDevKey: '',
    AppsFlyerS2SToken: '',
  },
  Facebook: {
    MetaConversionApiAccessToken: '',
    MetaConversionApiDataSourceId: '',
  },
  Google: {
    GoogleAnalyticsAndroidApiSecret: '',
    GoogleAnalyticsAndroidMeasurementId: '',
    GoogleAnalyticsApiSecret: '',
    GoogleAnalyticsIosApiSecret: '',
    GoogleAnalyticsIosMeasurementId: '',
    GoogleAnalyticsMeasurementId: '',
  },
  H5Analytic: { AnalyticsScript: '' },
  Okspin: { OkSpinPixelId: '' },
  Riobest: { IsRoibestOpen: true },
});

const adjustFields = [
  ['AdjustAppToken', 'App Token'],
  ['AdjustS2SToken', 'S2S Token'],
  ['AdjustFBPixelId', 'FB Pixel ID'],
  ['AdjustEventTokenFirstOpen', '首次开启 Event Token'],
  ['AdjustEventTokenCompleteRegister', '完成注册 Event Token'],
  ['AdjustEventTokenLogin', '登录成功 Event Token'],
  ['AdjustEventTokenPurchase', '充值 Event Token'],
  ['AdjustEventTokenInitiatedCheckout', '出金 Event Token'],
  ['AdjustEventTokenFirstDeposit', '首存 Event Token'],
] as const;
const appsFlyerFields = [
  ['AppsFlyerS2SToken', 'S2S Token'],
  ['AppsFlyerIOSDevKey', 'iOS Dev Key'],
  ['AppsFlyerIOSAppName', 'iOS App Name'],
  ['AppsFlyerAndroidDevKey', 'Android Dev Key'],
  ['AppsFlyerAndroidAppName', 'Android App Name'],
  ['AppsFlyerPCBBID', 'PC/H5 BBID'],
  ['AppsFlyerPCDevKey', 'PC/H5 Dev Key'],
] as const;
const googleFields = [
  ['GoogleAnalyticsMeasurementId', 'PC/H5 Measurement ID'],
  ['GoogleAnalyticsApiSecret', 'PC/H5 API Secret'],
] as const;

function assignStrings<T extends Record<string, string>>(
  target: T,
  source: PackageAnalyticsConfig,
) {
  Object.keys(target).forEach((key) => {
    target[key as keyof T] = String(source[key] ?? '') as T[keyof T];
  });
}

async function load() {
  if (!props.id) return;
  loading.value = true;
  try {
    raw.value = await fetchShelfAnalyticsApi(props.platform, props.id);
    assignStrings(form.Adjust, raw.value);
    assignStrings(form.AppsFlyer, raw.value);
    assignStrings(form.Facebook, raw.value);
    assignStrings(form.Google, raw.value);
    form.H5Analytic.AnalyticsScript = String(raw.value.AnalyticsScript || '');
    form.Okspin.OkSpinPixelId = String(raw.value.OkSpinPixelId || '');
    form.Riobest.IsRoibestOpen = raw.value.IsRoibestOpen !== false;
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!props.id) return;
  loading.value = true;
  try {
    await updateShelfAnalyticsApi(props.platform, {
      AppPackageConfigId: props.id,
      Adjust: JSON.stringify(form.Adjust),
      AppsFlyer: JSON.stringify(form.AppsFlyer),
      Facebook: JSON.stringify(form.Facebook),
      Google: JSON.stringify(form.Google),
      H5Analytic: JSON.stringify(form.H5Analytic),
      Okspin: JSON.stringify(form.Okspin),
      Riobest: JSON.stringify(form.Riobest),
    });
    message.success('数据统计配置已保存');
    emit('update:open', false);
    emit('saved');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      activeTab.value = 'adjust';
      void load();
    }
  },
);
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :open="open"
    title="数据统计"
    width="760px"
    @cancel="emit('update:open', false)"
    @ok="save"
  >
    <Tabs v-model:active-key="activeTab" class="pt-2">
      <Tabs.TabPane key="adjust" tab="Adjust">
        <Form layout="vertical">
          <div class="field-grid">
            <Form.Item
              v-for="[field, label] in adjustFields"
              :key="field"
              :label="label"
            >
              <Input v-model:value="form.Adjust[field]" />
            </Form.Item>
          </div>
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane key="appsflyer" tab="AppsFlyer">
        <Form layout="vertical">
          <div class="field-grid">
            <Form.Item
              v-for="[field, label] in appsFlyerFields"
              :key="field"
              :label="label"
            >
              <Input v-model:value="form.AppsFlyer[field]" />
            </Form.Item>
          </div>
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane key="facebook" tab="Facebook">
        <Form layout="vertical">
          <div class="field-grid">
            <Form.Item label="API Token">
              <Input.Password
                v-model:value="form.Facebook.MetaConversionApiAccessToken"
              />
            </Form.Item>
            <Form.Item label="Pixel / Data Source ID">
              <Input
                v-model:value="form.Facebook.MetaConversionApiDataSourceId"
              />
            </Form.Item>
          </div>
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane key="google" tab="Google Analytics">
        <Form layout="vertical">
          <div class="field-grid">
            <Form.Item
              v-for="[field, label] in googleFields"
              :key="field"
              :label="label"
            >
              <Input v-model:value="form.Google[field]" />
            </Form.Item>
          </div>
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane key="roibest" tab="ROIBest">
        <Form layout="vertical">
          <Form.Item label="启用 ROIBest">
            <Switch v-model:checked="form.Riobest.IsRoibestOpen" />
          </Form.Item>
        </Form>
      </Tabs.TabPane>
      <Tabs.TabPane key="okspin" tab="OKSpin">
        <Form layout="vertical">
          <Form.Item label="Pixel ID">
            <Input v-model:value="form.Okspin.OkSpinPixelId" />
          </Form.Item>
        </Form>
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>

<style scoped>
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

@media (max-width: 720px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
