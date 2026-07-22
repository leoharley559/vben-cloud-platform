<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiAssistantContentViewItem } from '#/api/operationManage/ai-assistant';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Result,
  Select,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchAiAssistantCategoryListApi,
  fetchAiAssistantContentViewListApi,
} from '#/api/operationManage/ai-assistant';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useProjectConfig } from '#/composables/use-project-config';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getTodayRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'PlayerVisitRecordPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canViewTable = computed(() => checkPermission(12739));

const defaultRange = getTodayRangeSeconds();
const categoryOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);
const previewOpen = ref(false);
const previewContent = ref('');

const filterContentId = ref('');
const filterCategoryId = ref<number | string>('');
const filterTitle = ref('');
const filterContent = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

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

function extractTitle(langInfos?: Array<Record<string, unknown>>) {
  const first = langInfos?.[0];
  return String(first?.Title || first?.title || '-');
}

function extractContent(langInfos?: Array<Record<string, unknown>>) {
  const first = langInfos?.[0];
  return String(first?.Content || first?.content || '-');
}

function formatSatisfaction(value?: number) {
  if (!value) {
    return { color: 'default', text: '未评价' };
  }
  if (value === -1) {
    return { color: 'warning', text: '无帮助' };
  }
  return { color: 'success', text: '有帮助' };
}

function buildFilter() {
  const filters: Array<{ key: string; value: string }> = [
    { key: 'PlayerId', value: String(props.playerId) },
  ];
  if (filterContentId.value) {
    filters.push({ key: 'Id', value: filterContentId.value });
  }
  if (filterCategoryId.value) {
    filters.push({ key: 'CategoryId', value: String(filterCategoryId.value) });
  }
  if (filterTitle.value) {
    filters.push({ key: 'Title', value: filterTitle.value });
  }
  if (filterContent.value) {
    filters.push({ key: 'Content', value: filterContent.value });
  }
  const [begin, end] = filterDateRange.value || [];
  filters.push({
    key: 'BeginTime',
    value: String(begin ? begin.startOf('day').unix() : defaultRange.BeginTime),
  });
  filters.push({
    key: 'EndTime',
    value: String(end ? end.endOf('day').unix() : defaultRange.EndTime),
  });
  return filters;
}

function getLangGroupIds() {
  const groups = projectConfig.value?.LangGroup || [];
  return groups.map((item) => item.Id).join(',');
}

const gridOptions: VxeTableGridOptions<AiAssistantContentViewItem> = {
  columns: [
    { field: 'ContentId', minWidth: 100, title: '问题编号' },
    {
      field: 'PlayerName',
      formatter: ({ cellValue }) => String(cellValue || '游客'),
      minWidth: 120,
      title: '玩家账号',
    },
    {
      field: 'Title',
      formatter: ({ row }) => extractTitle(row.LangInfos),
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '二级标题',
    },
    {
      field: 'Content',
      minWidth: 100,
      slots: { default: 'content' },
      title: '三级内容',
    },
    { field: 'CategoryTitle', minWidth: 140, title: '一级标题' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '访问时间',
    },
    {
      field: 'Satisfaction',
      minWidth: 100,
      slots: { default: 'satisfaction' },
      title: '评价',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchAiAssistantContentViewListApi({
          Filter: JSON.stringify(buildFilter()),
          LangGroupIds: getLangGroupIds(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

async function loadCategories() {
  const result = await fetchAiAssistantCategoryListApi({
    Page: 1,
    PageSize: 200,
  });
  categoryOptions.value = (result?.Items || []).map((item) => ({
    label: String(item.Title || item.Id),
    value: item.Id as number | string,
  }));
}

function openPreview(row: AiAssistantContentViewItem) {
  previewContent.value = extractContent(row.LangInfos);
  previewOpen.value = true;
}

function reloadGrid() {
  if (props.playerId && canViewTable.value) {
    gridApi.reload();
  }
}

watch(
  () => props.playerId,
  () => {
    reloadGrid();
  },
);

onMounted(async () => {
  await loadCategories();
  reloadGrid();
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterContentId"
        allow-clear
        placeholder="问题编号"
        style="width: 160px"
      >
        <template #addonBefore>问题编号</template>
      </Input>
      <Select
        v-model:value="filterCategoryId"
        allow-clear
        :options="categoryOptions"
        placeholder="一级标题"
        style="width: 180px"
      />
      <Input
        v-model:value="filterTitle"
        allow-clear
        placeholder="二级标题"
        style="width: 180px"
      />
      <Input
        v-model:value="filterContent"
        allow-clear
        placeholder="三级内容"
        style="width: 180px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
    </div>

    <Grid>
      <template #content="{ row }">
        <Button size="small" type="link" @click="openPreview(row)">
          预览
        </Button>
      </template>
      <template #satisfaction="{ row }">
        <Tag :color="formatSatisfaction(row.Satisfaction).color">
          {{ formatSatisfaction(row.Satisfaction).text }}
        </Tag>
      </template>
    </Grid>

    <Modal
      v-model:open="previewOpen"
      :footer="null"
      title="内容预览"
      width="640px"
    >
      <div class="whitespace-pre-wrap text-sm">{{ previewContent }}</div>
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12739 才能查看访问记录"
    title="无权限"
  />
</template>
