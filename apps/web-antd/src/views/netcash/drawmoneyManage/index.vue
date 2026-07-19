<script lang="ts" setup>
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Result,
  Space,
  Tabs,
} from 'ant-design-vue';

import {
  deleteDrawmoneyAccountApi,
  fetchDrawingsChannelSettingListApi,
  fetchDrawmoneyBlacklistApi,
  fetchDrawmoneyListApi,
  orderOperateApi,
} from '#/api/netcash/drawmoney-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime, WITHDRAW_STATUS_MAP } from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'DrawmoneyManage' });

const { checkPermission } = useCloudPermission();

const canStartProcess = computed(() => checkPermission(10_162));
const canApproveDrawmoney = computed(() => checkPermission(12_743));
const canRejectDrawmoney = computed(() => checkPermission(12_745));
const canDeleteBlack = computed(() => checkPermission(10_167));

const gridRefs = ref<Array<InstanceType<typeof NetcashGridPanel>>>([]);

function reloadCurrentGrid() {
  gridRefs.value[0]?.reload();
}

function getRowAmount(row: Record<string, unknown>) {
  return row.ApplyAmount ?? row.Money ?? 0;
}

function canRowActOnDrawmoney(row: Record<string, unknown>) {
  return Number(row.Status) === 1;
}

function handleStartProcess(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认开始处理「${row.ApplyName || row.Username || ''}」的提款申请？`,
    onOk: async () => {
      await orderOperateApi({
        Desc: '',
        Id: row.Id,
        Money: getRowAmount(row),
        Status: 2,
      });
      message.success('操作成功');
      reloadCurrentGrid();
    },
    title: '开始处理',
  });
}

const remarkModalOpen = ref(false);
const remarkModalRow = ref<null | Record<string, unknown>>(null);
const remarkModalStatus = ref<3 | 4>(3);
const remarkValue = ref('');
const remarkSubmitting = ref(false);

const remarkModalTitle = computed(() =>
  remarkModalStatus.value === 3 ? '通过提款申请' : '拒绝提款申请',
);

function openRemarkModal(row: Record<string, unknown>, status: 3 | 4) {
  remarkModalRow.value = row;
  remarkModalStatus.value = status;
  remarkValue.value = '';
  remarkModalOpen.value = true;
}

async function submitRemarkModal() {
  if (!remarkModalRow.value) {
    return;
  }
  remarkSubmitting.value = true;
  try {
    await orderOperateApi({
      Desc: remarkValue.value,
      Id: remarkModalRow.value.Id,
      Money: getRowAmount(remarkModalRow.value),
      Status: remarkModalStatus.value,
    });
    message.success('操作成功');
    remarkModalOpen.value = false;
    reloadCurrentGrid();
  } finally {
    remarkSubmitting.value = false;
  }
}

function handleDeleteBlack(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除黑名单账号「${row.Username || ''}」？`,
    onOk: async () => {
      await deleteDrawmoneyAccountApi(row.Id as number | string);
      message.success('删除成功');
      reloadCurrentGrid();
    },
    title: '删除黑名单',
  });
}

const tabs = computed(() =>
  [
    {
      config: {
        actionWidth: 220,
        columns: [
          { field: 'ApplyName', title: '申请账号' },
          { field: 'Username', title: '代理账号' },
          {
            field: 'Money',
            formatter: (value, row) =>
              formatAmountFromCent(Number(row ? getRowAmount(row) : value)),
            title: '提款金额',
          },
          {
            field: 'Status',
            formatter: (value) =>
              WITHDRAW_STATUS_MAP[Number(value)] || String(value ?? '-'),
            title: '状态',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '申请时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchDrawmoneyListApi(query as never),
        filters: ['username', 'date', 'status'],
        showActions: true,
        statusOptions: Object.entries(WITHDRAW_STATUS_MAP).map(
          ([value, label]) => ({
            label,
            value: Number(value),
          }),
        ),
      } satisfies NetcashGridConfig,
      key: 'drawings',
      permission: 10_156,
      tab: '提款列表',
    },
    {
      config: {
        actionWidth: 100,
        columns: [
          { field: 'Username', title: '代理账号' },
          { field: 'Reason', title: '原因' },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '添加时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchDrawmoneyBlacklistApi(query as never),
        filters: ['username'],
        showActions: true,
      } satisfies NetcashGridConfig,
      key: 'blacklist',
      permission: 10_157,
      tab: '提款黑名单',
    },
    {
      config: {
        columns: [
          { field: 'WithdrawTypeName', title: '出款类型' },
          { field: 'IsOpen', title: '开关' },
          { field: 'LimitMoney', title: '限额' },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchDrawingsChannelSettingListApi(query as never),
        filters: [],
      } satisfies NetcashGridConfig,
      key: 'channel',
      permission: 11_696,
      tab: '提款通道',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('drawings');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'drawings';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 提款管理"
    title="提款管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <NetcashGridPanel
            v-if="activeTab === item.key"
            ref="gridRefs"
            :config="item.config"
          >
            <template v-if="item.key === 'drawings'" #actions="{ row }">
              <Space :size="0">
                <Button
                  v-if="
                    canStartProcess &&
                    Number(row.Status) === 1 &&
                    Number(row.Process) <= 4
                  "
                  size="small"
                  type="link"
                  @click="handleStartProcess(row)"
                >
                  开始处理
                </Button>
                <Button
                  v-if="
                    canApproveDrawmoney &&
                    canRowActOnDrawmoney(row) &&
                    [2, 3].includes(Number(row.Process))
                  "
                  size="small"
                  type="link"
                  @click="openRemarkModal(row, 3)"
                >
                  通过
                </Button>
                <Button
                  v-if="
                    canRejectDrawmoney &&
                    canRowActOnDrawmoney(row) &&
                    [2, 3].includes(Number(row.Process))
                  "
                  danger
                  size="small"
                  type="link"
                  @click="openRemarkModal(row, 4)"
                >
                  拒绝
                </Button>
              </Space>
            </template>
            <template v-else-if="item.key === 'blacklist'" #actions="{ row }">
              <Button
                v-if="canDeleteBlack"
                danger
                size="small"
                type="link"
                @click="handleDeleteBlack(row)"
              >
                删除
              </Button>
            </template>
          </NetcashGridPanel>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="remarkModalOpen"
      :confirm-loading="remarkSubmitting"
      :title="remarkModalTitle"
      @ok="submitRemarkModal"
    >
      <Input.TextArea
        v-model:value="remarkValue"
        placeholder="备注（选填）"
        :rows="4"
      />
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无提款管理查看权限" title="403" />
</template>
