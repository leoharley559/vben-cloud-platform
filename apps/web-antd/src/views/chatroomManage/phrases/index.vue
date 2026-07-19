<script lang="ts" setup>
import { fetchPhraseListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomPhraseColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomPhrases' });
</script>

<template>
  <ChatroomListPage
    title="常用语"
    permission-key="chatroomPhraseSetting"
    :columns="chatroomPhraseColumns"
    :fetch-api="fetchPhraseListApi"
  />
</template>
