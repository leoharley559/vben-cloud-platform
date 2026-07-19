<script lang="ts" setup>
import { fetchChatRecordListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomChatRecordColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomChatRecord' });
</script>

<template>
  <ChatroomListPage
    title="聊天记录"
    permission-key="chatroomChatRecord"
    tip="详情/删除/禁言操作等待下一迭代迁移。"
    :columns="chatroomChatRecordColumns"
    :fetch-api="fetchChatRecordListApi"
    :filters="['login', 'date']"
  />
</template>
