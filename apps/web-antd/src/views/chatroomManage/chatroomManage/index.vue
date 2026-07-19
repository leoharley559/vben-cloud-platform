<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result, Tabs } from 'ant-design-vue';

import {
  fetchChatRecordListApi,
  fetchChatroomGiftListApi,
  fetchChatroomListApi,
  fetchChatroomSystemListApi,
  fetchInterceptRecordListApi,
  fetchMuteRecordListApi,
  fetchPhraseListApi,
  fetchSensitiveWordListApi,
  fetchStickerTabListApi,
  fetchWelcomePlanListApi,
} from '#/api/chatroomManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

import OperationListPanel from '#/views/operationalManage/components/operation-list-panel.vue';
import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

defineOptions({ name: 'ChatroomManage' });

const { checkPermission, checkPermissionByKey } = useCloudPermission();
const activeTab = ref('rooms');

const roomColumns: OperationListConfig['columns'] = [
  { field: 'Title', minWidth: 140, title: '聊天室' },
  { field: 'SteamerName', minWidth: 120, title: '主播' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '开启' : '关闭'),
    minWidth: 90,
    title: '状态',
  },
  { field: 'OnlineNum', minWidth: 90, title: '在线' },
];

const muteColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'Remark', minWidth: 140, title: '原因' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

const interceptColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'Content', minWidth: 180, title: '内容' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

const chatRecordColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'Content', minWidth: 180, title: '消息' },
  { field: 'RoomTitle', minWidth: 120, title: '聊天室' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

const wordColumns: OperationListConfig['columns'] = [
  { field: 'Word', minWidth: 140, title: '敏感词' },
  { field: 'TypeName', minWidth: 120, title: '分类' },
];

const phraseColumns: OperationListConfig['columns'] = [
  { field: 'Content', minWidth: 180, title: '常用语' },
  { field: 'TagName', minWidth: 120, title: '标签' },
];

const giftColumns: OperationListConfig['columns'] = [
  { field: 'GiftName', minWidth: 120, title: '礼物' },
  { field: 'Price', minWidth: 90, title: '价格' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

const welcomeColumns: OperationListConfig['columns'] = [
  { field: 'PlanName', minWidth: 140, title: '方案' },
  { field: 'Content', minWidth: 200, title: '欢迎语' },
];

const stickerColumns: OperationListConfig['columns'] = [
  { field: 'TagName', minWidth: 140, title: '贴图分类' },
  { field: 'Sort', minWidth: 80, title: '排序' },
];

const tabs = computed(() =>
  [
    {
      config: {
        columns: roomColumns,
        fetchApi: fetchChatroomListApi,
        filters: ['username'],
      } satisfies OperationListConfig,
      key: 'rooms',
      permissionKey: 'chatroomMgrShow',
      tab: '聊天管理',
      tip: '进入聊天室、禁言、WebSocket 会话等待下一迭代迁移。',
    },
    {
      config: {
        columns: roomColumns,
        fetchApi: fetchChatroomSystemListApi,
        filters: ['username'],
      } satisfies OperationListConfig,
      key: 'systemRooms',
      permission: 12036,
      tab: '比赛聊天室',
    },
    {
      config: {
        columns: muteColumns,
        fetchApi: fetchMuteRecordListApi,
        filters: ['login', 'date'],
      } satisfies OperationListConfig,
      key: 'mute',
      permissionKey: 'chatroomBlockRecords',
      tab: '禁言记录',
    },
    {
      config: {
        columns: interceptColumns,
        fetchApi: fetchInterceptRecordListApi,
        filters: ['login', 'date'],
      } satisfies OperationListConfig,
      key: 'intercept',
      permissionKey: 'chatroomInterceptRecord',
      tab: '拦截记录',
    },
    {
      config: {
        columns: chatRecordColumns,
        fetchApi: fetchChatRecordListApi,
        filters: ['login', 'date'],
      } satisfies OperationListConfig,
      key: 'chatRecord',
      permissionKey: 'chatroomChatRecord',
      tab: '聊天记录',
      tip: '详情/删除/禁言操作等待下一迭代迁移。',
    },
    {
      key: 'config',
      permissionKey: 'chatroomConfigShow',
      placeholder: true,
      tab: '公共配置',
      tip: '聊天室公共开关/白名单配置等待下一迭代迁移。',
    },
    {
      config: {
        columns: wordColumns,
        fetchApi: fetchSensitiveWordListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'sensitive',
      permissionKey: 'chatroomSensitivePhrase',
      tab: '敏感词',
    },
    {
      config: {
        columns: giftColumns,
        fetchApi: fetchChatroomGiftListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'gift',
      permissionKey: 'chatroomGiftConfig',
      tab: '礼物设置',
    },
    {
      config: {
        columns: phraseColumns,
        fetchApi: fetchPhraseListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'phrase',
      permissionKey: 'chatroomPhraseSetting',
      tab: '常用语',
    },
    {
      config: {
        columns: welcomeColumns,
        fetchApi: fetchWelcomePlanListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'welcome',
      permissionKey: 'chatroomWelcomeSetting',
      tab: '欢迎语',
    },
    {
      config: {
        columns: stickerColumns,
        fetchApi: fetchStickerTabListApi,
        filters: [],
      } satisfies OperationListConfig,
      key: 'sticker',
      permissionKey: 'chatroomStickerSetting',
      tab: '贴图设置',
    },
  ].filter((item) =>
    item.permissionKey
      ? checkPermissionByKey(item.permissionKey)
      : item.permission
        ? checkPermission(item.permission)
        : true,
  ),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'rooms';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="聊天室管理"
    title="聊天室管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <div v-if="item.tip" class="mb-4 text-xs text-gray-400">
            {{ item.tip }}
          </div>
          <Empty v-if="item.placeholder" description="公共配置表单待迁移" />
          <OperationListPanel
            v-else-if="activeTab === item.key && item.config"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无聊天室管理查看权限" title="403" />
</template>
