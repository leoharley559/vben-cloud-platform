<script lang="ts" setup>
import type { FormInstance, TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createAlgorithmTemplateApi,
  createCommConfigApi,
  createCommTemplateApi,
  createMultCommTemplateApi,
  createVenueTemplateApi,
  deleteAlgorithmTemplateApi,
  deleteCommConfigApi,
  deleteCommTemplateApi,
  deleteMultCommTemplateApi,
  deleteVenueTemplateApi,
  fetchAlgorithmTemplateListApi,
  fetchCommAlgorithmDataApi,
  fetchCommListApi,
  fetchCommTempListApi,
  fetchMultCommConfigApi,
  fetchMultCommTempListApi,
  fetchVenueListApi,
  fetchVenueTemplateListApi,
  resetAlgorithmApi,
  resetCommConfigApi,
  resetMultCommConfigApi,
  updateAlgorithmApi,
  updateAlgorithmTemplateApi,
  updateCommConfigApi,
  updateCommTemplateApi,
  updateMultCommConfigApi,
  updateMultCommTemplateApi,
  updateVenueConfigApi,
  updateVenueTemplateApi,
} from '#/api/netcash/commission-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';

import {
  cent,
  normalizeList,
  normalizeRows,
  percent100,
  safeRateRows,
} from '../commission-utils';

type Mode = 'algorithm' | 'multi' | 'single' | 'venue';
const props = defineProps<{ mode: Mode }>();
const { checkPermission, projectConfig } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const templateList = ref<Record<string, any>[]>([]);
const activeIndex = ref(0);
const rows = ref<Record<string, any>[]>([]);
const multiConfig = ref<Record<string, any>>({});
const loading = ref(false);
const templateOpen = ref(false);
const itemOpen = ref(false);
const saving = ref(false);
const algorithmUpdating = ref<number | string>();
const editingTemplate = ref(false);
const editingItem = ref<null | Record<string, any>>(null);
const templateFormRef = ref<FormInstance>();
const itemFormRef = ref<FormInstance>();
const templateForm = reactive({ Id: undefined as number | string | undefined, TemplateName: '' });
const itemForm = reactive<Record<string, any>>({});

const currentTemplate = computed(() => templateList.value[activeIndex.value]);
const isDefaultTemplate = computed(() => activeIndex.value === 0);

const permissions = computed(() => {
  if (props.mode === 'venue') {
    return {
      add: checkPermission(10_247),
      delete: checkPermission(10_249),
      edit: checkPermission(10_248),
      editItem: checkPermission(10_254),
      list: checkPermission(10_241),
      reset: false,
      view: checkPermission(10_239),
    };
  }
  if (props.mode === 'algorithm') {
    return {
      add: checkPermission(10_227),
      delete: checkPermission(10_229),
      edit: checkPermission(10_228),
      editItem: true,
      list: checkPermission(10_206),
      reset: checkPermission(12_568),
      view: checkPermission(10_486),
    };
  }
  return {
    add: checkPermission(10_227),
    delete: checkPermission(10_229),
    edit: checkPermission(10_228),
    editItem: checkPermission(10_237),
    list: checkPermission(10_206),
    reset: checkPermission(props.mode === 'multi' ? 12_567 : 12_566),
    view: checkPermission(10_205),
  };
});

const columns = computed<TableColumnsType>(() => {
  if (props.mode === 'multi') {
    return [
      { key: 'index', title: '序号', width: 70 },
      { dataIndex: 'Name', title: '场馆类型', width: 220 },
      { key: 'WinLoseRate', title: '输赢分成', width: 160 },
      { key: 'WaterRate', title: '流水分成', width: 160 },
      { key: 'actions', title: '操作', width: 100 },
    ];
  }
  if (props.mode === 'venue') {
    return [
      { key: 'index', title: '序号', width: 70 },
      { key: 'venue', title: '场馆名称', width: 220 },
      { key: 'Rate', title: '场馆成本', width: 160 },
      { key: 'Fee', title: '收取费率', width: 160 },
      { key: 'actions', title: '操作', width: 100 },
    ];
  }
  if (props.mode === 'algorithm') {
    return [
      { key: 'index', title: '序号', width: 70 },
      { key: 'typeName', title: '参数类型', width: 240 },
      { key: 'parameter', title: '参数', width: 420 },
      { dataIndex: 'Desc', title: '参数作用', width: 360 },
    ];
  }
  return [
    { key: 'index', title: '序号', width: 70 },
    { dataIndex: 'LevelName', title: '等级名称', width: 180 },
    { key: 'ActiveNum', title: '活跃会员', width: 160 },
    { key: 'SumWinLose', title: '月总输赢', width: 180 },
    { key: 'CommissionRate', title: '佣金比例', width: 160 },
    { key: 'actions', title: '操作', width: 160 },
  ];
});

const radioTexts: Record<number, [string, string]> = {
  1: ['先扣除后算佣', '先算佣后扣除'],
  2: ['先扣除后算佣', '先算佣后扣除'],
  3: ['计算正盈利', '计算全部盈利'],
  5: ['满足一项', '两项都满足'],
  6: ['不累积', '累积'],
  8: ['不累积', '累积'],
  9: ['先扣除后算佣', '先算佣后扣除'],
  11: ['忽略负业绩子代理数据', '包含负业绩子代理数据'],
  12: ['平台承担', '平台不承担'],
};
const radioTypes = new Set([1, 2, 3, 5, 6, 8, 9, 11, 12]);
const inputTypes = new Set([1, 2, 3, 4, 9, 10]);

function parseServiceRates(value: unknown) {
  const rates: Record<string, string> = {};
  if (typeof value !== 'string') return rates;
  for (const group of value.split('|')) {
    const [apiName, levels = ''] = group.split('#');
    const firstRate = levels.split(';')[0]?.split(':')[1];
    if (apiName && firstRate !== undefined) rates[apiName] = firstRate;
  }
  return rates;
}

function algorithmName(row: Record<string, any>) {
  return row.TypeNameC || String(row.TypeName || '').replaceAll('_', ' ') || '-';
}

function algorithmValue(row: Record<string, any>) {
  if (Number(row.Type) === 5) {
    return `充值金额 ${cent(row.Value)}；有效投注 ${cent(row.Value2)}`;
  }
  if (Number(row.Type) === 7) {
    return `存款费率 ${percent100(row.Value)}；取款费率 ${percent100(row.Value2)}`;
  }
  if (Number(row.Type) === 13) {
    const [daily = 0, weekly = 0, monthly = 0] = String(row.Values || '').split(',');
    return `日结 ${daily} 人；周结 ${weekly} 人；月结 ${monthly} 人`;
  }
  return percent100(row.Value);
}

async function loadTemplates(selectLast = false) {
  loading.value = true;
  try {
    let result: unknown;
    switch (props.mode) {
    case 'multi': {
    result = await fetchMultCommTempListApi();
    break;
    }
    case 'single': {
    result = await fetchCommTempListApi();
    break;
    }
    case 'venue': {
    result = await fetchVenueTemplateListApi();
    break;
    }
    default: { result = await fetchAlgorithmTemplateListApi();
    }
    }
    templateList.value = normalizeList(result).items;
    if (templateList.value.length === 0) {
      activeIndex.value = 0;
      rows.value = [];
      return;
    }
    activeIndex.value = selectLast
      ? templateList.value.length - 1
      : Math.min(activeIndex.value, templateList.value.length - 1);
    await loadRows();
  } finally {
    loading.value = false;
  }
}

async function loadRows() {
  const templateId = currentTemplate.value?.Id;
  if (templateId === undefined) {
    rows.value = [];
    return;
  }
  loading.value = true;
  try {
    let result: unknown;
    switch (props.mode) {
    case 'multi': {
    result = await fetchMultCommConfigApi({ TemplateId: templateId });
    break;
    }
    case 'single': {
    result = await fetchCommListApi({ TemplateId: templateId });
    break;
    }
    case 'venue': {
    result = await fetchVenueListApi({ TemplateId: templateId });
    break;
    }
    default: { result = await fetchCommAlgorithmDataApi({ TemplateId: templateId });
    }
    }
    if (props.mode === 'multi') {
      const body = ((result ?? {}) as Record<string, any>).Data ?? result ?? {};
      multiConfig.value = { ...(body as Record<string, any>) };
      rows.value = safeRateRows((body as Record<string, any>)?.CommissionRateMulti);
    } else {
      const normalizedRows = normalizeRows(result);
      if (props.mode === 'venue') {
        const accountInfo = (projectConfig.value?.AccountInfo || {}) as Record<string, unknown>;
        const serviceRates = parseServiceRates(accountInfo.ServiceRateV2);
        const venueNames = gameConfig.value.platformGameType;
        const hasVenueNames = Object.keys(venueNames).length > 0;
        rows.value = normalizedRows
          .filter((row) => !hasVenueNames || Boolean(venueNames[String(row.ApiName ?? '')]))
          .map((row) => ({
            ...row,
            Name: venueNames[String(row.ApiName ?? '')] || row.ApiName || '-',
            Rate: serviceRates[String(row.ApiName ?? '')] ?? 0,
          }));
      } else {
        rows.value = normalizedRows;
      }
    }
  } finally {
    loading.value = false;
  }
}

async function selectTemplate(index: number) {
  if (index === activeIndex.value) return;
  activeIndex.value = index;
  await loadRows();
}

function openTemplate(edit = false) {
  editingTemplate.value = edit;
  templateForm.Id = edit ? currentTemplate.value?.Id : undefined;
  templateForm.TemplateName = edit ? String(currentTemplate.value?.TemplateName || '') : '';
  templateOpen.value = true;
}

async function submitTemplate() {
  await templateFormRef.value?.validate();
  saving.value = true;
  try {
    const payload = { ...templateForm };
    switch (props.mode) {
    case 'multi': {
      await (editingTemplate.value
        ? updateMultCommTemplateApi(payload)
        : createMultCommTemplateApi(payload));
    
    break;
    }
    case 'single': {
      await (editingTemplate.value ? updateCommTemplateApi(payload) : createCommTemplateApi(payload));
    
    break;
    }
    case 'venue': {
      await (editingTemplate.value
        ? updateVenueTemplateApi(payload)
        : createVenueTemplateApi(payload));
    
    break;
    }
    default: {
      await (editingTemplate.value
        ? updateAlgorithmTemplateApi(payload)
        : createAlgorithmTemplateApi(payload));
    }
    }
    message.success(editingTemplate.value ? '方案名称已更新' : '方案已新增');
    templateOpen.value = false;
    await loadTemplates(!editingTemplate.value);
  } finally {
    saving.value = false;
  }
}

function confirmDeleteTemplate() {
  const template = currentTemplate.value;
  if (isDefaultTemplate.value || !template) return;
  Modal.confirm({
    content: `确认删除方案「${template.TemplateName}」？`,
    title: '删除方案',
    onOk: async () => {
      const id = template.Id;
      switch (props.mode) {
      case 'multi': {
      await deleteMultCommTemplateApi(id);
      break;
      }
      case 'single': {
      await deleteCommTemplateApi(id);
      break;
      }
      case 'venue': {
      await deleteVenueTemplateApi(id);
      break;
      }
      default: { await deleteAlgorithmTemplateApi(id);
      }
      }
      activeIndex.value = 0;
      message.success('删除成功');
      await loadTemplates();
    },
  });
}

function confirmReset() {
  const template = currentTemplate.value;
  if (!template) return;
  Modal.confirm({
    content: '确认恢复系统预设？当前默认方案配置将被覆盖。',
    title: '恢复系统预设',
    onOk: async () => {
      const payload = { TemplateId: template.Id };
      if (props.mode === 'single') await resetCommConfigApi(payload);
      else if (props.mode === 'multi') await resetMultCommConfigApi(payload);
      else await resetAlgorithmApi(payload);
      message.success('已恢复系统预设');
      await loadRows();
    },
  });
}

function openItem(row?: Record<string, any>) {
  editingItem.value = row || null;
  for (const key of Object.keys(itemForm)) delete itemForm[key];
  switch (props.mode) {
  case 'multi': {
    Object.assign(itemForm, {
      GameType: row?.GameType,
      Name: row?.Name,
      WaterRate: Number(row?.WaterRate ?? 0) / 100,
      WinLoseRate: Number(row?.WinLoseRate ?? 0) / 100,
    });
  
  break;
  }
  case 'single': {
    Object.assign(itemForm, {
      ActiveNum: row?.ActiveNum ?? 0,
      CommissionRate: row?.CommissionRate ?? 0,
      Id: row?.Id,
      LevelName: row?.LevelName ?? '',
      SumWinLose: row ? Number(row.SumWinLose ?? 0) / 100 : 0,
    });
  
  break;
  }
  case 'venue': {
    Object.assign(itemForm, {
      ApiName: row?.ApiName,
      Fee: Number(row?.Fee ?? 0) / 100,
      Id: row?.Id,
      Name: row?.Name || row?.GameName || row?.ApiName,
    });
  
  break;
  }
  default: {
    Object.assign(itemForm, row, {
      Value: Number(row?.Value ?? 0) / 100,
      Value2: Number(row?.Value2 ?? 0) / 100,
    });
    const values = String(row?.Values || '').split(',');
    itemForm.minDaily = Number(values[0] || 0);
    itemForm.minWeekly = Number(values[1] || 0);
    itemForm.minMonthly = Number(values[2] || 0);
  }
  }
  itemOpen.value = true;
}

async function submitItem() {
  await itemFormRef.value?.validate();
  if (saving.value) return;
  if (props.mode === 'single') {
    const currentIndex = editingItem.value
      ? rows.value.findIndex((row) => String(row.Id) === String(editingItem.value?.Id))
      : rows.value.length;
    const previous = rows.value[currentIndex - 1];
    const next = editingItem.value ? rows.value[currentIndex + 1] : undefined;
    const active = Number(itemForm.ActiveNum);
    const winLose = Number(itemForm.SumWinLose);
    const validPrevious =
      !previous ||
      (active >= Number(previous.ActiveNum) &&
        winLose > Number(previous.SumWinLose) / 100);
    const validNext =
      !next ||
      (active <= Number(next.ActiveNum) &&
        winLose < Number(next.SumWinLose) / 100);
    if (!validPrevious || !validNext) {
      message.error('活跃会员数不得低于上一档且不得高于下一档，月总输赢须严格递增');
      return;
    }
  }
  saving.value = true;
  try {
    switch (props.mode) {
    case 'multi': {
      const rateRows = safeRateRows(rows.value).map((item) =>
        String(item.GameType) === String(itemForm.GameType)
          ? {
              ...item,
              WaterRate: Math.round(Number(itemForm.WaterRate) * 100),
              WinLoseRate: Math.round(Number(itemForm.WinLoseRate) * 100),
            }
          : item,
      );
      await updateMultCommConfigApi({
        ...multiConfig.value,
        CommissionRateMulti: JSON.stringify(rateRows),
      });
    
    break;
    }
    case 'single': {
      const payload = {
        ...itemForm,
        SumWinLose: Math.round(Number(itemForm.SumWinLose) * 100),
        TemplateId: currentTemplate.value?.Id,
      };
      await (editingItem.value ? updateCommConfigApi(payload) : createCommConfigApi(payload));
    
    break;
    }
    case 'venue': {
      await updateVenueConfigApi({
        ...itemForm,
        Fee: Math.round(Number(itemForm.Fee) * 100),
      });
    
    break;
    }
    default: {
      const payload: Record<string, any> = {
        ...itemForm,
        Value: Math.round(Number(itemForm.Value) * 100),
        Value2: Math.round(Number(itemForm.Value2) * 100),
      };
      if (Number(itemForm.Type) === 13) {
        payload.Values = [itemForm.minDaily, itemForm.minWeekly, itemForm.minMonthly].join(',');
      }
      await updateAlgorithmApi(payload);
    }
    }
    itemOpen.value = false;
    message.success(editingItem.value ? '编辑成功' : '新增成功');
    await loadRows();
  } finally {
    saving.value = false;
  }
}

async function updateAlgorithmRadio(row: Record<string, any>, value: number) {
  if (algorithmUpdating.value !== undefined) return;
  const field = Number(row.Type) === 6 || Number(row.Type) === 8 ? 'Value' : 'Additional';
  algorithmUpdating.value = row.Id;
  try {
    await updateAlgorithmApi({ ...row, [field]: value });
    message.success('设置已更新');
    await loadRows();
  } finally {
    algorithmUpdating.value = undefined;
  }
}

function confirmDeleteItem(row: Record<string, any>) {
  Modal.confirm({
    content: `确认删除等级「${row.LevelName || ''}」？`,
    title: '删除等级',
    onOk: async () => {
      await deleteCommConfigApi(row.Id);
      message.success('删除成功');
      await loadRows();
    },
  });
}

onMounted(async () => {
  if (props.mode === 'venue') {
    await ensureGameConfig().catch(() => undefined);
  }
  await loadTemplates();
});
</script>

<template>
  <div v-if="permissions.view">
    <Space class="mb-4" wrap>
      <Button
        v-for="(template, index) in templateList"
        :key="template.Id"
        :type="activeIndex === index ? 'primary' : 'default'"
        @click="selectTemplate(index)"
      >
        {{ template.TemplateName || `方案 ${index + 1}` }}
      </Button>
      <Button v-if="permissions.add" type="dashed" @click="openTemplate(false)">
        + 新增自定义方案
      </Button>
    </Space>

    <Card size="small">
      <div class="scheme-toolbar">
        <Space wrap>
          <span class="scheme-name-label">方案名称</span>
          <strong>{{ currentTemplate?.TemplateName || '暂无方案' }}</strong>
          <Button v-if="permissions.edit && currentTemplate" @click="openTemplate(true)">编辑名称</Button>
          <Button
            v-if="permissions.delete && currentTemplate"
            danger
            :disabled="isDefaultTemplate"
            @click="confirmDeleteTemplate"
          >
            删除方案
          </Button>
          <Button
            v-if="permissions.reset && currentTemplate"
            :disabled="!isDefaultTemplate"
            @click="confirmReset"
          >
            恢复系统预设
          </Button>
        </Space>
        <Button
          v-if="mode === 'single' && checkPermission(10_236)"
          type="primary"
          @click="openItem()"
        >
          新增等级
        </Button>
      </div>

      <Table
        v-if="permissions.list"
        class="mt-4"
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="false"
        :row-key="(row, index) => row.Id || row.GameType || index"
        :scroll="{ x: 'max-content' }"
        bordered
        size="small"
      >
        <template #emptyText><Empty description="暂无配置数据" /></template>
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'ActiveNum'">≥ {{ record.ActiveNum ?? 0 }}</template>
          <template v-else-if="column.key === 'SumWinLose'">{{ cent(record.SumWinLose) }}</template>
          <template v-else-if="column.key === 'CommissionRate'">{{ record.CommissionRate ?? 0 }}%</template>
          <template v-else-if="column.key === 'WinLoseRate'">{{ percent100(record.WinLoseRate) }}</template>
          <template v-else-if="column.key === 'WaterRate'">{{ percent100(record.WaterRate) }}</template>
          <template v-else-if="column.key === 'venue'">{{ record.Name || record.GameName || record.ApiName || '-' }}</template>
          <template v-else-if="column.key === 'Rate'">{{ record.Rate ?? 0 }}%</template>
          <template v-else-if="column.key === 'Fee'">{{ percent100(record.Fee) }}</template>
          <template v-else-if="column.key === 'typeName'">{{ algorithmName(record) }}</template>
          <template v-else-if="column.key === 'parameter'">
            <Space direction="vertical" size="small">
              <span v-if="inputTypes.has(Number(record.Type)) || [5, 7, 13].includes(Number(record.Type))">
                {{ algorithmValue(record) }}
                <Button type="link" size="small" @click="openItem(record)">编辑</Button>
              </span>
              <Radio.Group
                v-if="radioTypes.has(Number(record.Type))"
                :disabled="algorithmUpdating !== undefined"
                :value="[6, 8].includes(Number(record.Type)) ? record.Value : record.Additional"
                @change="updateAlgorithmRadio(record, $event.target.value)"
              >
                <Radio :value="0">{{ radioTexts[Number(record.Type)]?.[0] }}</Radio>
                <Radio :value="1">{{ radioTexts[Number(record.Type)]?.[1] }}</Radio>
              </Radio.Group>
            </Space>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button v-if="permissions.editItem" type="link" size="small" @click="openItem(record)">
                编辑
              </Button>
              <Button
                v-if="mode === 'single' && checkPermission(10_238)"
                danger
                type="link"
                size="small"
                @click="confirmDeleteItem(record)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="templateOpen"
      :confirm-loading="saving"
      :title="editingTemplate ? '编辑方案名称' : '新增自定义方案'"
      @ok="submitTemplate"
    >
      <Form ref="templateFormRef" :model="templateForm" layout="vertical">
        <Form.Item label="方案名称" name="TemplateName" :rules="[{ required: true, message: '请输入方案名称' }]">
          <Input v-model:value="templateForm.TemplateName" :maxlength="50" placeholder="请输入方案名称" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="itemOpen"
      :confirm-loading="saving"
      :title="mode === 'single' && !editingItem ? '新增等级' : '编辑配置'"
      width="560px"
      @ok="submitItem"
    >
      <Form ref="itemFormRef" :model="itemForm" :label-col="{ span: 7 }">
        <template v-if="mode === 'single'">
          <Form.Item label="等级名称" name="LevelName" :rules="[{ required: true, message: '请输入等级名称' }]">
            <Input v-model:value="itemForm.LevelName" />
          </Form.Item>
          <Form.Item label="活跃会员" name="ActiveNum" :rules="[{ required: true, message: '请输入活跃会员数' }]">
            <InputNumber v-model:value="itemForm.ActiveNum" :min="0" :precision="0" class="w-full" addon-before="≥" />
          </Form.Item>
          <Form.Item label="月总输赢" name="SumWinLose" :rules="[{ required: true, message: '请输入月总输赢' }]">
            <InputNumber v-model:value="itemForm.SumWinLose" :min="0" :precision="2" class="w-full" />
          </Form.Item>
          <Form.Item label="佣金比例" name="CommissionRate" :rules="[{ required: true, message: '请输入佣金比例' }]">
            <InputNumber v-model:value="itemForm.CommissionRate" :min="0" :max="100" :precision="0" class="w-full" addon-after="%" />
          </Form.Item>
        </template>
        <template v-else-if="mode === 'multi'">
          <Form.Item label="场馆类型"><Input v-model:value="itemForm.Name" disabled /></Form.Item>
          <Form.Item label="输赢分成" name="WinLoseRate" :rules="[{ required: true, message: '请输入输赢分成' }]">
            <InputNumber v-model:value="itemForm.WinLoseRate" :min="0" :max="100" :precision="2" class="w-full" addon-after="%" />
          </Form.Item>
          <Form.Item label="流水分成" name="WaterRate" :rules="[{ required: true, message: '请输入流水分成' }]">
            <InputNumber v-model:value="itemForm.WaterRate" :min="0" :max="100" :precision="2" class="w-full" addon-after="%" />
          </Form.Item>
        </template>
        <template v-else-if="mode === 'venue'">
          <Form.Item label="场馆名称"><Input v-model:value="itemForm.Name" disabled /></Form.Item>
          <Form.Item label="收取费率" name="Fee" :rules="[{ required: true, message: '请输入收取费率' }]">
            <InputNumber v-model:value="itemForm.Fee" :min="0.01" :max="100" :precision="2" class="w-full" addon-after="%" />
          </Form.Item>
        </template>
        <template v-else>
          <template v-if="Number(itemForm.Type) === 13">
            <Form.Item label="日结人数" name="minDaily" :rules="[{ required: true, message: '请输入日结人数' }]">
              <InputNumber v-model:value="itemForm.minDaily" :min="0" :precision="0" class="w-full" addon-after="人" />
            </Form.Item>
            <Form.Item label="周结人数" name="minWeekly" :rules="[{ required: true, message: '请输入周结人数' }]">
              <InputNumber v-model:value="itemForm.minWeekly" :min="0" :precision="0" class="w-full" addon-after="人" />
            </Form.Item>
            <Form.Item label="月结人数" name="minMonthly" :rules="[{ required: true, message: '请输入月结人数' }]">
              <InputNumber v-model:value="itemForm.minMonthly" :min="0" :precision="0" class="w-full" addon-after="人" />
            </Form.Item>
          </template>
          <template v-else>
            <Form.Item :label="Number(itemForm.Type) === 5 ? '充值金额' : (Number(itemForm.Type) === 7 ? '存款费率' : algorithmName(itemForm))" name="Value" :rules="[{ required: true, message: '请输入参数值' }]">
              <InputNumber v-model:value="itemForm.Value" :min="0" :max="Number(itemForm.Type) === 5 ? undefined : 100" :precision="2" class="w-full" :addon-after="Number(itemForm.Type) === 5 ? undefined : '%'" />
            </Form.Item>
            <Form.Item v-if="[5, 7].includes(Number(itemForm.Type))" :label="Number(itemForm.Type) === 5 ? '有效投注' : '取款费率'" name="Value2" :rules="[{ required: true, message: '请输入参数值' }]">
              <InputNumber v-model:value="itemForm.Value2" :min="0" :max="Number(itemForm.Type) === 7 ? 100 : undefined" :precision="2" class="w-full" :addon-after="Number(itemForm.Type) === 7 ? '%' : undefined" />
            </Form.Item>
          </template>
        </template>
      </Form>
    </Modal>
  </div>
  <Empty v-else description="无此模块查看权限" />
</template>

<style scoped>
.scheme-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.scheme-name-label {
  padding: 5px 12px;
  color: #fff;
  background: #1677ff;
  border-radius: 6px;
}
</style>
