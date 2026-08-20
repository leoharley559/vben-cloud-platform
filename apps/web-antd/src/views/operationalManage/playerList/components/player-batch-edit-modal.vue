<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
} from 'ant-design-vue';

import {
  batchUpdatePlayerApi,
  fetchPlayerTagListApi,
} from '#/api/operationManage/player';
import { fetchPlayerLevelListApi } from '#/api/operationManage/player-level';
import { PLAYER_STATUS_OPTIONS } from '#/utils/player-status';

defineOptions({ name: 'PlayerBatchEditModal' });

const props = defineProps<{
  actType: BatchActType;
  open: boolean;
  playerIds: string;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

export type BatchActType = 1 | 2 | 3 | 4 | 5;

const submitting = ref(false);
const status = ref(0);
const remark = ref('');
const playerLevelId = ref<number | string>(0);
const checkedTagIds = ref<Array<number | string>>([]);
const tagOptions = ref<Array<{ Id: number | string; TagName: string }>>([]);
const levelOptions = ref<
  Array<{
    Id: number | string;
    Name: string;
    SchemeName?: string;
    WithdrawAutoConfigSchemeName?: string;
  }>
>([]);

const title = computed(() => {
  const map: Record<number, string> = {
    1: '批量修改标签状态',
    2: '批量修改备注',
    3: '批量重置次数',
    4: '批量上标签',
    5: '批量修改会员层级',
  };
  return map[props.actType] || '批量编辑';
});

const selectedLevel = computed(() =>
  levelOptions.value.find(
    (item) => String(item.Id) === String(playerLevelId.value),
  ),
);

const statusOptions = PLAYER_STATUS_OPTIONS.filter((item) =>
  [0, 1, 2, 3, 4].includes(item.value),
);

async function loadOptions() {
  if (props.actType === 4) {
    const result = await fetchPlayerTagListApi({ Page: 1, PageSize: 200 });
    tagOptions.value = (result?.Items || []) as Array<{
      Id: number | string;
      TagName: string;
    }>;
  }
  if (props.actType === 5) {
    const result = await fetchPlayerLevelListApi({ Page: 1, PageSize: 200 });
    levelOptions.value = (result?.Items || []).map((item) => ({
      Id: (item.Id ?? item.PlayerLevelId) as number | string,
      Name: String(
        item.LevelName || item.Name || item.PlayerLevelName || item.Id || '-',
      ),
      SchemeName: String(item.SchemeName || '产品的返水设置'),
      WithdrawAutoConfigSchemeName: String(
        item.WithdrawAutoConfigSchemeName || '预设风控方案',
      ),
    }));
  }
}

watch(
  () => [props.open, props.actType],
  async ([open]) => {
    if (!open) {
      return;
    }
    status.value = 0;
    remark.value = '';
    playerLevelId.value = 0;
    checkedTagIds.value = [];
    await loadOptions();
  },
);

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!props.playerIds) {
    message.warning('请先选择玩家');
    return;
  }
  const payload: Record<string, unknown> = {
    ActType: props.actType,
    PlayerIds: props.playerIds,
  };
  switch (props.actType) {
  case 1: {
    payload.Status = status.value;
  
  break;
  }
  case 2: {
    if (!remark.value.trim()) {
      message.warning('请填写备注');
      return;
    }
    payload.Remark = remark.value.trim();
  
  break;
  }
  case 4: {
    if (checkedTagIds.value.length === 0) {
      message.warning('请选择标签');
      return;
    }
    const names = checkedTagIds.value.map((id) => {
      const found = tagOptions.value.find(
        (item) => String(item.Id) === String(id),
      );
      return found?.TagName || '';
    });
    payload.TagId = checkedTagIds.value.join(',');
    payload.TagName = names.join(',');
  
  break;
  }
  case 5: {
    payload.PlayerLevelId = playerLevelId.value;
  
  break;
  }
  // No default
  }

  submitting.value = true;
  try {
    const result = await batchUpdatePlayerApi(payload);
    const successCount =
      (result as { successCount?: number })?.successCount ??
      (result as { SuccessCount?: number })?.SuccessCount ??
      '';
    const failCount =
      (result as { failCount?: number })?.failCount ??
      (result as { FailCount?: number })?.FailCount ??
      '';
    message.success(
      successCount !== '' || failCount !== ''
        ? `批量完成：成功 ${successCount}，失败 ${failCount}`
        : '批量操作成功',
    );
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    :title="title"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <p class="mb-3 text-sm text-gray-500">已选玩家 ID：{{ playerIds }}</p>

    <Radio.Group v-if="actType === 1" v-model:value="status">
      <Radio
        v-for="item in statusOptions"
        :key="item.value"
        :value="item.value"
      >
        {{ item.label }}
      </Radio>
    </Radio.Group>

    <Form v-else-if="actType === 2" layout="vertical">
      <Form.Item label="备注" required>
        <Input.TextArea v-model:value="remark" :rows="4" />
      </Form.Item>
    </Form>

    <div v-else-if="actType === 3" class="text-center text-gray-600">
      确认重置所选玩家的相关次数？
    </div>

    <Checkbox.Group v-else-if="actType === 4" v-model:value="checkedTagIds">
      <div class="flex flex-wrap gap-2">
        <Checkbox
          v-for="item in tagOptions"
          :key="String(item.Id)"
          :value="item.Id"
        >
          {{ item.TagName }}
        </Checkbox>
      </div>
    </Checkbox.Group>

    <Form v-else-if="actType === 5" layout="vertical">
      <Form.Item label="会员层级">
        <Select
          v-model:value="playerLevelId"
          :options="[
            { label: '无层级', value: 0 },
            ...levelOptions.map((item) => ({
              label: item.Name,
              value: item.Id,
            })),
          ]"
          style="width: 100%"
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
