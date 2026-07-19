<script lang="ts" setup>
import { fetchInterceptRecordListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomInterceptColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomInterceptRecord' });
</script>

<template>
  <ChatroomListPage
    title="拦截记录"
    permission-key="chatroomInterceptRecord"
    :columns="chatroomInterceptColumns"
    :fetch-api="fetchInterceptRecordListApi"
    :filters="['login', 'date']"
  />
</template>
