<script lang="ts" setup>
import type { ProbabilityPrizeItem } from './voucher-shared';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Tabs,
} from 'ant-design-vue';

import VoucherImageField from './voucher-image-field.vue';
import { createEmptyPhysicalVariant, createEmptyProbabilityPrize, formatCentsToYuan, getRewardTypeOptions, REWARD_TYPE, VOUCHER_TYPE, yuanToCents } from './voucher-shared';

defineOptions({ name: 'VoucherRewardTierModal' });

const props = defineProps<{
  langGroupIds: number[];
  mode: 'add' | 'edit';
  row?: null | Record<string, unknown>;
  voucherType: number;
}>();

const emit = defineEmits<{ submit: [Record<string, unknown>] }>();

const open = defineModel<boolean>('open', { default: false });

const activeLang = ref(String(props.langGroupIds[0] ?? 1));
const rewardTypeOptions = computed(() =>
  getRewardTypeOptions(props.voucherType),
);
const isRedPacket = computed(
  () => props.voucherType === VOUCHER_TYPE.RED_PACKET,
);
const isCash = computed(() => props.voucherType === VOUCHER_TYPE.CASH);
const isPrizeGroup = computed(
  () =>
    props.voucherType === VOUCHER_TYPE.GOLDEN_EGG ||
    props.voucherType === VOUCHER_TYPE.PRIZE_WHEEL,
);

interface SimpleTierDraft {
  DrawWater: number;
  goldYuan: number;
  maximumGoldYuan: number;
  minimumGoldYuan: number;
  PriceProbabilityWeight: number;
}

const simpleDraft = reactive<SimpleTierDraft>({
  DrawWater: 1,
  goldYuan: 10,
  maximumGoldYuan: 0,
  minimumGoldYuan: 0,
  PriceProbabilityWeight: 100,
});

const prizeDraft = reactive<ProbabilityPrizeItem & { goldYuan: number }>({
  ...createEmptyProbabilityPrize(props.voucherType, props.langGroupIds),
  goldYuan: 0,
});

const hasGoldReward = computed({
  get: () => Number(prizeDraft.goldYuan) > 0,
  set: (val: boolean) => {
    prizeDraft.goldYuan = val ? 100 : 0;
  },
});
const hasPointsReward = computed({
  get: () => Number(prizeDraft.Points) > 0,
  set: (val: boolean) => {
    prizeDraft.Points = val ? 100 : 0;
  },
});

function resetDraft() {
  activeLang.value = String(props.langGroupIds[0] ?? 1);
  Object.assign(simpleDraft, {
    DrawWater: 1,
    goldYuan: 10,
    maximumGoldYuan: 0,
    minimumGoldYuan: 0,
    PriceProbabilityWeight: 100,
  });
  Object.assign(prizeDraft, {
    ...createEmptyProbabilityPrize(props.voucherType, props.langGroupIds),
    goldYuan: 0,
  });
}

function fillFromRow(row: Record<string, unknown>) {
  resetDraft();
  if (isRedPacket.value) {
    simpleDraft.minimumGoldYuan = formatCentsToYuan(
      row.MinimumGoldAmount as number,
    );
    simpleDraft.maximumGoldYuan = formatCentsToYuan(
      row.MaximumGoldAmount as number,
    );
    simpleDraft.DrawWater = Number(row.DrawWater) || 1;
    simpleDraft.PriceProbabilityWeight =
      Number(row.PriceProbabilityWeight) || 100;
    return;
  }
  if (isCash.value) {
    simpleDraft.goldYuan = formatCentsToYuan(row.Gold as number);
    simpleDraft.DrawWater = Number(row.DrawWater) || 1;
    return;
  }
  Object.assign(
    prizeDraft,
    JSON.parse(JSON.stringify(row)) as ProbabilityPrizeItem,
  );
  prizeDraft.goldYuan = formatCentsToYuan(row.Gold as number);
}

watch(
  () => open.value,
  (visible) => {
    if (!visible) {
      return;
    }
    if (props.mode === 'edit' && props.row) {
      fillFromRow(props.row);
    } else {
      resetDraft();
    }
  },
);

watch(
  () => prizeDraft.PriceType,
  () => {
    if (!isPrizeGroup.value) {
      return;
    }
    const preservedWeight = prizeDraft.PriceProbabilityWeight;
    const fresh = createEmptyProbabilityPrize(
      props.voucherType,
      props.langGroupIds,
    );
    Object.assign(prizeDraft, fresh, {
      PriceProbabilityWeight: preservedWeight,
      goldYuan: 0,
    });
  },
);

function addVariant() {
  if (prizeDraft.PhysicalProduct.ProductTagDetail.length >= 5) {
    return;
  }
  prizeDraft.PhysicalProduct.ProductTagDetail.push(
    createEmptyPhysicalVariant(props.langGroupIds),
  );
}

function removeVariant(index: number) {
  prizeDraft.PhysicalProduct.ProductTagDetail.splice(index, 1);
}

function hasLangValue(
  langMap: Record<string, Record<string, unknown>> | undefined,
  lgId: string,
  key: string,
) {
  return Boolean(String(langMap?.[lgId]?.[key] ?? '').trim());
}

function validateAndBuild(): null | Record<string, unknown> {
  if (isRedPacket.value) {
    if (
      !(simpleDraft.minimumGoldYuan > 0) ||
      !(simpleDraft.maximumGoldYuan > 0)
    ) {
      message.warning('请输入最小金额与最大金额');
      return null;
    }
    if (
      Number(simpleDraft.minimumGoldYuan) > Number(simpleDraft.maximumGoldYuan)
    ) {
      message.warning('最小金额不能大于最大金额');
      return null;
    }
    if (
      !(simpleDraft.DrawWater > 0) ||
      !(simpleDraft.PriceProbabilityWeight > 0)
    ) {
      message.warning('请输入流水倍数与中奖概率权重');
      return null;
    }
    return {
      DrawWater: Number(simpleDraft.DrawWater),
      MaximumGoldAmount: yuanToCents(simpleDraft.maximumGoldYuan),
      MinimumGoldAmount: yuanToCents(simpleDraft.minimumGoldYuan),
      PriceProbabilityWeight: Number(simpleDraft.PriceProbabilityWeight),
    };
  }

  if (isCash.value) {
    if (!(simpleDraft.goldYuan > 0) || !(simpleDraft.DrawWater > 0)) {
      message.warning('请输入奖励金额与流水倍数');
      return null;
    }
    return {
      DrawWater: Number(simpleDraft.DrawWater),
      Gold: yuanToCents(simpleDraft.goldYuan),
    };
  }

  // 砸金蛋券 / 豪礼转盘券
  if (!(prizeDraft.PriceProbabilityWeight > 0)) {
    message.warning('请输入中奖概率权重');
    return null;
  }
  const lgId = activeLang.value;
  const result = JSON.parse(
    JSON.stringify(prizeDraft),
  ) as ProbabilityPrizeItem & Record<string, unknown>;
  delete (result as Record<string, unknown>).goldYuan;
  result.Gold = yuanToCents(prizeDraft.goldYuan);

  switch (prizeDraft.PriceType) {
  case REWARD_TYPE.CASH: {
    if (!(result.Gold > 0) || !(Number(prizeDraft.DrawWater) > 0)) {
      message.warning('请输入彩金奖励金额与流水倍数');
      return null;
    }
    if (!hasLangValue(prizeDraft.LangText, lgId, 'PriceName')) {
      message.warning('请输入奖品名称');
      return null;
    }
    if (
      !hasLangValue(prizeDraft.LangText, lgId, 'PrizeWheelImage') ||
      !hasLangValue(prizeDraft.LangText, lgId, 'PrizePopupImage')
    ) {
      message.warning('请上传奖品转盘图片与弹窗图片');
      return null;
    }
  
  break;
  }
  case REWARD_TYPE.GENERAL: {
    if (!(result.Gold > 0) && !(Number(prizeDraft.Points) > 0)) {
      message.warning('请至少设置一种奖励(彩金或积分)');
      return null;
    }
    if (result.Gold > 0 && !(Number(prizeDraft.DrawWater) > 0)) {
      message.warning('请输入彩金流水倍数');
      return null;
    }
  
  break;
  }
  case REWARD_TYPE.PHYSICAL: {
    if (
      !hasLangValue(prizeDraft.PhysicalProduct.LangText, lgId, 'ProductName') ||
      !hasLangValue(prizeDraft.PhysicalProduct.LangText, lgId, 'ProductPic')
    ) {
      message.warning('请填写实物奖品名称与图片');
      return null;
    }
    if (prizeDraft.PhysicalProduct.ProductTagDetail.length === 0) {
      message.warning('请添加至少一张申请图片');
      return null;
    }
    for (const variant of prizeDraft.PhysicalProduct.ProductTagDetail) {
      if (
        !hasLangValue(variant.LangText, lgId, 'ItemPic') ||
        !hasLangValue(variant.LangText, lgId, 'ItemAttribute')
      ) {
        message.warning('请完整填写申请图片与商品属性');
        return null;
      }
    }
  
  break;
  }
  case REWARD_TYPE.POINT: {
    if (!(Number(prizeDraft.Points) > 0)) {
      message.warning('请输入积分奖励');
      return null;
    }
    if (
      !hasLangValue(prizeDraft.LangText, lgId, 'PrizeWheelImage') ||
      !hasLangValue(prizeDraft.LangText, lgId, 'PrizePopupImage')
    ) {
      message.warning('请上传奖品转盘图片与弹窗图片');
      return null;
    }
  
  break;
  }
  case REWARD_TYPE.VIRTUAL: {
    if (
      !hasLangValue(prizeDraft.VirtualProduct.LangText, lgId, 'ProductName') ||
      !hasLangValue(prizeDraft.VirtualProduct.LangText, lgId, 'ProductPic')
    ) {
      message.warning('请填写虚拟奖品名称与图片');
      return null;
    }
  
  break;
  }
  // No default
  }

  return result;
}

function handleOk() {
  const built = validateAndBuild();
  if (!built) {
    return;
  }
  emit('submit', built);
  open.value = false;
}
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    :title="mode === 'edit' ? '编辑奖励' : '新增奖励'"
    width="760px"
    @ok="handleOk"
  >
    <!-- 幸运红包券 -->
    <Form v-if="isRedPacket" layout="vertical">
      <div class="flex flex-wrap gap-6">
        <Form.Item label="最小金额（元）">
          <InputNumber
            v-model:value="simpleDraft.minimumGoldYuan"
            :min="0.01"
            :precision="2"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item label="最大金额（元）">
          <InputNumber
            v-model:value="simpleDraft.maximumGoldYuan"
            :min="0.01"
            :precision="2"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item label="流水倍数">
          <InputNumber
            v-model:value="simpleDraft.DrawWater"
            :min="0"
            style="width: 140px"
          />
        </Form.Item>
        <Form.Item label="中奖概率权重">
          <InputNumber
            v-model:value="simpleDraft.PriceProbabilityWeight"
            :min="1"
            style="width: 140px"
          />
        </Form.Item>
      </div>
    </Form>

    <!-- 现金兑换券 -->
    <Form v-else-if="isCash" layout="vertical">
      <div class="flex flex-wrap gap-6">
        <Form.Item label="奖励金额（元）">
          <InputNumber
            v-model:value="simpleDraft.goldYuan"
            :min="0.01"
            :precision="2"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item label="流水倍数">
          <InputNumber
            v-model:value="simpleDraft.DrawWater"
            :min="0"
            style="width: 140px"
          />
        </Form.Item>
      </div>
    </Form>

    <!-- 砸金蛋券 / 豪礼转盘券 -->
    <div v-else>
      <Form layout="vertical">
        <div class="flex flex-wrap gap-6">
          <Form.Item label="奖品类型">
            <Select
              v-model:value="prizeDraft.PriceType"
              :options="rewardTypeOptions"
              style="width: 180px"
            />
          </Form.Item>
          <Form.Item label="中奖概率权重">
            <InputNumber
              v-model:value="prizeDraft.PriceProbabilityWeight"
              :min="1"
              style="width: 140px"
            />
          </Form.Item>
        </div>

        <!-- 彩金 + 积分 -->
        <template v-if="prizeDraft.PriceType === REWARD_TYPE.GENERAL">
          <Form.Item>
            <template #label>
              <Checkbox v-model:checked="hasGoldReward">
彩金奖励（元）
</Checkbox>
            </template>
            <InputNumber
              v-model:value="prizeDraft.goldYuan"
              :disabled="!hasGoldReward"
              :min="0"
              :precision="2"
              style="width: 180px"
            />
          </Form.Item>
          <Form.Item v-if="hasGoldReward" label="彩金流水倍数">
            <InputNumber
              v-model:value="prizeDraft.DrawWater"
              :min="0"
              style="width: 140px"
            />
          </Form.Item>
          <Form.Item>
            <template #label>
              <Checkbox v-model:checked="hasPointsReward">积分奖励</Checkbox>
            </template>
            <InputNumber
              v-model:value="prizeDraft.Points"
              :disabled="!hasPointsReward"
              :min="0"
              style="width: 180px"
            />
          </Form.Item>
        </template>

        <!-- 彩金 -->
        <template v-else-if="prizeDraft.PriceType === REWARD_TYPE.CASH">
          <div class="flex flex-wrap gap-6">
            <Form.Item label="彩金金额（元）">
              <InputNumber
                v-model:value="prizeDraft.goldYuan"
                :min="0.01"
                :precision="2"
                style="width: 180px"
              />
            </Form.Item>
            <Form.Item label="彩金流水倍数">
              <InputNumber
                v-model:value="prizeDraft.DrawWater"
                :min="0"
                style="width: 140px"
              />
            </Form.Item>
          </div>
        </template>

        <!-- 积分 -->
        <template v-else-if="prizeDraft.PriceType === REWARD_TYPE.POINT">
          <Form.Item label="积分奖励">
            <InputNumber
              v-model:value="prizeDraft.Points"
              :min="1"
              style="width: 180px"
            />
          </Form.Item>
        </template>
      </Form>

      <!-- 按语言组维护的字段 -->
      <Tabs v-model:active-key="activeLang" type="line" size="small">
        <Tabs.TabPane
          v-for="lgId in langGroupIds"
          :key="String(lgId)"
          :tab="langGroupIds.length > 1 ? `语言组 ${lgId}` : '奖品信息'"
        >
          <Form layout="vertical">
            <!-- 彩金 / 积分: 转盘图 + 弹窗图 + 奖品名称 -->
            <template
              v-if="
                ([REWARD_TYPE.CASH, REWARD_TYPE.POINT] as number[]).includes(
                  prizeDraft.PriceType,
                )
              "
            >
              <Form.Item label="奖品名称">
                <Input
                  v-model:value="prizeDraft.LangText[String(lgId)]!.PriceName"
                  allow-clear
                />
              </Form.Item>
              <div class="flex flex-wrap gap-6">
                <Form.Item label="奖品转盘图片">
                  <VoucherImageField
                    v-model="prizeDraft.LangText[String(lgId)]!.PrizeWheelImage"
                    dimension-hint="建议尺寸 264 * 420，PNG，≤500K"
                  />
                </Form.Item>
                <Form.Item label="奖品弹窗图片">
                  <VoucherImageField
                    v-model="prizeDraft.LangText[String(lgId)]!.PrizePopupImage"
                    dimension-hint="建议尺寸 264 * 420，PNG，≤500K"
                  />
                </Form.Item>
              </div>
            </template>

            <!-- 实体奖品 -->
            <template v-else-if="prizeDraft.PriceType === REWARD_TYPE.PHYSICAL">
              <Form.Item label="奖品名称">
                <Input
                  v-model:value="
                    prizeDraft.PhysicalProduct.LangText[String(lgId)]!
                      .ProductName
                  "
                  allow-clear
                />
              </Form.Item>
              <Form.Item label="奖品图片">
                <VoucherImageField
                  v-model="
                    prizeDraft.PhysicalProduct.LangText[String(lgId)]!
                      .ProductPic
                  "
                  dimension-hint="建议尺寸 354 * 324，PNG，≤500K"
                />
              </Form.Item>
              <Form.Item label="申请图片（最多 5 张）">
                <div class="flex flex-wrap gap-4">
                  <Card
                    v-for="(variant, index) in prizeDraft.PhysicalProduct
                      .ProductTagDetail"
                    :key="variant.ItemUid"
                    size="small"
                    style="width: 220px"
                  >
                    <template #extra>
                      <Button danger size="small" @click="removeVariant(index)">
                        删除
                      </Button>
                    </template>
                    <VoucherImageField
                      v-model="variant.LangText[String(lgId)]!.ItemPic"
                      dimension-hint="建议尺寸 200 * 200"
                      :preview-height="48"
                      :preview-width="64"
                    />
                    <Input
                      v-model:value="
                        variant.LangText[String(lgId)]!.ItemAttribute
                      "
                      class="mt-2"
                      placeholder="商品属性"
                    />
                  </Card>
                  <Card
                    v-if="
                      prizeDraft.PhysicalProduct.ProductTagDetail.length < 5
                    "
                    size="small"
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 220px;
                    "
                  >
                    <Empty :image="false" description=" ">
                      <Button type="primary" @click="addVariant">添加</Button>
                    </Empty>
                  </Card>
                </div>
              </Form.Item>
            </template>

            <!-- 虚拟奖品 -->
            <template v-else-if="prizeDraft.PriceType === REWARD_TYPE.VIRTUAL">
              <Form.Item label="奖品名称">
                <Input
                  v-model:value="
                    prizeDraft.VirtualProduct.LangText[String(lgId)]!
                      .ProductName
                  "
                  allow-clear
                />
              </Form.Item>
              <Form.Item label="奖品图片">
                <VoucherImageField
                  v-model="
                    prizeDraft.VirtualProduct.LangText[String(lgId)]!.ProductPic
                  "
                  dimension-hint="建议尺寸 354 * 324，PNG，≤500K"
                />
              </Form.Item>
            </template>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Modal>
</template>
