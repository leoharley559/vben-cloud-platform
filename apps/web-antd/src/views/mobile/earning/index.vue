<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Button, Card, List } from 'ant-design-vue';

import { fetchWithdrawUserInfoApi } from '#/api/promotion/close-manage';
import { useAuthStore } from '#/store';
import { formatAmountFromCent } from '#/utils/format-amount';

import MobileMvpTip from '../components/mobile-mvp-tip.vue';
import EarningAccountPsd from './accountPsd/index.vue';
import EarningAddAccount from './addAccount/index.vue';
import EarningBill from './bill/index.vue';
import EarningBillDetail from './billDetail/index.vue';
import EarningBindPhone from './bindPhone/index.vue';
import EarningWithdraw from './withdraw/index.vue';
import EarningWithdrawAccount from './withdrawAccount/index.vue';
import EarningWithdrawPsd from './withdrawPsd/index.vue';

defineOptions({ name: 'MobileEarningPanel' });

type SubView =
  | 'account'
  | 'accountpsd'
  | 'addAccount'
  | 'bill'
  | 'billDetail'
  | 'menu'
  | 'phone'
  | 'withdraw'
  | 'withdrawpsd';

const authStore = useAuthStore();
const subView = ref<SubView>('menu');
const userInfo = ref<Record<string, unknown>>({});

const menuItems: Array<{ key: SubView; label: string }> = [
  { key: 'bill', label: '账单' },
  { key: 'withdraw', label: '提现' },
  { key: 'account', label: '银行卡/支付宝' },
  { key: 'phone', label: '绑定手机' },
  { key: 'withdrawpsd', label: '提现密码设置' },
  { key: 'accountpsd', label: '修改账号密码' },
];

async function loadUserInfo() {
  userInfo.value = await fetchWithdrawUserInfoApi();
}

function openSubView(key: SubView) {
  subView.value = key;
}

async function handleLogout() {
  await authStore.logout(false);
  window.location.href = '/mlogin';
}

onMounted(loadUserInfo);
</script>

<template>
  <div>
    <template v-if="subView === 'menu'">
      <Card class="mb-3 bg-blue-500 text-white" size="small">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="text-xs opacity-80">可用余额(元)</div>
            <div class="text-lg font-semibold">
              {{ formatAmountFromCent(Number(userInfo.UseMoney || 0)) }}
            </div>
          </div>
          <div>
            <div class="text-xs opacity-80">未结算资金(元)</div>
            <div class="text-lg font-semibold">
              {{ formatAmountFromCent(Number(userInfo.NoCloseMoney || 0)) }}
            </div>
          </div>
        </div>
      </Card>
      <MobileMvpTip>完整收益菜单、结算说明等待下一迭代迁移。</MobileMvpTip>
      <List :data-source="menuItems" bordered size="small">
        <template #renderItem="{ item }">
          <List.Item class="cursor-pointer" @click="openSubView(item.key)">
            {{ item.label }}
          </List.Item>
        </template>
      </List>
      <Button block class="mt-3" danger @click="handleLogout">退出登录</Button>
    </template>

    <template v-else>
      <Button class="mb-3" size="small" @click="subView = 'menu'">返回</Button>
      <EarningBill v-if="subView === 'bill'" @detail="subView = 'billDetail'" />
      <EarningBillDetail v-else-if="subView === 'billDetail'" />
      <EarningWithdraw v-else-if="subView === 'withdraw'" />
      <EarningWithdrawAccount
        v-else-if="subView === 'account'"
        @add="subView = 'addAccount'"
      />
      <EarningAddAccount
        v-else-if="subView === 'addAccount'"
        @back="subView = 'account'"
      />
      <EarningBindPhone v-else-if="subView === 'phone'" />
      <EarningWithdrawPsd v-else-if="subView === 'withdrawpsd'" />
      <EarningAccountPsd v-else-if="subView === 'accountpsd'" />
    </template>
  </div>
</template>
