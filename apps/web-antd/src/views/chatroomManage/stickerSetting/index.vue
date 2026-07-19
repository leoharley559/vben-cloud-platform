<script lang="ts" setup>
import { fetchStickerTabListApi } from '#/api/chatroomManage';

import ChatroomListPage from '../shared/chatroom-list-page.vue';
import { chatroomStickerColumns } from '../shared/columns';

defineOptions({ name: 'ChatroomStickerSetting' });
</script>

<template>
  <ChatroomListPage
    title="贴图设置"
    permission-key="chatroomStickerSetting"
    tip="贴图上传、排序等待下一迭代迁移。"
    :columns="chatroomStickerColumns"
    :fetch-api="fetchStickerTabListApi"
  />
</template>
