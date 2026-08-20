<script lang="ts" setup>
import type { SecuritySettingItem } from '#/types/system-manage';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { getProjectConfigApi } from '#/api';
import {
  editSecuredStatusApi,
  fetchSecuredListApi,
  resetSecuredStatusApi,
} from '#/api/systemManage/security';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';

import SecurityAccessTable from './components/security-access-table.vue';

defineOptions({ name: 'SystemSecurityManage' });

const cloudStore = useCloudPlatformStore();
const { checkPermission } = useCloudPermission();

const list = ref<SecuritySettingItem[]>([]);
const listLoading = ref(false);

const canGcode = computed(() => checkPermission(12_917));
const canPrivate = computed(() => checkPermission(12_918));
const canMultiAcct = computed(() => checkPermission(12_919));
const canExportEncrypt = computed(() => checkPermission(12_932));

const canViewAny = computed(
  () =>
    canGcode.value ||
    canPrivate.value ||
    canMultiAcct.value ||
    canExportEncrypt.value,
);

const activeTab = ref('gcode');

function resolveDefaultTab() {
  const tabs = [
    { key: 'gcode', visible: canGcode.value },
    { key: 'privatepass', visible: canPrivate.value },
    { key: 'multiacct', visible: canMultiAcct.value },
    { key: 'exportencrpt', visible: canExportEncrypt.value },
  ];
  const first = tabs.find((item) => item.visible);
  activeTab.value = first?.key || 'gcode';
}

async function loadList() {
  listLoading.value = true;
  try {
    const data = await fetchSecuredListApi();
    // 接口 respond 直接为数组（与旧站 res.data.Data 一致）
    list.value = Array.isArray(data) ? data : [];
    if (cloudStore.projectConfig) {
      cloudStore.setProjectConfig({
        ...cloudStore.projectConfig,
        SecuritySetting: list.value,
      });
    }
  } catch {
    list.value = [];
  } finally {
    listLoading.value = false;
  }
}

async function refreshProjectConfig() {
  try {
    await getProjectConfigApi();
  } catch {
    /* 配置刷新失败仍拉列表，避免开关乐观更新卡住 */
  }
  await loadList();
}

async function handleUpdate(data: Record<string, unknown>) {
  listLoading.value = true;
  try {
    await editSecuredStatusApi(data);
  } catch {
    // 错误由拦截器提示；finally 仍刷新以回滚乐观开关
  } finally {
    await refreshProjectConfig();
    listLoading.value = false;
  }
}

async function handleReset(data: Record<string, unknown>) {
  listLoading.value = true;
  try {
    await resetSecuredStatusApi(data);
  } catch {
    // 同上
  } finally {
    await refreshProjectConfig();
    listLoading.value = false;
  }
}

onMounted(async () => {
  resolveDefaultTab();
  if (canViewAny.value) {
    await loadList();
  }
});
</script>

<template>
  <Page
    v-if="canViewAny"
    auto-content-height
    description="系统管理 · 安全管理"
    title="安全管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-if="canGcode" key="gcode" tab="谷歌验证码">
          <SecurityAccessTable
            v-if="activeTab === 'gcode'"
            :list="list"
            :list-loading="listLoading"
            :type="1"
            @reset="handleReset"
            @update="handleUpdate"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canPrivate" key="privatepass" tab="私人密码">
          <SecurityAccessTable
            v-if="activeTab === 'privatepass'"
            :list="list"
            :list-loading="listLoading"
            :type="2"
            @reset="handleReset"
            @update="handleUpdate"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canMultiAcct" key="multiacct" tab="多账号验证">
          <SecurityAccessTable
            v-if="activeTab === 'multiacct'"
            :list="list"
            :list-loading="listLoading"
            :type="3"
            @reset="handleReset"
            @update="handleUpdate"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="canExportEncrypt" key="exportencrpt" tab="导出加密">
          <SecurityAccessTable
            v-if="activeTab === 'exportencrpt'"
            :list="list"
            :list-loading="listLoading"
            :type="4"
            @reset="handleReset"
            @update="handleUpdate"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>

  <Page v-else auto-content-height title="安全管理">
    <Result
      status="403"
      sub-title="需要权限 12917 / 12918 / 12919 / 12932 才能访问此页面"
      title="无权限"
    />
  </Page>
</template>
