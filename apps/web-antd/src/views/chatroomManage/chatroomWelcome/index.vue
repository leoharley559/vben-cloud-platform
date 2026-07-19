<script lang="ts" setup>
import { fetchWelcomePlanListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomWelcomeColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomWelcome' });
</script>

<template>
  <ChatroomListPage
    title="欢迎语"
    permission-key="chatroomWelcomeSetting"
    tip="欢迎语方案编辑等待下一迭代迁移。"
    :columns="chatroomWelcomeColumns"
    :fetch-api="fetchWelcomePlanListApi"
  />
</template>
