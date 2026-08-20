<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Form,
  Input,
  message,
  Modal,
  Select,
  Switch,
  Tabs,
} from 'ant-design-vue';

import { fetchAdActivityJumpListApi } from '#/api/operationManage/game-notice';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';

import {
  createDefaultTaskForm,
  parseLangTextMap,
  resolveDefaultLangGroupId,
  resolveLangGroupIds,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsTaskUpsertModal' });

const props = defineProps<{
  mode: 'add' | 'edit';
  task?: null | Record<string, unknown>;
}>();

const emit = defineEmits<{ submit: [Record<string, unknown>] }>();

const open = defineModel<boolean>('open', { default: false });

const cloudStore = useCloudPlatformStore();
const langGroupIds = computed(() =>
  resolveLangGroupIds(cloudStore.projectConfig),
);
const defaultLangGroupId = computed(() =>
  resolveDefaultLangGroupId(cloudStore.projectConfig),
);

const form = reactive(createDefaultTaskForm(langGroupIds.value));
const activeLang = ref(String(defaultLangGroupId.value));

const activityOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);

function extractLangTitle(raw: unknown, fallback: string) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as undefined | { Title?: string };
  return first?.Title || fallback;
}

async function loadActivityOptions() {
  try {
    const result = await fetchAdActivityJumpListApi();
    const list = Array.isArray(result)
      ? result
      : (result as { Items?: unknown[] })?.Items || [];
    activityOptions.value = (list as Array<Record<string, unknown>>)
      .filter(Boolean)
      .map((item) => ({
        label: `${extractLangTitle(item.LangText, String(item.Name || item.Title || item.Id))} (${item.Id})`,
        value: item.Id as number,
      }));
  } catch {
    activityOptions.value = [];
  }
}

onMounted(() => {
  void loadActivityOptions();
});

watch(
  () => open.value,
  (visible) => {
    if (!visible) {
      return;
    }
    activeLang.value = String(defaultLangGroupId.value);
    void loadActivityOptions();
    if (props.mode === 'edit' && props.task) {
      Object.assign(form, JSON.parse(JSON.stringify(props.task)));
    } else {
      Object.assign(form, createDefaultTaskForm(langGroupIds.value));
    }
  },
);

function handleOk() {
  for (const lgId of langGroupIds.value) {
    const isDefault = lgId === defaultLangGroupId.value;
    const lang = form.LangText[String(lgId)];
    const active = isDefault || Boolean(lang?.IsActive);
    if (!active) {
      continue;
    }
    if (!String(lang?.Desc || '').trim()) {
      message.warning(`请填写语言组 ${lgId} 的任务说明`);
      activeLang.value = String(lgId);
      return;
    }
    if (!lang?.AppPic || !lang?.PcPic) {
      message.warning(`请上传语言组 ${lgId} 的任务图片`);
      activeLang.value = String(lgId);
      return;
    }
  }
  if (!form.Jump) {
    message.warning('请选择关联活动');
    return;
  }
  emit('submit', JSON.parse(JSON.stringify(form)));
  open.value = false;
}
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    :title="mode === 'edit' ? '编辑积分任务' : '新增积分任务'"
    width="720px"
    @ok="handleOk"
  >
    <Form layout="vertical">
      <Form.Item label="关联活动" required>
        <Select
          v-model:value="form.Jump"
          allow-clear
          :options="activityOptions"
          placeholder="请选择活动"
          show-search
          style="width: 100%; max-width: 420px"
        />
      </Form.Item>
    </Form>

    <Tabs v-model:active-key="activeLang" type="line" size="small">
      <Tabs.TabPane
        v-for="lgId in langGroupIds"
        :key="String(lgId)"
        :tab="langGroupIds.length > 1 ? `语言组 ${lgId}` : '基本信息'"
      >
        <Form layout="vertical">
          <Form.Item v-if="lgId !== defaultLangGroupId" label="多语言开关">
            <Switch v-model:checked="form.LangText[String(lgId)]!.IsActive" />
          </Form.Item>
          <Form.Item label="任务说明" required>
            <Input
              v-model:value="form.LangText[String(lgId)]!.Desc"
              allow-clear
              placeholder="请输入任务说明"
            />
          </Form.Item>
          <div class="flex flex-wrap gap-6">
            <Form.Item label="APP 图片" required>
              <VoucherImageField
                v-model="form.LangText[String(lgId)]!.AppPic"
              />
            </Form.Item>
            <Form.Item label="PC 图片" required>
              <VoucherImageField v-model="form.LangText[String(lgId)]!.PcPic" />
            </Form.Item>
          </div>
        </Form>
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>
