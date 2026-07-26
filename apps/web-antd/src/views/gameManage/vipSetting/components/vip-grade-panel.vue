<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Form,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import { getProjectConfigApi } from '#/api/core/project';
import {
  createVipGradeApi,
  fetchVipGradeListApi,
  fetchVipLevelModeApi,
  fetchVipRelegationDayApi,
  updateVipGradeApi,
  updateVipLevelModeApi,
  updateVipRelegationDayApi,
} from '#/api/gameManage/vip-setting';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'VipGradePanel' });

type Row = Record<string, number | string | undefined>;
interface Field {
  integer?: boolean;
  key: string;
  label: string;
  money?: boolean;
  suffix?: string;
}

const fields: Field[] = [
  { key: 'UpgradeMoney', label: '升级存款', money: true },
  { key: 'UpgradeTurnover', label: '升级流水要求', money: true },
  { key: 'HoldLevelTurnover', label: '保级流水要求', money: true },
  { integer: true, key: 'DayWithdrawalTimes', label: '单日提现次数', suffix: '次' },
  { key: 'DayWithdrawal', label: '单日提现限额', money: true },
  { key: 'UpgradeDividend', label: 'VIP 等级升级红利', money: true },
  { key: 'UpgradeDividendMultiple', label: '升级红利流水倍数', suffix: '倍' },
  { key: 'BirthdayDividend', label: '生日礼金', money: true },
  { key: 'BirthdayDividendMultiple', label: '生日礼金流水倍数', suffix: '倍' },
  { key: 'FirstHalfMonthDividend', label: '上半月红包', money: true },
  { key: 'LastHalfMonthDividend', label: '下半月红包', money: true },
  { key: 'MonthDividendMultiple', label: '月红包流水倍数', suffix: '倍' },
];
const requirementFields = [
  { group: '上半月红包领取设置', key: 'FirstHalfBetReq', label: '有效投注要求' },
  { group: '上半月红包领取设置', key: 'FirstHalfPayMoneyReq', label: '存款金额要求' },
  { group: '下半月红包领取设置', key: 'SecondHalfBetReq', label: '有效投注要求' },
  { group: '下半月红包领取设置', key: 'SecondHalfPayMoneyReq', label: '存款金额要求' },
];
const moneyKeys = new Set([
  ...fields.filter((item) => item.money).map((item) => item.key),
  ...requirementFields.map((item) => item.key),
]);
const columns: TableColumnsType<Row> = [
  { key: 'index', title: '序号', width: 60 },
  { key: 'VipLevel', title: 'VIP 等级', width: 100 },
  { key: 'UpgradeMoney', title: '升级存款', width: 130 },
  { key: 'UpgradeTurnover', title: '升级流水', width: 130 },
  { key: 'HoldLevelTurnover', title: '保级流水', width: 130 },
  { dataIndex: 'DayWithdrawalTimes', key: 'DayWithdrawalTimes', title: '每日提现次数', width: 130 },
  { key: 'DayWithdrawal', title: '每日提现限额', width: 140 },
  { key: 'upgradeBonus', title: '升级红利/流水倍数', width: 180 },
  { key: 'birthdayGift', title: '生日礼金/流水倍数', width: 180 },
  { key: 'FirstHalfMonthDividend', title: '上半月红包', width: 130 },
  { key: 'LastHalfMonthDividend', title: '下半月红包', width: 130 },
  { fixed: 'right', key: 'action', title: '操作', width: 90 },
];

const { checkPermission } = useCloudPermission();
const loading = ref(false);
const saving = ref(false);
const rows = ref<Row[]>([]);
const formVisible = ref(false);
const daysVisible = ref(false);
const editing = ref(false);
const vipLevelMode = ref(1);
const relegationDay = ref(90);
const form = reactive<Row>({});
const enabledRequirements = reactive<Record<string, boolean>>({});

const fromCent = (value: unknown) => (Number(value || 0) / 100).toFixed(2);
const toCent = (value: unknown) => Math.ceil(Number(value || 0) * 100);

async function loadData() {
  loading.value = true;
  try {
    const [list, mode, day] = await Promise.all([
      checkPermission(10_999) ? fetchVipGradeListApi() : Promise.resolve([]),
      fetchVipLevelModeApi(),
      fetchVipRelegationDayApi(),
    ]);
    rows.value = Array.isArray(list) ? (list as Row[]) : [];
    vipLevelMode.value = Number(mode?.VipLevelMode || 1);
    // 对齐旧站：仅当接口返回 >0 才覆盖，否则保持默认 90
    const nextDay = Number(day?.RelegationDay || 0);
    if (nextDay > 0) relegationDay.value = nextDay;
  } finally {
    loading.value = false;
  }
}

function openForm(row?: Row) {
  Object.keys(form).forEach((key) => delete form[key]);
  editing.value = !!row;
  Object.assign(
    form,
    row
      ? structuredClone(row)
      : Object.fromEntries([
          ['Id', ''],
          [
            'VipLevel',
            Math.max(-1, ...rows.value.map((item) => Number(item.VipLevel))) +
              1,
          ],
          ...fields.map((field) => [field.key, field.integer ? 1 : 0]),
          ...requirementFields.map((field) => [field.key, 0]),
        ]),
  );
  moneyKeys.forEach((key) => {
    form[key] = fromCent(form[key]);
  });
  requirementFields.forEach(({ key }) => {
    enabledRequirements[key] = Number(form[key] || 0) !== 0;
  });
  formVisible.value = true;
}

function toggleRequirement(key: string, checked: boolean) {
  enabledRequirements[key] = checked;
  form[key] = checked ? '' : 0;
}

async function saveGrade() {
  for (const field of fields) {
    const value = Number(form[field.key]);
    if (!Number.isFinite(value) || value < 0 || (field.integer && (!Number.isInteger(value) || value < 1))) {
      message.warning(`请正确输入${field.label}`);
      return;
    }
  }
  for (const { key } of requirementFields) {
    if (enabledRequirements[key] && (!Number.isFinite(Number(form[key])) || Number(form[key]) < 0)) {
      message.warning('请完整填写红包领取要求');
      return;
    }
  }
  saving.value = true;
  try {
    const payload: Record<string, unknown> = { ...form };
    moneyKeys.forEach((key) => {
      payload[key] = toCent(form[key]);
    });
    if (editing.value) await updateVipGradeApi(payload);
    else {
      delete payload.Id;
      await createVipGradeApi(payload);
      await getProjectConfigApi();
    }
    formVisible.value = false;
    message.success('操作成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

async function saveMode() {
  await updateVipLevelModeApi({ VipLevelMode: vipLevelMode.value });
  message.success('更换成功');
}

async function saveDays() {
  if (!Number.isInteger(relegationDay.value) || relegationDay.value < 1) {
    message.warning('保级流水天数必须为正整数');
    return;
  }
  saving.value = true;
  try {
    await updateVipRelegationDayApi({ RelegationDay: relegationDay.value });
    daysVisible.value = false;
    message.success('保存成功');
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Card class="toolbar-card" size="small">
    <div class="toolbar">
      <Space v-if="checkPermission(12_145)">
        <span>升级模式：</span>
        <Select
          v-model:value="vipLevelMode"
          :options="[
            { label: '存款与有效投注升级', value: 1 },
            { label: '有效投注升级', value: 2 },
          ]"
          style="width: 210px"
        />
        <Button type="primary" @click="saveMode">更换</Button>
      </Space>
      <Space>
        <Button v-if="checkPermission(13_181)" type="primary" @click="openForm()">
          新增 VIP 等级
        </Button>
        <Button v-if="checkPermission(11_704)" @click="daysVisible = true">
          保级流水天数设置
        </Button>
      </Space>
    </div>
  </Card>
  <Card class="table-card" :bordered="false">
    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      :row-key="(row) => String(row.Id || row.VipLevel)"
      :scroll="{ x: 1550 }"
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <span v-if="column.key === 'index'">{{ index + 1 }}</span>
        <span v-else-if="column.key === 'VipLevel'">VIP.{{ record.VipLevel }}</span>
        <span v-else-if="moneyKeys.has(String(column.key))">
          {{ fromCent(record[String(column.key)]) }}
        </span>
        <span v-else-if="column.key === 'upgradeBonus'">
          {{ fromCent(record.UpgradeDividend) }} / {{ record.UpgradeDividendMultiple }}
        </span>
        <span v-else-if="column.key === 'birthdayGift'">
          {{ fromCent(record.BirthdayDividend) }} / {{ record.BirthdayDividendMultiple }}
        </span>
        <Button
          v-else-if="column.key === 'action' && checkPermission(11_000)"
          size="small"
          type="primary"
          @click="openForm(record)"
        >
          编辑
        </Button>
      </template>
    </Table>
  </Card>

  <Modal
    v-model:open="formVisible"
    :confirm-loading="saving"
    :title="editing ? '编辑 VIP 等级参数' : '新增 VIP 等级参数'"
    width="760px"
    @ok="saveGrade"
  >
    <div class="form-scroll">
      <Form :label-col="{ span: 9 }">
        <Form.Item label="VIP 等级">
          <InputNumber v-model:value="form.VipLevel as number" class="!w-full" disabled addon-after="级" />
        </Form.Item>
        <Form.Item v-for="field in fields" :key="field.key" :label="field.label" required>
          <InputNumber
            v-model:value="form[field.key] as number"
            class="!w-full"
            :min="field.integer ? 1 : 0"
            :precision="field.integer ? 0 : 2"
            :addon-after="field.suffix"
          />
        </Form.Item>
        <template v-for="(item, index) in requirementFields" :key="item.key">
          <div
            v-if="
              index === 0 ||
              requirementFields[index - 1]?.group !== item.group
            "
            class="section-title"
          >
            {{ item.group }}
          </div>
          <Form.Item>
            <template #label>
              <Checkbox
                :checked="enabledRequirements[item.key]"
                @change="toggleRequirement(item.key, $event.target.checked)"
              >
                {{ item.label }}
              </Checkbox>
            </template>
            <InputNumber
              v-model:value="form[item.key] as number"
              class="!w-full"
              :disabled="!enabledRequirements[item.key]"
              :min="0"
              :precision="2"
            />
          </Form.Item>
        </template>
      </Form>
    </div>
  </Modal>
  <Modal v-model:open="daysVisible" :confirm-loading="saving" title="保级流水天数设置" @ok="saveDays">
    <Form layout="vertical">
      <Form.Item label="天数" required>
        <InputNumber v-model:value="relegationDay" class="!w-full" :min="1" :precision="0" addon-after="天" />
      </Form.Item>
    </Form>
  </Modal>
</template>

<style scoped>
.toolbar-card,
.table-card {
  margin-bottom: 14px;
  border-radius: 10px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.form-scroll {
  max-height: 70vh;
  padding-right: 8px;
  overflow: auto;
}
.section-title {
  padding: 8px 12px;
  margin: 12px 0;
  font-weight: 600;
  color: hsl(var(--primary));
  background: hsl(var(--muted) / 45%);
  border-left: 3px solid hsl(var(--primary));
}
</style>
