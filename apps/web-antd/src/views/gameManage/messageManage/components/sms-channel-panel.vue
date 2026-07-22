<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  changeAnnouncementSmsChannelApi,
  changeSmsChannelApi,
  fetchSmsChannelsApi,
  updateSmsChannelConfigApi,
} from '#/api/gameManage/message-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'SmsChannelPanel' });

interface ChannelRow {
  AesIv?: string;
  AesKey?: string;
  AgentId?: number;
  AppCode?: string;
  AppExtraInfo1?: string;
  AppKey?: string;
  AppSecret?: string;
  Desc?: string;
  Id: number | string;
}

const { checkPermission } = useCloudPermission();
const canManage = computed(() => checkPermission(12_908));
const allChannels = ref<ChannelRow[]>([]);
const otpChannel = ref<number | string>(0);
const noticeChannel = ref<number | string>(0);
const recallChannel = ref<number | string>(0);
const current = reactive({
  notice: 0 as number | string,
  otp: 0 as number | string,
  recall: 0 as number | string,
});
const secretVisible = ref(false);
const saving = ref(false);
const secretForm = reactive({
  AesIv: '',
  AesKey: '',
  AppCode: '',
  AppExtraInfo1: '',
  AppKey: '',
  AppSecret: '',
  Id: '' as number | string,
});
const channelOptions = computed(() =>
  allChannels.value.map((item) => ({
    label: item.Desc || item.Id,
    value: item.Id,
  })),
);

const gridOptions: VxeTableGridOptions<ChannelRow> = {
  columns: [
    { type: 'seq', title: '序号', width: 60 },
    { field: 'Desc', minWidth: 180, title: '通道名称' },
    {
      field: 'action',
      slots: { default: 'action' },
      title: '密钥管理',
      width: 120,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!canManage.value) return { items: [], total: 0 };
        try {
          // 旧站无分页参数，一次拉全量；下拉用全量，表格仅展示 AgentId!==0
          const result = await fetchSmsChannelsApi({});
          allChannels.value = (result.Items || []) as unknown as ChannelRow[];
          otpChannel.value = result.CurrentSmsConfigId || 0;
          noticeChannel.value = result.CurrentSmsAnnouncementConfigId || 0;
          recallChannel.value = result.RecallSmsConfigId || 0;
          current.otp = otpChannel.value;
          current.notice = noticeChannel.value;
          current.recall = recallChannel.value;
          const filtered = allChannels.value.filter(
            (item) => Number(item.AgentId) !== 0,
          );
          const start = (page.currentPage - 1) * page.pageSize;
          return {
            items: filtered.slice(start, start + page.pageSize),
            total: filtered.length,
          };
        } catch {
          allChannels.value = [];
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function replaceChannel(type: 'notice' | 'otp' | 'recall') {
  const value =
    type === 'otp'
      ? otpChannel.value
      : (type === 'notice'
        ? noticeChannel.value
        : recallChannel.value);
  if (!value) {
    message.warning('请选择短信通道');
    return;
  }
  await (type === 'notice' ? changeAnnouncementSmsChannelApi(value) : changeSmsChannelApi({
      Id: value,
      Type: type === 'otp' ? 1 : 2,
    }));
  message.success('通道更换成功');
  await gridApi.reload();
}

function openSecret(row: ChannelRow) {
  Object.assign(secretForm, {
    AesIv: String(row.AesIv || ''),
    AesKey: String(row.AesKey || ''),
    AppCode: String(row.AppCode || ''),
    AppExtraInfo1: String(row.AppExtraInfo1 || ''),
    AppKey: String(row.AppKey || ''),
    AppSecret: String(row.AppSecret || ''),
    Id: row.Id,
  });
  secretVisible.value = true;
}

async function submitSecret() {
  saving.value = true;
  try {
    await updateSmsChannelConfigApi({ ...secretForm });
    message.success('密钥配置已保存');
    secretVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Alert
    v-if="!canManage"
    message="当前账号无短信通道配置权限"
    show-icon
    type="warning"
  />
  <template v-else>
    <div class="channel-settings">
      <div class="channel-setting">
        <span>发送 OTP 短信通道</span>
        <Select
          v-model:value="otpChannel"
          :options="channelOptions"
          class="!w-[220px]"
        />
        <Button
          type="primary"
          :disabled="String(current.otp) === String(otpChannel)"
          @click="replaceChannel('otp')"
        >
          更换
        </Button>
      </div>
      <div class="channel-setting">
        <span>发送公告短信通道</span>
        <Select
          v-model:value="noticeChannel"
          :options="channelOptions"
          class="!w-[220px]"
        />
        <Button
          type="primary"
          :disabled="String(current.notice) === String(noticeChannel)"
          @click="replaceChannel('notice')"
        >
          更换
        </Button>
      </div>
      <div class="channel-setting">
        <span>次日召回短信通道</span>
        <Select
          v-model:value="recallChannel"
          :options="channelOptions"
          class="!w-[220px]"
        />
        <Button
          type="primary"
          :disabled="String(current.recall) === String(recallChannel)"
          @click="replaceChannel('recall')"
        >
          更换
        </Button>
      </div>
    </div>

    <div class="channel-grid">
      <Grid>
        <template #action="{ row }">
          <Button size="small" type="link" @click="openSecret(row)">
            密钥管理
          </Button>
        </template>
      </Grid>
    </div>
  </template>

  <Modal
    v-model:open="secretVisible"
    :confirm-loading="saving"
    title="密钥管理"
    width="620px"
    @ok="submitSecret"
  >
    <Form class="pt-3" layout="vertical">
      <div class="form-grid">
        <Form.Item label="商户 ID">
          <Input v-model:value="secretForm.AppKey" :maxlength="3000" />
        </Form.Item>
        <Form.Item label="商户密钥">
          <Input.Password v-model:value="secretForm.AppSecret" :maxlength="3000" />
        </Form.Item>
        <Form.Item label="商户 Code">
          <Input v-model:value="secretForm.AppCode" :maxlength="3000" />
        </Form.Item>
        <Form.Item label="商户信息">
          <Input v-model:value="secretForm.AppExtraInfo1" :maxlength="3000" />
        </Form.Item>
        <Form.Item label="加密密钥 Key">
          <Input.Password v-model:value="secretForm.AesKey" :maxlength="3000" />
        </Form.Item>
        <Form.Item label="加密密钥 IV">
          <Input.Password v-model:value="secretForm.AesIv" :maxlength="3000" />
        </Form.Item>
      </div>
    </Form>
  </Modal>
</template>

<style scoped>
.channel-settings {
  display: grid;
  gap: 12px;
  padding: 18px;
  margin-bottom: 18px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.channel-setting {
  display: grid;
  grid-template-columns: 180px 220px auto;
  gap: 12px;
  align-items: center;
}

.channel-grid {
  max-width: 720px;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

@media (max-width: 720px) {
  .channel-setting,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
