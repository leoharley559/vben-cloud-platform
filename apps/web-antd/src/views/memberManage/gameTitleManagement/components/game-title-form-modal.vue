<script lang="ts" setup>
import type { ChannelInfoOption } from '#/types/config';
import type { Dayjs } from 'dayjs';
import type { UploadChangeParam } from 'ant-design-vue';
import type {
  GameTitleChannelRef,
  GameTitleGroupItem,
  GameTitleItem,
  GameTitlePackageRef,
  GameTitlePayload,
  GameTitleRuleItem,
} from '#/types/game-title';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Upload,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createGameTitleApi,
  editGameTitleApi,
} from '#/api/memberManage/game-title';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { getServiceImageUrl, getUploadMd5ImageUrl } from '#/utils/media';

defineOptions({ name: 'GameTitleFormModal' });

const props = defineProps<{
  groupOptions: GameTitleGroupItem[];
  mode: 'create' | 'edit';
  open: boolean;
  row?: GameTitleItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const cloudStore = useCloudPlatformStore();
const { packageOptions } = useOperationOptions();

const submitting = ref(false);
const validTimeRadio = ref(0);
const activatedRadio = ref(0);
const budgetRadio = ref(0);
const validChannelMode = ref<'' | 1>('');
const shieldChannelMode = ref<'' | 1>('');
const validPackageMode = ref<'' | 1>('');
const shieldPackageMode = ref<'' | 1>('');
const validChannelIds = ref<Array<number | string>>([]);
const shieldChannelIds = ref<Array<number | string>>([]);
const validPackageIds = ref<Array<number | string>>([]);
const shieldPackageIds = ref<Array<number | string>>([]);
const activatedRange = ref<[Dayjs, Dayjs] | undefined>();
const calRange = ref<[Dayjs, Dayjs] | undefined>();

const form = reactive({
  Budget: 1,
  CalCycle: 4,
  CategoryId: undefined as number | string | undefined,
  Desc: '',
  DisplayDesc: 1,
  Id: undefined as number | string | undefined,
  Img: '',
  Name: '',
  Ordinal: 1,
  Remark: '',
  Rules: [
    { SubType: 1, TargetId: 0, Type: 1, Value: 1 },
  ] as GameTitleRuleItem[],
  Type: 1,
  ValidDays: 1,
  Vip: 0,
});

const title = computed(() =>
  props.mode === 'create' ? '新增称号' : '编辑称号',
);

const vipOptions = Array.from({ length: 11 }, (_, i) => ({
  label: `VIP${i}`,
  value: i,
}));

const ruleTypeOptions = [
  { label: '充值', value: 1 },
  { label: '有效投注', value: 2 },
  { label: '直播', value: 3 },
  { label: '登录/注册', value: 4 },
  { label: '邀请好友', value: 5 },
];

const packageSelectOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '' && item.PackageId != null)
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageId,
    })),
);

const channelNameMap = computed(() => {
  const map = new Map<string, string>();
  const list = (cloudStore.projectConfig?.ChildChannelInfo ||
    []) as ChannelInfoOption[];
  for (const item of list) {
    map.set(String(item.ChannelId), item.ChannelName || '');
  }
  return map;
});

function parseJsonList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function isDollarRule(rule: GameTitleRuleItem) {
  return (
    rule.Type === 1 ||
    rule.Type === 2 ||
    (rule.Type === 3 && rule.SubType === 2)
  );
}

function getRuleSubTypeOptions(type?: number) {
  switch (type) {
    case 1: {
      return [
        { label: '单笔充值', value: 1 },
        { label: '累计充值', value: 2 },
      ];
    }
    case 2: {
      return [
        { label: '品类累计投注', value: 1 },
        { label: '场馆累计投注', value: 2 },
      ];
    }
    case 3: {
      return [
        { label: '观看时长', value: 1 },
        { label: '送礼金额', value: 2 },
      ];
    }
    case 4: {
      return [{ label: '注册时长', value: 1 }];
    }
    case 5: {
      return [{ label: '推荐人数', value: 1 }];
    }
    default: {
      return [];
    }
  }
}

function ruleValueSuffix(rule: GameTitleRuleItem) {
  if (rule.Type === 1 || rule.Type === 2) {
    return '元';
  }
  if (rule.Type === 3) {
    return rule.SubType === 1 ? '分钟' : '元';
  }
  if (rule.Type === 4) {
    return rule.SubType === 1 ? '小时' : '天';
  }
  if (rule.Type === 5) {
    return '人';
  }
  return '';
}

function resetForm() {
  form.Budget = 1;
  form.CalCycle = 4;
  form.CategoryId = undefined;
  form.Desc = '';
  form.DisplayDesc = 1;
  form.Id = undefined;
  form.Img = '';
  form.Name = '';
  form.Ordinal = 1;
  form.Remark = '';
  form.Rules = [{ SubType: 1, TargetId: 0, Type: 1, Value: 1 }];
  form.Type = 1;
  form.ValidDays = 1;
  form.Vip = 0;
  validTimeRadio.value = 0;
  activatedRadio.value = 0;
  budgetRadio.value = 0;
  validChannelMode.value = '';
  shieldChannelMode.value = '';
  validPackageMode.value = '';
  shieldPackageMode.value = '';
  validChannelIds.value = [];
  shieldChannelIds.value = [];
  validPackageIds.value = [];
  shieldPackageIds.value = [];
  activatedRange.value = undefined;
  calRange.value = undefined;
}

function fillFromRow(row: GameTitleItem) {
  resetForm();
  form.Id = row.Id;
  form.Name = row.Name || '';
  form.CategoryId = row.CategoryId;
  form.Ordinal = row.Ordinal || 1;
  form.Img = row.Img || '';
  form.Desc = row.Desc || '';
  form.DisplayDesc = row.DisplayDesc || 1;
  form.Type = row.Type || 1;
  form.Vip = row.Vip ?? 0;
  form.Budget = row.Budget || 1;
  form.CalCycle = row.CalCycle || 4;
  form.Remark = row.Remark || '';
  form.ValidDays = row.ValidDays || 1;
  form.Rules = row.Rules?.length
    ? row.Rules.map((item) => ({
        ...item,
        Value: isDollarRule(item)
          ? Number(((Number(item.Value) || 0) / 100).toFixed(2))
          : Number(item.Value) || 1,
      }))
    : [{ SubType: 1, TargetId: 0, Type: 1, Value: 1 }];

  validTimeRadio.value = row.ValidDays ? 1 : 0;
  activatedRadio.value = row.ActivatedStartTime || row.ActivatedEndTime ? 1 : 0;
  budgetRadio.value = row.Budget ? 1 : 0;

  if (row.ActivatedStartTime && row.ActivatedEndTime) {
    activatedRange.value = [
      dayjs.unix(row.ActivatedStartTime),
      dayjs.unix(row.ActivatedEndTime),
    ];
  }
  if (row.CalStartTime && row.CalEndTime) {
    calRange.value = [dayjs.unix(row.CalStartTime), dayjs.unix(row.CalEndTime)];
  }

  const validChannels = parseJsonList<GameTitleChannelRef>(row.ValidChannels);
  const shieldChannels = parseJsonList<GameTitleChannelRef>(row.ShieldChannels);
  const validPackages = parseJsonList<GameTitlePackageRef>(row.ValidPackages);
  const shieldPackages = parseJsonList<GameTitlePackageRef>(row.ShieldPackages);

  validChannelIds.value = validChannels
    .map((item) => item.ChannelId)
    .filter((id): id is number | string => id != null && id !== '');
  shieldChannelIds.value = shieldChannels
    .map((item) => item.ChannelId)
    .filter((id): id is number | string => id != null && id !== '');
  validPackageIds.value = validPackages
    .map((item) => item.PackageId)
    .filter((id): id is number | string => id != null && id !== '');
  shieldPackageIds.value = shieldPackages
    .map((item) => item.PackageId)
    .filter((id): id is number | string => id != null && id !== '');

  validChannelMode.value = validChannelIds.value.length ? 1 : '';
  shieldChannelMode.value = shieldChannelIds.value.length ? 1 : '';
  validPackageMode.value = validPackageIds.value.length ? 1 : '';
  shieldPackageMode.value = shieldPackageIds.value.length ? 1 : '';
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    if (props.mode === 'edit' && props.row) {
      fillFromRow(props.row);
      return;
    }
    resetForm();
  },
);

function closeModal() {
  emit('update:open', false);
}

function beforeUpload(file: File) {
  if (!file.name.toLowerCase().endsWith('.png')) {
    message.warning('仅支持 PNG 图片');
    return Upload.LIST_IGNORE;
  }
  if (file.size > 250 * 1024) {
    message.warning('图片大小不能超过 250KB');
    return Upload.LIST_IGNORE;
  }
  return true;
}

function handleUploadChange(info: UploadChangeParam) {
  const response = info.file.response as
    | { Code?: number | string; Data?: { url?: string }; Msg?: string }
    | undefined;
  if (info.file.status === 'done') {
    if (String(response?.Code) === '200' && response?.Data?.url) {
      form.Img = response.Data.url;
      return;
    }
    message.error(response?.Msg || '图片上传失败');
  }
}

function addRule(index: number) {
  form.Rules.splice(index + 1, 0, {
    SubType: 1,
    TargetId: 0,
    Type: 1,
    Value: 1,
  });
}

function removeRule(index: number) {
  if (form.Rules.length <= 1) {
    return;
  }
  form.Rules.splice(index, 1);
}

function onRuleTypeChange(rule: GameTitleRuleItem) {
  rule.SubType = 1;
  rule.TargetId = 0;
  rule.Value = 1;
}

function buildChannelJson(ids: Array<number | string>) {
  if (!ids.length) {
    return '';
  }
  return JSON.stringify(
    ids.map((id) => ({
      ChannelId: id,
      ChannelName: channelNameMap.value.get(String(id)) || '',
    })),
  );
}

function buildPackageJson(ids: Array<number | string>) {
  if (!ids.length) {
    return '';
  }
  const map = new Map<string, GameTitlePackageRef>();
  for (const id of ids) {
    const key = String(id);
    if (map.has(key)) {
      continue;
    }
    const target = packageOptions.value.find(
      (item) => String(item.PackageId) === key,
    );
    map.set(key, {
      PackageId: id,
      PackageName: target?.PackageName || '',
    });
  }
  return JSON.stringify([...map.values()]);
}

function buildPayload(): GameTitlePayload | null {
  if (!form.Name.trim()) {
    message.warning('请输入称号名称');
    return null;
  }
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(form.Name.trim())) {
    message.warning('称号名称仅支持中英文与数字');
    return null;
  }
  if (!form.CategoryId) {
    message.warning('请选择称号类别');
    return null;
  }
  if (!form.Img) {
    message.warning('请上传称号图片');
    return null;
  }
  if (form.DisplayDesc === 2 && !form.Desc.trim()) {
    message.warning('请输入称号说明');
    return null;
  }
  if (validTimeRadio.value === 1 && !form.ValidDays) {
    message.warning('请输入有效天数');
    return null;
  }
  if (
    form.Type === 1 &&
    activatedRadio.value === 1 &&
    (!activatedRange.value?.[0] || !activatedRange.value?.[1])
  ) {
    message.warning('请选择称号获取时间');
    return null;
  }
  if (
    form.Type === 1 &&
    form.CalCycle === 4 &&
    (!calRange.value?.[0] || !calRange.value?.[1])
  ) {
    message.warning('请选择条件计算时间');
    return null;
  }
  if (validChannelMode.value === 1 && !validChannelIds.value.length) {
    message.warning('请选择生效渠道');
    return null;
  }
  if (shieldChannelMode.value === 1 && !shieldChannelIds.value.length) {
    message.warning('请选择屏蔽渠道');
    return null;
  }
  if (validPackageMode.value === 1 && !validPackageIds.value.length) {
    message.warning('请选择生效包体');
    return null;
  }
  if (shieldPackageMode.value === 1 && !shieldPackageIds.value.length) {
    message.warning('请选择屏蔽包体');
    return null;
  }

  const rules =
    form.Type === 2
      ? null
      : form.Rules.map((item) => ({
          SubType: item.SubType,
          TargetId: item.TargetId ?? 0,
          Type: item.Type,
          Value: isDollarRule(item)
            ? Number((Number(item.Value) * 100).toFixed(0))
            : Number(item.Value),
        }));

  return {
    ActivatedEndTime:
      form.Type === 2 || activatedRadio.value === 0
        ? 0
        : activatedRange.value![1].unix(),
    ActivatedStartTime:
      form.Type === 2 || activatedRadio.value === 0
        ? 0
        : activatedRange.value![0].unix(),
    Budget:
      form.Type === 2 || budgetRadio.value === 0 ? 0 : Number(form.Budget),
    CalCycle: form.Type === 2 ? 0 : form.CalCycle,
    CalEndTime:
      form.Type === 2 || form.CalCycle !== 4
        ? 0
        : calRange.value![1].endOf('day').unix(),
    CalStartTime:
      form.Type === 2 || form.CalCycle !== 4
        ? 0
        : calRange.value![0].startOf('day').unix(),
    CategoryId: form.CategoryId,
    Desc: form.Desc.trim(),
    DisplayDesc: form.DisplayDesc,
    Id: form.Id,
    Img: form.Img,
    Name: form.Name.trim(),
    Ordinal: form.Ordinal,
    Remark: form.Remark,
    Rules: rules,
    ShieldChannels:
      shieldChannelMode.value === 1
        ? buildChannelJson(shieldChannelIds.value)
        : '',
    ShieldPackages:
      shieldPackageMode.value === 1
        ? buildPackageJson(shieldPackageIds.value)
        : '',
    Type: form.Type,
    ValidChannels:
      validChannelMode.value === 1
        ? buildChannelJson(validChannelIds.value)
        : '',
    ValidDays: validTimeRadio.value === 0 ? 0 : Number(form.ValidDays),
    ValidPackages:
      validPackageMode.value === 1
        ? buildPackageJson(validPackageIds.value)
        : '',
    Vip: form.Type === 2 ? null : form.Vip,
  };
}

async function handleSubmit() {
  const payload = buildPayload();
  if (!payload) {
    return;
  }
  submitting.value = true;
  try {
    if (props.mode === 'create') {
      await createGameTitleApi(payload);
      message.success('新增成功');
    } else {
      await editGameTitleApi(payload);
      message.success('编辑成功');
    }
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    destroy-on-close
    :open="open"
    :title="title"
    width="920px"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form class="max-h-[70vh] overflow-y-auto pr-2" layout="vertical">
      <Form.Item label="称号名称" required>
        <Input
          v-model:value="form.Name"
          :maxlength="8"
          placeholder="中英文或数字，最多 8 字"
          show-count
        />
      </Form.Item>
      <Form.Item label="称号类别" required>
        <Select
          v-model:value="form.CategoryId"
          class="w-60"
          placeholder="请选择"
          :options="
            groupOptions.map((item) => ({
              label: item.Name,
              value: item.Id,
            }))
          "
        />
      </Form.Item>
      <Form.Item label="排序" required>
        <InputNumber v-model:value="form.Ordinal" :max="999" :min="1" />
        <span class="ml-2 text-red-500">数字越小越靠前</span>
      </Form.Item>
      <Form.Item label="称号图片" required>
        <div class="flex items-center gap-3">
          <img
            v-if="form.Img"
            alt="称号图片"
            class="h-[90px] w-[262px] rounded border object-contain"
            :src="getServiceImageUrl(form.Img)"
          />
          <Upload
            :action="getUploadMd5ImageUrl()"
            :before-upload="beforeUpload"
            :show-upload-list="false"
            accept="image/png"
            @change="handleUploadChange"
          >
            <Button size="small">{{
              form.Img ? '重新上传' : '上传 PNG'
            }}</Button>
          </Upload>
          <Button v-if="form.Img" danger size="small" @click="form.Img = ''">
            删除
          </Button>
        </div>
        <div class="mt-1 text-xs text-gray-500">262×90，PNG，≤250KB</div>
      </Form.Item>
      <Form.Item label="游戏内展示" required>
        <Radio.Group v-model:value="form.DisplayDesc">
          <Radio :value="1">展示称号条件</Radio>
          <Radio :value="2">展示称号说明</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="称号说明" :required="form.DisplayDesc === 2">
        <Input.TextArea
          v-model:value="form.Desc"
          :disabled="form.DisplayDesc === 1"
          :maxlength="100"
          :rows="3"
          show-count
        />
      </Form.Item>
      <Form.Item label="有效时间">
        <Radio.Group v-model:value="validTimeRadio">
          <Radio :value="0">永久</Radio>
          <Radio :value="1">限时</Radio>
        </Radio.Group>
        <InputNumber
          v-if="validTimeRadio === 1"
          v-model:value="form.ValidDays"
          class="ml-2"
          :max="999"
          :min="1"
          addon-after="天"
        />
      </Form.Item>
      <Form.Item label="称号类型">
        <Radio.Group v-model:value="form.Type">
          <Radio :value="1">条件</Radio>
          <Radio :value="2">指定发放</Radio>
        </Radio.Group>
      </Form.Item>

      <template v-if="form.Type === 1">
        <Form.Item label="称号获取时间">
          <Radio.Group
            v-model:value="activatedRadio"
            :disabled="mode === 'edit'"
          >
            <Radio :value="0">不限</Radio>
            <Radio :value="1">限时</Radio>
          </Radio.Group>
          <DatePicker.RangePicker
            v-if="activatedRadio === 1"
            v-model:value="activatedRange"
            class="ml-2"
            :disabled="mode === 'edit'"
            show-time
          />
          <div class="mt-1 text-xs font-medium text-red-500">
            * 保存后不可修改
          </div>
        </Form.Item>
        <Form.Item label="VIP 等级">
          <div class="flex items-center gap-2">
            <Select
              v-model:value="form.Vip"
              class="w-32"
              :options="vipOptions"
            />
            <span class="text-gray-500">及以上</span>
          </div>
        </Form.Item>
        <Form.Item label="称号数量">
          <Radio.Group v-model:value="budgetRadio">
            <Radio :value="0">不限</Radio>
            <Radio :value="1">限量</Radio>
          </Radio.Group>
          <InputNumber
            v-if="budgetRadio === 1"
            v-model:value="form.Budget"
            class="ml-2"
            :max="99"
            :min="1"
            addon-after="个"
          />
        </Form.Item>
        <Form.Item label="称号条件">
          <div
            v-for="(rule, index) in form.Rules"
            :key="index"
            class="mb-2 flex flex-wrap items-center gap-2 rounded border p-2"
          >
            <Select
              v-model:value="rule.Type"
              class="w-32"
              :options="ruleTypeOptions"
              @change="() => onRuleTypeChange(rule)"
            />
            <Select
              v-model:value="rule.SubType"
              class="w-36"
              :options="getRuleSubTypeOptions(rule.Type)"
            />
            <InputNumber
              v-if="rule.Type === 2 || rule.Type === 3"
              v-model:value="rule.TargetId"
              class="w-28"
              placeholder="目标ID"
            />
            <InputNumber
              v-model:value="rule.Value"
              class="w-28"
              :min="1"
              :addon-after="ruleValueSuffix(rule)"
            />
            <Space>
              <Button size="small" type="dashed" @click="addRule(index)">
                加条件
              </Button>
              <Button
                v-if="index > 0"
                danger
                size="small"
                @click="removeRule(index)"
              >
                删除
              </Button>
            </Space>
          </div>
          <div class="text-xs font-medium text-red-500">
            * 金额类条件单位为元，提交时自动换算成分
          </div>
        </Form.Item>
        <Form.Item label="条件计算时间" required>
          <DatePicker.RangePicker v-model:value="calRange" class="w-full" />
        </Form.Item>
      </template>

      <Form.Item label="生效渠道">
        <Radio.Group v-model:value="validChannelMode">
          <Radio value="">全部渠道可见</Radio>
          <Radio :value="1">指定渠道</Radio>
        </Radio.Group>
        <ChannelSelect
          v-if="validChannelMode === 1"
          v-model="validChannelIds"
          class="mt-2 w-full"
        />
      </Form.Item>
      <Form.Item label="屏蔽渠道">
        <Radio.Group v-model:value="shieldChannelMode">
          <Radio value="">无</Radio>
          <Radio :value="1">屏蔽指定渠道</Radio>
        </Radio.Group>
        <ChannelSelect
          v-if="shieldChannelMode === 1"
          v-model="shieldChannelIds"
          class="mt-2 w-full"
        />
      </Form.Item>
      <Form.Item label="生效包体">
        <Radio.Group v-model:value="validPackageMode">
          <Radio value="">全部包体</Radio>
          <Radio :value="1">指定包体</Radio>
        </Radio.Group>
        <Select
          v-if="validPackageMode === 1"
          v-model:value="validPackageIds"
          class="mt-2 w-full"
          mode="multiple"
          :options="packageSelectOptions"
          placeholder="请选择包体"
        />
      </Form.Item>
      <Form.Item label="屏蔽包体">
        <Radio.Group v-model:value="shieldPackageMode">
          <Radio value="">无</Radio>
          <Radio :value="1">屏蔽指定包体</Radio>
        </Radio.Group>
        <Select
          v-if="shieldPackageMode === 1"
          v-model:value="shieldPackageIds"
          class="mt-2 w-full"
          mode="multiple"
          :options="packageSelectOptions"
          placeholder="请选择包体"
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea v-model:value="form.Remark" :rows="2" />
      </Form.Item>
    </Form>
  </Modal>
</template>
