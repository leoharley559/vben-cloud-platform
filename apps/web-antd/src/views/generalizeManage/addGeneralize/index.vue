<script lang="ts" setup>
import type { SteamerGroupItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Divider,
  Form,
  Input,
  Radio,
  Select,
  Steps,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  createPromoterApi,
  fetchPromoterDetailApi,
  updatePromoterApi,
} from '#/api/promotion/manage';
import {
  fetchSteamerDirectGroupApi,
  fetchSteamerGroupListApi,
} from '#/api/promotion/steamer-group';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  PROMOTER_FUNCTION_MAP,
  PROMOTER_SETTLE_TYPE_MAP,
} from '#/utils/promotion';

defineOptions({ name: 'AddGeneralize' });

const route = useRoute();
const router = useRouter();
const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canQingLiu = computed(() => checkPermission(12577));
const editId = computed(() => String(route.query.id || ''));
const isEdit = computed(() =>
  Boolean(editId.value && editId.value !== 'undefined'),
);

const loading = ref(false);
const saving = ref(false);
const activeStep = ref(0);
const steamerGroups = ref<SteamerGroupItem[]>([]);
const defaultSteamerGroupId = ref<number | string>();

const formUsername = ref('');
const formPassword = ref('');
const formConfirmPassword = ref('');
const formName = ref('');
const formContact = ref('');
const formNote = ref('');
const formSettleType = ref(1);
const formSettlePrice = ref('');
const formSettleRate = ref('');
const formFunctions = ref<string[]>([]);
const formTeamIds = ref<Array<number | string>>([]);
const formQingLiu = ref(false);

const settleTypeOptions = [
  { label: PROMOTER_SETTLE_TYPE_MAP[1], value: 1 },
  { label: PROMOTER_SETTLE_TYPE_MAP[3], value: 3 },
  { label: PROMOTER_SETTLE_TYPE_MAP[4], value: 4 },
  { label: PROMOTER_SETTLE_TYPE_MAP[5], value: 5 },
  { label: PROMOTER_SETTLE_TYPE_MAP[6], value: 6 },
  { label: PROMOTER_SETTLE_TYPE_MAP[7], value: 7 },
];

const functionOptions = Object.entries(PROMOTER_FUNCTION_MAP).map(
  ([value, label]) => ({ label, value }),
);

const confirmRows = computed(() => [
  {
    content: formFunctions.value
      .map((item) => PROMOTER_FUNCTION_MAP[item] || item)
      .join('、'),
    key: 'function',
    type: '功能权限',
  },
  {
    content: formTeamIds.value
      .map((id) => steamerGroups.value.find((g) => g.Id === id)?.TypeName || id)
      .join('、'),
    key: 'team',
    type: '直播分组',
  },
  {
    content: formQingLiu.value ? '是' : '否',
    key: 'qingliu',
    type: '清流房间',
  },
]);

const isRateSettleType = computed(() =>
  [4, 5, 6, 7].includes(formSettleType.value),
);

function getRealAdminType() {
  const parentInfo = projectConfig.value?.ParentInfo as
    | { AdminType?: number }
    | undefined;
  return parentInfo?.AdminType ?? 0;
}

function isFunctionDisabled(value: string) {
  if (getRealAdminType() !== 2) {
    return false;
  }
  try {
    const roleDataField = projectConfig.value?.RoleDataField
      ? JSON.parse(projectConfig.value.RoleDataField)
      : {};
    const allowed = String(roleDataField.HaveFunction || '')
      .split(',')
      .filter(Boolean);
    return !allowed.includes(value);
  } catch {
    return false;
  }
}

async function loadSteamerGroups() {
  const result = await fetchSteamerGroupListApi();
  const items = [...(result.Items || [])];
  items.sort((a, b) => Number(b.IsDefault) - Number(a.IsDefault));
  steamerGroups.value = items.map((item) => ({
    ...item,
    TypeName: item.IsDefault ? `${item.TypeName || ''}(默认)` : item.TypeName,
  }));
  const defaultItem = items.find((item) => item.IsDefault);
  defaultSteamerGroupId.value = defaultItem?.Id;
  if (!isEdit.value && defaultItem?.Id) {
    formTeamIds.value = [defaultItem.Id];
  }
}

async function loadDetail() {
  if (!isEdit.value) {
    return;
  }
  loading.value = true;
  try {
    const detail = await fetchPromoterDetailApi(editId.value);
    formUsername.value = detail.Username || '';
    formName.value = detail.Name || '';
    formContact.value = detail.ContactInf || '';
    formNote.value = detail.Note || '';
    formSettleType.value = detail.SettleType || 1;
    formSettlePrice.value = detail.SettlePrice
      ? String(detail.SettlePrice)
      : '';
    if ([4, 5, 6, 7].includes(Number(detail.SettleType))) {
      formSettleRate.value = detail.SettlePrice
        ? String(detail.SettlePrice)
        : '';
    }
    const roleData = detail.RoleDataField;
    if (typeof roleData === 'string' && roleData) {
      const parsed = JSON.parse(roleData) as { HaveFunction?: string };
      formFunctions.value = parsed.HaveFunction
        ? parsed.HaveFunction.split(',').filter(Boolean)
        : [];
    }
    const directGroup = await fetchSteamerDirectGroupApi({
      AdminId: detail.AdminId ?? detail.Id,
    });
    formQingLiu.value = Boolean(directGroup.CanQingLiu);
    formTeamIds.value =
      directGroup.Teams?.filter((item) => item.Checked).map(
        (item) => item.Id!,
      ) || [];
  } finally {
    loading.value = false;
  }
}

function validateStepOne() {
  if (!formUsername.value.trim()) {
    message.warning('请输入账号用户名');
    return false;
  }
  if (!/^[a-z][a-z0-9_]{1,19}$/i.test(formUsername.value.trim())) {
    message.warning('账号用户名格式不正确');
    return false;
  }
  if (!isEdit.value) {
    if (!formPassword.value) {
      message.warning('请输入密码');
      return false;
    }
    if (!/^[a-z0-9_]{6,20}$/i.test(formPassword.value)) {
      message.warning('密码格式不正确');
      return false;
    }
    if (formPassword.value !== formConfirmPassword.value) {
      message.warning('两次密码不一致');
      return false;
    }
  }
  if (!formName.value.trim()) {
    message.warning('请输入账号姓名');
    return false;
  }
  return true;
}

function validateStepTwo() {
  if (isRateSettleType.value) {
    if (!formSettleRate.value) {
      message.warning('请输入分成比例');
      return false;
    }
  } else if (!formSettlePrice.value) {
    message.warning('请输入结算单价');
    return false;
  }
  if (!formTeamIds.value.length) {
    message.warning('请至少选择一个直播分组');
    return false;
  }
  return true;
}

function handleNext() {
  if (activeStep.value === 0 && !validateStepOne()) {
    return;
  }
  if (activeStep.value === 1 && !validateStepTwo()) {
    return;
  }
  activeStep.value = Math.min(activeStep.value + 1, 2);
}

function handlePrev() {
  activeStep.value = Math.max(activeStep.value - 1, 0);
}

function buildPayload() {
  const payload: Record<string, unknown> = {
    ConfirmPassword: formConfirmPassword.value,
    ContactInf: formContact.value,
    Id: isEdit.value ? editId.value : undefined,
    Name: formName.value,
    Note: formNote.value,
    Password: formPassword.value,
    QingLiu: formQingLiu.value,
    RoleDataField: JSON.stringify({
      HaveFunction: formFunctions.value.join(','),
    }),
    SettleType: formSettleType.value,
    TeamIds: formTeamIds.value,
    Username: formUsername.value,
  };
  if (isRateSettleType.value) {
    payload.SettlePrice = formSettleRate.value;
  } else {
    payload.SettlePrice = formSettlePrice.value;
  }
  if (!isEdit.value) {
    payload.Hash = String(Date.now());
  }
  return payload;
}

async function handleSubmit() {
  if (!validateStepOne() || !validateStepTwo()) {
    activeStep.value = 0;
    return;
  }
  saving.value = true;
  try {
    const payload = buildPayload();
    if (isEdit.value) {
      await updatePromoterApi(payload);
      message.success('编辑成功');
    } else {
      await createPromoterApi(payload);
      message.success('创建成功');
    }
    router.push({ path: '/generalizeManage/generalizeManageact' });
  } finally {
    saving.value = false;
  }
}

function handleBack() {
  router.push({ path: '/generalizeManage/generalizeManageact' });
}

onMounted(async () => {
  await loadSteamerGroups();
  await loadDetail();
});
</script>

<template>
  <Page
    auto-content-height
    :description="
      isEdit ? '推广管理 · 编辑推广账号' : '推广管理 · 创建推广账号'
    "
    :title="isEdit ? '编辑推广账号' : '创建推广账号'"
  >
    <Card :loading="loading">
      <Steps :current="activeStep" class="mb-8">
        <Steps.Step title="账号信息" />
        <Steps.Step title="协作配置" />
        <Steps.Step title="信息确认" />
      </Steps>

      <div v-if="activeStep === 0" class="mx-auto max-w-xl">
        <Divider>账号信息</Divider>
        <Form layout="vertical">
          <Form.Item label="账号用户名" required>
            <Input
              v-model:value="formUsername"
              :disabled="isEdit"
              placeholder="字母开头，2-20位"
            />
          </Form.Item>
          <Form.Item :required="!isEdit" label="密码">
            <Input.Password v-model:value="formPassword" placeholder="6-20位" />
          </Form.Item>
          <Form.Item :required="!isEdit" label="确认密码">
            <Input.Password
              v-model:value="formConfirmPassword"
              placeholder="再次输入密码"
            />
          </Form.Item>
          <Form.Item label="账号姓名" required>
            <Input v-model:value="formName" />
          </Form.Item>
          <Form.Item label="联系方式">
            <Input v-model:value="formContact" />
          </Form.Item>
          <Form.Item label="备注">
            <Input v-model:value="formNote" />
          </Form.Item>
        </Form>
      </div>

      <div v-else-if="activeStep === 1" class="mx-auto max-w-xl">
        <Divider>协作配置</Divider>
        <Form layout="vertical">
          <Form.Item label="结算类型" required>
            <div class="flex gap-2">
              <Select
                v-model:value="formSettleType"
                class="flex-1"
                :options="settleTypeOptions"
              />
              <Input
                v-if="isRateSettleType"
                v-model:value="formSettleRate"
                placeholder="分成 %"
                suffix="%"
              />
              <Input
                v-else
                v-model:value="formSettlePrice"
                placeholder="单价"
                suffix="元/个"
              />
            </div>
          </Form.Item>
          <Form.Item label="功能权限">
            <CheckboxGroup v-model:value="formFunctions">
              <Checkbox
                v-for="item in functionOptions"
                :key="item.value"
                :disabled="isFunctionDisabled(item.value)"
                :value="item.value"
              >
                {{ item.label }}
              </Checkbox>
            </CheckboxGroup>
          </Form.Item>
          <Form.Item label="直播分组" required>
            <CheckboxGroup v-model:value="formTeamIds">
              <div class="flex flex-col gap-2">
                <Checkbox
                  v-for="item in steamerGroups"
                  :key="String(item.Id)"
                  :disabled="!canQingLiu && !item.IsDefault"
                  :value="item.Id"
                >
                  {{ item.TypeName }}
                </Checkbox>
              </div>
            </CheckboxGroup>
          </Form.Item>
          <Form.Item label="清流房间">
            <Radio.Group v-model:value="formQingLiu" :disabled="!canQingLiu">
              <Radio :value="true">是</Radio>
              <Radio :value="false">否</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </div>

      <div v-else class="mx-auto max-w-2xl">
        <Divider>信息确认</Divider>
        <div class="mb-4 space-y-2">
          <div>账号：{{ formUsername }}</div>
          <div>姓名：{{ formName }}</div>
          <div>联系方式：{{ formContact || '-' }}</div>
          <div>
            结算类型：{{ PROMOTER_SETTLE_TYPE_MAP[formSettleType] }} /
            {{
              isRateSettleType
                ? `${formSettleRate}%`
                : `${formSettlePrice} 元/个`
            }}
          </div>
        </div>
        <Table
          bordered
          :columns="[
            { dataIndex: 'type', key: 'type', title: '配置项', width: 140 },
            { dataIndex: 'content', key: 'content', title: '内容' },
          ]"
          :data-source="confirmRows"
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template
              v-if="column.key === 'content' && record.key === 'function'"
            >
              <Tag v-for="item in formFunctions" :key="item" class="mb-1">
                {{ PROMOTER_FUNCTION_MAP[item] || item }}
              </Tag>
            </template>
          </template>
        </Table>
      </div>

      <div class="mt-8 flex justify-center gap-3">
        <Button @click="handleBack">返回列表</Button>
        <Button v-if="activeStep > 0" @click="handlePrev">上一步</Button>
        <Button v-if="activeStep < 2" type="primary" @click="handleNext">
          下一步
        </Button>
        <Button v-else :loading="saving" type="primary" @click="handleSubmit">
          确认提交
        </Button>
      </div>
    </Card>
  </Page>
</template>
