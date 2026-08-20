<script lang="ts" setup>
import type { SecuritySettingItem } from '#/types/system-manage';

import { computed, ref } from 'vue';

import { Button, Space, Switch, Table } from 'ant-design-vue';

import PassPopup from '#/components/security/pass-popup.vue';
import {
  getSecurityPathName,
  isSecurityPathActive,
} from '#/utils/security-path';
import { antTableScrollY } from '#/utils/table-height';
import { formatReportDateTime } from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'SecurityAccessTable' });

const props = defineProps<{
  list: SecuritySettingItem[];
  listLoading?: boolean;
  type: number;
}>();

const emit = defineEmits<{
  reset: [data: Record<string, unknown>];
  update: [data: Record<string, unknown>];
}>();

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const selectedRowKeys = ref<Array<number | string>>([]);
const currentRow = ref<null | SecuritySettingItem>(null);
const isResetAction = ref(false);

const activeList = computed(() =>
  props.list.filter(
    (row) => row.Type === props.type && isSecurityPathActive(row.PageId),
  ),
);

const hasSelection = computed(() => selectedRowKeys.value.length > 0);

const columns = [
  { dataIndex: 'index', key: 'index', title: '序号', width: 70 },
  { dataIndex: 'path', key: 'path', title: '路径', width: 460 },
  { dataIndex: 'IsOpen', key: 'IsOpen', title: '状态', width: 100 },
  { dataIndex: 'HandlerName', key: 'HandlerName', title: '操作人', width: 160 },
  {
    dataIndex: 'HandlerTime',
    key: 'HandlerTime',
    title: '操作时间',
    width: 180,
  },
];

function openValidation(options: Record<string, unknown> = {}) {
  isResetAction.value = !!options.reset;
  passPopupRef.value?.validate('root', options);
}

function handleSwitchChange(row: SecuritySettingItem, checked: boolean) {
  row.IsOpen = checked;
  currentRow.value = row;
  openValidation();
}

function handleBatchAction(open: boolean) {
  currentRow.value = {
    Id: selectedRowKeys.value.join(','),
    IsOpen: open,
    PageId: 0,
    Type: props.type,
  };
  openValidation();
}

function handleResetDefault() {
  currentRow.value = null;
  openValidation({ reset: true });
}

function handlePassClose() {
  if (
    currentRow.value &&
    !props.listLoading &&
    !hasSelection.value &&
    !String(currentRow.value.Id).includes(',')
  ) {
    currentRow.value.IsOpen = !currentRow.value.IsOpen;
  }
  currentRow.value = null;
  isResetAction.value = false;
}

function handlePassConfirm(data: Record<string, unknown>) {
  if (data.reset || isResetAction.value) {
    emit('reset', {
      Type: props.type,
      ...data,
    });
    currentRow.value = null;
    isResetAction.value = false;
    selectedRowKeys.value = [];
    return;
  }

  if (!currentRow.value) {
    return;
  }

  emit('update', {
    Id: currentRow.value.Id,
    IsOpen: currentRow.value.IsOpen,
    Type: props.type,
    ...data,
  });
  currentRow.value = null;
  isResetAction.value = false;
  selectedRowKeys.value = [];
}
</script>

<template>
  <div>
    <div class="mb-4">
      <Space>
        <Button
          :disabled="!hasSelection"
          :loading="listLoading"
          type="primary"
          @click="handleBatchAction(true)"
        >
          一键开启
        </Button>
        <Button
          :disabled="!hasSelection"
          :loading="listLoading"
          danger
          @click="handleBatchAction(false)"
        >
          一键关闭
        </Button>
        <Button :loading="listLoading" @click="handleResetDefault">
          恢复默认配置
        </Button>
      </Space>
    </div>

    <Table
      bordered
      :columns="columns"
      :data-source="activeList"
      :loading="listLoading"
      :pagination="false"
      :row-key="(record) => record.Id"
      :row-selection="{
        selectedRowKeys,
        onChange: (keys) => (selectedRowKeys = keys as Array<number | string>),
      }"
      :scroll="{ x: 980, y: antTableScrollY(60) }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'path'">
          <div class="whitespace-pre-line px-2 text-left">
            {{ getSecurityPathName(record.PageId) }}
          </div>
        </template>
        <template v-else-if="column.key === 'IsOpen'">
          <Switch
            :checked="!!record.IsOpen"
            @change="
              (checked) =>
                handleSwitchChange(record as SecuritySettingItem, !!checked)
            "
          />
        </template>
        <template v-else-if="column.key === 'HandlerTime'">
          {{ formatReportDateTime(record.HandlerTime) }}
        </template>
      </template>
    </Table>

    <PassPopup
      ref="passPopupRef"
      :type="type === 2 ? 'private' : 'gcode'"
      @close="handlePassClose"
      @confirm="handlePassConfirm"
    />
  </div>
</template>
