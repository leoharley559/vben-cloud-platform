<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  Result,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  fetchCountriesConfigListApi,
  fetchGameCountriesStateApi,
  updateGameCountriesStateApi,
} from '#/api/operationManage/country';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'CountrySet' });

interface CountryRow {
  FieldName: string;
  FieldNameForGame?: string;
  Id: number;
  Status1: number;
  Status2: number;
}

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10024));
const canEdit = computed(() => checkPermission(10025));

const loading = ref(false);
const saving = ref(false);
const filterName = ref('');
/** 1=按钮关闭为屏蔽(CountriesAllow/Status1)；2=按钮关闭允许访问(Countries/Status2) */
const mode = ref<1 | 2>(1);
/** 完整国家列表（搜索仅做前端过滤，避免保存时覆盖未展示项） */
const allTableData = ref<CountryRow[]>([]);
const selectedRowKeys = ref<number[]>([]);
/** 状态接口原始字段，保存时与 Countries/CountriesAllow/Option 合并（对齐旧站） */
const stateSnapshot = ref<Record<string, unknown>>({});
const originalPayload = ref({
  Countries: '',
  CountriesAllow: '',
  Option: 1 as 1 | 2,
});

const modeOptions = [
  { label: '按钮关闭为屏蔽', value: 1 },
  { label: '按钮关闭允许访问', value: 2 },
];

const columns = [
  {
    align: 'center' as const,
    key: 'index',
    title: '序号',
    width: 72,
  },
  { dataIndex: 'name', key: 'name', title: '国家名称' },
  {
    align: 'center' as const,
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    width: 140,
  },
];

const tableData = computed(() => {
  const keyword = filterName.value.trim().toLowerCase();
  if (!keyword) {
    return allTableData.value;
  }
  return allTableData.value.filter((item) => {
    const name = String(item.FieldName || '').toLowerCase();
    const gameName = String(item.FieldNameForGame || '').toLowerCase();
    const label = `${gameName}-${name}`;
    return (
      name.includes(keyword) ||
      gameName.includes(keyword) ||
      label.includes(keyword)
    );
  });
});

/** Option1 → CountriesAllow；Option2 → Countries（基于全量列表） */
function buildPayloadCountries() {
  const allowIds = allTableData.value
    .filter((item) => item.Status1 === 1)
    .map((item) => item.Id);
  const blockIds = allTableData.value
    .filter((item) => item.Status2 === 1)
    .map((item) => item.Id);
  return {
    Countries: blockIds.join(','),
    CountriesAllow: allowIds.join(','),
    Option: mode.value,
  };
}

const hasChanges = computed(() => {
  const current = buildPayloadCountries();
  return (
    current.Countries !== originalPayload.value.Countries ||
    current.CountriesAllow !== originalPayload.value.CountriesAllow ||
    current.Option !== originalPayload.value.Option
  );
});

function parseIdList(value: unknown) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number)
    .filter((item) => Number.isFinite(item));
}

/** 后端 Option=0 时归一为模式 1（旧站 select 无 0 选项会导致开关不渲染） */
function normalizeOption(value: unknown): 1 | 2 {
  return Number(value) === 2 ? 2 : 1;
}

async function loadData() {
  loading.value = true;
  selectedRowKeys.value = [];
  try {
    // 始终拉全量配置；名称筛选改前端过滤，避免带 Name 查询后保存丢其它国家
    const [configResult, stateResult] = await Promise.all([
      fetchCountriesConfigListApi({
        Name: '',
        Page: 1,
        PageSize: 9999,
      }),
      fetchGameCountriesStateApi(),
    ]);

    const state = (stateResult || {}) as Record<string, unknown>;
    stateSnapshot.value = { ...state };

    // Countries → Status2（模式2）；CountriesAllow → Status1（模式1）
    const countries = parseIdList(state.Countries);
    const countriesAllow = parseIdList(state.CountriesAllow);
    const option = normalizeOption(state.Option);

    originalPayload.value = {
      Countries: countries.join(','),
      CountriesAllow: countriesAllow.join(','),
      Option: option,
    };
    mode.value = option;

    allTableData.value = ((configResult.Items || []) as CountryRow[]).map(
      (item) => ({
        ...item,
        Status1: countriesAllow.includes(item.Id) ? 1 : 0,
        Status2: countries.includes(item.Id) ? 1 : 0,
      }),
    );
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  selectedRowKeys.value = [];
}

function resetFilters() {
  filterName.value = '';
  selectedRowKeys.value = [];
}

function handleModeChange() {
  selectedRowKeys.value = [];
}

function handleSelectionChange(keys: (number | string)[]) {
  selectedRowKeys.value = keys.map(Number).filter((id) => Number.isFinite(id));
}

function changeAllStatus(status: 0 | 1) {
  if (!selectedRowKeys.value.length) {
    return;
  }
  const selected = new Set(selectedRowKeys.value);
  allTableData.value = allTableData.value.map((item) => {
    if (!selected.has(item.Id)) {
      return item;
    }
    return mode.value === 1
      ? { ...item, Status1: status }
      : { ...item, Status2: status };
  });
}

/** 恢复当前模式下的默认（全部关闭），需再点保存提交 */
function handleResetDefault() {
  if (mode.value === 1) {
    allTableData.value = allTableData.value.map((item) => ({
      ...item,
      Status1: 0,
    }));
  } else {
    allTableData.value = allTableData.value.map((item) => ({
      ...item,
      Status2: 0,
    }));
  }
  message.info('已恢复当前模式默认状态，请保存并提交后生效');
}

function setRowStatus(row: CountryRow, checked: boolean) {
  if (mode.value === 1) {
    row.Status1 = checked ? 1 : 0;
  } else {
    row.Status2 = checked ? 1 : 0;
  }
}

async function saveChanges() {
  if (!canEdit.value) {
    return;
  }
  saving.value = true;
  try {
    // 对齐旧站：在状态接口返回体上覆盖 Countries / CountriesAllow / Option
    await updateGameCountriesStateApi({
      ...stateSnapshot.value,
      ...buildPayloadCountries(),
    });
    message.success('区域屏蔽设置已保存');
    await loadData();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (canViewPage.value) {
    void loadData();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 推广地区屏蔽"
    title="区域屏蔽"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base font-medium">推广地区屏蔽</span>
          <Tooltip
            title="屏蔽后需要等待约 5 分钟才会生效，屏蔽功能不会有踢线效果"
          >
            <span class="cursor-help text-xs text-gray-400">说明</span>
          </Tooltip>
        </div>
        <Space>
          <Select
            v-model:value="mode"
            :options="modeOptions"
            style="width: 200px"
            @change="handleModeChange"
          />
          <Button
            v-if="canEdit"
            :disabled="!hasChanges"
            :loading="saving"
            type="primary"
            @click="saveChanges"
          >
            保存并提交
          </Button>
        </Space>
      </div>

      <div class="mb-4 flex flex-wrap items-end gap-2">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterName"
            allow-clear
            style="width: 260px"
            @press-enter="handleSearch"
            placeholder="请输入国家名称"
          >
            <template #addonBefore>国家名称</template>
          </Input>
        </div>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="resetFilters">重置</Button>
        <div class="ml-auto flex flex-wrap gap-2">
          <Button
            :disabled="selectedRowKeys.length === 0"
            type="primary"
            ghost
            @click="changeAllStatus(1)"
          >
            一键开启
          </Button>
          <Button
            :disabled="selectedRowKeys.length === 0"
            danger
            @click="changeAllStatus(0)"
          >
            一键关闭
          </Button>
          <Button type="default" @click="handleResetDefault">
            恢复默认配置
          </Button>
        </div>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :row-key="(row: CountryRow) => row.Id"
        :row-selection="{
          onChange: handleSelectionChange,
          selectedRowKeys,
        }"
        :scroll="{ y: 560 }"
        size="middle"
        table-layout="fixed"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'name'">
            {{ record.FieldNameForGame }}-{{ record.FieldName }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch
              :checked="
                mode === 1 ? record.Status1 === 1 : record.Status2 === 1
              "
              :disabled="!canEdit"
              @change="(checked) => setRowStatus(record, !!checked)"
            />
          </template>
        </template>
      </Table>
    </Card>
  </Page>
  <Result
    v-else
    status="403"
    sub-title="无区域屏蔽查看权限(10024)"
    title="403"
  />
</template>
