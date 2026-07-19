<script lang="ts" setup>
import type { MobileVerifyCodeListItem } from '#/types/mobile-verify-code';
import type { PlayerBasicInfo } from '#/types/player-detail';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Descriptions,
  Input,
  Modal,
  Select,
  Table,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { generateMobileVerifyCodeApi } from '#/api/memberManage/mobile-verify-code';
import {
  fetchPlayerBasicInfoApi,
  queryPlayerByAccountApi,
} from '#/api/operationManage/player';
import { useOperationOptions } from '#/composables/use-operation-options';

defineOptions({ name: 'GenerateMobileCodeModal' });

const open = defineModel<boolean>('open', { default: false });

const { packageOptions } = useOperationOptions();

const loginAccount = ref('');
const packageName = ref('');
const searching = ref(false);
const generating = ref(false);
const playerInfo = ref<PlayerBasicInfo | null>(null);
const generatedList = ref<MobileVerifyCodeListItem[]>([]);

const productNameOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageName,
    })),
);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

watch(open, (value) => {
  if (!value) {
    loginAccount.value = '';
    packageName.value = productNameOptions.value[0]?.value || '';
    playerInfo.value = null;
    generatedList.value = [];
    return;
  }
  packageName.value = productNameOptions.value[0]?.value || '';
});

async function handleSearchPlayer() {
  if (!loginAccount.value || !packageName.value) {
    message.warning('请输入游戏账号并选择产品');
    return;
  }
  searching.value = true;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: loginAccount.value,
      PackageName: packageName.value,
    });
    const player = result?.Items?.[0];
    if (!player?.PlayerId) {
      message.warning('未找到玩家');
      playerInfo.value = null;
      return;
    }
    if (Number(player.DataFlag) === 1) {
      message.warning('测试账号不可操作');
      playerInfo.value = null;
      return;
    }
    playerInfo.value = await fetchPlayerBasicInfoApi(player.PlayerId);
  } finally {
    searching.value = false;
  }
}

async function handleGenerate() {
  if (!playerInfo.value?.PlayerId) {
    message.warning('请先查询玩家');
    return;
  }
  generating.value = true;
  try {
    const result = await generateMobileVerifyCodeApi({
      PlayerId: playerInfo.value.PlayerId,
    });
    if (result) {
      generatedList.value = [result, ...generatedList.value];
      message.success('验证码生成成功');
    }
  } finally {
    generating.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :footer="null"
    destroy-on-close
    title="后台生成手机验证码"
    width="720px"
  >
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="loginAccount"
        allow-clear
        placeholder="请输入"
        style="width: 220px"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Select
        v-model:value="packageName"
        :options="productNameOptions"
        placeholder="所属产品"
        show-search
        style="width: 180px"
      />
      <Button :loading="searching" type="primary" @click="handleSearchPlayer">
        查询玩家
      </Button>
    </div>

    <Descriptions
      v-if="playerInfo"
      bordered
      class="mb-4"
      :column="2"
      size="small"
      title="玩家信息"
    >
      <Descriptions.Item label="游戏账号">
        {{ playerInfo.LoginAccount || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="所属产品">
        {{ playerInfo.PackageName || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="手机号">
        {{ playerInfo.PhoneNo || '-' }}
      </Descriptions.Item>
      <Descriptions.Item label="玩家 ID">
        {{ playerInfo.PlayerId || '-' }}
      </Descriptions.Item>
    </Descriptions>

    <div v-if="playerInfo" class="mb-3 text-right">
      <Button :loading="generating" type="primary" @click="handleGenerate">
        生成验证码
      </Button>
    </div>

    <Table
      v-if="generatedList.length"
      :columns="[
        { dataIndex: 'CreateTime', key: 'time', title: '申请时间' },
        { dataIndex: 'PhoneNum', key: 'phone', title: '手机号' },
        { dataIndex: 'VerifyCode', key: 'code', title: '验证码' },
        { dataIndex: 'HandlerName', key: 'handler', title: '操作人' },
      ]"
      :data-source="generatedList"
      :pagination="false"
      bordered
      row-key="VerifyCode"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'time'">
          {{ formatDateTime(record.CreateTime) }}
        </template>
      </template>
    </Table>
  </Modal>
</template>
