<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Result,
  Select,
  Tabs,
  message,
} from 'ant-design-vue';

import {
  changeJuniorAgentApi,
  fetchJuniorChangeChannelListApi,
  fetchJuniorMemberChangeRecordApi,
  fetchJuniorMemberListApi,
} from '#/api/netcash/junior-member';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'JuniorMember' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_153));
const canViewChange = computed(() => checkPermission(10_154));
const canChangeChannel = computed(() => checkPermission(10_155));
const activeTab = ref('member');

const gridRef = ref<InstanceType<typeof NetcashGridPanel>>();

const memberConfig = computed<NetcashGridConfig>(() => ({
  actionWidth: 120,
  columns: [
    { field: 'LoginAccount', title: '游戏账号' },
    { field: 'PromoterUserName', title: '所属代理' },
    { field: 'PackageName', title: '产品包' },
    {
      field: 'Status',
      formatter: (value) =>
        Number(value) === 1 ? '正常' : String(value ?? '-'),
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: (value) => formatNetcashDateTime(value as string),
      title: '注册时间',
    },
    {
      field: 'PayMoney',
      formatter: (value) => formatAmountFromCent(Number(value)),
      title: '充值金额',
    },
  ],
  fetchApi: (query) => fetchJuniorMemberListApi(query as never),
  filters: ['login', 'package', 'date', 'status'],
  showActions: canChangeChannel.value,
  statusOptions: [
    { label: '正常', value: 1 },
    { label: '停用', value: 2 },
  ],
}));

const changeConfig: NetcashGridConfig = {
  columns: [
    { field: 'LoginAccount', title: '游戏账号' },
    { field: 'OldPromoter', title: '原代理' },
    { field: 'NewPromoter', title: '新代理' },
    {
      field: 'CreateTime',
      formatter: (value) => formatNetcashDateTime(value as string),
      title: '变更时间',
    },
    { field: 'Operator', title: '操作人' },
  ],
  fetchApi: (query) => fetchJuniorMemberChangeRecordApi(query as never),
  filters: ['login', 'date'],
};

const changeModalOpen = ref(false);
const changeSubmitting = ref(false);
const channelOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);
const changeForm = reactive({
  AdminId: '',
  DataFlag: 0,
  FromChannelId: '' as number | string,
  LoginAccount: '',
  Note: '',
  PlayerId: '' as number | string,
  PromoterUserName: '',
  ToChannelId: undefined as number | string | undefined,
});

async function loadChannelOptions(row: Record<string, unknown>) {
  const result = await fetchJuniorChangeChannelListApi({
    AdminId: changeForm.AdminId || undefined,
    ChannelId: row.ChannelId,
    DataSearchType: row.DataFlag || 0,
  });
  const list = Array.isArray(result)
    ? result
    : Array.isArray((result as { Items?: unknown[] })?.Items)
      ? (result as { Items: Record<string, unknown>[] }).Items
      : [];
  const fromId = String(row.ChannelId ?? '');
  channelOptions.value = list
    .filter((item) => String(item.ChannelId) !== fromId)
    .map((item) => ({
      label: `${item.Name || ''} (${item.ChannelName || ''})`,
      value: item.ChannelId as number | string,
    }));
  changeForm.ToChannelId = channelOptions.value[0]?.value;
}

async function openChangeModal(row: Record<string, unknown>) {
  changeForm.PlayerId = String(row.PlayerId ?? '');
  changeForm.FromChannelId = String(row.ChannelId ?? '');
  changeForm.PromoterUserName = String(row.PromoterUserName ?? '');
  changeForm.LoginAccount = String(row.LoginAccount ?? '');
  changeForm.DataFlag = Number(row.DataFlag || 0);
  changeForm.AdminId = '';
  changeForm.Note = '';
  changeForm.ToChannelId = undefined;
  channelOptions.value = [];
  changeModalOpen.value = true;
  try {
    await loadChannelOptions(row);
  } catch {
    // interceptor tips
  }
}

async function submitChangeModal() {
  if (!changeForm.ToChannelId) {
    message.warning('请选择变更渠道');
    return;
  }
  changeSubmitting.value = true;
  try {
    await changeJuniorAgentApi({
      AdminId: changeForm.AdminId || undefined,
      DataFlag: changeForm.DataFlag,
      FromChannelId: changeForm.FromChannelId,
      LoginAccount: changeForm.LoginAccount,
      Note: changeForm.Note,
      PlayerId: changeForm.PlayerId,
      PromoterUserName: changeForm.PromoterUserName,
      ToChannelId: changeForm.ToChannelId,
    });
    message.success('变更成功');
    changeModalOpen.value = false;
    gridRef.value?.reload();
  } finally {
    changeSubmitting.value = false;
  }
}

onMounted(() => {
  activeTab.value = 'member';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 下级成员"
    title="下级成员"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane key="member" tab="成员列表">
          <NetcashGridPanel
            v-if="activeTab === 'member'"
            ref="gridRef"
            :config="memberConfig"
          >
            <template #actions="{ row }">
              <Button
                v-if="canChangeChannel"
                size="small"
                type="link"
                @click="openChangeModal(row)"
              >
                改线
              </Button>
            </template>
          </NetcashGridPanel>
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canViewChange" key="change" tab="变更记录">
          <NetcashGridPanel
            v-if="activeTab === 'change'"
            :config="changeConfig"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="changeModalOpen"
      :confirm-loading="changeSubmitting"
      title="变更渠道"
      @ok="submitChangeModal"
    >
      <Form layout="vertical">
        <Form.Item label="游戏账号">
          <Input v-model:value="changeForm.LoginAccount" disabled />
        </Form.Item>
        <Form.Item label="所属代理">
          <Input v-model:value="changeForm.PromoterUserName" disabled />
        </Form.Item>
        <Form.Item label="变更渠道" required>
          <Select
            v-model:value="changeForm.ToChannelId"
            :options="channelOptions"
            allow-clear
            placeholder="请选择目标渠道"
            show-search
            style="width: 100%"
            :filter-option="
              (input, option) =>
                String(option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="changeForm.Note" placeholder="请输入备注" />
          <p class="mt-1 text-xs text-red-500">
            变更后玩家将归属新渠道代理，请确认后再提交
          </p>
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无下级成员查看权限" title="403" />
</template>
