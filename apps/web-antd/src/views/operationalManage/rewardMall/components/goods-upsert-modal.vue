<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Spin,
  Switch,
  Tabs,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createRewardProductApi,
  fetchRewardProductDetailApi,
  fetchRewardProductTagListApi,
  updateRewardProductApi,
} from '#/api/operationManage/reward-mall';
import { fetchVoucherListAllApi } from '#/api/operationManage/voucher';
import ChannelSelect from '#/components/global/channel-select.vue';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';
import VoucherVenueField from '#/views/operationalManage/voucher/components/voucher-venue-field.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPlatformStore } from '#/store/cloud-platform';

import {
  LIMIT_WINDOW,
  LIMIT_WINDOW_OPTIONS,
  PRODUCT_TYPE,
  PRODUCT_TYPE_OPTIONS,
  VIP_LEVEL_RANGE_OPTIONS,
  type PhysicalVariantItem,
  assembleProductSubmitPayload,
  breakupProductDetail,
  createDefaultProductForm,
  createEmptyPhysicalVariant,
  parseLangTextMap,
  resolveDefaultLangGroupId,
  resolveLangGroupIds,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsUpsertModal' });

type UpsertMode = 'add' | 'clone' | 'edit';

const props = defineProps<{
  mode?: UpsertMode;
  productId?: number | string;
}>();

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const cloudStore = useCloudPlatformStore();
const { packageOptions } = useOperationOptions();
const langGroupIds = computed(() =>
  resolveLangGroupIds(cloudStore.projectConfig),
);
const defaultLangGroupId = computed(() =>
  resolveDefaultLangGroupId(cloudStore.projectConfig),
);

const loading = ref(false);
const saving = ref(false);
const activeLangTab = ref(String(defaultLangGroupId.value));

const form = reactive(createDefaultProductForm(langGroupIds.value));

const modalTitle = computed(() => {
  if (props.mode === 'clone') {
    return '克隆商品';
  }
  if (props.mode === 'edit') {
    return '编辑商品';
  }
  return '新增商品';
});

const isEditing = computed(() => props.mode === 'edit');

const isCash = computed(() => form.ProductType === PRODUCT_TYPE.CASH);
const isVoucher = computed(() => form.ProductType === PRODUCT_TYPE.VOUCHER);
const isPhysical = computed(() => form.ProductType === PRODUCT_TYPE.PHYSICAL);

const deviceOptions = computed(() => {
  const map = cloudStore.projectConfig?.DevicePlatformAll || {};
  const entries = Object.entries(map);
  if (!entries.length) {
    return [
      { label: 'PC', value: '1' },
      { label: 'H5', value: '2' },
      { label: 'Android', value: '3' },
      { label: 'iOS', value: '4' },
    ];
  }
  return entries.map(([value, label]) => ({
    label: String(label),
    value: String(value),
  }));
});

function csvToIds(value?: string): Array<number | string> {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (Number.isNaN(Number(item)) ? item : Number(item)));
}
function idsToCsv(value: Array<number | string> | undefined) {
  return (value || []).map(String).filter(Boolean).join(',');
}

const displayDevicesArray = computed<string[]>({
  get: () =>
    String(form.DisplayDevices || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  set: (val) => {
    form.DisplayDevices = val.join(',');
  },
});

const validChannels = computed<Array<number | string>>({
  get: () => csvToIds(form.ValidChannels),
  set: (val) => {
    form.ValidChannels = idsToCsv(val);
  },
});

const validPackages = computed<Array<number | string>>({
  get: () => csvToIds(form.ValidPackages),
  set: (val) => {
    form.ValidPackages = idsToCsv(val);
  },
});

const validTimeRange = computed<[Dayjs, Dayjs] | undefined>({
  get: (): [Dayjs, Dayjs] | undefined =>
    form.ProductValidStartTime && form.ProductValidEndTime
      ? [
          dayjs.unix(Number(form.ProductValidStartTime)),
          dayjs.unix(Number(form.ProductValidEndTime)),
        ]
      : undefined,
  set: (val: [Dayjs, Dayjs] | undefined) => {
    form.ProductValidStartTime = val ? val[0].unix() : 0;
    form.ProductValidEndTime = val ? val[1].unix() : 0;
  },
});

const bonusAmountYuan = computed<number>({
  get: () => (Number(form.BonusConfig.BonusAmount) || 0) / 100,
  set: (val) => {
    form.BonusConfig.BonusAmount = Math.round((Number(val) || 0) * 100);
  },
});

/* ------------------------------------------------------------------ */
/* 商品页签 / 票券选择器                                                     */
/* ------------------------------------------------------------------ */

const tagOptions = ref<Array<{ label: string; value: number }>>([]);
const voucherOptions = ref<Array<{ label: string; value: number }>>([]);

async function loadTagOptions() {
  try {
    const result = await fetchRewardProductTagListApi();
    const items = result.Items || [];
    tagOptions.value = items.map((item) => {
      const lang = parseLangTextMap(item.LangText);
      const first = Object.values(lang)[0] as { Name?: string } | undefined;
      return { label: first?.Name || `页签${item.Id}`, value: Number(item.Id) };
    });
  } catch {
    tagOptions.value = [];
  }
}

async function loadVoucherOptions() {
  try {
    const result = await fetchVoucherListAllApi();
    const items = result.Items || [];
    voucherOptions.value = items.map((item) => {
      const lang = parseLangTextMap(item.LangText);
      const first = Object.values(lang)[0] as { Name?: string } | undefined;
      return {
        label: `${first?.Name || '-'} (${item.Id})`,
        value: Number(item.Id),
      };
    });
  } catch {
    voucherOptions.value = [];
  }
}

/* ------------------------------------------------------------------ */
/* 实体商品变种                                                            */
/* ------------------------------------------------------------------ */

function addVariant() {
  if (form.PhysicalProductElement.length >= 5) {
    return;
  }
  form.PhysicalProductElement.push(
    createEmptyPhysicalVariant(langGroupIds.value),
  );
}

function removeVariant(index: number) {
  const variant = form.PhysicalProductElement[index] as
    | PhysicalVariantItem
    | undefined;
  const hasContent = Boolean(
    variant?.LangText?.[activeLangTab.value]?.ItemPic ||
    variant?.LangText?.[activeLangTab.value]?.ItemAttribute,
  );
  if (hasContent) {
    Modal.confirm({
      content: '确认删除该商品变种吗？',
      onOk: () => {
        form.PhysicalProductElement.splice(index, 1);
      },
      title: '删除确认',
    });
    return;
  }
  form.PhysicalProductElement.splice(index, 1);
}

/* ------------------------------------------------------------------ */
/* 加载 / 提交                                                            */
/* ------------------------------------------------------------------ */

async function loadDetail() {
  if (!props.productId) {
    return;
  }
  loading.value = true;
  try {
    const detail = await fetchRewardProductDetailApi(props.productId);
    if (!detail) {
      return;
    }
    const breakup = breakupProductDetail(detail, langGroupIds.value);
    Object.assign(form, breakup);
    if (props.mode === 'clone') {
      form.Id = undefined;
    }
  } finally {
    loading.value = false;
  }
}

watch(
  () => [open.value, props.productId, props.mode] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }
    activeLangTab.value = String(defaultLangGroupId.value);
    void loadTagOptions();
    void loadVoucherOptions();
    if (props.mode === 'add') {
      Object.assign(form, createDefaultProductForm(langGroupIds.value));
      displayDevicesArray.value = deviceOptions.value.map((item) => item.value);
    } else {
      void loadDetail();
    }
  },
);

function validateForm(): boolean {
  for (const lgId of langGroupIds.value) {
    const isDefault = lgId === defaultLangGroupId.value;
    const lang = form.LangText[String(lgId)];
    const active = isDefault || Boolean(lang?.IsActive);
    if (!active) {
      continue;
    }
    if (!String(lang?.Name || '').trim()) {
      message.warning(`请填写语言组 ${lgId} 的商品名称`);
      activeLangTab.value = String(lgId);
      return false;
    }
    if (!lang?.AppListImage || !lang?.PcListImage) {
      message.warning(`请上传语言组 ${lgId} 的商品列表图`);
      activeLangTab.value = String(lgId);
      return false;
    }
    if (!lang?.AppPurchaseImage || !lang?.PcPurchaseImage) {
      message.warning(`请上传语言组 ${lgId} 的商品购买图`);
      activeLangTab.value = String(lgId);
      return false;
    }
  }

  if (!form.ProductTag) {
    message.warning('请选择商品页签');
    return false;
  }
  if (!validTimeRange.value) {
    message.warning('请选择商品有效时间');
    return false;
  }
  if (!displayDevicesArray.value.length) {
    message.warning('请至少选择一个展示设备');
    return false;
  }
  if (Number(form.VipLevelStart) > Number(form.VipLevelEnd)) {
    message.warning('VIP等级下限不能大于上限');
    return false;
  }
  if (!(Number(form.ProductExchangePoints) > 0)) {
    message.warning('请输入兑换要求积分');
    return false;
  }
  if (
    form.ProductExchangeLimitType !== LIMIT_WINDOW.NONE &&
    !(Number(form.ProductExchangeLimitCount) > 0)
  ) {
    message.warning('请输入商品限制可购买数量');
    return false;
  }
  if (!isEditing.value && !(Number(form.ProductStockCount) > 0)) {
    message.warning('请输入商品总库存');
    return false;
  }
  if (isCash.value) {
    if (!(Number(form.BonusConfig.BonusAmount) > 0)) {
      message.warning('请输入彩金金额');
      return false;
    }
    if (!(Number(form.BonusConfig.RewardMulti) > 0)) {
      message.warning('请输入彩金流水倍数');
      return false;
    }
  }
  if (isVoucher.value && !form.VoucherId) {
    message.warning('请选择票券');
    return false;
  }
  if (isPhysical.value && !form.PhysicalProductElement.length) {
    message.warning('请至少添加一个商品变种');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  const payload = assembleProductSubmitPayload(form, {
    langGroupIds: langGroupIds.value,
    mode: props.mode || 'add',
  });
  saving.value = true;
  try {
    if (props.mode === 'edit') {
      await updateRewardProductApi(payload);
      message.success('保存成功');
    } else {
      await createRewardProductApi(payload);
      message.success(props.mode === 'clone' ? '克隆成功' : '创建成功');
    }
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
    width="90%"
    :style="{ maxWidth: '1100px' }"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <div class="max-h-[75vh] overflow-y-auto pr-2">
        <Form layout="vertical">
          <Form.Item label="商品类型" required>
            <Select
              v-model:value="form.ProductType"
              :options="PRODUCT_TYPE_OPTIONS"
              style="width: 220px"
            />
          </Form.Item>

          <template v-if="isCash">
            <div class="flex flex-wrap gap-6">
              <Form.Item label="彩金金额（元）" required>
                <InputNumber
                  v-model:value="bonusAmountYuan"
                  :min="0.01"
                  :precision="2"
                  style="width: 200px"
                />
              </Form.Item>
              <Form.Item label="彩金流水倍数" required>
                <InputNumber
                  v-model:value="form.BonusConfig.RewardMulti"
                  :min="1"
                  style="width: 200px"
                />
                <span class="ml-2 text-gray-500">倍</span>
              </Form.Item>
            </div>
            <Form.Item label="提款流水场馆">
              <VoucherVenueField
                v-model:categories="form.BonusConfig.WithdrawWaterGamesPlatform"
                v-model:pick-mode="form.BonusConfig.WithdrawWaterGameType"
                v-model:venues="form.BonusConfig.WithdrawWaterGames"
                :disabled="isEditing"
                format="csv"
              />
              <div v-if="isEditing" class="mt-1 text-xs text-gray-400">
                * 保存后不可编辑
              </div>
            </Form.Item>
          </template>

          <Form.Item v-if="isVoucher" label="票券设置" required>
            <Select
              v-model:value="form.VoucherId"
              allow-clear
              :options="voucherOptions"
              placeholder="请选择票券"
              show-search
              style="width: 320px"
            />
          </Form.Item>
        </Form>

        <!-- 多语言 -->
        <Tabs v-model:active-key="activeLangTab" type="line" size="small">
          <Tabs.TabPane
            v-for="lgId in langGroupIds"
            :key="String(lgId)"
            :tab="langGroupIds.length > 1 ? `语言组 ${lgId}` : '基本信息'"
          >
            <Form layout="vertical">
              <Form.Item v-if="lgId !== defaultLangGroupId" label="多语言开关">
                <Switch
                  v-model:checked="form.LangText[String(lgId)]!.IsActive"
                />
              </Form.Item>
              <Form.Item label="商品名称" required>
                <Input
                  v-model:value="form.LangText[String(lgId)]!.Name"
                  allow-clear
                  placeholder="请输入商品名称"
                />
              </Form.Item>
              <Form.Item label="商品描述">
                <Input.TextArea
                  v-model:value="form.LangText[String(lgId)]!.Description"
                  :auto-size="{ maxRows: 4, minRows: 2 }"
                  placeholder="请输入商品描述"
                />
              </Form.Item>
              <div class="flex flex-wrap gap-6">
                <Form.Item label="APP 商品列表图" required>
                  <VoucherImageField
                    v-model="form.LangText[String(lgId)]!.AppListImage"
                    dimension-hint="建议尺寸 200 * 200，PNG，≤500K"
                    :max-size-kb="500"
                  />
                </Form.Item>
                <Form.Item label="PC 商品列表图" required>
                  <VoucherImageField
                    v-model="form.LangText[String(lgId)]!.PcListImage"
                    dimension-hint="建议尺寸 435 * 387，PNG，≤1M"
                    :max-size-kb="1024"
                  />
                </Form.Item>
              </div>
              <div class="flex flex-wrap gap-6">
                <Form.Item label="APP 商品购买图" required>
                  <VoucherImageField
                    v-model="form.LangText[String(lgId)]!.AppPurchaseImage"
                    dimension-hint="建议尺寸 354 * 324，PNG，≤500K"
                    :max-size-kb="500"
                  />
                </Form.Item>
                <Form.Item label="PC 商品购买图" required>
                  <VoucherImageField
                    v-model="form.LangText[String(lgId)]!.PcPurchaseImage"
                    dimension-hint="建议尺寸 758 * 800，PNG，≤1M"
                    :max-size-kb="1024"
                  />
                </Form.Item>
              </div>

              <Form.Item v-if="isPhysical" label="商品申请图片（最多5个变种）">
                <div class="flex flex-wrap gap-4">
                  <div
                    v-for="(variant, idx) in form.PhysicalProductElement"
                    :key="(variant as PhysicalVariantItem).ItemUid || idx"
                    class="relative w-[220px] rounded border p-3"
                  >
                    <Button
                      class="absolute right-1 top-1"
                      danger
                      shape="circle"
                      size="small"
                      @click="removeVariant(idx)"
                    >
                      ×
                    </Button>
                    <VoucherImageField
                      v-model="
                        (variant as PhysicalVariantItem).LangText[String(lgId)]!
                          .ItemPic
                      "
                      dimension-hint="建议尺寸 200 * 200，PNG，≤500K"
                    />
                    <div class="mt-2 flex flex-col gap-1">
                      <span class="text-xs text-gray-500">商品属性</span>
                      <Input
                        v-model:value="
                          (variant as PhysicalVariantItem).LangText[
                            String(lgId)
                          ]!.ItemAttribute
                        "
                        placeholder="请输入商品属性"
                      />
                    </div>
                  </div>
                  <div
                    v-if="form.PhysicalProductElement.length < 5"
                    class="flex w-[220px] items-center justify-center rounded border border-dashed"
                  >
                    <Button type="dashed" @click="addVariant">添加变种</Button>
                  </div>
                </div>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>

        <!-- 基础设置 -->
        <div class="mb-2 mt-6 text-base font-semibold text-primary">
          基础设置
        </div>
        <Form layout="vertical">
          <Form.Item label="商品页签" required>
            <Select
              v-model:value="form.ProductTag"
              :options="tagOptions"
              placeholder="请选择商品页签"
              style="width: 260px"
            />
          </Form.Item>

          <Form.Item label="商品有效期" required>
            <DatePicker.RangePicker v-model:value="validTimeRange" show-time />
          </Form.Item>

          <Form.Item label="展示设备" required>
            <Checkbox.Group
              v-model:value="displayDevicesArray"
              :options="deviceOptions"
            />
          </Form.Item>

          <Form.Item label="VIP等级限制">
            <Select
              v-model:value="form.VipLevelStart"
              :options="VIP_LEVEL_RANGE_OPTIONS"
              style="width: 140px"
            />
            <span class="mx-2">-</span>
            <Select
              v-model:value="form.VipLevelEnd"
              :options="VIP_LEVEL_RANGE_OPTIONS"
              style="width: 140px"
            />
          </Form.Item>

          <Form.Item label="生效渠道">
            <ChannelSelect
              v-model="validChannels"
              style="width: 100%; max-width: 480px"
              placeholder="请输入渠道号"
            />
          </Form.Item>

          <Form.Item label="生效产品">
            <Select
              v-model:value="validPackages"
              allow-clear
              :field-names="{ label: 'PackageName', value: 'PackageId' }"
              mode="multiple"
              :options="packageOptions"
              placeholder="不选=不限"
              style="width: 100%; max-width: 480px"
            />
          </Form.Item>

          <Form.Item label="兑换要求" required>
            <InputNumber
              v-model:value="form.ProductExchangePoints"
              :max="99_999_999"
              :min="1"
              style="width: 200px"
            />
            <span class="ml-2 text-gray-500">积分</span>
          </Form.Item>

          <Form.Item label="商品限制可购买总数">
            <div class="mb-1">
              <Radio.Group
                v-model:value="form.ProductExchangeLimitType"
                :options="LIMIT_WINDOW_OPTIONS"
              />
            </div>
            <div>
              <InputNumber
                v-model:value="form.ProductExchangeLimitCount"
                :disabled="form.ProductExchangeLimitType === LIMIT_WINDOW.NONE"
                :min="1"
                style="width: 200px"
              />
              <span class="ml-2 text-gray-500">次</span>
            </div>
          </Form.Item>

          <Form.Item label="商品总库存" required>
            <InputNumber
              v-model:value="form.ProductStockCount"
              :disabled="isEditing"
              :max="99_999_999"
              :min="1"
              style="width: 200px"
            />
            <span v-if="isEditing" class="ml-2 text-xs text-gray-400">
              * 保存后不可编辑
            </span>
          </Form.Item>
        </Form>
      </div>
    </Spin>
  </Modal>
</template>
