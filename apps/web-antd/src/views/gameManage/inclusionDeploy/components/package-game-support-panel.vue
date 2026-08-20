<script lang="ts" setup>
import type { PackageId } from '#/types/package-config';

import { computed, reactive, ref } from 'vue';

import {
  Alert,
  Form,
  Input,
  Radio,
  Select,
  Switch,
  Tabs,
} from 'ant-design-vue';

import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';

defineOptions({ name: 'PackageGameSupportPanel' });

const props = defineProps<{
  langGroups: LangGroup[];
  vipLevels: Array<{ label: string; value: number }>;
}>();

interface LangGroup {
  Id?: PackageId;
  Name?: string;
}

interface SupportLine {
  csType: number;
  enable: boolean;
  vipBegin: number;
  vipEnd: number;
  [key: string]: unknown;
}

interface LocalizedSupport {
  normalLine: { [key: string]: unknown; customerServiceName2: string };
  officialCsLogo: string;
  specialLine: { [key: string]: unknown; customerServiceName1: string };
  [key: string]: unknown;
}

interface UniversalSupport {
  normalLine: SupportLine;
  specialLine: SupportLine;
  thirdPartyCsUrl: string;
  thirdPartyPcFloatCode: string;
  [key: string]: unknown;
}

const sourceDetail = ref<Record<string, unknown>>({});
const activeLangGroup = ref('');
const universal = reactive<UniversalSupport>({
  normalLine: { csType: 2, enable: false, vipBegin: 0, vipEnd: 1 },
  specialLine: { csType: 1, enable: false, vipBegin: 0, vipEnd: 1 },
  thirdPartyCsUrl: '',
  thirdPartyPcFloatCode: '',
});
const localized = reactive<Record<string, LocalizedSupport>>({});

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseLangText(value: unknown) {
  const parsed = parseJson<unknown>(value, []);
  const rows = Array.isArray(parsed) ? parsed : Object.values(asRecord(parsed));
  return Object.fromEntries(
    rows.map((item) => {
      const row = asRecord(item);
      return [String(row.LangGroupId ?? row.LangGrouopId ?? ''), row];
    }),
  );
}

function hydrate(detail: Record<string, unknown>) {
  sourceDetail.value = detail;
  const parsed = parseJson<Record<string, unknown>>(detail.CsLineConfig, {});
  Object.assign(universal, parsed, {
    normalLine: {
      csType: 2,
      enable: false,
      vipBegin: 0,
      vipEnd: 1,
      ...asRecord(parsed.normalLine),
    },
    specialLine: {
      csType: 1,
      enable: false,
      vipBegin: 0,
      vipEnd: 1,
      ...asRecord(parsed.specialLine),
    },
    thirdPartyCsUrl: String(parsed.thirdPartyCsUrl ?? ''),
    thirdPartyPcFloatCode: String(parsed.thirdPartyPcFloatCode ?? ''),
  });

  Object.keys(localized).forEach((key) => delete localized[key]);
  const langText = parseLangText(detail.LangText);
  const langIds = new Set([
    ...props.langGroups.map((group) => String(group.Id ?? '')).filter(Boolean),
    ...Object.keys(langText),
  ]);
  langIds.forEach((langId) => {
    const parsedLocalized = parseJson<Record<string, unknown>>(
      langText[langId]?.CsLineConfig,
      {},
    );
    localized[langId] = {
      ...parsedLocalized,
      normalLine: {
        customerServiceName2: '',
        ...asRecord(parsedLocalized.normalLine),
      },
      officialCsLogo: String(parsedLocalized.officialCsLogo ?? ''),
      specialLine: {
        customerServiceName1: '',
        ...asRecord(parsedLocalized.specialLine),
      },
    } as LocalizedSupport;
  });
  activeLangGroup.value =
    String(props.langGroups[0]?.Id ?? '') || [...langIds][0] || '';
}

const activeLocalized = computed(() => localized[activeLangGroup.value]);
const lineForms = computed(() => [
  { line: universal.specialLine, no: 1 as const },
  { line: universal.normalLine, no: 2 as const },
]);

function validateLine(line: SupportLine, label: string) {
  if (Number(line.vipBegin) > Number(line.vipEnd)) {
    throw new Error(`${label} VIP 起始等级不能大于结束等级`);
  }
}

function buildPatch() {
  validateLine(universal.specialLine, '客服路线 1');
  validateLine(universal.normalLine, '客服路线 2');
  const usesThirdParty = [universal.specialLine, universal.normalLine].some(
    (line) => line.enable && Number(line.csType) === 2,
  );
  if (usesThirdParty) {
    const url = universal.thirdPartyCsUrl.trim();
    if (!url) throw new Error('启用第三方客服路线时，客服 URL 为必填');
    if (!/^(?:https?|ftp):\/\//i.test(url)) {
      throw new Error('第三方客服 URL 必须以 http://、https:// 或 ftp:// 开头');
    }
  }

  const LangText = parseLangText(sourceDetail.value.LangText);
  Object.entries(localized).forEach(([langId, value]) => {
    if (value.specialLine.customerServiceName1.length > 100) {
      throw new Error('客服路线 1 名称不能超过 100 个字符');
    }
    if (value.normalLine.customerServiceName2.length > 100) {
      throw new Error('客服路线 2 名称不能超过 100 个字符');
    }
    LangText[langId] ??= { LangGroupId: Number(langId) || langId };
    LangText[langId].CsLineConfig = JSON.stringify(value);
  });
  return {
    CsLineConfig: JSON.stringify(universal),
    LangText: JSON.stringify(Object.values(LangText)),
  };
}

defineExpose({ buildPatch, hydrate });
</script>

<template>
  <Alert
    class="mb-4"
    message="通用客服路线只在默认语言页编辑；客服名称与官方客服 Logo 按语言组保存。"
    show-icon
    type="info"
  />
  <Tabs v-model:active-key="activeLangGroup" size="small" type="line">
    <Tabs.TabPane
      v-for="group in langGroups"
      :key="String(group.Id)"
      :tab="String(group.Name || `语言组 ${group.Id}`)"
    >
      <Form v-if="activeLocalized" layout="vertical">
        <div class="support-grid">
          <Form.Item label="官方客服 Logo">
            <VoucherImageField
              v-model="activeLocalized.officialCsLogo"
              dimension-hint="PNG/JPG，最大 1MB"
              :max-size-kb="1024"
              :preview-height="120"
              :preview-width="80"
            />
          </Form.Item>
          <div></div>

          <template v-for="item in lineForms" :key="item.no">
            <div class="line-card">
              <div class="line-heading">
                <strong>客服路线 {{ item.no }}</strong>
                <Switch
                  v-model:checked="item.line.enable"
                  :disabled="
                    activeLangGroup !== String(langGroups[0]?.Id ?? '')
                  "
                />
              </div>
              <Form.Item label="客服名称">
                <Input
                  v-if="item.no === 1"
                  v-model:value="
                    activeLocalized.specialLine.customerServiceName1
                  "
                  :maxlength="100"
                  show-count
                />
                <Input
                  v-else
                  v-model:value="
                    activeLocalized.normalLine.customerServiceName2
                  "
                  :maxlength="100"
                  show-count
                />
              </Form.Item>
              <Form.Item label="VIP 范围">
                <div class="vip-range">
                  <Select
                    v-model:value="item.line.vipBegin"
                    :disabled="
                      activeLangGroup !== String(langGroups[0]?.Id ?? '')
                    "
                    :options="vipLevels"
                  />
                  <span>—</span>
                  <Select
                    v-model:value="item.line.vipEnd"
                    :disabled="
                      activeLangGroup !== String(langGroups[0]?.Id ?? '')
                    "
                    :options="vipLevels"
                  />
                </div>
              </Form.Item>
              <Form.Item label="客服类型">
                <Radio.Group
                  v-model:value="item.line.csType"
                  :disabled="
                    activeLangGroup !== String(langGroups[0]?.Id ?? '')
                  "
                >
                  <Radio :value="1">官方客服</Radio>
                  <Radio :value="2">第三方客服</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
          </template>
        </div>

        <template v-if="activeLangGroup === String(langGroups[0]?.Id ?? '')">
          <Form.Item label="第三方客服 URL">
            <Input.TextArea
              v-model:value="universal.thirdPartyCsUrl"
              :rows="3"
              placeholder="http://、https:// 或 ftp://"
            />
          </Form.Item>
          <Form.Item label="PC 悬浮客服代码">
            <Input.TextArea
              v-model:value="universal.thirdPartyPcFloatCode"
              :rows="6"
            />
          </Form.Item>
        </template>
      </Form>
    </Tabs.TabPane>
  </Tabs>
</template>

<style scoped>
.support-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.line-card {
  padding: 14px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.line-heading,
.vip-range {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.line-heading {
  margin-bottom: 14px;
}

.vip-range :deep(.ant-select) {
  flex: 1;
}

@media (max-width: 800px) {
  .support-grid {
    grid-template-columns: 1fr;
  }
}
</style>
