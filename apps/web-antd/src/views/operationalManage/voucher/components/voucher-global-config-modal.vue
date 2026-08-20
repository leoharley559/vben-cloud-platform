<script lang="ts" setup>
import type { VoucherRuleItem } from './voucher-shared';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
} from 'ant-design-vue';

import {
  fetchVoucherGlobalConfigApi,
  updateVoucherGlobalConfigApi,
} from '#/api/operationManage/voucher';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { getServiceImageUrl } from '#/utils/media';

import VoucherRuleModal from './voucher-rule-modal.vue';
import { assembleVoucherGlobalConfigPayload, breakupVoucherGlobalConfig, createDefaultVoucherGlobalConfigForm, REDIRECT_TYPE, resolveDefaultLangGroupId, resolveLangGroupIds } from './voucher-shared';

defineOptions({ name: 'VoucherGlobalConfigModal' });

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

const form = reactive(createDefaultVoucherGlobalConfigForm(langGroupIds.value));

const deviceOptions = computed(() => {
  const map = cloudStore.projectConfig?.DevicePlatformAll || {};
  const entries = Object.entries(map);
  if (entries.length === 0) {
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

const invalidChannels = computed<Array<number | string>>({
  get: () => csvToIds(form.InvalidChannels),
  set: (val) => {
    form.InvalidChannels = idsToCsv(val);
  },
});

const validPackages = computed<Array<number | string>>({
  get: () => csvToIds(form.ValidPackages),
  set: (val) => {
    form.ValidPackages = idsToCsv(val);
  },
});

const invalidPackages = computed<Array<number | string>>({
  get: () => csvToIds(form.InvalidPackages),
  set: (val) => {
    form.InvalidPackages = idsToCsv(val);
  },
});

async function loadConfig() {
  loading.value = true;
  try {
    const data = await fetchVoucherGlobalConfigApi();
    if (!data) {
      Object.assign(
        form,
        createDefaultVoucherGlobalConfigForm(langGroupIds.value),
      );
      displayDevicesArray.value = deviceOptions.value.map((item) => item.value);
      return;
    }
    const breakup = breakupVoucherGlobalConfig(data, langGroupIds.value);
    Object.assign(form, breakup);
    if (!form.DisplayDevices) {
      displayDevicesArray.value = deviceOptions.value.map((item) => item.value);
    }
  } finally {
    loading.value = false;
  }
}

watch(open, (visible) => {
  if (visible) {
    activeLangTab.value = String(defaultLangGroupId.value);
    void loadConfig();
  }
});

const ruleModalOpen = ref(false);
const ruleModalMode = ref<'add' | 'edit'>('add');
const ruleEditIndex = ref(-1);
const ruleEditingRow = computed<null | VoucherRuleItem>(() =>
  ruleEditIndex.value >= 0
    ? ((form.RulesConfig[ruleEditIndex.value] as VoucherRuleItem) ?? null)
    : null,
);

function openAddRule() {
  ruleModalMode.value = 'add';
  ruleEditIndex.value = -1;
  ruleModalOpen.value = true;
}
function openEditRule(index: number) {
  ruleModalMode.value = 'edit';
  ruleEditIndex.value = index;
  ruleModalOpen.value = true;
}
function handleDeleteRule(index: number) {
  Modal.confirm({
    content: '确认删除该条规则吗？',
    onOk: () => form.RulesConfig.splice(index, 1),
    title: '删除确认',
  });
}
function handleRuleSubmit(rule: VoucherRuleItem) {
  if (ruleModalMode.value === 'edit' && ruleEditIndex.value >= 0) {
    form.RulesConfig.splice(ruleEditIndex.value, 1, rule);
  } else {
    form.RulesConfig.push(rule);
  }
}

function ruleText(rule: VoucherRuleItem) {
  const html = String(rule.LangText?.[activeLangTab.value]?.Text || '');
  const text = html.replaceAll(/<[^>]+>/g, '').trim();
  return text || '-';
}
function ruleTypeLabel(type: number) {
  switch (type) {
    case REDIRECT_TYPE.ACTIVITY: {
      return '活动接口';
    }
    case REDIRECT_TYPE.NONE: {
      return '无';
    }
    case REDIRECT_TYPE.NOTICE: {
      return '公告接口';
    }
    case REDIRECT_TYPE.UI_PAGE: {
      return '功能页面';
    }
    case REDIRECT_TYPE.URL: {
      return '网址';
    }
    case REDIRECT_TYPE.VENUE: {
      return '场馆接口';
    }
    default: {
      return '-';
    }
  }
}

async function handleSubmit() {
  if (displayDevicesArray.value.length === 0) {
    message.warning('请至少选择一个展示设备');
    return;
  }
  saving.value = true;
  try {
    const payload = assembleVoucherGlobalConfigPayload(
      form,
      langGroupIds.value,
    );
    await updateVoucherGlobalConfigApi(payload);
    message.success('保存成功');
    open.value = false;
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
    title="票券中心全局设置"
    width="900px"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <div class="max-h-[70vh] overflow-y-auto pr-2">
        <Form layout="vertical">
          <Form.Item label="展示设备" required>
            <Checkbox.Group
              v-model:value="displayDevicesArray"
              :options="deviceOptions"
            />
          </Form.Item>
          <Form.Item label="生效渠道">
            <ChannelSelect
              v-model="validChannels"
              style="width: 100%"
              placeholder="请输入渠道号"
            />
          </Form.Item>
          <Form.Item label="屏蔽渠道">
            <ChannelSelect
              v-model="invalidChannels"
              style="width: 100%"
              placeholder="请输入渠道号"
            />
          </Form.Item>
          <Form.Item label="生效包体">
            <Select
              v-model:value="validPackages"
              allow-clear
              :field-names="{ label: 'PackageName', value: 'PackageId' }"
              mode="multiple"
              :options="packageOptions"
              placeholder="不选=不限"
              style="width: 100%"
            />
          </Form.Item>
          <Form.Item label="屏蔽包体">
            <Select
              v-model:value="invalidPackages"
              allow-clear
              :field-names="{ label: 'PackageName', value: 'PackageId' }"
              mode="multiple"
              :options="packageOptions"
              placeholder="不选=不限"
              style="width: 100%"
            />
          </Form.Item>
          <Form.Item label="游客展示">
            <Radio.Group v-model:value="form.IsGuestDisplay">
              <Radio :value="true">是</Radio>
              <Radio :value="false">否</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>

        <Tabs
          v-if="langGroupIds.length > 1"
          v-model:active-key="activeLangTab"
          type="line"
          size="small"
        >
          <Tabs.TabPane
            v-for="lgId in langGroupIds"
            :key="String(lgId)"
            :tab="`语言组 ${lgId}`"
          >
            <Form v-if="lgId !== defaultLangGroupId" layout="vertical">
              <Form.Item label="多语言开关">
                <Switch
                  v-model:checked="form.LangText[String(lgId)]!.IsActive"
                />
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>

        <div class="mb-2 mt-4 text-base font-semibold text-primary">
          票券中心规则
        </div>
        <Table
          :columns="[
            { key: 'index', title: '序号', width: 60 },
            { key: 'text', title: '文字' },
            { key: 'appPic', title: 'APP 图片' },
            { key: 'pcPic', title: 'PC 图片' },
            { key: 'type', title: '跳转类型' },
            { key: 'action', title: '操作', width: 150 },
          ]"
          :data-source="form.RulesConfig"
          :pagination="false"
          row-key="__row__"
          size="small"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
            <template v-else-if="column.key === 'text'">
              {{ ruleText(record as VoucherRuleItem) }}
            </template>
            <template v-else-if="column.key === 'appPic'">
              <img
                v-if="
                  (record as VoucherRuleItem).LangText[activeLangTab]?.AppPic
                "
                alt="APP图片"
                class="h-9 w-11 rounded border object-contain"
                :src="
                  getServiceImageUrl(
                    (record as VoucherRuleItem).LangText[activeLangTab]?.AppPic,
                  )
                "
              />
              <span v-else class="text-gray-400">-</span>
            </template>
            <template v-else-if="column.key === 'pcPic'">
              <img
                v-if="
                  (record as VoucherRuleItem).LangText[activeLangTab]?.PcPic
                "
                alt="PC图片"
                class="h-9 w-11 rounded border object-contain"
                :src="
                  getServiceImageUrl(
                    (record as VoucherRuleItem).LangText[activeLangTab]?.PcPic,
                  )
                "
              />
              <span v-else class="text-gray-400">-</span>
            </template>
            <template v-else-if="column.key === 'type'">
              {{ ruleTypeLabel((record as VoucherRuleItem).Type) }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button size="small" type="link" @click="openEditRule(index)">
                  编辑
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="handleDeleteRule(index)"
                >
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
        <Button class="mt-2" type="dashed" @click="openAddRule">
新增规则
</Button>
      </div>
    </Spin>

    <VoucherRuleModal
      v-model:open="ruleModalOpen"
      :lang-group-ids="langGroupIds"
      :mode="ruleModalMode"
      :rule="ruleEditingRow"
      @submit="handleRuleSubmit"
    />
  </Modal>
</template>
