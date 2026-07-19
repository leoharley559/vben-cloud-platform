<script lang="ts" setup>
import { fetchChatroomListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomRoomColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomList' });
</script>

<template>
  <ChatroomListPage
    title="聊天室列表"
    permission-key="chatroomMgrShow"
    tip="进入聊天室、禁言、WebSocket 会话等待下一迭代迁移。"
    :columns="chatroomRoomColumns"
    :fetch-api="fetchChatroomListApi"
    :filters="['username']"
  />
</template>
