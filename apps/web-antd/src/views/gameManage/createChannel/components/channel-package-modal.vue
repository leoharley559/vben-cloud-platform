<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type {
  ChannelAppPackageOption,
  ChannelDetail,
  ChannelId,
  ChannelIosPackageOption,
  ChannelRow,
} from '#/types/channel-config';

import { computed, reactive, ref, watch } from 'vue';

import {
  Alert,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Spin,
} from 'ant-design-vue';

import {
  fetchChannelAndroidAppPackagesApi,
  fetchChannelDetailApi,
  fetchChannelIosAppPackagesApi,
  fetchChannelIosEnterprisePackagesApi,
  updateChannelAndroidAppPackageApi,
  updateChannelIosAppPackageApi,
} from '#/api/gameManage/channel';

defineOptions({ name: 'ChannelPackageModal' });

const props = defineProps<{
  open: boolean;
  platform: 'android' | 'ios';
  row: ChannelRow;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const detail = ref<ChannelDetail>();
const shelfOptions = ref<
  Array<ChannelAppPackageOption | ChannelIosPackageOption>
>([]);
const enterpriseOptions = ref<ChannelIosPackageOption[]>([]);
let loadGeneration = 0;

const model = reactive<{
  AppPackageConfigId?: ChannelId;
  IosPackageId?: '' | ChannelId;
  ThirdCustomIosUrl: string;
  ThirdOrIos: 1 | 2 | 3;
}>({
  AppPackageConfigId: undefined,
  IosPackageId: '',
  ThirdCustomIosUrl: '',
  ThirdOrIos: 3,
});

const title = computed(() =>
  props.platform === 'ios' ? 'iOS 包体设置' : 'Android 包体设置',
);

const rules = computed(() => ({
  AppPackageConfigId: [{ required: true, message: '请选择上架包' }],
  IosPackageId:
    model.ThirdOrIos === 2 ? [{ required: true, message: '请选择企业包' }] : [],
  ThirdCustomIosUrl:
    model.ThirdOrIos === 1
      ? [
          { required: true, message: '请输入三方超级签地址' },
          {
            pattern: /^https?:\/\/[^\s]+$/i,
            message: '请输入有效的 http(s) URL',
          },
        ]
      : [],
}));

watch(
  () => props.open,
  (open) => {
    if (open) void initialize();
    else loadGeneration += 1;
  },
  { immediate: true },
);

function shelfLabel(item: ChannelAppPackageOption | ChannelIosPackageOption) {
  const name =
    item.AppName ||
    item.PkName ||
    item.PackageName ||
    item.IosName ||
    String(item.Id || '');
  const code = item.AppUrl || item.PkCode;
  return code ? `${name}（${code}）` : name;
}

function enterpriseLabel(item: ChannelIosPackageOption) {
  return item.IosName || item.PackageName || String(item.Id || '');
}

async function initialize() {
  const generation = ++loadGeneration;
  loading.value = true;
  error.value = '';
  detail.value = undefined;
  shelfOptions.value = [];
  enterpriseOptions.value = [];
  try {
    const databaseId = props.row.Id;
    if (databaseId == null || databaseId === '') {
      throw new Error('缺少渠道数据库 Id，无法加载包体设置');
    }
    const fullDetail = await fetchChannelDetailApi(databaseId);
    if (generation !== loadGeneration || !props.open) return;

    detail.value = fullDetail;
    const packageId = fullDetail.PackageConfigId;
    if (props.platform === 'ios') {
      if (packageId == null || packageId === '') {
        throw new Error('渠道缺少包体 Id，无法加载 iOS 包体选项');
      }
      const [shelf, enterprise] = await Promise.all([
        fetchChannelIosAppPackagesApi(packageId),
        fetchChannelIosEnterprisePackagesApi(packageId),
      ]);
      if (generation !== loadGeneration || !props.open) return;
      shelfOptions.value = shelf;
      enterpriseOptions.value = enterprise.Items;
      model.AppPackageConfigId =
        fullDetail.IosPkgConfigId ?? fullDetail.AppPackageConfigId;
      model.IosPackageId = fullDetail.IosPackageId || '';
      model.ThirdCustomIosUrl = String(fullDetail.ThirdCustomIosUrl || '');
      if (model.IosPackageId) {
        model.ThirdOrIos = 2;
      } else if (model.ThirdCustomIosUrl) {
        model.ThirdOrIos = 1;
      } else {
        model.ThirdOrIos = 3;
      }
    } else {
      const shelf = await fetchChannelAndroidAppPackagesApi();
      if (generation !== loadGeneration || !props.open) return;
      shelfOptions.value = shelf;
      model.AppPackageConfigId =
        fullDetail.AndroidPkgConfigId ?? fullDetail.AppPackageConfigId;
      model.IosPackageId = '';
      model.ThirdCustomIosUrl = '';
      model.ThirdOrIos = 3;
    }
    formRef.value?.clearValidate();
  } catch (error_) {
    if (generation === loadGeneration) {
      error.value =
        error_ instanceof Error ? error_.message : '包体设置加载失败';
    }
  } finally {
    if (generation === loadGeneration) loading.value = false;
  }
}

async function submit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (!detail.value) return;

  saving.value = true;
  try {
    const payload = {
      ...detail.value,
      AppPackageConfigId: model.AppPackageConfigId,
      PromoterAdminId: detail.value.AdminId,
      ThirdOrIos: model.ThirdOrIos,
    };
    if (props.platform === 'ios') {
      payload.IosPackageId = model.ThirdOrIos === 2 ? model.IosPackageId : '';
      payload.ThirdCustomIosUrl =
        model.ThirdOrIos === 1 ? model.ThirdCustomIosUrl.trim() : '';
      await updateChannelIosAppPackageApi(payload);
    } else {
      await updateChannelAndroidAppPackageApi(payload);
    }
    message.success('包体设置成功');
    emit('success');
    emit('update:open', false);
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
    :title="title"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <Spin :spinning="loading">
      <Alert v-if="error" :message="error" show-icon type="error" />
      <Form
        v-else
        ref="formRef"
        class="mt-4"
        :label-col="{ span: 7 }"
        :model="model"
        :rules="rules"
        :wrapper-col="{ span: 17 }"
      >
        <template v-if="platform === 'ios'">
          <Form.Item label="iOS 签名方式" name="ThirdOrIos">
            <Radio.Group v-model:value="model.ThirdOrIos">
              <Radio :value="1">第三方签名</Radio>
              <Radio :value="2">企业包</Radio>
              <Radio :value="3">均不使用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            v-if="model.ThirdOrIos === 1"
            label="三方超级签地址"
            name="ThirdCustomIosUrl"
          >
            <Input
              v-model:value="model.ThirdCustomIosUrl"
              placeholder="https://..."
            />
          </Form.Item>
          <Form.Item
            v-if="model.ThirdOrIos === 2"
            label="iOS 企业包"
            name="IosPackageId"
          >
            <Select
              v-model:value="model.IosPackageId"
              :options="
                enterpriseOptions.map((item) => ({
                  label: enterpriseLabel(item),
                  value: item.Id,
                }))
              "
              placeholder="请选择企业包"
            />
          </Form.Item>
        </template>
        <Form.Item
          :label="platform === 'ios' ? 'iOS 上架包' : 'Android 上架包'"
          name="AppPackageConfigId"
        >
          <Select
            v-model:value="model.AppPackageConfigId"
            :options="
              shelfOptions.map((item) => ({
                label: shelfLabel(item),
                value: item.Id,
              }))
            "
            placeholder="请选择上架包"
            show-search
            :filter-option="
              (input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
          />
        </Form.Item>
      </Form>
    </Spin>
  </Modal>
</template>
