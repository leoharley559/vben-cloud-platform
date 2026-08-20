<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { $t } from '#/locales';
import { useAuthStore, useCloudPlatformStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

import HeaderAlertBar from './components/header-alert-bar.vue';
import HeaderSoundToggle from './components/header-sound-toggle.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const cloudStore = useCloudPlatformStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const cloudCoin = computed(() => {
  const account = cloudStore.adminInfo?.Account;
  if (account && typeof account === 'object') {
    const value = account.CloudCoin;
    return value === undefined || value === null || value === ''
      ? '0'
      : String(value);
  }
  return '0';
});

const firstRole = computed(
  () => String(userStore.userInfo?.roles?.[0] || '').trim() || '暂无角色',
);

const menus = computed(() => [
  {
    handler: () => {},
    icon: 'lucide:coins',
    text: `云币: ${cloudCoin.value}`,
  },
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
]);

const avatar = computed(() => {
  // 空字符串也要回退默认头像（?? 只处理 null/undefined）
  return userStore.userInfo?.avatar || preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="
          String(
            userStore.userInfo?.realName ||
              userStore.userInfo?.username ||
              '管理员',
          )
        "
        :description="firstRole"
        @logout="handleLogout"
      />
    </template>
    <template #header-right-10>
      <HeaderAlertBar />
    </template>
    <template #header-right-95>
      <HeaderSoundToggle />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
