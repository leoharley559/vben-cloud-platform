<script lang="ts" setup>
import type { InviteFriendConfig } from '#/api/operationManage/invite-friend-activity';

import { computed, onMounted, ref } from 'vue';

import { Button, Image, Spin, Table, Tag } from 'ant-design-vue';

import { fetchInviteFriendConfigListApi } from '#/api/operationManage/invite-friend-activity';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatAmountFromCent } from '#/utils/format-amount';
import { getServiceImageUrl } from '#/utils/media';
import { formatOperationDateTime } from '#/utils/operation-status';

import ActivityInviteConfigFormModal from './activity-invite-config-form-modal.vue';
import {
  formatInviterTiers,
  formatRiskDimensions,
} from './activity-invite-shared';

defineOptions({ name: 'ActivityInviteConfigPanel' });

const { projectConfig } = useProjectConfig();
const loading = ref(false);
const list = ref<InviteFriendConfig[]>([]);
const formOpen = ref(false);
const editing = ref<InviteFriendConfig | null>(null);

const langGroupNameMap = computed(() => {
  const map: Record<string, string> = { '0': '默认语言组' };
  const groups = (projectConfig.value?.LangGroup || []) as Array<{
    Id?: number | string;
    Name?: string;
  }>;
  for (const group of groups) {
    map[String(group.Id)] = String(group.Name || `语言组 ${group.Id}`);
  }
  return map;
});

const columns = [
  {
    customRender: ({ record }: { record: InviteFriendConfig }) =>
      langGroupNameMap.value[String(record.LangGroupId)] ||
      String(record.LangGroupId),
    key: 'LangGroupId',
    title: '语言组',
    width: 120,
  },
  { dataIndex: 'Title', ellipsis: true, key: 'Title', title: '标题', width: 160 },
  {
    key: 'Banner',
    title: 'Banner',
    width: 100,
  },
  {
    key: 'ShareImage',
    title: '分享图',
    width: 100,
  },
  {
    key: 'Open',
    title: '开关',
    width: 90,
  },
  {
    key: 'IsActive',
    title: '状态',
    width: 90,
  },
  {
    key: 'Time',
    title: '活动时间',
    width: 200,
  },
  {
    customRender: ({ record }: { record: InviteFriendConfig }) =>
      formatAmountFromCent(record.DepositThreshold),
    key: 'DepositThreshold',
    title: '充值门槛',
    width: 110,
  },
  {
    customRender: ({ record }: { record: InviteFriendConfig }) =>
      formatAmountFromCent(record.InviteeReward),
    key: 'InviteeReward',
    title: '被邀请人奖励',
    width: 120,
  },
  {
    customRender: ({ record }: { record: InviteFriendConfig }) =>
      formatInviterTiers(record.InviterTiers),
    ellipsis: true,
    key: 'InviterTiers',
    title: '邀请人阶梯',
    width: 220,
  },
  {
    dataIndex: 'WaterMultiple',
    key: 'WaterMultiple',
    title: '流水倍数',
    width: 90,
  },
  {
    customRender: ({ record }: { record: InviteFriendConfig }) =>
      formatRiskDimensions(record.RiskDimensions),
    ellipsis: true,
    key: 'RiskDimensions',
    title: '风控维度',
    width: 140,
  },
  {
    customRender: ({ record }: { record: InviteFriendConfig }) =>
      formatOperationDateTime(record.UpdateTime),
    key: 'UpdateTime',
    title: '更新时间',
    width: 160,
  },
  {
    fixed: 'right' as const,
    key: 'action',
    title: '操作',
    width: 100,
  },
];

async function loadList() {
  loading.value = true;
  try {
    const result = await fetchInviteFriendConfigListApi();
    list.value = Array.isArray(result) ? result : [];
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}

function openEdit(record: InviteFriendConfig) {
  editing.value = { ...record };
  formOpen.value = true;
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Button type="primary" @click="openCreate">新建配置</Button>
      <Button :loading="loading" @click="loadList">刷新</Button>
      <span class="text-xs text-gray-400">
        按语言组保存（对接：当前代理 + LangGroupId upsert）；同一代理仅允许一个
        Open=true。时间字段为 Unix 秒（UTC）。
      </span>
    </div>

    <Spin :spinning="loading">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row: InviteFriendConfig) => String(row.Id ?? row.LangGroupId)"
        :scroll="{ x: 1700 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'Banner'">
            <Image
              v-if="record.Banner"
              :src="getServiceImageUrl(String(record.Banner))"
              :width="64"
              style="object-fit: contain"
            />
            <span v-else class="text-xs text-gray-400">-</span>
          </template>
          <template v-else-if="column.key === 'ShareImage'">
            <Image
              v-if="record.ShareImage"
              :src="getServiceImageUrl(String(record.ShareImage))"
              :width="64"
              style="object-fit: contain"
            />
            <span v-else class="text-xs text-gray-400">-</span>
          </template>
          <template v-else-if="column.key === 'Open'">
            <Tag :color="record.Open ? 'success' : 'default'">
              {{ record.Open ? '开启' : '关闭' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'IsActive'">
            <Tag :color="Number(record.IsActive) === 1 ? 'processing' : 'error'">
              {{ Number(record.IsActive) === 1 ? '启用' : '停用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'Time'">
            <div class="text-xs leading-5">
              <div>开始(UTC)：{{ formatOperationDateTime(record.BeginTime) }}</div>
              <div>结束(UTC)：{{ formatOperationDateTime(record.EndTime) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
            </Button>
          </template>
        </template>
      </Table>
    </Spin>

    <ActivityInviteConfigFormModal
      v-model:open="formOpen"
      :record="editing"
      @success="loadList"
    />
  </div>
</template>
