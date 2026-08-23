<script lang="ts" setup>
import type { CloudWsStatus } from '#/utils/ws';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { fetchEndReasonSimpleListApi } from '#/api/serviceManage';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { getCloudToken } from '#/utils/auth-token';
import { CloudWebSocket, getServiceWsUrl } from '#/utils/ws';
import { ServiceMessageType } from '#/utils/ws/service-message-type';

defineOptions({ name: 'ServiceWorkbenchPanel' });

interface ServicePlayer {
  [key: string]: unknown;
  ClientId: string;
  HubName?: string;
  LoginAccount: string;
  OrderId?: string;
  Receive?: string;
  ServiceId?: number | string;
  VipLevel?: number | string;
}

interface ChatMessage {
  ack: number;
  content: string;
  from: string;
  key: string;
  orderId?: string;
  sendTime: number | string;
  type: number;
}

interface ServiceAgent {
  ClientId: string;
  NickName: string;
}

interface PlayerBucket {
  Offline: ServicePlayer[];
  Online: ServicePlayer[];
  Queue: ServicePlayer[];
  UnSelect: ServicePlayer[];
  Unset: ServicePlayer[];
}

interface LogItem {
  at: string;
  text: string;
}

interface EndReasonOption {
  label: string;
  value: number;
}

type BucketKey = keyof PlayerBucket;

const userStore = useUserStore();
const baseUrl = getServiceWsUrl();
const wsReady = computed(() => Boolean(baseUrl));

const status = ref<CloudWsStatus>('closed');
const activeBucket = ref<BucketKey>('Online');
const selectedPlayer = ref<null | ServicePlayer>(null);
const chatMessages = ref<ChatMessage[]>([]);
const chatLoading = ref(false);
const draftText = ref('');
const maxAllowOnline = ref(0);
const selfClientId = ref('');
const busy = ref(false);
const latencyMs = ref(0);
const endReasonId = ref<number>();
const endReasonOptions = ref<EndReasonOption[]>([]);
const transferOpen = ref(false);
const transferLoading = ref(false);
const transferList = ref<ServiceAgent[]>([]);
const transferTargetId = ref('');
const logs = ref<LogItem[]>([]);
const buckets = ref<PlayerBucket>({
  Offline: [],
  Online: [],
  Queue: [],
  UnSelect: [],
  Unset: [],
});

let client: CloudWebSocket | null = null;
let heartTimer: null | ReturnType<typeof setInterval> = null;

const canSend = computed(
  () => status.value === 'open' && Boolean(selectedPlayer.value?.ClientId),
);

const canOperate = computed(
  () => status.value === 'open' && Boolean(selectedPlayer.value?.ClientId),
);

const statusColor = computed(() => {
  if (status.value === 'open') {
    return 'success';
  }
  if (status.value === 'connecting' || status.value === 'reconnecting') {
    return 'processing';
  }
  return 'default';
});

const currentList = computed(() => buckets.value[activeBucket.value] || []);

const adminName = computed(
  () => userStore.userInfo?.realName || userStore.userInfo?.username || '客服',
);

const columns = [
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '账号' },
  { dataIndex: 'VipLevel', key: 'VipLevel', title: 'VIP', width: 70 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号' },
  { dataIndex: 'ClientId', key: 'ClientId', title: 'ClientId' },
];

function pushLog(text: string) {
  const at = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  logs.value = [{ at, text }, ...logs.value].slice(0, 40);
}

function normalizePlayers(list: unknown): ServicePlayer[] {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.map((item) => {
    const row = (item || {}) as Record<string, unknown>;
    const clientId = String(row.ClientId || row.Receive || '');
    return {
      ...row,
      ClientId: clientId,
      HubName: row.HubName ? String(row.HubName) : '',
      LoginAccount: String(row.LoginAccount || row.NickName || '-'),
      OrderId: row.OrderId ? String(row.OrderId) : '',
      Receive: String(row.Receive || clientId),
      ServiceId: (row.ServiceId as number | string) ?? '',
      VipLevel: (row.VipLevel as number | string) ?? '-',
    };
  });
}

function formatChatTime(value: number | string) {
  const num = Number(value);
  if (!num) {
    return '-';
  }
  const ms = String(value).length > 10 ? num : num * 1000;
  return new Date(ms).toLocaleString('zh-CN', { hour12: false });
}

function decodeContent(raw: unknown) {
  const text = String(raw ?? '');
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function formatMessageContent(type: number, raw: unknown) {
  const decoded = decodeContent(raw);
  if (type === ServiceMessageType.MESSAGE_IMAGE) {
    return `[图片] ${decoded}`;
  }
  if (type === ServiceMessageType.MESSAGE_VIDEO) {
    return `[视频] ${decoded}`;
  }
  if (type === ServiceMessageType.MESSAGE_AUDIO) {
    return `[语音] ${decoded}`;
  }
  return decoded;
}

function mapChatList(list: unknown[], targetId: string) {
  return list
    .map((item, index) => {
      const row = (item || {}) as Record<string, unknown>;
      const type = Number(
        row.MessageType ?? row.messageType ?? ServiceMessageType.MESSAGE_TEXT,
      );
      const content = formatMessageContent(type, row.Content);
      return {
        ack: Number(row.Ack || 0),
        content,
        from: String(row.From || row.ClientId || '-'),
        key: `${targetId}-${row.Ack || index}-${row.Date || index}`,
        orderId: row.OrderId ? String(row.OrderId) : '',
        sendTime: (row.Date as number | string) || 0,
        type,
      } satisfies ChatMessage;
    })
    .toSorted((a, b) => Number(a.sendTime) - Number(b.sendTime) || a.ack - b.ack);
}

function clearHeart() {
  if (heartTimer) {
    clearInterval(heartTimer);
    heartTimer = null;
  }
}

function startHeart() {
  clearHeart();
  heartTimer = setInterval(() => {
    client?.send(
      JSON.stringify({ MessageType: ServiceMessageType.HEART_BEAT }),
    );
  }, ServiceMessageType.HEART_BEAT_TIME);
}

function applyPlayerList(msg: Record<string, unknown>) {
  buckets.value = {
    Offline: normalizePlayers(msg.Offline),
    Online: normalizePlayers(msg.Online),
    Queue: normalizePlayers(msg.Queue),
    UnSelect: normalizePlayers(msg.UnSelect),
    Unset: normalizePlayers(msg.Unset),
  };
  if (selectedPlayer.value) {
    selectedPlayer.value =
      Object.values(buckets.value)
        .flat()
        .find((item) => item.ClientId === selectedPlayer.value?.ClientId) ||
      null;
  }
}

function requestChatRecord(targetId: string, ack: number) {
  const size = Math.min(Math.max(ack, 1), ServiceMessageType.CHAT_MAX_SIZE);
  chatLoading.value = true;
  client?.send(
    JSON.stringify({
      Ack: ack || ServiceMessageType.CHAT_MAX_SIZE,
      HistoryLog: 0,
      MessageType: ServiceMessageType.GET_CHAT_RECORD,
      Size: size,
      TargetId: targetId,
    }),
  );
  pushLog(`拉取聊天记录 TargetId=${targetId} Ack=${ack}`);
}

function selectPlayer(row: ServicePlayer) {
  if (!row.ClientId) {
    return;
  }
  selectedPlayer.value = row;
  chatMessages.value = [];
  draftText.value = '';
  const ok = client?.send(
    JSON.stringify({
      MessageType: ServiceMessageType.SWITCH_CHATTING,
      TargetId: row.ClientId,
    }),
  );
  pushLog(
    ok
      ? `切换会话：${row.LoginAccount} (${row.ClientId})`
      : `切换失败（未连接）：${row.LoginAccount}`,
  );
}

function sendTextMessage() {
  const player = selectedPlayer.value;
  const content = draftText.value.trim();
  if (!player?.ClientId || !content) {
    return;
  }
  const sendTo = player.Receive || player.ClientId;
  const ok = client?.send(
    JSON.stringify({
      Content: content,
      MessageType: ServiceMessageType.MESSAGE_TEXT,
      SendToClient: sendTo,
    }),
  );
  if (!ok) {
    message.warning('发送失败（未连接）');
    return;
  }
  chatMessages.value = [
    ...chatMessages.value,
    {
      ack: 0,
      content,
      from: '我',
      key: `local-${Date.now()}-${chatMessages.value.length}`,
      orderId: player.OrderId,
      sendTime: Date.now() / 1000,
      type: ServiceMessageType.MESSAGE_TEXT,
    },
  ];
  draftText.value = '';
  pushLog(`发送：${content.slice(0, 40)}`);
}

function toggleBusy(checked: boolean | number | string) {
  const next = Boolean(checked);
  const ok = client?.send(
    JSON.stringify({
      Busy: next,
      MessageType: ServiceMessageType.CUSTOMER_SWITCH_BUSY_IDLE,
    }),
  );
  if (!ok) {
    message.warning('未连接');
    return;
  }
  busy.value = next;
  pushLog(next ? '已切换为忙碌' : '已切换为空闲');
}

function receiveFromQueue(row: ServicePlayer) {
  const ok = client?.send(
    JSON.stringify({
      MessageType: ServiceMessageType.CUSTOMER_RECEIVE_USER,
      TargetId: row.ClientId,
    }),
  );
  pushLog(
    ok
      ? `强制接单：${row.LoginAccount}`
      : `接单失败（未连接）：${row.LoginAccount}`,
  );
}

function closeSession() {
  const player = selectedPlayer.value;
  if (!player?.ClientId) {
    message.warning('请先选择会话');
    return;
  }
  if (endReasonId.value === undefined || endReasonId.value === null) {
    message.warning('请选择结束原因');
    return;
  }
  const endReason = `,${endReasonId.value},`;
  const isUnset = activeBucket.value === 'Unset';
  const ok = client?.send(
    JSON.stringify({
      EndReason: endReason,
      MessageType: isUnset
        ? ServiceMessageType.DEL_OFFLINE_USER
        : ServiceMessageType.FORCE_CLOSE,
      OrderId: player.OrderId || '',
      TargetId: player.Receive || player.ClientId,
    }),
  );
  if (!ok) {
    message.warning('未连接');
    return;
  }
  pushLog(`结束会话：${player.LoginAccount} reason=${endReason}`);
  message.success('已发送结束请求');
  selectedPlayer.value = null;
  chatMessages.value = [];
  draftText.value = '';
}

function openTransfer() {
  const player = selectedPlayer.value;
  if (!player?.ClientId) {
    message.warning('请先选择会话');
    return;
  }
  transferTargetId.value = '';
  transferList.value = [];
  transferLoading.value = true;
  transferOpen.value = true;
  const ok = client?.send(
    JSON.stringify({
      MessageType: ServiceMessageType.ALL_SERVICE_LIST,
    }),
  );
  if (ok) {
    pushLog('请求转单客服列表');
  } else {
    transferLoading.value = false;
    transferOpen.value = false;
    message.warning('未连接，无法获取客服列表');
  }
}

function handleServiceList(msg: Record<string, unknown>) {
  transferLoading.value = false;
  const services = Array.isArray(msg.Service) ? msg.Service : null;
  if (!services) {
    message.error('无法获取客服列表');
    transferOpen.value = false;
    return;
  }
  const filter = new Set<string>();
  if (selfClientId.value) {
    filter.add(selfClientId.value);
  }
  transferList.value = services
    .map((item) => {
      const row = (item || {}) as Record<string, unknown>;
      return {
        ClientId: String(row.ClientId || ''),
        NickName: String(row.NickName || row.ClientId || '-'),
      };
    })
    .filter((item) => item.ClientId && !filter.has(item.ClientId));
}

function confirmTransfer() {
  const player = selectedPlayer.value;
  const target = transferTargetId.value;
  if (!player?.ClientId || !target) {
    message.warning('请选择转接客服');
    return;
  }
  const ok = client?.send(
    JSON.stringify({
      AdminName: adminName.value,
      MessageType: ServiceMessageType.TRANSFER_TO_ASK,
      PlayerId: player.Receive || player.ClientId,
      PlayerName: player.LoginAccount,
      TransferTo: target,
    }),
  );
  if (!ok) {
    message.warning('发送转接请求失败');
    return;
  }
  transferOpen.value = false;
  pushLog(`转接询问：→ ${target}`);
  message.info('已发送转接询问，等待对方确认');
}

function handleTransferAsk(msg: Record<string, unknown>) {
  const transferTo = String(msg.TransferTo || '');
  if (transferTo && transferTo === selfClientId.value) {
    Modal.confirm({
      cancelText: '拒绝',
      content: `${msg.AdminName || '客服'}想将会员(${msg.PlayerName || ''})转接给您，是否同意？`,
      okText: '同意',
      onCancel: () => {
        client?.send(JSON.stringify({ ...msg, Agree: false }));
      },
      onOk: () => {
        client?.send(JSON.stringify({ ...msg, Agree: true }));
      },
      title: '转接询问',
    });
    return;
  }
  if (!msg.Agree) {
    const name =
      transferList.value.find((item) => item.ClientId === transferTo)
        ?.NickName || transferTo;
    message.warning(`${name} 不同意转接`);
    return;
  }
  client?.send(
    JSON.stringify({
      MessageType: ServiceMessageType.TRANSFER_TO,
      PlayerId: msg.PlayerId,
      TransferTo: transferTo,
    }),
  );
  pushLog(`对方同意，执行转接 → ${transferTo}`);
}

function handleTransferSuccess(msg: Record<string, unknown>) {
  const playerId = String(msg.PlayerId || '');
  message.success('转接成功');
  pushLog(`转接成功 PlayerId=${playerId}`);
  if (
    selectedPlayer.value &&
    (selectedPlayer.value.ClientId === playerId ||
      selectedPlayer.value.Receive === playerId)
  ) {
    selectedPlayer.value = null;
    chatMessages.value = [];
    draftText.value = '';
  }
  client?.send(
    JSON.stringify({ MessageType: ServiceMessageType.GET_PLAYER_LIST }),
  );
}

function handleSwitchAck(msg: Record<string, unknown>) {
  const targetId = String(msg.TargetId || selectedPlayer.value?.ClientId || '');
  if (!targetId || selectedPlayer.value?.ClientId !== targetId) {
    return;
  }
  requestChatRecord(targetId, Number(msg.Ack || 0));
}

function handleChatRecord(msg: Record<string, unknown>) {
  const targetId = String(msg.TargetId || '');
  if (
    selectedPlayer.value?.ClientId &&
    targetId &&
    selectedPlayer.value.ClientId !== targetId
  ) {
    return;
  }
  const list = Array.isArray(msg.List) ? msg.List : [];
  chatMessages.value = mapChatList(
    list,
    targetId || selectedPlayer.value?.ClientId || 'chat',
  );
  chatLoading.value = false;
  pushLog(`聊天记录 ${chatMessages.value.length} 条`);
}

function handleLiveMessage(msg: Record<string, unknown>) {
  const clientId = String(msg.ClientId || '');
  const sendTo = String(msg.SendToClient || '');
  const selected = selectedPlayer.value?.ClientId;
  if (!selected || (clientId !== selected && sendTo !== selected)) {
    return;
  }
  chatMessages.value = [
    ...chatMessages.value,
    {
      ack: Number(msg.Ack || 0),
      content: decodeContent(msg.Content),
      from: clientId || sendTo,
      key: `live-${msg.Ack || Date.now()}-${chatMessages.value.length}`,
      orderId: msg.OrderId ? String(msg.OrderId) : '',
      sendTime: (msg.SendTime as number | string) || Date.now() / 1000,
      type: Number(msg.MessageType),
    },
  ];
}

function handleMessage(raw: ArrayBuffer | string) {
  if (typeof raw !== 'string') {
    pushLog('收到二进制帧（工作台薄切片忽略 Protobuf）');
    return;
  }
  try {
    const parsed = JSON.parse(raw) as
      | Record<string, unknown>
      | Record<string, unknown>[];
    const list = Array.isArray(parsed) ? parsed : [parsed];
    for (const msg of list) {
      const type = Number(msg.MessageType);
      if (type === ServiceMessageType.HEART_BEAT) {
        continue;
      }
      if (type === ServiceMessageType.SERVER_INIT_DONE) {
        maxAllowOnline.value = Number(msg.MaxAllow || 0);
        selfClientId.value = String(msg.SendToClient || '');
        if (msg.BusyState !== undefined) {
          busy.value = Boolean(msg.BusyState);
        }
        pushLog(`SERVER_INIT_DONE self=${selfClientId.value || '-'}`);
        client?.send(
          JSON.stringify({
            MessageType: ServiceMessageType.CLIENT_SPEED_TEST,
            SendTime: Date.now(),
          }),
        );
        client?.send(
          JSON.stringify({
            MessageType: ServiceMessageType.GET_PLAYER_LIST,
          }),
        );
        continue;
      }
      if (type === ServiceMessageType.CLIENT_SPEED_TEST) {
        latencyMs.value = Date.now() - Number(msg.SendTime || Date.now());
        continue;
      }
      if (type === ServiceMessageType.DUPLICATE_LOGIN) {
        message.error('账号异地登录，连接已断开');
        pushLog('异地登录，断开连接');
        disconnect();
        continue;
      }
      if (
        type === ServiceMessageType.GET_PLAYER_LIST ||
        type === ServiceMessageType.REFRESH_PLAYER_LIST
      ) {
        applyPlayerList(msg);
        pushLog(
          `玩家列表 Online=${buckets.value.Online.length} Queue=${buckets.value.Queue.length}`,
        );
        continue;
      }
      if (type === ServiceMessageType.SWITCH_CHATTING) {
        handleSwitchAck(msg);
        continue;
      }
      if (type === ServiceMessageType.GET_CHAT_RECORD) {
        handleChatRecord(msg);
        continue;
      }
      if (type === ServiceMessageType.CUSTOMER_SWITCH_BUSY_IDLE) {
        if (msg.Busy !== undefined) {
          busy.value = Boolean(msg.Busy);
        }
        continue;
      }
      if (type === ServiceMessageType.ALL_SERVICE_LIST) {
        handleServiceList(msg);
        continue;
      }
      if (type === ServiceMessageType.TRANSFER_TO_ASK) {
        handleTransferAsk(msg);
        continue;
      }
      if (type === ServiceMessageType.TRANSFER_TO_SUCCESS) {
        handleTransferSuccess(msg);
        continue;
      }
      if (type === ServiceMessageType.TRANSFER_TO_FAIL) {
        message.error('玩家转接失败');
        continue;
      }
      if (type === ServiceMessageType.TRANSFER_TO_FAIL_CUSTOMER_BUSY) {
        message.error('客服正忙，无法转接给该客服');
        continue;
      }
      if (type === ServiceMessageType.PICK_PLAYER_FAIL_404) {
        message.error('从排队队列中找不到该用户');
        continue;
      }
      if (
        type === ServiceMessageType.MESSAGE_TEXT ||
        type === ServiceMessageType.MESSAGE_IMAGE ||
        type === ServiceMessageType.MESSAGE_AUDIO ||
        type === ServiceMessageType.MESSAGE_VIDEO
      ) {
        handleLiveMessage(msg);
        continue;
      }
      pushLog(`MessageType=${type}`);
    }
  } catch {
    pushLog('消息解析失败');
  }
}

function buildUrl() {
  const token = getCloudToken() || '';
  if (!baseUrl) {
    return '';
  }
  const join = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${join}token=${encodeURIComponent(token)}&aiBanTalk=0`;
}

function connect() {
  if (!wsReady.value) {
    message.warning('未配置 VITE_WBSOCKT_URL');
    return;
  }
  const url = buildUrl();
  if (!url) {
    return;
  }
  disconnect();
  client = new CloudWebSocket(url, {
    autoReconnect: true,
    decrypt: false,
    onClose: () => {
      clearHeart();
      pushLog('连接关闭');
    },
    onError: () => {
      pushLog('连接错误');
    },
    onMessage: handleMessage,
    onOpen: () => {
      pushLog('连接成功，等待 SERVER_INIT_DONE');
      startHeart();
    },
    onStatusChange: (next) => {
      status.value = next;
    },
  });
  pushLog(`连接 ${baseUrl}`);
  client.connect();
}

function disconnect() {
  clearHeart();
  client?.close();
  client = null;
  status.value = 'closed';
  selectedPlayer.value = null;
  chatMessages.value = [];
  chatLoading.value = false;
  draftText.value = '';
  selfClientId.value = '';
  transferOpen.value = false;
  transferList.value = [];
  transferTargetId.value = '';
  transferLoading.value = false;
}

async function loadEndReasons() {
  try {
    const result = await fetchEndReasonSimpleListApi();
    const items = (result.Items || []) as Array<{
      Id?: number;
      Sort?: number;
      Title?: string;
    }>;
    endReasonOptions.value = [...items]
      .toSorted((a, b) => Number(a.Sort || 0) - Number(b.Sort || 0))
      .map((item) => ({
        label: String(item.Title || item.Id || '-'),
        value: Number(item.Id),
      }))
      .filter((item) => item.value > 0);
  } catch {
    endReasonOptions.value = [];
  }
}

onMounted(() => {
  void loadEndReasons();
  pushLog(
    wsReady.value
      ? '已就绪，点击「连接」接入客服工作台 WS'
      : '缺少 VITE_WBSOCKT_URL',
  );
});

onBeforeUnmount(() => {
  disconnect();
});
</script>

<template>
  <div class="space-y-4">
    <div class="text-xs text-gray-400">
      客服工作台薄切片：连接 / 列表 / 聊天 / 发文本 / 忙碌 / 接单 / 转单 /
      结束会话。图片消息与 Protobuf 仍待专项。
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Tag :color="wsReady ? 'success' : 'warning'">
        {{ wsReady ? '已配置客服 WS' : '未配置 VITE_WBSOCKT_URL' }}
      </Tag>
      <Tag :color="statusColor">状态：{{ status }}</Tag>
      <Tag v-if="latencyMs" color="blue">延时 {{ latencyMs }}ms</Tag>
      <span v-if="baseUrl" class="text-xs text-gray-500">{{ baseUrl }}</span>
      <Space>
        <Button
          type="primary"
          :disabled="!wsReady || status === 'open' || status === 'connecting'"
          @click="connect"
        >
          连接
        </Button>
        <Button :disabled="status === 'closed'" @click="disconnect">
          断开
        </Button>
        <span class="text-xs text-gray-500">忙碌</span>
        <Switch
          :checked="busy"
          :disabled="status !== 'open'"
          @change="toggleBusy"
        />
      </Space>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Card size="small">
        <div class="text-xs text-gray-400">进线中</div>
        <div class="text-xl font-medium">{{ buckets.Online.length }}</div>
      </Card>
      <Card size="small">
        <div class="text-xs text-gray-400">排队</div>
        <div class="text-xl font-medium">{{ buckets.Queue.length }}</div>
      </Card>
      <Card size="small">
        <div class="text-xs text-gray-400">待选择</div>
        <div class="text-xl font-medium">{{ buckets.UnSelect.length }}</div>
      </Card>
      <Card size="small">
        <div class="text-xs text-gray-400">待设置</div>
        <div class="text-xl font-medium">{{ buckets.Unset.length }}</div>
      </Card>
      <Card size="small">
        <div class="text-xs text-gray-400">离线 / 上限</div>
        <div class="text-xl font-medium">
          {{ buckets.Offline.length }}
          <span v-if="maxAllowOnline" class="text-sm text-gray-400">
            / {{ maxAllowOnline }}
          </span>
        </div>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-1" size="small" title="会话列表">
        <Tabs v-model:active-key="activeBucket" type="line" size="small">
          <Tabs.TabPane key="Online" :tab="`进线(${buckets.Online.length})`" />
          <Tabs.TabPane key="Queue" :tab="`排队(${buckets.Queue.length})`" />
          <Tabs.TabPane
            key="UnSelect"
            :tab="`待选(${buckets.UnSelect.length})`"
          />
          <Tabs.TabPane key="Unset" :tab="`待设(${buckets.Unset.length})`" />
          <Tabs.TabPane
            key="Offline"
            :tab="`离线(${buckets.Offline.length})`"
          />
        </Tabs>
        <Table
          size="small"
          :columns="columns"
          :data-source="currentList"
          :pagination="{ pageSize: 8 }"
          :row-key="
            (row: ServicePlayer) =>
              row.ClientId || row.OrderId || row.LoginAccount
          "
          :custom-row="
            (row: ServicePlayer) => ({
              class:
                selectedPlayer?.ClientId === row.ClientId
                  ? 'cursor-pointer bg-blue-50'
                  : 'cursor-pointer',
              onClick: () => selectPlayer(row),
            })
          "
        >
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key === 'LoginAccount'">
              <PlayerAccountLink
                :login-account="String(record.LoginAccount || '')"
                :player-id="record.Receive"
              />
            </template>
            <template v-else>{{ text }}</template>
          </template>
        </Table>
      </Card>

      <Card class="lg:col-span-2" size="small" title="会话详情 / 聊天">
        <div v-if="selectedPlayer" class="mb-3 space-y-2 text-sm text-gray-700">
          <div>
            账号：{{ selectedPlayer.LoginAccount }} ｜ VIP：{{
              selectedPlayer.VipLevel
            }}
          </div>
          <div>
            订单：{{ selectedPlayer.OrderId || '-' }} ｜ ClientId：{{
              selectedPlayer.ClientId
            }}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              v-if="activeBucket === 'Queue'"
              size="small"
              type="primary"
              :disabled="status !== 'open'"
              @click="receiveFromQueue(selectedPlayer)"
            >
              强制接单
            </Button>
            <Select
              v-model:value="endReasonId"
              allow-clear
              class="min-w-40"
              :options="endReasonOptions"
              size="small"
              placeholder="请选择结束原因"
            />
            <Button
              size="small"
              danger
              :disabled="!canOperate"
              @click="closeSession"
            >
              结束会话
            </Button>
            <Button size="small" :disabled="!canOperate" @click="openTransfer">
              转单
            </Button>
          </div>
        </div>
        <div v-else class="mb-3 text-xs text-gray-400">
          点击左侧列表选择会话
        </div>

        <div
          v-if="chatLoading"
          class="mb-3 rounded border border-dashed px-3 py-6 text-center text-xs text-gray-400"
        >
          正在拉取聊天记录...
        </div>
        <div
          v-else-if="chatMessages.length > 0"
          class="mb-3 max-h-80 space-y-2 overflow-auto rounded border p-3"
        >
          <div
            v-for="item in chatMessages"
            :key="item.key"
            class="rounded bg-gray-50 px-2 py-1 text-xs"
          >
            <div class="mb-1 text-gray-400">
              {{ formatChatTime(item.sendTime) }}
              <span class="ml-2">{{ item.from }}</span>
            </div>
            <div class="whitespace-pre-wrap break-all text-gray-700">
              {{ item.content || '-' }}
            </div>
          </div>
        </div>
        <div
          v-else
          class="mb-3 rounded border border-dashed px-3 py-6 text-center text-xs text-gray-400"
        >
          {{ selectedPlayer ? '暂无聊天记录' : '选择会话后显示聊天记录' }}
        </div>

        <div v-if="selectedPlayer" class="flex gap-2">
          <Input.TextArea
            v-model:value="draftText"
            :disabled="!canSend"
            :rows="2"
            placeholder="输入回复内容"
            @press-enter.exact.prevent="sendTextMessage"
          />
          <Button type="primary" :disabled="!canSend" @click="sendTextMessage">
            发送
          </Button>
        </div>
      </Card>
    </div>

    <Card size="small" title="事件日志">
      <div
        v-if="logs.length > 0"
        class="max-h-40 space-y-1 overflow-auto text-xs text-gray-600"
      >
        <div v-for="(item, index) in logs" :key="`${item.at}-${index}`">
          <span class="mr-2 text-gray-400">{{ item.at }}</span>
          {{ item.text }}
        </div>
      </div>
      <div v-else class="text-xs text-gray-400">暂无事件</div>
    </Card>

    <Modal
      v-model:open="transferOpen"
      title="转接客服"
      :confirm-loading="transferLoading"
      ok-text="确认转接"
      :ok-button-props="{ disabled: !transferTargetId || transferLoading }"
      @ok="confirmTransfer"
    >
      <div
        v-if="transferLoading"
        class="py-6 text-center text-xs text-gray-400"
      >
        正在加载客服列表...
      </div>
      <div v-else-if="transferList.length > 0" class="flex flex-wrap gap-2">
        <Radio.Group v-model:value="transferTargetId">
          <Radio
            v-for="item in transferList"
            :key="item.ClientId"
            :value="item.ClientId"
            class="mb-2 mr-2"
          >
            {{ item.NickName }}
          </Radio>
        </Radio.Group>
      </div>
      <div v-else class="py-6 text-center text-xs text-gray-400">
        暂无可转接客服
      </div>
    </Modal>
  </div>
</template>
