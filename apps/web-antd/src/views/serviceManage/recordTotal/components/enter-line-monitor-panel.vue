<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  Button,
  Card,
  Input,
  Modal,
  Radio,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'ant-design-vue';

import { getCloudToken } from '#/utils/auth-token';
import {
  CloudWebSocket,
  getServiceManagerWsUrl,
  type CloudWsStatus,
} from '#/utils/ws';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { ServiceMessageType } from '#/utils/ws/service-message-type';

defineOptions({ name: 'EnterLineMonitorPanel' });

interface MonitorPlayer {
  ClientId: string;
  HubName?: string;
  IsInterlocution?: boolean;
  LoginAccount: string;
  OrderId?: string;
  Receive?: string;
  ServiceId?: number | string;
  VipLevel?: number | string;
  [key: string]: unknown;
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
  Offline: MonitorPlayer[];
  Online: MonitorPlayer[];
  Queue: MonitorPlayer[];
  UnSelect: MonitorPlayer[];
  Unset: MonitorPlayer[];
}

interface LogItem {
  at: string;
  text: string;
}

type BucketKey = keyof PlayerBucket;

const userStore = useUserStore();
const baseUrl = getServiceManagerWsUrl();
const wsReady = computed(() => Boolean(baseUrl));

const status = ref<CloudWsStatus>('closed');
const activeBucket = ref<BucketKey>('Online');
const selectedPlayer = ref<MonitorPlayer | null>(null);
const chatMessages = ref<ChatMessage[]>([]);
const chatLoading = ref(false);
const draftText = ref('');
const maxAllowOnline = ref(0);
const selfClientId = ref('');
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

const canJoin = computed(() => {
  const player = selectedPlayer.value;
  return Boolean(player?.ClientId) && !player?.IsInterlocution;
});

const canSend = computed(() => {
  const player = selectedPlayer.value;
  return (
    status.value === 'open' &&
    Boolean(player?.ClientId) &&
    Boolean(player?.IsInterlocution)
  );
});

const canTransfer = computed(
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
  () =>
    userStore.userInfo?.realName || userStore.userInfo?.username || '管理员',
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

function normalizePlayers(list: unknown): MonitorPlayer[] {
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
      IsInterlocution: Boolean(row.Tracked || row.IsInterlocution),
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

function mapChatList(list: unknown[], targetId: string) {
  return list
    .map((item, index) => {
      const row = (item || {}) as Record<string, unknown>;
      const type = Number(
        row.MessageType ?? row.messageType ?? ServiceMessageType.MESSAGE_TEXT,
      );
      const content =
        type === ServiceMessageType.MESSAGE_IMAGE
          ? `[图片] ${decodeContent(row.Content)}`
          : type === ServiceMessageType.MESSAGE_VIDEO
            ? `[视频] ${decodeContent(row.Content)}`
            : type === ServiceMessageType.MESSAGE_AUDIO
              ? `[语音] ${decodeContent(row.Content)}`
              : decodeContent(row.Content);
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
    .sort((a, b) => Number(a.sendTime) - Number(b.sendTime) || a.ack - b.ack);
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
    const prev = selectedPlayer.value;
    const next =
      Object.values(buckets.value)
        .flat()
        .find((item) => item.ClientId === prev.ClientId) || null;
    if (next && prev.IsInterlocution) {
      next.IsInterlocution = true;
    }
    selectedPlayer.value = next;
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

function selectPlayer(row: MonitorPlayer) {
  if (!row.ClientId) {
    return;
  }
  selectedPlayer.value = row;
  chatMessages.value = [];
  draftText.value = '';
  const ok = client?.send(
    JSON.stringify({
      MessageType: ServiceMessageType.MANAGE_SWITCH_MONITOR,
      OrderId: row.OrderId || '',
      TargetId: row.ClientId,
    }),
  );
  pushLog(
    ok
      ? `切换监控：${row.LoginAccount} (${row.ClientId})`
      : `切换失败（未连接）：${row.LoginAccount}`,
  );
}

function joinInterlocution() {
  const player = selectedPlayer.value;
  if (!player?.ClientId) {
    message.warning('请先选择会话');
    return;
  }
  if (player.IsInterlocution) {
    message.info('已加入该对话');
    return;
  }
  const targetId = player.Receive || player.ClientId;
  const ok = client?.send(
    JSON.stringify({
      MessageType: ServiceMessageType.MANAGE_JOIN_SERVICE,
      TargetId: targetId,
    }),
  );
  if (!ok) {
    message.warning('未连接，无法加入对话');
    return;
  }
  player.IsInterlocution = true;
  selectedPlayer.value = { ...player };
  pushLog(`加入对话：${player.LoginAccount} TargetId=${targetId}`);
  message.success('已加入对话，可发送插话消息');
}

function sendTextMessage() {
  const player = selectedPlayer.value;
  const content = draftText.value.trim();
  if (!player?.ClientId || !content) {
    return;
  }
  if (!player.IsInterlocution) {
    message.warning('请先加入对话');
    return;
  }
  const sendTo = player.Receive || player.ClientId;
  const ok = client?.send(
    JSON.stringify({
      Content: content,
      HubName: player.HubName || '',
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
      from: '我(插话)',
      key: `local-${Date.now()}-${chatMessages.value.length}`,
      orderId: player.OrderId,
      sendTime: Date.now() / 1000,
      type: ServiceMessageType.MESSAGE_TEXT,
    },
  ];
  draftText.value = '';
  pushLog(`插话发送：${content.slice(0, 40)}`);
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
      HubName: player.HubName || '',
      MessageType: ServiceMessageType.ALL_SERVICE_LIST,
    }),
  );
  if (!ok) {
    transferLoading.value = false;
    transferOpen.value = false;
    message.warning('未连接，无法获取客服列表');
    return;
  }
  pushLog('请求转单客服列表');
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
  const serviceId = selectedPlayer.value?.ServiceId;
  if (serviceId !== undefined && serviceId !== null && serviceId !== '') {
    filter.add(`s_${serviceId}`);
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
  if (!transferList.value.length) {
    message.warning('当前无其他可转接客服');
  }
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
  pushLog(`转接询问：→ ${target} 玩家=${player.LoginAccount}`);
  message.info('已发送转接询问，等待对方确认');
}

function handleTransferAsk(msg: Record<string, unknown>) {
  const transferTo = String(msg.TransferTo || '');
  // 被询问：监控端通常不是接单客服，默认拒绝
  if (transferTo && transferTo === selfClientId.value) {
    const reply = { ...msg, Agree: false };
    client?.send(JSON.stringify(reply));
    pushLog('收到转接询问，已自动拒绝（监控端）');
    return;
  }
  // 收到对方回复
  if (!msg.Agree) {
    const name =
      transferList.value.find((item) => item.ClientId === transferTo)
        ?.NickName || transferTo;
    message.warning(`${name} 不同意转接`);
    pushLog(`转接被拒：${name}`);
    return;
  }
  const player = selectedPlayer.value;
  client?.send(
    JSON.stringify({
      HubName: player?.HubName || '',
      MessageType: ServiceMessageType.TRANSFER_TO,
      PlayerId: msg.PlayerId || player?.Receive || player?.ClientId,
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
    JSON.stringify({
      MessageType: ServiceMessageType.MANAGE_GET_PLAYER_LIST,
    }),
  );
}

function handleSwitchAck(msg: Record<string, unknown>) {
  const targetId = String(msg.TargetId || selectedPlayer.value?.ClientId || '');
  if (!targetId || selectedPlayer.value?.ClientId !== targetId) {
    return;
  }
  const ack = Number(msg.Ack || 0);
  requestChatRecord(targetId, ack);
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
    pushLog('收到二进制帧（监控薄切片忽略）');
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
        pushLog(
          `SERVER_INIT_DONE self=${selfClientId.value || '-'}，拉取玩家列表`,
        );
        client?.send(
          JSON.stringify({
            MessageType: ServiceMessageType.CLIENT_SPEED_TEST,
            SendTime: Date.now(),
          }),
        );
        client?.send(
          JSON.stringify({
            MessageType: ServiceMessageType.MANAGE_GET_PLAYER_LIST,
          }),
        );
        continue;
      }
      if (
        type === ServiceMessageType.GET_PLAYER_LIST ||
        type === ServiceMessageType.MANAGE_GET_PLAYER_LIST ||
        type === ServiceMessageType.REFRESH_PLAYER_LIST
      ) {
        applyPlayerList(msg);
        pushLog(
          `玩家列表刷新 Online=${buckets.value.Online.length} Queue=${buckets.value.Queue.length}`,
        );
        continue;
      }
      if (
        type === ServiceMessageType.MANAGE_SWITCH_MONITOR ||
        type === ServiceMessageType.SWITCH_CHATTING
      ) {
        handleSwitchAck(msg);
        continue;
      }
      if (type === ServiceMessageType.GET_CHAT_RECORD) {
        handleChatRecord(msg);
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
        pushLog('转接失败');
        continue;
      }
      if (type === ServiceMessageType.TRANSFER_TO_FAIL_CUSTOMER_BUSY) {
        message.error('客服正忙，无法转接给该客服');
        pushLog('转接失败：客服正忙');
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
    message.warning('未配置 VITE_MJ_WBSOCKT_URL');
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

onMounted(() => {
  pushLog(
    wsReady.value
      ? '已就绪，点击「连接」接入进线监控 WS'
      : '缺少 VITE_MJ_WBSOCKT_URL',
  );
});

onBeforeUnmount(() => {
  disconnect();
});
</script>

<template>
  <div class="space-y-4">
    <div class="text-xs text-gray-400">
      进线监控：连接 / 列表点选 / 聊天记录 / 组长插话 / 转单。
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Tag :color="wsReady ? 'success' : 'warning'">
        {{ wsReady ? '已配置 MJ WS' : '未配置 VITE_MJ_WBSOCKT_URL' }}
      </Tag>
      <Tag :color="statusColor">状态：{{ status }}</Tag>
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
            (row: MonitorPlayer) =>
              row.ClientId || row.OrderId || row.LoginAccount
          "
          :custom-row="
            (row: MonitorPlayer) => ({
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
                :player-id="record.Receive as number | string | undefined"
              />
            </template>
            <template v-else>{{ text }}</template>
          </template>
        </Table>
      </Card>

      <Card class="lg:col-span-2" size="small" title="会话详情 / 聊天记录">
        <div v-if="selectedPlayer" class="mb-3 space-y-1 text-sm text-gray-700">
          <div>
            账号：{{ selectedPlayer.LoginAccount }} ｜ VIP：{{
              selectedPlayer.VipLevel
            }}
            <Tag
              v-if="selectedPlayer.IsInterlocution"
              class="ml-2"
              color="processing"
            >
              已插话
            </Tag>
          </div>
          <div>
            订单：{{ selectedPlayer.OrderId || '-' }} ｜ ClientId：{{
              selectedPlayer.ClientId
            }}
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <Button
              v-if="canJoin"
              size="small"
              type="primary"
              :disabled="status !== 'open'"
              @click="joinInterlocution"
            >
              加入对话
            </Button>
            <span
              v-else-if="selectedPlayer.IsInterlocution"
              class="self-center text-xs text-gray-400"
            >
              已加入，可在下方发送插话
            </span>
            <Button size="small" :disabled="!canTransfer" @click="openTransfer">
              转单
            </Button>
          </div>
        </div>
        <div v-else class="mb-3 text-xs text-gray-400">
          点击左侧列表选择会话
        </div>

        <div
          v-if="chatLoading"
          class="rounded border border-dashed px-3 py-6 text-center text-xs text-gray-400"
        >
          正在拉取聊天记录...
        </div>
        <div
          v-else-if="chatMessages.length"
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
            placeholder="加入对话后可发送插话文本"
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
        v-if="logs.length"
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
      <div v-else-if="transferList.length" class="flex flex-wrap gap-2">
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
