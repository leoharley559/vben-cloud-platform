<script lang="ts" setup>
import ChatroomListPage from '../shared/chatroom-list-page.vue';

defineOptions({ name: 'ChatroomConfigList' });
</script>

<template>
  <ChatroomListPage
    title="公共配置"
    permission-key="chatroomConfigShow"
    tip="聊天室公共开关/白名单配置等待下一迭代迁移。"
    placeholder
  />
</template>
