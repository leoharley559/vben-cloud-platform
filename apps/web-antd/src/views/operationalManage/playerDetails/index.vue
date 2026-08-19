<script lang="ts" setup>
import type { PlayerBasicInfo } from '#/types/player-detail';
import { PLAYER_DETAIL_TABS } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Result,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  fetchPlayerBasicInfoApi,
  queryPlayerByAccountApi,
  updatePlayerExtApi,
} from '#/api/operationManage/player';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  buildPlayerDetailPath,
  parsePlayerDetailRouteId,
} from '#/utils/player-detail-route';

import PlayerAdjustListPanel from './components/player-adjust-list.vue';
import PlayerBasicInfoPanel from './components/player-basic-info.vue';
import PlayerBetDetailPanel from './components/player-bet-detail.vue';
import PlayerBonusRewardPanel from './components/player-bonus-reward.vue';
import PlayerCoinDetailPanel from './components/player-coin-detail.vue';
import PlayerGameInfoPanel from './components/player-game-info.vue';
import PlayerLoginInfoPanel from './components/player-login-info.vue';
import PlayerLogsPanel from './components/player-logs.vue';
import PlayerPointsPanel from './components/player-points.vue';
import PlayerProblemPanel from './components/player-problem.vue';
import PlayerRebatePanel from './components/player-rebate.vue';
import PlayerRechargeWithdrawPanel from './components/player-recharge-withdraw.vue';
import PlayerRelationPanel from './components/player-relation.vue';
import PlayerRiskPanel from './components/player-risk.vue';
import PlayerStreamingPanel from './components/player-streaming.vue';
import PlayerVenueTransferPanel from './components/player-venue-transfer.vue';
import PlayerWalletPanel from './components/player-wallet.vue';

defineOptions({ name: 'OperationalPlayerDetails' });

const route = useRoute();
const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const loading = ref(false);
const searchLoading = ref(false);
const statusSaving = ref(false);
const playerInfo = ref<PlayerBasicInfo | null>(null);
const activeTab = ref('profile');
const statusEditing = ref(false);
const nextStatus = ref<number>(0);
const banRemarkOpen = ref(false);
const kickOpen = ref(false);
const banRemark = ref('');
const kickMinutes = ref(0);

const searchLoginAccount = ref('');
const searchPlayerId = ref('');
const searchPackageId = ref<number | string>('');

const routePlayer = computed(() =>
  parsePlayerDetailRouteId(String(route.params.id || '')),
);

const visibleTabs = computed(() =>
  PLAYER_DETAIL_TABS.filter((tab) => checkPermission(tab.permission)),
);

const canViewAnyTab = computed(() => visibleTabs.value.length > 0);
const canEditStatus = computed(() => checkPermission(10406));
const currentPlayerId = computed(
  () => routePlayer.value.playerId || playerInfo.value?.PlayerId || '',
);
const pageTitle = computed(() => {
  const account =
    playerInfo.value?.LoginAccount || routePlayer.value.loginAccount;
  return account ? `玩家详情 - ${account}` : '玩家详情';
});

const statusLabelMap: Record<number, string> = {
  0: '正常',
  1: '优质',
  2: '关注',
  3: '封号',
  4: '禁提',
  6: '踢下线',
  8: '取消踢下线',
};

const statusSelectOptions = computed(() => {
  const current = Number(playerInfo.value?.Status ?? 0);
  return [
    {
      label: current === 1 ? '取消优质' : '优质',
      value: current === 1 ? 0 : 1,
    },
    {
      label: current === 2 ? '取消关注' : '关注',
      value: current === 2 ? 0 : 2,
    },
    {
      label: current === 3 ? '取消封号' : '封号',
      value: current === 3 ? 0 : 3,
    },
    {
      label: current === 4 ? '取消禁提' : '禁提',
      value: current === 4 ? 0 : 4,
    },
    {
      label: current === 6 ? '取消踢下线' : '踢下线',
      value: current === 6 ? 8 : 6,
    },
  ];
});

function resolveDefaultTab() {
  const first = visibleTabs.value[0];
  activeTab.value = first?.key || 'profile';
}

async function loadPlayerInfo(playerId?: string) {
  const id = playerId || routePlayer.value.playerId;
  if (!id) {
    playerInfo.value = null;
    return;
  }

  loading.value = true;
  try {
    playerInfo.value = await fetchPlayerBasicInfoApi(id);
    searchLoginAccount.value = String(playerInfo.value?.LoginAccount || '');
  } catch {
    playerInfo.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  if (searchPlayerId.value) {
    const path = buildPlayerDetailPath(
      searchPlayerId.value.trim(),
      searchLoginAccount.value.trim(),
    );
    if (path !== route.fullPath) {
      await router.push(path);
    } else {
      await loadPlayerInfo(searchPlayerId.value.trim());
    }
    return;
  }

  if (!searchLoginAccount.value || !searchPackageId.value) {
    message.warning('请输入游戏账号并选择产品，或直接输入玩家 ID');
    return;
  }

  searchLoading.value = true;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: searchLoginAccount.value.trim().toLowerCase().replaceAll(/\s/g, ''),
      PackageId: searchPackageId.value,
    });
    const first = result?.Items?.[0];
    if (!first?.PlayerId) {
      message.error('未找到对应玩家');
      return;
    }
    await router.push(
      buildPlayerDetailPath(first.PlayerId, first.LoginAccount),
    );
  } finally {
    searchLoading.value = false;
  }
}

function handleResetSearch() {
  searchLoginAccount.value = '';
  searchPlayerId.value = '';
  searchPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
}

function startEditStatus() {
  nextStatus.value = statusSelectOptions.value[0]?.value ?? 0;
  statusEditing.value = true;
}

function cancelEditStatus() {
  statusEditing.value = false;
  banRemarkOpen.value = false;
  kickOpen.value = false;
  banRemark.value = '';
  kickMinutes.value = 0;
}

async function applyStatusChange(payload: {
  BlockTime?: number;
  LastBlockTime?: number;
  Remark?: string;
  Status: number;
}) {
  const playerId = currentPlayerId.value;
  if (!playerId) {
    return;
  }
  statusSaving.value = true;
  try {
    await updatePlayerExtApi({
      PlayerId: playerId,
      ...payload,
    });
    message.success('状态已更新');
    cancelEditStatus();
    await loadPlayerInfo(String(playerId));
  } finally {
    statusSaving.value = false;
  }
}

function handleSaveStatus() {
  const playerId = currentPlayerId.value;
  const status = nextStatus.value;
  const name =
    playerInfo.value?.PlayerName ||
    playerInfo.value?.LoginAccount ||
    String(playerId);
  const stateLabel = statusLabelMap[status] || String(status);

  if (status === 6) {
    kickMinutes.value = Number(playerInfo.value?.LastBlockTime || 0);
    kickOpen.value = true;
    return;
  }

  if (status === 8) {
    Modal.confirm({
      content: `确认取消玩家「${name}」的踢下线状态？`,
      onOk: () => applyStatusChange({ Status: 8 }),
      title: '取消踢下线',
    });
    return;
  }

  if (status === 3) {
    banRemark.value = '';
    banRemarkOpen.value = true;
    return;
  }

  Modal.confirm({
    content: `确认将玩家「${name}」状态改为「${stateLabel}」？`,
    onOk: () => applyStatusChange({ Status: status }),
    title: '修改玩家状态',
  });
}

async function submitBanRemark() {
  if (!banRemark.value.trim()) {
    message.warning('封号必须填写原因');
    return;
  }
  await applyStatusChange({
    Remark: banRemark.value.trim(),
    Status: 3,
  });
  banRemarkOpen.value = false;
}

async function submitKick() {
  const minutes = Number(kickMinutes.value || 0);
  if (minutes < 0 || minutes > 60) {
    message.warning('踢下线时长需在 0–60 分钟');
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  await applyStatusChange({
    BlockTime: minutes * 60 + now,
    LastBlockTime: minutes,
    Status: 6,
  });
  kickOpen.value = false;
}

watch(
  () => route.params.id,
  async () => {
    cancelEditStatus();
    resolveDefaultTab();
    await loadPlayerInfo();
  },
);

onMounted(async () => {
  searchPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  resolveDefaultTab();
  await loadPlayerInfo();
});
</script>

<template>
  <Page auto-content-height :title="pageTitle">
    <Card>
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Space.Compact>
            <span class="query-field-addon">游戏账号</span>
            <Input
              v-model:value="searchLoginAccount"
              allow-clear
              autocomplete="off"
              name="player-detail-login-account"
              placeholder="请输入游戏账号"
              @press-enter="handleSearch"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">产品</span>
            <Select
              v-model:value="searchPackageId"
              :options="
                packageOptions
                  .filter((item) => item.PackageId !== '')
                  .map((item) => ({
                    label: item.PackageName,
                    value: item.PackageId,
                  }))
              "
              placeholder="请选择产品"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">玩家 ID</span>
            <Input
              v-model:value="searchPlayerId"
              allow-clear
              autocomplete="off"
              name="player-detail-player-id"
              placeholder="请输入玩家 ID"
              @press-enter="handleSearch"
            />
          </Space.Compact>
          <div class="query-filter-actions query-filter-actions-single">
            <Button
              :loading="searchLoading || loading"
              type="primary"
              @click="handleSearch"
            >
              查询
            </Button>
            <Button @click="handleResetSearch">重置</Button>
          </div>
        </div>
      </div>

      <Spin :spinning="loading">
        <div
          class="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md bg-gray-50 px-3 py-2 text-sm"
        >
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500">游戏账号</span>
            <span class="font-medium text-blue-600">
              {{ playerInfo?.LoginAccount || '-' }}
            </span>
          </div>
          <Tag color="gold">
            VIP {{ playerInfo?.VipLevel ?? '-' }}
          </Tag>
          <div class="flex items-center gap-1.5">
            <span class="text-gray-500">在线状态</span>
            <Tag :color="playerInfo?.Online ? 'success' : 'default'">
              {{ playerInfo?.Online ? '在线' : '离线' }}
            </Tag>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-gray-500">状态</span>
            <template v-if="!statusEditing">
              <PlayerStatusTag :status="playerInfo?.Status" />
              <Button
                v-if="canEditStatus && playerInfo"
                size="small"
                type="link"
                @click="startEditStatus"
              >
                修改
              </Button>
            </template>
            <template v-else>
              <Space.Compact>
                <span class="query-field-addon">选择状态</span>
                <Select
                  v-model:value="nextStatus"
                  :options="statusSelectOptions"
                  placeholder="请选择状态"
                />
              </Space.Compact>
              <Button
                :loading="statusSaving"
                size="small"
                type="primary"
                @click="handleSaveStatus"
              >
                保存
              </Button>
              <Button size="small" @click="cancelEditStatus">取消</Button>
            </template>
          </div>
        </div>
      </Spin>

      <Tabs
        v-if="canViewAnyTab"
        v-model:active-key="activeTab"
        type="line"
        size="small"
      >
        <Tabs.TabPane
          v-for="tab in visibleTabs"
          :key="tab.key"
          :tab="tab.label"
        >
          <PlayerBasicInfoPanel
            v-if="tab.key === 'profile' && activeTab === 'profile'"
            :info="playerInfo"
            :loading="loading"
            @refreshed="loadPlayerInfo()"
          />
          <PlayerWalletPanel
            v-else-if="tab.key === 'wallet' && activeTab === 'wallet'"
            :player-id="currentPlayerId"
          />
          <PlayerGameInfoPanel
            v-else-if="tab.key === 'coin' && activeTab === 'coin'"
            :player-id="currentPlayerId"
          />
          <PlayerBetDetailPanel
            v-else-if="tab.key === 'bet' && activeTab === 'bet'"
            :login-account="
              playerInfo?.LoginAccount || routePlayer.loginAccount
            "
            :player-id="currentPlayerId"
          />
          <PlayerCoinDetailPanel
            v-else-if="tab.key === 'coinStats' && activeTab === 'coinStats'"
            :player-id="currentPlayerId"
          />
          <PlayerRechargeWithdrawPanel
            v-else-if="
              tab.key === 'rechargeWithdraw' && activeTab === 'rechargeWithdraw'
            "
            :player-id="currentPlayerId"
          />
          <PlayerLoginInfoPanel
            v-else-if="tab.key === 'login' && activeTab === 'login'"
            :player-id="currentPlayerId"
          />
          <PlayerVenueTransferPanel
            v-else-if="
              tab.key === 'venueTransfer' && activeTab === 'venueTransfer'
            "
            :player-id="currentPlayerId"
          />
          <PlayerAdjustListPanel
            v-else-if="tab.key === 'adjust' && activeTab === 'adjust'"
            :player-id="currentPlayerId"
          />
          <PlayerBonusRewardPanel
            v-else-if="tab.key === 'bonus' && activeTab === 'bonus'"
            :player-id="currentPlayerId"
          />
          <PlayerStreamingPanel
            v-else-if="tab.key === 'streaming' && activeTab === 'streaming'"
            :player-id="currentPlayerId"
          />
          <PlayerPointsPanel
            v-else-if="tab.key === 'points' && activeTab === 'points'"
            :player-id="currentPlayerId"
          />
          <PlayerRelationPanel
            v-else-if="tab.key === 'relation' && activeTab === 'relation'"
            :player-id="currentPlayerId"
          />
          <PlayerRebatePanel
            v-else-if="tab.key === 'rebate' && activeTab === 'rebate'"
            :player-id="currentPlayerId"
          />
          <PlayerProblemPanel
            v-else-if="tab.key === 'problem' && activeTab === 'problem'"
            :player-id="currentPlayerId"
          />
          <PlayerRiskPanel
            v-else-if="tab.key === 'risk' && activeTab === 'risk'"
            :player-id="currentPlayerId"
          />
          <PlayerLogsPanel
            v-else-if="tab.key === 'logs' && activeTab === 'logs'"
            :player-id="currentPlayerId"
          />
        </Tabs.TabPane>
      </Tabs>

      <Result
        v-else
        status="403"
        sub-title="当前账号没有玩家详情 Tab 权限（10407+）"
        title="无权限"
      />
    </Card>

    <Modal
      v-model:open="banRemarkOpen"
      :confirm-loading="statusSaving"
      destroy-on-close
      title="封号原因"
      @ok="submitBanRemark"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="原因" required>
          <Input.TextArea
            v-model:value="banRemark"
            :rows="3"
            allow-clear
            placeholder="请填写封号原因"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="kickOpen"
      :confirm-loading="statusSaving"
      destroy-on-close
      title="踢下线时长"
      @ok="submitKick"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="时长（分钟，0–60）" required>
          <InputNumber
            v-model:value="kickMinutes"
            :max="60"
            :min="0"
            :precision="0"
            class="!w-full"
          />
        </Form.Item>
        <div class="text-xs text-gray-400">
          到期后自动恢复；设为 0 表示立即踢下线且不额外锁定时长。
        </div>
      </Form>
    </Modal>
  </Page>
</template>
