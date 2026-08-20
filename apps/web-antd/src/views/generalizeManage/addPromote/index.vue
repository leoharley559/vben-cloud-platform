<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Result,
  Space,
  Steps,
} from 'ant-design-vue';

import { createPromoterApi } from '#/api/promotion/manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'AddPromote' });

const router = useRouter();
const { adminInfo, checkPermission, projectConfig } = useCloudPermission();

const realAdminType = computed(() => {
  const parentInfo = projectConfig.value?.ParentInfo as
    | undefined
    | { AdminType?: number };
  const admin = adminInfo.value as undefined | { realAdminType?: number };
  return admin?.realAdminType ?? parentInfo?.AdminType ?? 0;
});

const canViewPage = computed(() => {
  const teamInfo = projectConfig.value?.AccountTeamInfo as
    | undefined
    | { AgentId?: number; Id?: number };
  const inTeam =
    Number(teamInfo?.Id || 0) > 0 && Number(teamInfo?.AgentId || 0) > 0;
  return checkPermission(10_912) && (inTeam || realAdminType.value === 1);
});

const childRateConfig = computed(() => {
  const config = projectConfig.value?.AccountTeamChildCommissionRate as
    | undefined
    | {
        FirstPayPeriod?: number;
        MaxCommissionRate?: number;
        MinCommissionRate?: number;
      };
  return {
    firstPayPeriod: Number(config?.FirstPayPeriod || 0),
    max: Number(config?.MaxCommissionRate || 0) / 10,
    min: Number(config?.MinCommissionRate || 0) / 10,
  };
});

const selfPercent = computed(() => {
  const teamInfo = projectConfig.value?.AccountTeamInfo as
    | undefined
    | { CommissionRate?: number };
  return Number(teamInfo?.CommissionRate || 0) / 10;
});

const activeStep = ref(0);
const saving = ref(false);

const form = reactive({
  ChildMaxCommissionRate: String(childRateConfig.value.max || ''),
  ChildMinCommissionRate: String(childRateConfig.value.min || ''),
  ConfirmPassword: '',
  ContactInf: '',
  Name: '',
  Note: '',
  Password: '',
  ProfitCommissionRate: '',
  TeamCommissionRate: '',
  TeamPayPeriod: childRateConfig.value.firstPayPeriod as number | undefined,
  TeamType: 1,
  Username: '',
});

const ratePattern = /^(\d{1,2}(\.\d{1})?|100)$/;

function handleCancel() {
  router.push({ path: '/generalizeManage/generalizeManageact' });
}

function validateStepZero() {
  if (![1, 2].includes(form.TeamType)) {
    message.warning('请选择推广类型');
    return false;
  }
  if (form.TeamType === 2 && realAdminType.value !== 1) {
    message.warning('当前账号无权创建总代');
    return false;
  }
  return true;
}

function validateStepOne() {
  if (form.TeamType === 2) {
    if (!String(form.ProfitCommissionRate).trim()) {
      message.warning('请输入利润分成比例');
      return false;
    }
    if (!ratePattern.test(String(form.ProfitCommissionRate))) {
      message.warning('利润分成比例格式不正确');
      return false;
    }
  }
  if (!String(form.TeamCommissionRate).trim()) {
    message.warning(
      form.TeamType === 1 ? '请输入税收分成比例' : '请输入下级成本比例',
    );
    return false;
  }
  if (!ratePattern.test(String(form.TeamCommissionRate))) {
    message.warning('分成比例格式不正确');
    return false;
  }
  const teamRate = Number(form.TeamCommissionRate);
  if (realAdminType.value !== 1) {
    if (
      teamRate < childRateConfig.value.min ||
      teamRate > childRateConfig.value.max
    ) {
      message.warning(
        `分成比例需在 ${childRateConfig.value.min}%-${childRateConfig.value.max}% 之间`,
      );
      return false;
    }
    if (teamRate > selfPercent.value) {
      message.warning(`分成比例不能超过自身比例 ${selfPercent.value}%`);
      return false;
    }
  }
  if (form.TeamPayPeriod == null || Number.isNaN(Number(form.TeamPayPeriod))) {
    message.warning('请输入结算周期');
    return false;
  }
  if (!/^[1-9]\d*|0$/.test(String(form.TeamPayPeriod))) {
    message.warning('结算周期需为数字');
    return false;
  }
  if (
    form.ChildMinCommissionRate == null ||
    form.ChildMaxCommissionRate == null ||
    String(form.ChildMinCommissionRate).trim() === '' ||
    String(form.ChildMaxCommissionRate).trim() === ''
  ) {
    message.warning('请输入下放比例');
    return false;
  }
  if (
    !ratePattern.test(String(form.ChildMinCommissionRate)) ||
    !ratePattern.test(String(form.ChildMaxCommissionRate))
  ) {
    message.warning('下放比例格式不正确');
    return false;
  }
  if (
    Number(form.ChildMinCommissionRate) >= Number(form.ChildMaxCommissionRate)
  ) {
    message.warning('最小比例不能大于或等于最大比例');
    return false;
  }
  return true;
}

function validateStepTwo() {
  if (!form.Username.trim()) {
    message.warning('请输入账号用户名');
    return false;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]{1,19}$/.test(form.Username.trim())) {
    message.warning('账号用户名格式不正确');
    return false;
  }
  if (!form.Password) {
    message.warning('请输入密码');
    return false;
  }
  if (!/^[a-zA-Z0-9_]{6,20}$/.test(form.Password)) {
    message.warning('密码需为 6-20 位字母数字或下划线');
    return false;
  }
  if (form.Password !== form.ConfirmPassword) {
    message.warning('两次密码不一致');
    return false;
  }
  if (!form.Name.trim()) {
    message.warning('请输入账号姓名');
    return false;
  }
  return true;
}

function handleNext() {
  if (activeStep.value === 0 && !validateStepZero()) {
    return;
  }
  if (activeStep.value === 1 && !validateStepOne()) {
    return;
  }
  if (activeStep.value < 2) {
    activeStep.value += 1;
  }
}

function handlePrev() {
  if (activeStep.value > 0) {
    activeStep.value -= 1;
  }
}

async function handleSave() {
  if (!canViewPage.value) {
    message.error('无新增下级代理权限');
    return;
  }
  if (!validateStepTwo()) {
    return;
  }
  saving.value = true;
  try {
    await createPromoterApi({
      ChildMaxCommissionRate: Number(form.ChildMaxCommissionRate) * 10,
      ChildMinCommissionRate: Number(form.ChildMinCommissionRate) * 10,
      ConfirmPassword: form.ConfirmPassword,
      ContactInf: form.ContactInf.trim(),
      Hash: createRequestHash(),
      IsTeam: 1,
      Name: form.Name.trim(),
      Note: form.Note.trim(),
      Password: form.Password,
      ProfitCommissionRate:
        form.TeamType === 2 ? Number(form.ProfitCommissionRate) * 10 : 0,
      TeamCommissionRate: Number(form.TeamCommissionRate) * 10,
      TeamPayPeriod: Number(form.TeamPayPeriod),
      TeamType: form.TeamType,
      Username: form.Username.trim(),
    });
    message.success('新增团队推广成功');
    handleCancel();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  form.ChildMaxCommissionRate = String(childRateConfig.value.max || '');
  form.ChildMinCommissionRate = String(childRateConfig.value.min || '');
  form.TeamPayPeriod = childRateConfig.value.firstPayPeriod;
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 新增团队推广"
    title="新增团队推广"
  >
    <Card>
      <Steps
        class="mb-8"
        :current="activeStep"
        :items="[
          { title: '1. 推广类型' },
          { title: '2. 推广设置' },
          { title: '3. 账号设置' },
        ]"
      />

      <div
        v-if="activeStep === 0"
        class="flex flex-col items-center gap-6 py-6"
      >
        <Radio.Group v-model:value="form.TeamType" button-style="solid">
          <Radio.Button :value="1" class="!h-auto !px-8 !py-4">
            <div class="text-center">
              <div class="text-xl font-semibold">推广员</div>
              <div class="mt-2 text-xs opacity-80">按业绩分成 / 可提现</div>
            </div>
          </Radio.Button>
          <Radio.Button
            v-if="realAdminType === 1"
            :value="2"
            class="!ml-4 !h-auto !px-8 !py-4"
          >
            <div class="text-center">
              <div class="text-xl font-semibold">总代</div>
              <div class="mt-2 text-xs opacity-80">
                按利润分成 / 不可提现 / 线下结算
              </div>
            </div>
          </Radio.Button>
        </Radio.Group>
        <Space>
          <Button @click="handleCancel">取消</Button>
          <Button type="primary" @click="handleNext">下一步</Button>
        </Space>
      </div>

      <div v-else-if="activeStep === 1" class="mx-auto max-w-xl">
        <Form layout="vertical">
          <Form.Item v-if="form.TeamType === 2" label="利润分成比例" required>
            <Input
              v-model:value="form.ProfitCommissionRate"
              addon-after="%"
              placeholder="请输入"
            />
          </Form.Item>
          <Form.Item
            :label="form.TeamType === 1 ? '税收分成比例' : '下级成本比例'"
            required
          >
            <Input
              v-model:value="form.TeamCommissionRate"
              addon-after="%"
              placeholder="请输入"
            />
          </Form.Item>
          <Form.Item label="结算周期" required>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model:value="form.TeamPayPeriod"
                class="w-full"
                :disabled="realAdminType !== 1"
                :min="0"
              />
              <span class="text-gray-500">天</span>
            </div>
          </Form.Item>
          <Form.Item label="下放比例" required>
            <div class="flex items-center gap-2">
              <Input
                v-model:value="form.ChildMinCommissionRate"
                addon-after="%"
                :disabled="realAdminType !== 1"
                placeholder="最小"
              />
              <span>-</span>
              <Input
                v-model:value="form.ChildMaxCommissionRate"
                addon-after="%"
                :disabled="realAdminType !== 1"
                placeholder="最大"
              />
            </div>
          </Form.Item>
        </Form>
        <div class="mt-6 text-center">
          <Space>
            <Button @click="handlePrev">上一步</Button>
            <Button type="primary" @click="handleNext">下一步</Button>
          </Space>
        </div>
      </div>

      <div v-else class="mx-auto max-w-xl">
        <Form layout="vertical">
          <Form.Item label="账号用户名" required>
            <Input v-model:value="form.Username" placeholder="字母开头" />
          </Form.Item>
          <Form.Item label="账户密码" required>
            <Input.Password
              v-model:value="form.Password"
              autocomplete="new-password"
            />
          </Form.Item>
          <Form.Item label="确认密码" required>
            <Input.Password
              v-model:value="form.ConfirmPassword"
              autocomplete="new-password"
            />
          </Form.Item>
          <Form.Item label="账号姓名" required>
            <Input v-model:value="form.Name" :maxlength="20" />
          </Form.Item>
          <Form.Item label="联系方式">
            <Input v-model:value="form.ContactInf" />
          </Form.Item>
          <Form.Item label="备注">
            <Input v-model:value="form.Note" />
          </Form.Item>
        </Form>
        <div class="mt-6 text-center">
          <Space>
            <Button @click="handlePrev">上一步</Button>
            <Button :loading="saving" type="primary" @click="handleSave">
              确认
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无新增团队推广权限" title="403" />
</template>
