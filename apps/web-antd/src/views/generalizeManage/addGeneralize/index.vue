<script lang="ts" setup>
import type { SteamerGroupItem } from '#/types/promotion';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Divider,
  Form,
  Input,
  message,
  Radio,
  Result,
  Select,
  Steps,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getProjectConfigApi } from '#/api/core/project';
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
import { createRequestHash } from '#/utils/crypto';
import {
  PROMOTER_FUNCTION_MAP,
  PROMOTER_SETTLE_TYPE_MAP,
} from '#/utils/promotion';

defineOptions({ name: 'AddGeneralize' });

const route = useRoute();
const router = useRouter();
const { closeCurrentTab } = useTabs();
const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canQingLiu = computed(() => checkPermission(12_577));
const editId = computed(() => String(route.query.id || ''));
const isEdit = computed(() =>
  Boolean(editId.value && editId.value !== 'undefined'),
);
const isRootTeam = computed(() => {
  const teamInfo = projectConfig.value?.AccountTeamInfo as
    | undefined
    | { AgentId?: number; Id?: number };
  return (
    teamInfo?.Id !== undefined &&
    teamInfo.AgentId !== undefined &&
    Number(teamInfo.Id) === 0 &&
    Number(teamInfo.AgentId) === 0
  );
});
const canViewPage = computed(() =>
  isEdit.value
    ? checkPermission(10_909)
    : checkPermission(10_913) && isRootTeam.value,
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
const formStatus = ref<number>();
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
      .map(
        (id) =>
          steamerGroups.value.find((group) => String(group.Id) === String(id))
            ?.TypeName || id,
      )
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
const groupCheckAll = computed({
  get: () =>
    steamerGroups.value.length > 0 &&
    formTeamIds.value.length === steamerGroups.value.length,
  set: (checked: boolean) => {
    if (!canQingLiu.value) return;
    formTeamIds.value = checked
      ? steamerGroups.value
          .map((item) => item.Id)
          .filter(
            (id): id is number | string => id !== undefined && id !== null,
          )
      : (defaultSteamerGroupId.value === undefined
        ? []
        : [defaultSteamerGroupId.value]);
  },
});
const groupIndeterminate = computed(
  () =>
    formTeamIds.value.length > 0 &&
    formTeamIds.value.length < steamerGroups.value.length,
);

function getRealAdminType() {
  const parentInfo = projectConfig.value?.ParentInfo as
    | undefined
    | { AdminType?: number };
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
    return true;
  }
}

function ensureDefaultTeamIfEmpty() {
  if (
    formTeamIds.value.length === 0 &&
    defaultSteamerGroupId.value !== undefined
  ) {
    formTeamIds.value = [defaultSteamerGroupId.value];
  }
}

async function loadSteamerGroups() {
  const result = await fetchSteamerGroupListApi();
  const items = [...(result.Items || [])].filter(
    (item) => item.Id !== undefined && item.Id !== null,
  );
  items.sort((a, b) => Number(b.IsDefault) - Number(a.IsDefault));
  steamerGroups.value = items.map((item) => ({
    ...item,
    TypeName: item.IsDefault ? `${item.TypeName || ''}(默认)` : item.TypeName,
  }));
  const defaultItem = items.find((item) => item.IsDefault);
  defaultSteamerGroupId.value = defaultItem?.Id;
  if (!isEdit.value && defaultItem?.Id) {
    formTeamIds.value = [defaultItem.Id];
  } else {
    // 编辑态若直属分组接口失败/空选，回落到默认分组（与旧站 min=1 一致）
    ensureDefaultTeamIfEmpty();
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
    formStatus.value = detail.Status;
    formSettleType.value = detail.SettleType || 1;
    formSettlePrice.value =
      detail.SettlePrice === undefined || detail.SettlePrice === null
        ? ''
        : String(detail.SettlePrice);
    if ([4, 5, 6, 7].includes(Number(detail.SettleType))) {
      formSettleRate.value =
        detail.SettlePrice === undefined || detail.SettlePrice === null
          ? ''
          : String(detail.SettlePrice);
    }
    const roleData = detail.RoleDataField;
    if (roleData) {
      try {
        const parsed =
          typeof roleData === 'string'
            ? (JSON.parse(roleData) as { HaveFunction?: string })
            : roleData;
        formFunctions.value = parsed.HaveFunction
          ? parsed.HaveFunction.split(',').filter(Boolean)
          : [];
      } catch {
        formFunctions.value = [];
      }
    }
    // 直属分组与详情解耦：分组服务 20001 时仍保留账号信息可编辑
    try {
      const directGroup = await fetchSteamerDirectGroupApi({
        AdminId: detail.AdminId ?? detail.Id,
      });
      formQingLiu.value = Boolean(directGroup.CanQingLiu);
      formTeamIds.value =
        directGroup.Teams?.filter(
          (item) => item.Checked && item.Id !== undefined && item.Id !== null,
        ).map((item) => item.Id!) || [];
      ensureDefaultTeamIfEmpty();
    } catch {
      message.warning('直播分组配置加载失败，已保留默认分组（如有）');
      ensureDefaultTeamIfEmpty();
    }
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
  if (!isEdit.value && !formPassword.value) {
    message.warning('请输入密码');
    return false;
  }
  if (formPassword.value && !/^[a-z0-9_]{6,20}$/i.test(formPassword.value)) {
    message.warning('密码必须为 6～20 位字母、数字或下划线');
    return false;
  }
  if (
    (formPassword.value || formConfirmPassword.value) &&
    formPassword.value !== formConfirmPassword.value
  ) {
    message.warning('两次密码不一致');
    return false;
  }
  if (!formName.value.trim()) {
    message.warning('请输入账号姓名');
    return false;
  }
  if (formName.value.trim().length > 20) {
    message.warning('账号姓名最多 20 个字符');
    return false;
  }
  if (formNote.value && formNote.value.length > 400) {
    message.warning('备注最多 400 个字符');
    return false;
  }
  return true;
}

function validateStepTwo() {
  if (isRateSettleType.value) {
    if (!/^([0-9]\d?(\.\d{1,2})?|0\.\d{1,2}|100)$/.test(formSettleRate.value)) {
      message.warning('分成比例须为 0～100，最多两位小数');
      return false;
    }
  } else if (!/^(0|[1-9]\d*)$/.test(formSettlePrice.value)) {
    message.warning('结算单价须为非负整数');
    return false;
  }
  if (formTeamIds.value.length === 0) {
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

function handleGroupChange(values: Array<boolean | number | string>) {
  if (values.length > 0 || defaultSteamerGroupId.value === undefined) return;
  formTeamIds.value = [defaultSteamerGroupId.value];
  message.info('至少需要保留一个直播分组');
}

function buildPayload() {
  const payload: Record<string, unknown> = {
    ConfirmPassword: formConfirmPassword.value,
    ContactInf: formContact.value.trim(),
    Name: formName.value.trim(),
    Note: formNote.value.trim(),
    Password: formPassword.value,
    QingLiu: formQingLiu.value,
    RoleDataField: JSON.stringify({
      HaveFunction: formFunctions.value.join(','),
    }),
    SettleType: formSettleType.value,
    TeamIds: formTeamIds.value,
    Username: formUsername.value.trim(),
    SettlePrice: isRateSettleType.value
      ? formSettleRate.value
      : formSettlePrice.value,
  };
  if (isEdit.value) {
    payload.Id = editId.value;
    if (formStatus.value !== undefined) payload.Status = formStatus.value;
  } else {
    payload.Hash = createRequestHash();
  }
  return payload;
}

async function handleSubmit() {
  if (!canViewPage.value) {
    message.error(isEdit.value ? '无编辑推广账号权限' : '无创建渠道推广权限');
    return;
  }
  if (!validateStepOne()) {
    activeStep.value = 0;
    return;
  }
  if (!validateStepTwo()) {
    activeStep.value = 1;
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
    await handleBack();
    void getProjectConfigApi().catch(() => {
      message.warning('项目配置刷新失败，请稍后刷新页面');
    });
  } finally {
    saving.value = false;
  }
}

async function handleBack() {
  await closeCurrentTab();
  await router.push({ path: '/generalizeManage/generalizeManageact' });
}

async function loadPage() {
  if (!canViewPage.value) {
    return;
  }
  const results = await Promise.allSettled([loadSteamerGroups(), loadDetail()]);
  if (results[0]?.status === 'rejected') {
    message.warning('直播分组加载失败，请稍后重试');
  }
  if (results[1]?.status === 'rejected' && isEdit.value) {
    message.warning('推广账号详情加载失败，请稍后重试');
  }
}

function resetForm() {
  activeStep.value = 0;
  formUsername.value = '';
  formPassword.value = '';
  formConfirmPassword.value = '';
  formName.value = '';
  formContact.value = '';
  formNote.value = '';
  formSettleType.value = 1;
  formSettlePrice.value = '';
  formSettleRate.value = '';
  formStatus.value = undefined;
  formFunctions.value = [];
  formTeamIds.value = [];
  formQingLiu.value = false;
  steamerGroups.value = [];
  defaultSteamerGroupId.value = undefined;
}

watch(editId, async (current, previous) => {
  if (current === previous) return;
  resetForm();
  await loadPage();
});

watch(canViewPage, async (allowed, previous) => {
  if (allowed && !previous) await loadPage();
});

onMounted(async () => {
  await loadPage();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    :description="
      isEdit ? '推广管理 · 编辑推广账号' : '推广管理 · 创建推广账号'
    "
    :title="isEdit ? '编辑推广账号' : '创建推广账号'"
  >
    <Card :loading="loading" class="promotion-form-card" :bordered="false">
      <Steps :current="activeStep" class="step-header">
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
            <Input v-model:value="formName" :maxlength="20" show-count />
          </Form.Item>
          <Form.Item label="联系方式">
            <Input v-model:value="formContact" :maxlength="400" />
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea
              v-model:value="formNote"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              :maxlength="400"
              show-count
            />
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
            <Alert
              v-if="isRateSettleType && formSettleRate"
              class="mt-3"
              show-icon
              type="info"
            >
              <template #message>
                当前合作模式按
                <b>{{ formSettleRate }}%</b>
                {{
                  formSettleType === 4
                    ? '税收'
                    : formSettleType === 5
                      ? '利润'
                      : formSettleType === 6
                        ? '杀数'
                        : '流水'
                }}
                分成结算
              </template>
            </Alert>
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
          <Form.Item required>
            <template #label>
              <span>
                直播分组
                <Tooltip
                  title="设置该推广账号可查看和管理的直播分组；无分组权限时保留原有选择。"
                >
                  <span class="group-help">?</span>
                </Tooltip>
              </span>
            </template>
            <Alert
              v-if="steamerGroups.length === 0"
              class="mb-3"
              message="暂无可用直播分组，暂时无法提交"
              show-icon
              type="warning"
            />
            <Checkbox
              v-model:checked="groupCheckAll"
              :disabled="!canQingLiu || steamerGroups.length === 0"
              :indeterminate="groupIndeterminate"
              class="mb-3"
            >
              全选
            </Checkbox>
            <CheckboxGroup
              v-model:value="formTeamIds"
              @change="handleGroupChange"
            >
              <div class="group-box">
                <Checkbox
                  v-for="item in steamerGroups"
                  :key="String(item.Id)"
                  :disabled="!canQingLiu"
                  :value="item.Id"
                >
                  {{ item.TypeName }}
                </Checkbox>
              </div>
            </CheckboxGroup>
          </Form.Item>
          <Form.Item label="清流房间">
            <Radio.Group v-model:value="formQingLiu">
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
          <div>
            密码：{{
              formPassword ? formPassword : isEdit ? '（未修改）' : '-'
            }}
          </div>
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
              v-if="
                column.key === 'content' &&
                ['function', 'team'].includes(record.key)
              "
            >
              <Tag
                v-for="item in String(record.content)
                  .split('、')
                  .filter(Boolean)"
                :key="item"
                class="mb-1 mr-1"
                color="green"
              >
                {{ item }}
              </Tag>
            </template>
            <Tag
              v-else-if="column.key === 'content' && record.key === 'qingliu'"
              :color="formQingLiu ? 'green' : 'default'"
            >
              {{ record.content }}
            </Tag>
          </template>
        </Table>
      </div>

      <div class="mt-8 flex justify-center gap-3">
        <Button @click="handleBack">返回列表</Button>
        <Button v-if="activeStep > 0" @click="handlePrev">上一步</Button>
        <Button v-if="activeStep < 2" type="primary" @click="handleNext">
          下一步
        </Button>
        <Button
          v-else
          :disabled="steamerGroups.length === 0"
          :loading="saving"
          type="primary"
          @click="handleSubmit"
        >
          确认提交
        </Button>
      </div>
    </Card>
  </Page>
  <Result
    v-else
    status="403"
    sub-title="无创建或编辑推广账号权限"
    title="403"
  />
</template>

<style scoped>
.promotion-form-card {
  max-width: 1080px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 5%);
}

.step-header {
  padding: 18px 24px 28px;
  margin-bottom: 24px;
  background: hsl(var(--muted) / 40%);
  border-radius: 10px;
}

.group-box {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: 260px;
  padding: 12px;
  overflow-y: auto;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.group-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  font-size: 11px;
  color: #fff;
  cursor: help;
  background: #8c8c8c;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .group-box {
    grid-template-columns: 1fr;
  }
}
</style>
