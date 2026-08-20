<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Button, Card, Descriptions } from 'ant-design-vue';

import { fetchWithdrawUserInfoApi } from '#/api/promotion/close-manage';
import { useAuthStore } from '#/store';
import { formatAmountFromCent } from '#/utils/format-amount';

import MobileMvpTip from '../../mobile/components/mobile-mvp-tip.vue';
import CloudAccountPsd from '../earning/accountPsd/index.vue';
import CloudBindPhone from '../earning/bindPhone/index.vue';

defineOptions({ name: 'MobileCloudUser' });

const authStore = useAuthStore();
const userInfo = ref<Record<string, unknown>>({});
const subView = ref<'accountpsd' | 'menu' | 'phone'>('menu');

const displayUsername = computed(() => {
  const admin = userInfo.value.Admin as Record<string, unknown> | undefined;
  return String(admin?.Username || userInfo.value.Username || '-');
});

async function loadUserInfo() {
  userInfo.value = await fetchWithdrawUserInfoApi();
}

async function handleLogout() {
  await authStore.logout(false);
  window.location.href = '/mobilelogin';
}

onMounted(loadUserInfo);
</script>

<template>
  <div>
    <template v-if="subView === 'menu'">
      <Card class="mb-3" size="small" title="个人中心">
        <Descriptions :column="1" size="small">
          <Descriptions.Item label="账号">
            {{ displayUsername }}
          </Descriptions.Item>
          <Descriptions.Item label="可用余额">
            {{ formatAmountFromCent(Number(userInfo.UseMoney || 0)) }}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <MobileMvpTip />
      <Button block class="mb-1" @click="subView = 'phone'">绑定手机</Button>
      <Button block class="mb-1" @click="subView = 'accountpsd'">
        修改账号密码
      </Button>
      <Button block danger @click="handleLogout">退出登录</Button>
    </template>
    <template v-else>
      <Button class="mb-3" size="small" @click="subView = 'menu'">返回</Button>
      <CloudBindPhone v-if="subView === 'phone'" />
      <CloudAccountPsd v-else-if="subView === 'accountpsd'" />
    </template>
  </div>
</template>
