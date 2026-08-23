<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  InputNumber,
  message,
  Modal,
  Radio,
  Result,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  drawmoneyRequest,
  fetchDrawingsChannelSettingListApi,
} from '#/api/netcash/drawmoney-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';

import { MULTIPLY_OPTIONS, PAY_TYPE_MAP, payTypeLabel } from '../shared';
import ThirdChannelModals from './third-channel-modals.vue';

defineOptions({ name: 'DrawmoneyChannelPanel' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(11_697));
const canViewAccounts = computed(
  () => checkPermission(12_727) && checkPermission(12_734),
);

const money = (v: unknown) => formatAmountFromCent(Number(v || 0));
const types = ref<Record<string, unknown>[]>([]);
const channelType = ref<number | string>('');
const formOpen = ref(false);
const form = reactive<Record<string, any>>({});
const thirdModalsRef = ref<InstanceType<typeof ThirdChannelModals>>();

async function loadTypes() {
  try {
    const result = await fetchDrawingsChannelSettingListApi();
    types.value = result.toSorted(
      (a, b) => Number(a.Sort || 0) - Number(b.Sort || 0),
    );
    if (!channelType.value) {
      channelType.value = String(types.value[0]?.WithdrawType || '');
    }
    if (canViewAccounts.value) channelGridApi.reload();
  } catch {
    types.value = [];
  }
}

function selectType(item: Record<string, unknown>) {
  channelType.value = item.WithdrawType as string;
  channelGridApi.reload();
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    {
      field: 'Switch',
      slots: { default: 'switch' },
      title: '启用',
      width: 80,
    },
    {
      field: 'ScriptStatus',
      formatter: ({ row }) =>
        Number(row.HandleType) === 2
          ? (row.ScriptStatus
            ? '在线'
            : '离线')
          : '--',
      minWidth: 100,
      title: '脚本状态',
    },
    {
      field: 'ScriptMode',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '自动' : '手动'),
      minWidth: 100,
      title: '脚本模式',
    },
    {
      field: 'Switch',
      formatter: ({ row }) =>
        Number(row.HandleType) === 1
          ? (Number(row.Switch) === 1
            ? '生效'
            : '未生效')
          : (Number(row.Switch) === 1 &&
              Number(row.Money) !== 0 &&
              row.ScriptStatus
            ? '生效'
            : '未生效'),
      minWidth: 100,
      title: '通道状态',
    },
    {
      field: 'AccountType',
      formatter: ({ cellValue }) => payTypeLabel(cellValue),
      minWidth: 110,
      title: '通道类型',
    },
    {
      field: 'HandleType',
      formatter: ({ row }) =>
        Number(row.ThirdWithdrawId) === 0
          ? (Number(row.HandleType) === 1
            ? '签约账户'
            : '普通用户')
          : '第三方账户',
      minWidth: 100,
      title: '账号类型',
    },
    {
      field: 'AccountNum',
      formatter: ({ row }) =>
        String(row.ThirdWithdrawId ? row.ShowName : row.AccountNum ?? ''),
      minWidth: 150,
      title: '出款账号',
    },
    { field: 'RealName', minWidth: 120, title: '名称' },
    {
      field: 'AisleBalance',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 110,
      title: '通道余额',
    },
    {
      field: 'Money',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 120,
      title: '今日出款上限',
    },
    { field: 'PerMulti', minWidth: 110, title: '单次提款倍数' },
    { field: 'Rate', minWidth: 90, title: '费率' },
    {
      field: 'MinOrderMoney',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 100,
      title: '单笔下限',
    },
    {
      field: 'MaxOrderMoney',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 100,
      title: '单笔上限',
    },
    { field: 'SupportBank', minWidth: 120, title: '支持银行' },
    { field: 'Round', minWidth: 80, title: '权重' },
    { field: 'Description', minWidth: 160, title: '说明' },
    { field: 'DailyAccTimes', minWidth: 120, title: '日累计调用次数' },
    {
      field: 'DailyAccAmount',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 130,
      title: '日累计出款金额',
    },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 230,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await drawmoneyRequest.channelAccounts({
            AccountType: channelType.value,
            Page: page.currentPage,
            PageSize: page.pageSize,
          });
          const items = result.Items || [];
          const statuses = items.length > 0
            ? await drawmoneyRequest.channelStatus(
                items.map((x) => x.Id).join(','),
              )
            : [];
          statuses.forEach((status) => {
            const row = items.find((x) => String(x.Id) === String(status.Id));
            if (row) row.ScriptStatus = status.Status;
          });
          return {
            items,
            total: Number(result.Pagination?.MaxCount || 0),
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [ChannelGrid, channelGridApi] = useVbenVxeGrid({ gridOptions });

async function toggleChannel(row: Record<string, unknown>, checked: boolean) {
  try {
    await drawmoneyRequest.channelSwitch({
      Id: row.Id,
      Switch: checked ? 1 : 2,
    });
    message.success('切换成功');
    channelGridApi.reload();
  } catch {
    /* */
  }
}

function editChannel(row: Record<string, unknown>) {
  Object.assign(form, row, {
    MaxOrderMoney: Number(row.MaxOrderMoney || 0) / 100,
    MinOrderMoney: Number(row.MinOrderMoney || 0) / 100,
    Money:
      Number(row.Money || 0) === 99_999_999_999
        ? undefined
        : Number(row.Money || 0) / 100,
    kind: 'account',
  });
  formOpen.value = true;
}

async function saveChannel() {
  try {
    if (checkPermission(12_738)) {
      await drawmoneyRequest.channelLimit({
        Id: form.Id,
        Money:
          form.Money === undefined
            ? 99_999_999_999
            : Number(form.Money || 0) * 100,
      });
    }
    if (checkPermission(12_737)) {
      await drawmoneyRequest.channelRound({
        Id: form.Id,
        Round: form.Round,
        ScriptMode: form.ScriptMode,
      });
    }
    formOpen.value = false;
    message.success('保存成功');
    channelGridApi.reload();
  } catch {
    /* */
  }
}

async function toggleType(item: Record<string, unknown>, checked: boolean) {
  try {
    await drawmoneyRequest.typeSwitch({
      Id: item.Id,
      IsOpen: checked,
      WithdrawType: item.WithdrawType,
    });
    message.success('切换成功');
    await loadTypes();
  } catch {
    /* */
  }
}

async function moveType(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= types.value.length) return;
  const copy = [...types.value];
  [copy[index], copy[target]] = [copy[target]!, copy[index]!];
  types.value = copy;
  try {
    await drawmoneyRequest.exchangeTypes({
      Ids: copy.map((x) => x.Id).join(','),
    });
    message.success('排序已保存');
    await loadTypes();
  } catch {
    await loadTypes();
  }
}

function editType(item: Record<string, unknown>) {
  Object.assign(form, item, {
    DailyWithdrawLimit: Number(item.DailyWithdrawLimit || 0) / 100,
    kind: 'type',
  });
  formOpen.value = true;
}

async function saveChannelForm() {
  if (form.kind === 'type') {
    if (
      Number(form.WithdrawMin) <= 0 ||
      Number(form.WithdrawMax) < Number(form.WithdrawMin)
    ) {
      message.warning('请填写正确的提款范围');
      return;
    }
    try {
      await drawmoneyRequest.typeLimit({
        ...form,
        DailyWithdrawLimit: Number(form.DailyWithdrawLimit || 0) * 100,
      });
      formOpen.value = false;
      message.success('保存成功');
      await loadTypes();
    } catch {
      /* */
    }
    return;
  }
  await saveChannel();
}

async function refreshBalance(row: Record<string, unknown>) {
  try {
    await drawmoneyRequest.updateBalance({ Ids: row.Id });
    message.success('余额已刷新');
    channelGridApi.reload();
  } catch {
    /* */
  }
}

async function offShelf(row: Record<string, unknown>) {
  if (!row.ThirdWithdrawId) return;
  try {
    await drawmoneyRequest.channelShelf({
      Id: row.ThirdWithdrawId,
      OnShelf: 2,
    });
    message.success('已下架');
    channelGridApi.reload();
  } catch {
    /* */
  }
}

function onThirdSaved(fromStrategy: boolean) {
  if (fromStrategy) channelGridApi.reload();
}

onMounted(() => {
  if (canView.value) loadTypes();
});
</script>

<template>
  <Result
    v-if="!canView"
    status="403"
    sub-title="无提款通道管理查看权限"
    title="403"
  />
  <div v-else>
    <div class="ops-query-scope mb-4">
      <div class="ops-summary-cards">
        <Card
          v-for="(item, index) in types"
          :key="String(item.Id)"
          size="small"
          hoverable
          class="cursor-pointer"
          :class="{
            'border-primary': String(channelType) === String(item.WithdrawType),
          }"
          @click="selectType(item)"
        >
          <Space direction="vertical">
            <Space>
              <b>
                {{
                  PAY_TYPE_MAP[Number(item.WithdrawType)] ||
                  item.I18nKey ||
                  item.WithdrawType
                }}
              </b>
              <Switch
                :checked="Number(item.IsOpen) === 1"
                :disabled="!checkPermission(11698)"
                @click.stop
                @change="(v) => toggleType(item, !!v)"
              />
              <Button
                v-if="checkPermission(12105)"
                type="link"
                size="small"
                @click.stop="editType(item)"
              >
                编辑
              </Button>
            </Space>
            <span>手续费率 {{ item.ServiceRate || 0 }}%</span>
            <span>
              提款范围 {{ item.WithdrawMin || 0 }} - {{ item.WithdrawMax || 0 }}
            </span>
            <Space>
              <Button
                size="small"
                :disabled="index === 0"
                @click.stop="moveType(index, -1)"
              >
                上移
              </Button>
              <Button
                size="small"
                :disabled="index === types.length - 1"
                @click.stop="moveType(index, 1)"
              >
                下移
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    </div>

    <ChannelGrid v-if="canViewAccounts">
      <template #switch="{ row }">
        <Switch
          :checked="Number(row.Switch) === 1"
          :disabled="!checkPermission(12736)"
          @change="(v) => toggleChannel(row, !!v)"
        />
      </template>
      <template #actions="{ row }">
        <Button
          v-if="
            (checkPermission(12738) || checkPermission(12737)) &&
            Number(row.Switch) === 2
          "
          type="link"
          @click="editChannel(row)"
        >
          策略设置
        </Button>
        <Button
          v-if="
            checkPermission(12735) &&
            Number(row.Switch) === 2 &&
            row.ThirdWithdrawId
          "
          type="link"
          @click="thirdModalsRef?.openEdit(row)"
        >
          通道设置
        </Button>
        <Button type="link" @click="refreshBalance(row)">刷新余额</Button>
        <Button
          v-if="checkPermission(12739) && row.ThirdWithdrawId"
          danger
          type="link"
          @click="offShelf(row)"
        >
          下架
        </Button>
      </template>
    </ChannelGrid>

    <Modal
      v-model:open="formOpen"
      :title="form.kind === 'type' ? '编辑出款类型' : '通道策略设置'"
      @ok="saveChannelForm"
    >
      <Form layout="vertical">
        <template v-if="form.kind === 'type'">
          <Form.Item label="最小提款金额">
            <InputNumber
              v-model:value="form.WithdrawMin"
              class="w-full"
              :min="1"
            />
          </Form.Item>
          <Form.Item label="最大提款金额">
            <InputNumber
              v-model:value="form.WithdrawMax"
              class="w-full"
              :min="1"
            />
          </Form.Item>
          <Form.Item label="手续费率">
            <InputNumber
              v-model:value="form.ServiceRate"
              class="w-full"
              :min="0"
              addon-after="%"
            />
          </Form.Item>
          <Form.Item label="每日提款限额">
            <InputNumber
              v-model:value="form.DailyWithdrawLimit"
              class="w-full"
              :min="0"
            />
          </Form.Item>
          <Form.Item label="单次提款倍数">
            <Select v-model:value="form.PerMulti" :options="MULTIPLY_OPTIONS" />
          </Form.Item>
        </template>
        <template v-else>
          <Form.Item v-if="checkPermission(12738)" label="今日出款金额上限">
            <InputNumber
              v-model:value="form.Money"
              class="w-full"
              placeholder="留空表示不限制"
            />
          </Form.Item>
          <Form.Item v-if="checkPermission(12737)" label="权重">
            <InputNumber
              v-model:value="form.Round"
              class="w-full"
              :max="100"
              :min="1"
            />
          </Form.Item>
          <Form.Item v-if="checkPermission(12737)" label="脚本模式">
            <Radio.Group v-model:value="form.ScriptMode">
              <Radio :value="1">自动</Radio>
              <Radio :value="2">手动</Radio>
            </Radio.Group>
          </Form.Item>
        </template>
      </Form>
    </Modal>

    <ThirdChannelModals ref="thirdModalsRef" @saved="onThirdSaved" />
  </div>
</template>
