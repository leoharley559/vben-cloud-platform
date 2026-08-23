<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Form, Input, message, Modal, Select } from 'ant-design-vue';

import { updatePlayerLevelAssignApi } from '#/api/operationManage/player';
import { fetchPlayerLevelListApi } from '#/api/operationManage/player-level';

defineOptions({ name: 'PlayerLevelModal' });

const props = defineProps<{
  playerId?: null | number | string;
  playerLevelId?: null | number | string;
}>();

const emit = defineEmits<{ success: [] }>();

interface LevelOption {
  Id: number | string;
  LevelName: string;
  SchemeName?: string;
  WithdrawAutoConfigSchemeName?: string;
}

const open = defineModel<boolean>('open', { default: false });
const submitting = ref(false);
const levelId = ref<number | string>(0);
const levels = ref<LevelOption[]>([]);

const selectedLevel = computed(() =>
  levels.value.find((item) => String(item.Id) === String(levelId.value)),
);

watch(open, async (visible) => {
  if (!visible) {
    return;
  }
  levelId.value =
    props.playerLevelId === undefined || props.playerLevelId === null
      ? 0
      : props.playerLevelId;
  const result = await fetchPlayerLevelListApi({ Page: 1, PageSize: 200 });
  levels.value = ((result?.Items || []) as unknown as LevelOption[]).map((item) => ({
    Id: item.Id,
    LevelName: String(item.LevelName || item.Id),
    SchemeName: String(item.SchemeName || '产品的返水设置'),
    WithdrawAutoConfigSchemeName: String(
      item.WithdrawAutoConfigSchemeName || '预设风控方案',
    ),
  }));
});

async function handleOk() {
  if (!props.playerId) {
    return;
  }
  submitting.value = true;
  try {
    await updatePlayerLevelAssignApi({
      PlayerId: props.playerId,
      PlayerLevelId: levelId.value,
    });
    message.success('操作成功');
    open.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="修改会员层级"
    :confirm-loading="submitting"
    destroy-on-close
    @ok="handleOk"
  >
    <Form layout="vertical">
      <Form.Item label="会员层级">
        <Select
          v-model:value="levelId"
          style="width: 100%"
          :options="[
            { label: '未分层', value: 0 },
            ...levels.map((item) => ({
              label: item.LevelName,
              value: item.Id,
            })),
          ]"
        />
      </Form.Item>
      <Form.Item label="返水方案">
        <Input
          :value="selectedLevel?.SchemeName || '产品的返水设置'"
          disabled
        />
      </Form.Item>
      <Form.Item label="风控方案">
        <Input
          :value="selectedLevel?.WithdrawAutoConfigSchemeName || '预设风控方案'"
          disabled
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
