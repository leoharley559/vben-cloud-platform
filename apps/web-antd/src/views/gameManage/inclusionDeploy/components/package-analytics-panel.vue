<script lang="ts" setup>
import type { PackageAnalyticsConfig } from '#/api/gameManage/package-settings';
import type { PackageId } from '#/types/package-config';

import { reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Space,
  Switch,
  Tabs,
} from 'ant-design-vue';

import {
  fetchPackageAnalyticsConfigApi,
  updatePackageAnalyticsConfigApi,
} from '#/api/gameManage/package-settings';

defineOptions({ name: 'PackageAnalyticsPanel' });

const props = defineProps<{ packageId: PackageId }>();

const raw = ref<PackageAnalyticsConfig>({});
const analyticsTab = ref('adjust');
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
  Google: {
    GoogleAnalyticsAndroidApiSecret: '',
    GoogleAnalyticsAndroidMeasurementId: '',
    GoogleAnalyticsApiSecret: '',
    GoogleAnalyticsIosApiSecret: '',
    GoogleAnalyticsIosMeasurementId: '',
    GoogleAnalyticsMeasurementId: '',
  },
  Facebook: {
    MetaConversionApiAccessToken: '',
    MetaConversionApiDataSourceId: '',
  },
  Riobest: {
    IsRoibestOpen: true,
  },
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
  ['GoogleAnalyticsIosMeasurementId', 'iOS Measurement ID'],
  ['GoogleAnalyticsIosApiSecret', 'iOS API Secret'],
  ['GoogleAnalyticsAndroidMeasurementId', 'Android Measurement ID'],
  ['GoogleAnalyticsAndroidApiSecret', 'Android API Secret'],
] as const;

function assignStringFields<T extends Record<string, string>>(
  target: T,
  source: PackageAnalyticsConfig,
) {
  Object.keys(target).forEach((key) => {
    target[key as keyof T] = String(source[key] ?? '') as T[keyof T];
  });
}

async function load() {
  raw.value = await fetchPackageAnalyticsConfigApi(props.packageId);
  assignStringFields(form.Adjust, raw.value);
  assignStringFields(form.AppsFlyer, raw.value);
  assignStringFields(form.Google, raw.value);
  assignStringFields(form.Facebook, raw.value);
  form.Riobest.IsRoibestOpen = Boolean(raw.value.IsRoibestOpen ?? true);
}

async function save() {
  const source = raw.value;
  const payload = {
    PackageAppNameId: source.PackageAppNameId ?? '',
    PackageId: props.packageId,
    Adjust: JSON.stringify({ ...form.Adjust }),
    AppsFlyer: JSON.stringify({ ...form.AppsFlyer }),
    Google: JSON.stringify({ ...form.Google }),
    Facebook: JSON.stringify({
      ...form.Facebook,
    }),
    H5Analytic: JSON.stringify({
      AnalyticsScript: source.AnalyticsScript ?? '',
    }),
    Riobest: JSON.stringify({
      ...form.Riobest,
    }),
    Okspin: JSON.stringify({
      OkSpinPixelId: source.OkSpinPixelId ?? '',
    }),
  };
  await updatePackageAnalyticsConfigApi(payload);
}

async function copyPackageAppNameId() {
  const value = String(raw.value.PackageAppNameId ?? '');
  if (!value) {
    message.warning('当前产品没有 Package App Name ID');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    message.success('已复制 Package App Name ID');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

defineExpose({ load, save });
</script>

<template>
  <Form layout="vertical">
    <Form.Item label="Package App Name ID">
      <Space.Compact block>
        <Input :value="raw.PackageAppNameId" readonly />
        <Button type="primary" @click="copyPackageAppNameId">复制</Button>
      </Space.Compact>
      <div class="mt-1 text-xs text-gray-400">
        用于移动端分析平台的包名配置。
      </div>
    </Form.Item>

    <Tabs v-model:active-key="analyticsTab" size="small" type="line">
      <Tabs.TabPane key="adjust" tab="Adjust">
        <div class="analytics-grid">
          <Form.Item
            v-for="[field, label] in adjustFields"
            :key="field"
            :label="label"
          >
            <Input v-model:value="form.Adjust[field]" />
          </Form.Item>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane key="appsflyer" tab="AppsFlyer">
        <div class="analytics-grid">
          <Form.Item
            v-for="[field, label] in appsFlyerFields"
            :key="field"
            :label="label"
          >
            <Input v-model:value="form.AppsFlyer[field]" />
          </Form.Item>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane key="google" tab="Google Analytics">
        <div class="analytics-grid">
          <Form.Item
            v-for="[field, label] in googleFields"
            :key="field"
            :label="label"
          >
            <Input v-model:value="form.Google[field]" />
          </Form.Item>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane key="facebook" tab="Facebook Conversion API">
        <div class="analytics-grid">
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
      </Tabs.TabPane>
      <Tabs.TabPane key="roibest" tab="ROIBest">
        <Form.Item label="启用 ROIBest 数据统计">
          <Switch v-model:checked="form.Riobest.IsRoibestOpen" />
        </Form.Item>
      </Tabs.TabPane>
    </Tabs>
  </Form>
</template>

<style scoped>
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

@media (max-width: 800px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
