<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Badge, Button } from 'ant-design-vue';
import Cookies from 'js-cookie';

import { fetchRechargeAlertApi } from '#/api/operationManage/recharge';
import { fetchWithdrawAlertApi } from '#/api/operationManage/withdraw';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import { useHeaderAlertSound } from './use-header-alert-sound';

defineOptions({ name: 'HeaderAlertBar' });

const WITHDRAW_ID_COOKIE = 'newWithdrawId';
const RECHARGE_ID_COOKIE = 'newRechargeId';

const WITHDRAW_POLL_MS = 10 * 1000;
const RECHARGE_POLL_MS = 300 * 1000;
const RECHARGE_POLL_DELAY_MS = 15 * 1000;

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { playSound } = useHeaderAlertSound();

const canWithdrawAlert = computed(() => checkPermission(11_375));
const canRechargeAlert = computed(() => checkPermission(11_376));

const withdrawCount = ref(0);
const rechargeCount = ref(0);
const lastWithdrawId = ref(Number(Cookies.get(WITHDRAW_ID_COOKIE) || 0));
const lastRechargeId = ref(Number(Cookies.get(RECHARGE_ID_COOKIE) || 0));

const timers: number[] = [];

function badgeText(count: number) {
  return count > 999 ? '999+' : count;
}

function playAudio(src: string) {
  const audio = new Audio(src);
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

async function loadWithdrawAlert() {
  if (!canWithdrawAlert.value) return;
  try {
    const data = await fetchWithdrawAlertApi();
    withdrawCount.value = Number(data?.Count || 0);
    const newId = Number(data?.LastId || 0);
    Cookies.set(WITHDRAW_ID_COOKIE, String(newId));
    if (playSound.value && newId > lastWithdrawId.value) {
      playAudio('/audio/tix.mp3');
    }
    lastWithdrawId.value = newId;
  } catch {
    // 对齐旧站：轮询失败静默
  }
}

async function loadRechargeAlert() {
  if (!canRechargeAlert.value) return;
  try {
    const data = await fetchRechargeAlertApi();
    rechargeCount.value = Number(data?.Count || 0);
    const newId = Number(data?.LastId || 0);
    Cookies.set(RECHARGE_ID_COOKIE, String(newId));
    if (playSound.value && newId > lastRechargeId.value) {
      playAudio('/audio/chongz.mp3');
    }
    lastRechargeId.value = newId;
  } catch {
    // 对齐旧站：轮询失败静默
  }
}

function goWithdraw() {
  void router.push('/operationalManage/withdrawList');
}

function goRecharge() {
  void router.push({
    path: '/operationalManage/rechargeList',
    query: { tab: 'fast' },
  });
}

onMounted(() => {
  void loadWithdrawAlert();
  void loadRechargeAlert();

  if (canWithdrawAlert.value) {
    timers.push(
      window.setInterval(() => void loadWithdrawAlert(), WITHDRAW_POLL_MS),
    );
  }
  if (canRechargeAlert.value) {
    timers.push(
      window.setTimeout(() => {
        timers.push(
          window.setInterval(() => void loadRechargeAlert(), RECHARGE_POLL_MS),
        );
      }, RECHARGE_POLL_DELAY_MS),
    );
  }
});

onUnmounted(() => {
  timers.forEach((id) => {
    clearInterval(id);
    clearTimeout(id);
  });
});
</script>

<template>
  <div class="header-alert-bar mr-2 flex items-center gap-2">
    <Badge
      v-if="canWithdrawAlert"
      :count="badgeText(withdrawCount)"
      :offset="[-2, 2]"
      :show-zero="false"
    >
      <Button size="small" @click="goWithdraw">提款</Button>
    </Badge>

    <Badge
      v-if="canRechargeAlert"
      :count="badgeText(rechargeCount)"
      :offset="[-2, 2]"
      :show-zero="false"
    >
      <Button size="small" @click="goRecharge">充值</Button>
    </Badge>
  </div>
</template>
