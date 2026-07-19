<script lang="ts" setup>
import { fetchSensitiveWordListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomWordColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomSensitivePhrase' });
</script>

<template>
  <ChatroomListPage
    title="敏感词"
    permission-key="chatroomSensitivePhrase"
    :columns="chatroomWordColumns"
    :fetch-api="fetchSensitiveWordListApi"
  />
</template>
