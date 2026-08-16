<script lang="ts" setup>
import type { AccountLoginInfo } from '#/api/core/account-login';

import { computed, onMounted, ref } from 'vue';

import { Profile } from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { fetchAccountLoginInfoApi } from '#/api/core/account-login';

import ProfileBase from './base-setting.vue';
import ProfileLoginLog from './login-log.vue';
import ProfileLoginSecurity from './login-security-setting.vue';
import ProfilePasswordSetting from './password-setting.vue';
import ProfilePhoneSetting from './phone-setting.vue';
import ProfilePrivatePassword from './private-password-setting.vue';

const userStore = useUserStore();

const tabsValue = ref('basic');
const loading = ref(false);
const accountInfo = ref<AccountLoginInfo>({});

const profileUserInfo = computed(() => {
  const roles = (userStore.userInfo?.roles || []).filter(Boolean);
  return {
    ...userStore.userInfo,
    // 个人中心固定使用默认头像
    avatar: preferences.app.defaultAvatar,
    // 昵称优先用账号资料里的 Name
    realName: String(
      accountInfo.value.Name ||
        userStore.userInfo?.realName ||
        userStore.userInfo?.username ||
        '',
    ),
    // 昵称下方展示当前角色
    username: roles.length > 0 ? roles.join('、') : '暂无角色',
  };
});

const tabs = [
  { label: '基本信息', value: 'basic' },
  { label: '修改密码', value: 'password' },
  { label: '绑定手机', value: 'phone' },
  { label: '私人密码', value: 'private' },
  { label: '登录与安全', value: 'login-security' },
  { label: '登录记录', value: 'login-log' },
];

async function loadAccountInfo() {
  loading.value = true;
  try {
    accountInfo.value = (await fetchAccountLoginInfoApi()) || {};
  } finally {
    loading.value = false;
  }
}

function switchTab(tab: string) {
  tabsValue.value = tab;
}

onMounted(() => {
  void loadAccountInfo();
});
</script>

<template>
  <Profile
    v-model:model-value="tabsValue"
    title="个人中心"
    :user-info="profileUserInfo"
    :tabs="tabs"
  >
    <template #content>
      <div v-if="loading" class="py-10 text-center text-muted-foreground">
        加载中...
      </div>
      <template v-else>
        <ProfileBase
          v-if="tabsValue === 'basic'"
          :info="accountInfo"
          @refresh="loadAccountInfo"
          @switch-tab="switchTab"
        />
        <ProfilePasswordSetting v-else-if="tabsValue === 'password'" />
        <ProfilePhoneSetting
          v-else-if="tabsValue === 'phone'"
          :info="accountInfo"
          @refresh="loadAccountInfo"
        />
        <ProfilePrivatePassword
          v-else-if="tabsValue === 'private'"
          :info="accountInfo"
          @refresh="loadAccountInfo"
        />
        <ProfileLoginSecurity
          v-else-if="tabsValue === 'login-security'"
          :info="accountInfo"
          @refresh="loadAccountInfo"
        />
        <ProfileLoginLog v-else-if="tabsValue === 'login-log'" />
      </template>
    </template>
  </Profile>
</template>
