<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  createBackWaterSchemeApi,
  deleteBackWaterSchemeApi,
  fetchBackWaterSchemeDetailApi,
  fetchBackWaterSchemeListApi,
  updateBackWaterSchemeNameApi,
  updateBackWaterSchemeRuleApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  formatPercentFromStorage,
  formatPercentToStorage,
} from '#/utils/game-config';

defineOptions({ name: 'BackWaterSchemePanel' });

interface SchemeRow {
  Id: number | string;
  Name?: string;
  PackageName?: string;
  SchemeName?: string;
  Status?: number;
}

interface RuleRow {
  Id?: number | string;
  Name?: string;
  [key: string]: number | string | undefined;
}

interface LangTextItem {
  IsActive?: number;
  LangGroupId?: number | string;
  MultiDesc?: string;
  MultiRule?: string;
  Rule: RuleRow[] | string;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canRename = computed(
  () => checkPermission(11098) || checkPermission(11073),
);
const canEditRule = computed(
  () => checkPermission(11095) || checkPermission(11073),
);
const canCreate = computed(() => checkPermission(11097));
const canDelete = computed(
  () => checkPermission(11097) || checkPermission(11096),
);

const langGroups = computed(
  () => projectConfig.value?.LangGroup?.filter((item) => item.Id) || [],
);

const vipLevels = computed(() => {
  const map = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId: number;
    VipLevelName: string;
  }>;
  if (map.length) {
    return map;
  }
  return Array.from({ length: 11 }, (_, i) => ({
    VipLevelId: i,
    VipLevelName: `VIP${i}`,
  }));
});

const renameVisible = ref(false);
const ruleVisible = ref(false);
const ruleEditVisible = ref(false);
const saving = ref(false);
const ruleLoading = ref(false);
const createLoading = ref(false);

const renameForm = reactive({
  Id: '' as number | string,
  Name: '',
});

const currentSchemeId = ref<number | string>('');
const schemeDetail = ref<Record<string, unknown>>({});
const ruleRows = ref<RuleRow[]>([]);
const langTextList = ref<LangTextItem[]>([]);
const editIndex = ref(-1);

const ruleForm = reactive<Record<string, number | string>>({
  Id: '',
  Name: '',
});

function schemeName(row: SchemeRow) {
  return String(row.Name || row.SchemeName || '');
}

const gridOptions: VxeTableGridOptions<SchemeRow> = {
  columns: [
    {
      field: 'Name',
      formatter: ({ row }) => schemeName(row),
      minWidth: 160,
      title: '方案名称',
    },
    { field: 'PackageName', minWidth: 120, title: '包名' },
    {
      field: 'Status',
      slots: { default: 'status' },
      title: '状态',
      width: 90,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 220,
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchBackWaterSchemeListApi({
          Page: 1,
          PageSize: 200,
        });
        const items = (result.Items || []) as unknown as SchemeRow[];
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function handleCreateScheme() {
  const langGroupId = langGroups.value[0]?.Id;
  if (!langGroupId) {
    message.warning('未配置语言群组，无法新增方案');
    return;
  }
  createLoading.value = true;
  try {
    await createBackWaterSchemeApi({ LangGroupId: langGroupId });
    message.success('方案已新增');
    await gridApi.reload();
  } finally {
    createLoading.value = false;
  }
}

function handleDeleteScheme(row: SchemeRow) {
  Modal.confirm({
    content: `确认删除方案「${schemeName(row)}」？`,
    title: '删除方案',
    onOk: async () => {
      await deleteBackWaterSchemeApi(row.Id);
      message.success('删除成功');
      await gridApi.reload();
    },
  });
}

const ruleColumns = computed(() => [
  { dataIndex: 'Name', key: 'Name', title: '返水类型', width: 140 },
  ...vipLevels.value.map((level) => ({
    customRender: ({ record }: { record: RuleRow }) => {
      const raw = record[`Level${level.VipLevelId}`];
      if (raw === undefined || raw === null || raw === '') {
        return '-';
      }
      return `${formatPercentFromStorage(raw)}%`;
    },
    key: `Level${level.VipLevelId}`,
    title: level.VipLevelName,
    width: 90,
  })),
  { key: 'action', title: '操作', width: 90 },
]);

function openRename(row: SchemeRow) {
  renameForm.Id = row.Id;
  renameForm.Name = schemeName(row);
  renameVisible.value = true;
}

async function submitRename() {
  const name = renameForm.Name.trim();
  if (!name) {
    message.warning('请输入方案名称');
    return;
  }
  saving.value = true;
  try {
    await updateBackWaterSchemeNameApi({
      Id: renameForm.Id,
      Name: name,
    });
    message.success('重命名成功');
    renameVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function parseLangText(raw: unknown): LangTextItem[] {
  if (!raw || raw === 'null') {
    return [];
  }
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        Rule:
          typeof item.Rule === 'string'
            ? (JSON.parse(item.Rule || '[]') as RuleRow[])
            : ((item.Rule || []) as RuleRow[]),
      }));
    }
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed as Record<string, LangTextItem>).map(
        (item) => ({
          ...item,
          Rule:
            typeof item.Rule === 'string'
              ? (JSON.parse(item.Rule || '[]') as RuleRow[])
              : ((item.Rule || []) as RuleRow[]),
        }),
      );
    }
  } catch {
    return [];
  }
  return [];
}

async function openRules(row: SchemeRow) {
  currentSchemeId.value = row.Id;
  ruleVisible.value = true;
  ruleLoading.value = true;
  try {
    const detail = await fetchBackWaterSchemeDetailApi({ Id: row.Id });
    schemeDetail.value = detail || {};
    const ruleTemplate = Array.isArray(detail?.Rule)
      ? (detail.Rule as RuleRow[])
      : typeof detail?.Rule === 'string'
        ? (JSON.parse(detail.Rule || '[]') as RuleRow[])
        : [];
    langTextList.value = parseLangText(detail?.LangText);
    ruleRows.value = ruleTemplate.length
      ? ruleTemplate
      : (langTextList.value[0]?.Rule as RuleRow[]) || [];
  } catch {
    ruleRows.value = [];
    langTextList.value = [];
  } finally {
    ruleLoading.value = false;
  }
}

function openEditRule(row: RuleRow, index: number) {
  editIndex.value = index;
  ruleForm.Id = row.Id || '';
  ruleForm.Name = String(row.Name || '');
  for (const level of vipLevels.value) {
    const key = `Level${level.VipLevelId}`;
    const raw = row[key];
    ruleForm[key] =
      raw === undefined || raw === null || raw === ''
        ? 0
        : Number(formatPercentFromStorage(raw));
  }
  ruleEditVisible.value = true;
}

async function submitRuleEdit() {
  if (!String(ruleForm.Name || '').trim()) {
    message.warning('请输入返水类型');
    return;
  }
  const next: RuleRow = {
    Id: ruleForm.Id,
    Name: String(ruleForm.Name).trim(),
  };
  for (const level of vipLevels.value) {
    const key = `Level${level.VipLevelId}`;
    next[key] = formatPercentToStorage(Number(ruleForm[key] || 0));
  }

  const rules = [...ruleRows.value];
  rules[editIndex.value] = next;
  ruleRows.value = rules;

  const langText = langTextList.value.length
    ? langTextList.value.map((item, idx) => {
        const itemRules = Array.isArray(item.Rule) ? [...item.Rule] : [];
        if (idx === 0 || itemRules[editIndex.value]) {
          itemRules[editIndex.value] = {
            ...next,
            Name:
              idx === 0 ? next.Name : itemRules[editIndex.value]?.Name || '',
          };
        }
        return {
          ...item,
          MultiDesc: '',
          MultiRule: '',
          Rule: JSON.stringify(itemRules),
        };
      })
    : [
        {
          IsActive: 1,
          Rule: JSON.stringify(rules),
        },
      ];

  saving.value = true;
  try {
    await updateBackWaterSchemeRuleApi({
      Id: currentSchemeId.value,
      LangText: JSON.stringify(langText),
      Rule: JSON.stringify(rules),
    });
    message.success('规则已保存');
    ruleEditVisible.value = false;
    await openRules({ Id: currentSchemeId.value });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Button
        v-if="canCreate"
        :loading="createLoading"
        type="primary"
        @click="handleCreateScheme"
      >
        新增方案
      </Button>
      <span class="text-xs text-gray-400">
        已支持方案新增/删除、重命名与规则 VIP 比例编辑；拖拽排序/多语言待续。
      </span>
    </div>
    <Grid>
      <template #status="{ row }">
        <Tag :color="Number(row.Status) === 1 ? 'success' : 'default'">
          {{ Number(row.Status) === 1 ? '启用' : '停用' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Space :size="0">
          <Button
            v-if="canRename"
            size="small"
            type="link"
            @click="openRename(row)"
          >
            重命名
          </Button>
          <Button
            v-if="canEditRule"
            size="small"
            type="link"
            @click="openRules(row)"
          >
            规则
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDeleteScheme(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="renameVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="修改方案名称"
      @ok="submitRename"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="方案名称" required>
          <Input v-model:value="renameForm.Name" maxlength="50" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="ruleVisible"
      :footer="null"
      destroy-on-close
      title="返水规则"
      width="960px"
    >
      <Table
        :columns="ruleColumns"
        :data-source="ruleRows"
        :loading="ruleLoading"
        :pagination="false"
        row-key="Id"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'action'">
            <Button
              v-if="canEditRule"
              size="small"
              type="link"
              @click="openEditRule(record, index)"
            >
              编辑
            </Button>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="ruleEditVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑返水规则"
      width="520px"
      @ok="submitRuleEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="返水类型" required>
          <Input v-model:value="ruleForm.Name" maxlength="32" />
        </Form.Item>
        <Form.Item
          v-for="level in vipLevels"
          :key="level.VipLevelId"
          :label="level.VipLevelName"
        >
          <InputNumber
            v-model:value="ruleForm[`Level${level.VipLevelId}`] as number"
            :min="0"
            :precision="2"
            addon-after="%"
            class="!w-full"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
