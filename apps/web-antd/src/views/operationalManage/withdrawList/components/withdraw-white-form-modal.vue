<script lang="ts" setup>
import type { WithdrawWhiteItem } from '#/types/withdraw-extra';

import { computed, ref, watch } from 'vue';

import { Form, Input, Modal, Select, message } from 'ant-design-vue';

import {
  fetchPlayerBasicInfoApi,
  queryPlayerByAccountApi,
} from '#/api/operationManage/player';
import {
  createWithdrawWhiteApi,
  updateWithdrawWhiteApi,
} from '#/api/operationManage/withdraw-extra';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';

defineOptions({ name: 'WithdrawWhiteFormModal' });

const props = defineProps<{
  mode: 'create' | 'update';
  open: boolean;
  row: WithdrawWhiteItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { adminInfo } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const submitting = ref(false);
const lookupLoading = ref(false);
const loginAccount = ref('');
const packageName = ref('');
const playerId = ref<number | string>('');
const remark = ref('');
const playerGold = ref<number | string>('');
const playerStatus = ref<number | string>('');

const title = computed(() =>
  props.mode === 'create' ? '新增提现白名单' : '编辑提现白名单',
);

const operatorName = computed(() => {
  const admin = adminInfo.value as Record<string, unknown> | undefined;
  const nestedAdmin = admin?.Admin as Record<string, unknown> | undefined;
  return String(
    admin?.Account || admin?.AdminName || nestedAdmin?.Username || '',
  );
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    if (props.mode === 'update' && props.row) {
      loginAccount.value = String(props.row.LoginAccount || '');
      packageName.value = String(props.row.PackageName || '');
      playerId.value = props.row.PlayerId || '';
      remark.value = String(props.row.Remark || '');
      void loadPlayerInfo();
      return;
    }
    loginAccount.value = '';
    packageName.value =
      packageOptions.value.find((item) => item.PackageName)?.PackageName || '';
    playerId.value = '';
    remark.value = '';
    playerGold.value = '';
    playerStatus.value = '';
  },
);

async function lookupPlayer() {
  if (!loginAccount.value || !packageName.value) {
    return;
  }
  const packageId = packageOptions.value.find(
    (item) => item.PackageName === packageName.value,
  )?.PackageId;
  if (!packageId) {
    message.warning('请选择有效产品');
    return;
  }

  lookupLoading.value = true;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: loginAccount.value.trim(),
      PackageId: packageId,
    });
    const first = result?.Items?.[0];
    if (!first?.PlayerId) {
      playerId.value = '';
      playerGold.value = '';
      playerStatus.value = '';
      message.error('未找到对应玩家');
      return;
    }
    playerId.value = first.PlayerId;
    await loadPlayerInfo();
  } finally {
    lookupLoading.value = false;
  }
}

async function loadPlayerInfo() {
  if (!playerId.value) {
    return;
  }
  const info = await fetchPlayerBasicInfoApi(playerId.value);
  playerGold.value = info?.Gold ?? '';
  playerStatus.value = info?.Status ?? '';
}

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!playerId.value) {
    message.warning('请先查询并确认玩家信息');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      PlayerId: playerId.value,
      PlayersId: playerId.value,
      Remark: remark.value,
      Username: operatorName.value,
    };
    if (props.mode === 'create') {
      await createWithdrawWhiteApi({
        ...payload,
        Hash: String(Date.now()),
      });
      message.success('新增成功');
    } else {
      await updateWithdrawWhiteApi({
        ...payload,
        Id: props.row?.Id,
      });
      message.success('保存成功');
    }
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
    width="640px"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <div class="grid grid-cols-2 gap-3">
        <Form.Item label="游戏账号" required>
          <Input
            v-model:value="loginAccount"
            :disabled="mode === 'update'"
            placeholder="请输入游戏账号"
            @blur="lookupPlayer"
          />
        </Form.Item>
        <Form.Item label="所属产品" required>
          <Select
            v-model:value="packageName"
            :disabled="mode === 'update'"
            :loading="lookupLoading"
            :options="
              packageOptions
                .filter((item) => item.PackageName)
                .map((item) => ({
                  label: item.PackageName,
                  value: item.PackageName,
                }))
            "
            @change="lookupPlayer"
          />
        </Form.Item>
      </div>

      <div
        v-if="playerId"
        class="mb-4 rounded border bg-gray-50 px-3 py-2 text-sm"
      >
        <div>玩家 ID：{{ playerId }}</div>
        <div>账户余额：{{ formatAmountFromCent(playerGold) }}</div>
        <div class="flex items-center gap-1">
          玩家状态：
          <PlayerStatusTag :status="playerStatus" />
        </div>
      </div>

      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="remark"
          :rows="3"
          placeholder="请输入备注"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
