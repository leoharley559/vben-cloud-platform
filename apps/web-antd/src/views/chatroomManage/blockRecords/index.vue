<script lang="ts" setup>
import { fetchMuteRecordListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomMuteColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomBlockRecords' });
</script>

<template>
  <ChatroomListPage
    title="禁言记录"
    permission-key="chatroomBlockRecords"
    :columns="chatroomMuteColumns"
    :fetch-api="fetchMuteRecordListApi"
    :filters="['login', 'date']"
  />
</template>
