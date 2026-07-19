<script lang="ts" setup>
import { fetchChatroomGiftListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomGiftColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomGiftSetting' });
</script>

<template>
  <ChatroomListPage
    title="礼物设置"
    permission-key="chatroomGiftConfig"
    tip="礼物编辑、上下架等待下一迭代迁移。"
    :columns="chatroomGiftColumns"
    :fetch-api="fetchChatroomGiftListApi"
  />
</template>
