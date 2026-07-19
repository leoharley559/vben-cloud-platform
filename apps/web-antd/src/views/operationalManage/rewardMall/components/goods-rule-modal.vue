<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Form, Modal, Tabs, message } from 'ant-design-vue';

import RichTextEditor from '#/components/global/rich-text-editor.vue';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';
import VoucherRedirectField from '#/views/operationalManage/voucher/components/voucher-redirect-field.vue';

import {
  type GoodsGuideItem,
  createEmptyGoodsGuide,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsRuleModal' });

const props = defineProps<{
  guide?: GoodsGuideItem | null;
  langGroupIds: number[];
  mode: 'add' | 'edit';
  title?: string;
}>();

const emit = defineEmits<{ submit: [GoodsGuideItem] }>();

const open = defineModel<boolean>('open', { default: false });

const activeLang = ref('');
const draft = reactive<GoodsGuideItem>(
  createEmptyGoodsGuide(props.langGroupIds),
);

function resetDraft() {
  Object.assign(draft, createEmptyGoodsGuide(props.langGroupIds));
  activeLang.value = String(props.langGroupIds[0] ?? 1);
}

watch(
  () => open.value,
  (visible) => {
    if (!visible) {
      return;
    }
    if (props.mode === 'edit' && props.guide) {
      resetDraft();
      Object.assign(draft, JSON.parse(JSON.stringify(props.guide)));
    } else {
      resetDraft();
    }
  },
);

function handleOk() {
  if (draft.JumpType !== 6 && !String(draft.Jump || '').trim()) {
    message.warning('请填写跳转参数');
    return;
  }
  emit('submit', JSON.parse(JSON.stringify(draft)));
  open.value = false;
}
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    :title="title || (mode === 'edit' ? '编辑规则' : '新增规则')"
    width="720px"
    @ok="handleOk"
  >
    <Tabs
      v-if="langGroupIds.length > 1"
      v-model:active-key="activeLang"
      class="mb-1"
      type="line"
      size="small"
    >
      <Tabs.TabPane
        v-for="lgId in langGroupIds"
        :key="String(lgId)"
        :tab="`语言组 ${lgId}`"
      >
        <Form layout="vertical">
          <Form.Item label="文本内容">
            <RichTextEditor
              v-model="draft.LangText[String(lgId)]!.Desc"
              placeholder="请输入文本内容"
            />
          </Form.Item>
          <div class="flex flex-wrap gap-6">
            <Form.Item label="APP 图片">
              <VoucherImageField
                v-model="draft.LangText[String(lgId)]!.Image2"
                dimension-hint="建议尺寸 642 * 460，PNG，≤500K"
              />
            </Form.Item>
            <Form.Item label="PC 图片">
              <VoucherImageField
                v-model="draft.LangText[String(lgId)]!.Image3"
                dimension-hint="建议尺寸 2136 * 全宽，PNG，≤500K"
              />
            </Form.Item>
          </div>
        </Form>
      </Tabs.TabPane>
    </Tabs>
    <Form v-else layout="vertical">
      <Form.Item label="文本内容">
        <RichTextEditor
          v-model="draft.LangText[String(langGroupIds[0] ?? 1)]!.Desc"
          placeholder="请输入文本内容"
        />
      </Form.Item>
      <div class="flex flex-wrap gap-6">
        <Form.Item label="APP 图片">
          <VoucherImageField
            v-model="draft.LangText[String(langGroupIds[0] ?? 1)]!.Image2"
            dimension-hint="建议尺寸 642 * 460，PNG，≤500K"
          />
        </Form.Item>
        <Form.Item label="PC 图片">
          <VoucherImageField
            v-model="draft.LangText[String(langGroupIds[0] ?? 1)]!.Image3"
            dimension-hint="建议尺寸 2136 * 全宽，PNG，≤500K"
          />
        </Form.Item>
      </div>
    </Form>

    <Form layout="vertical">
      <Form.Item label="跳转设置">
        <VoucherRedirectField
          v-model:param="draft.Jump"
          v-model:type="draft.JumpType"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
