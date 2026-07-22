<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchApplyServiceListApi,
  fetchEndReasonListApi,
  fetchWorkQuestionTypeListApi,
  handleApplyServiceApi,
  rejectApplyServiceApi,
} from '#/api/operationManage/apply-service';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import {
  APPLY_SERVICE_STATUS_MAP,
  formatOperationDateTime,
} from '#/utils/operation-status';

defineOptions({ name: 'ApplyServicePanel' });

interface ApplyRow {
  Id: number | string;
  Content?: string;
  CreateTime?: number | string;
  FileUrl?: string;
  LoginAccount?: string;
  OperatorUsername?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Remark?: string;
  RemarkStatusChange?: string;
  Status?: number;
  SupporterName?: string;
  SupporterUsername?: string;
  TypeName?: string;
  UpdateTime?: number | string;
  WorkQuestionType?: number | string;
  WorkQuestionTypeName?: string;
  newQuest?: string;
}

interface OptionItem {
  label: string;
  value: number | string;
}

const { checkPermission, checkPermissionByKey } = useCloudPermission();
const { packageOptions } = useOperationOptions();

/** 操作列：旧站 pleyerOrderHandle(12431) || 12430 */
const canShowActions = computed(
  () =>
    checkPermissionByKey('pleyerOrderHandle') ||
    checkPermission(12_430) ||
    checkPermission(10_079),
);
/** 通过：applyServicePass(12437) */
const canPass = computed(
  () => checkPermissionByKey('applyServicePass') || checkPermission(10_079),
);
/** 驳回：applyService 模式下旧站无额外权限门禁（仅 Status==2） */
const canReject = computed(() => true);
/** 查看：applyServiceCheck(12438) || pleyerOrderCheck(12439) */
const canCheck = computed(
  () =>
    checkPermissionByKey('applyServiceCheck') ||
    checkPermissionByKey('pleyerOrderCheck') ||
    checkPermission(10_079),
);
const canFilterQuestType = computed(
  () =>
    checkPermissionByKey('playerOrderQuestType') || checkPermission(10_079),
);
const canExport = computed(
  () => checkPermission(12_546) || checkPermission(12_547),
);

/** 对齐旧站 listQuery：默认今天（getBeforeDateTimestamp(1,false)～今天 23:59） */
const todayRange = (): [dayjs.Dayjs, dayjs.Dayjs] => [
  dayjs().startOf('day'),
  dayjs().endOf('day'),
];

/** 与旧站 listQuery / Status 对齐 */
const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterSupporterUsername = ref('');
const filterOperatorUsername = ref('');
const filterWorkQuestionType = ref<number | string>();
const filterEndReasonType = ref<number | string>();
/** 旧站多选；含 '' 表示全部 */
const filterStatus = ref<Array<number | string>>(['']);
const isAllStatus = ref(true);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(todayRange());

const workQuestOptions = ref<OptionItem[]>([]);
const endReasonOptions = ref<OptionItem[]>([]);
const workQuestTitleMap = ref<Map<number | string, string>>(new Map());
const exportLoading = ref(false);

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

const statusOptions = computed(() => [
  { label: '全部', value: '' },
  ...Object.entries(APPLY_SERVICE_STATUS_MAP)
    .filter(([value]) => value !== '0')
    .map(([value, label]) => ({
      label,
      value: Number(value),
    })),
]);

const modalOpen = ref(false);
const submitting = ref(false);
const form = reactive({
  Id: '' as number | string,
  Remark: '',
  mode: 'pass' as 'pass' | 'reject',
});

function statusColor(status?: number) {
  if (Number(status) === 1) {
    return 'success';
  }
  if (Number(status) === 5 || Number(status) === 4) {
    return 'error';
  }
  if (Number(status) === 2) {
    return 'processing';
  }
  return 'default';
}

function resolveQuestTypeLabel(row: ApplyRow) {
  if (row.WorkQuestionTypeName) {
    return String(row.WorkQuestionTypeName);
  }
  const id = row.WorkQuestionType;
  if (id === undefined || id === null || id === '') {
    return '-';
  }
  return workQuestTitleMap.value.get(id) || String(id);
}

/** 对齐旧站 handleDataList：Content 第 3 段为「新问题」 */
function resolveNewQuest(row: ApplyRow) {
  if (row.newQuest) {
    return String(row.newQuest);
  }
  const content = String(row.Content || '');
  if (!content.includes('|')) {
    return content || '-';
  }
  return content.split('|')[2] || '-';
}

function parseContentParts(content?: string) {
  const parts = String(content || '').split('|');
  return {
    after: parts[2] || '',
    before: parts[1] || '',
    name: parts[0] || '',
  };
}

/** 对齐旧站：仅 Status==2（处理中）可过审/驳回 */
function isProcessing(row: ApplyRow) {
  return Number(row.Status) === 2;
}

function normalizeListItems(items: ApplyRow[]) {
  return items.map((item) => ({
    ...item,
    newQuest: resolveNewQuest(item),
  }));
}

/** 旧站 Status.toString()：全部 → ''；多选 → '1,2' */
function buildStatusParam() {
  const values = filterStatus.value;
  if (!values.length || values.includes('')) {
    return '';
  }
  return values.join(',');
}

function buildListQuery(page?: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value;
  return {
    BeginTime: begin.startOf('day').unix(),
    EndTime: end.endOf('day').unix(),
    LoginAccount: filterLoginAccount.value.trim(),
    OperatorUsername: filterOperatorUsername.value.trim(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
    Sort: '',
    Status: buildStatusParam(),
    SupporterUsername: filterSupporterUsername.value.trim(),
    Type: filterEndReasonType.value || '',
    WorkQuestionType: filterWorkQuestionType.value || '',
  };
}

const gridOptions: VxeTableGridOptions<ApplyRow> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'OrderId', minWidth: 140, title: '订单编号' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      sortable: true,
      title: '申请时间',
    },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      sortable: true,
      title: '完成时间',
    },
    {
      field: 'LoginAccount',
      minWidth: 140,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'TypeName', minWidth: 120, title: '结束理由' },
    {
      field: 'WorkQuestionTypeName',
      formatter: ({ row }) => resolveQuestTypeLabel(row),
      minWidth: 120,
      title: '问题类型',
    },
    {
      field: 'newQuest',
      formatter: ({ row }) => resolveNewQuest(row),
      minWidth: 140,
      title: '新问题',
    },
    {
      field: 'SupporterName',
      formatter: ({ row }) =>
        String(row.SupporterName || row.SupporterUsername || '-'),
      minWidth: 120,
      title: '申请人',
    },
    { field: 'OperatorUsername', minWidth: 120, title: '审核人' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 220,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }) => {
        const query = buildListQuery(page);
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          // 对齐旧站 sortChange：升序 field，降序 -field
          sortParam =
            sortOrder === 'asc' ? String(sortField) : `-${sortField}`;
        }
        const result = await fetchApplyServiceListApi({
          ...query,
          Sort: sortParam,
        });
        const items = normalizeListItems(
          (result.Items || []) as unknown as ApplyRow[],
        );
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
  sortConfig: {
    remote: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

/** 旧站 handleSelectChange：勾「全部」与具体状态互斥 */
function onStatusChange(value: Array<number | string>) {
  if (!isAllStatus.value && value.includes('')) {
    filterStatus.value = [''];
    isAllStatus.value = true;
    return;
  }
  if (isAllStatus.value && value.includes('')) {
    filterStatus.value = value.filter((option) => option !== '');
    isAllStatus.value = false;
    return;
  }
  isAllStatus.value = false;
  filterStatus.value = value.filter((option) => option !== '');
}

function resetFilters() {
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterPackageId.value = undefined;
  filterSupporterUsername.value = '';
  filterOperatorUsername.value = '';
  filterWorkQuestionType.value = undefined;
  filterEndReasonType.value = undefined;
  filterStatus.value = [''];
  isAllStatus.value = true;
  filterDateRange.value = todayRange();
  gridApi.reload();
}

function openAction(row: ApplyRow, mode: 'pass' | 'reject') {
  form.Id = row.Id;
  form.mode = mode;
  form.Remark = '';
  modalOpen.value = true;
}

const detailOpen = ref(false);
const detailRow = ref<ApplyRow | null>(null);
const detailContent = ref({ after: '', before: '', name: '' });
const historyList = ref<ApplyRow[]>([]);
const historyLoading = ref(false);
const recordList = ref<
  Array<{ RemarkStatusChange?: string; Record: number; Time?: string; User?: string }>
>([]);

async function openCheck(row: ApplyRow) {
  detailRow.value = row;
  detailContent.value = parseContentParts(row.Content);
  recordList.value = [
    {
      Record: 0,
      RemarkStatusChange: row.Remark,
      Time: formatOperationDateTime(row.CreateTime as string),
      User: String(row.SupporterName || row.SupporterUsername || '-'),
    },
  ];
  if (Number(row.Status) !== 2) {
    recordList.value.unshift({
      Record: Number(row.Status || 0),
      RemarkStatusChange: row.RemarkStatusChange,
      Time: formatOperationDateTime(row.UpdateTime as string),
      User: row.OperatorUsername || '-',
    });
  }
  detailOpen.value = true;
  historyLoading.value = true;
  try {
    const result = await fetchApplyServiceListApi({
      LoginAccount: row.LoginAccount || '',
      Page: 1,
      PageSize: 50,
    });
    historyList.value = normalizeListItems(
      (result.Items || []) as unknown as ApplyRow[],
    );
  } catch {
    historyList.value = [];
  } finally {
    historyLoading.value = false;
  }
}

async function submitAction() {
  if (!form.Remark.trim()) {
    message.warning('请填写备注');
    return;
  }
  submitting.value = true;
  try {
    if (form.mode === 'pass') {
      await handleApplyServiceApi({
        HandleType: 3,
        Id: form.Id,
        Remark: form.Remark,
        Status: 1,
      });
      message.success('工单已通过');
    } else {
      await rejectApplyServiceApi({
        Id: form.Id,
        Remark: form.Remark,
      });
      message.success('工单已驳回');
    }
    modalOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchApplyServiceListApi({
      ...buildListQuery({ currentPage: 1, pageSize: 10_000 }),
      IsExp: true,
    });
    const rows = (result.Items || []) as unknown as ApplyRow[];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        {
          header: '状态',
          value: (row) =>
            APPLY_SERVICE_STATUS_MAP[Number(row.Status)] ||
            String(row.Status ?? '-'),
        },
        { header: '订单编号', value: (row) => row.OrderId || '-' },
        {
          header: '申请时间',
          value: (row) => formatOperationDateTime(row.CreateTime as string),
        },
        {
          header: '完成时间',
          value: (row) => formatOperationDateTime(row.UpdateTime as string),
        },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '所属产品', value: (row) => row.PackageName || '-' },
        { header: '结束理由', value: (row) => row.TypeName || '-' },
        {
          header: '问题类型',
          value: (row) => resolveQuestTypeLabel(row),
        },
        {
          header: '新问题',
          value: (row) => resolveNewQuest(row),
        },
        {
          header: '申请人',
          value: (row) =>
            String(row.SupporterName || row.SupporterUsername || '-'),
        },
        {
          header: '审核人',
          value: (row) => row.OperatorUsername || '-',
        },
      ],
      `客服工单_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

async function loadFilterOptions() {
  try {
    const [workRes, endRes] = await Promise.all([
      fetchWorkQuestionTypeListApi(),
      fetchEndReasonListApi({
        BeginTime: filterDateRange.value[0].startOf('day').unix(),
        EndTime: filterDateRange.value[1].endOf('day').unix(),
      }),
    ]);
    const workItems = (workRes.Items || [])
      .slice()
      .sort((a, b) => Number(a.Sort ?? 0) - Number(b.Sort ?? 0)) as Array<
      Record<string, unknown>
    >;
    workQuestOptions.value = [
      { label: '全部', value: '' },
      ...workItems.map((item) => ({
        label: String(item.Title ?? item.Id),
        value: item.Id as number | string,
      })),
    ];
    workQuestTitleMap.value = new Map(
      workItems.map((item) => [
        item.Id as number | string,
        String(item.Title ?? item.Id),
      ]),
    );

    const endItems = (endRes.Items || []) as Array<Record<string, unknown>>;
    endReasonOptions.value = [
      { label: '全部', value: '' },
      ...endItems.map((item) => ({
        label: String(item.Title ?? item.Id),
        value: item.Id as number | string,
      })),
    ];
  } catch {
    workQuestOptions.value = [{ label: '全部', value: '' }];
    endReasonOptions.value = [{ label: '全部', value: '' }];
  }
}

onMounted(() => {
  void loadFilterOptions();
});
</script>

<template>
  <div>
    <!-- 查询区与旧站 playerOrderPage Filters 逐项对齐 -->
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="请输入"
        style="width: 250px"
      >
        <template #addonBefore>订单号</template>
      </Input>

      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="请输入"
        style="width: 250px"
        @change="
          filterLoginAccount = filterLoginAccount
            .toLowerCase()
            .replace(/\s/g, '')
        "
      >
        <template #addonBefore>游戏账号</template>
      </Input>

      <Select
        v-model:value="filterPackageId"
        allow-clear
        class="w-[250px]"
        :options="packageSelectOptions"
        placeholder="请选择产品"
        show-search
        :filter-option="
          (input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
        "
      />

      <Input
        v-model:value="filterSupporterUsername"
        allow-clear
        placeholder="请输入"
        style="width: 250px"
      >
        <template #addonBefore>申请人</template>
      </Input>

      <Input
        v-model:value="filterOperatorUsername"
        allow-clear
        placeholder="请输入"
        style="width: 250px"
      >
        <template #addonBefore>审核人</template>
      </Input>

      <div v-if="canFilterQuestType" class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">问题类型</span>
        <Select
          v-model:value="filterWorkQuestionType"
          allow-clear
          class="w-40"
          :options="workQuestOptions"
          placeholder="请选择"
          show-search
          :filter-option="
            (input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
          "
        />
      </div>

      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">结束理由</span>
        <Select
          v-model:value="filterEndReasonType"
          allow-clear
          class="w-40"
          :options="endReasonOptions"
          placeholder="请选择"
        />
      </div>

      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">工单状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          class="w-44"
          :max-tag-count="1"
          mode="multiple"
          :options="statusOptions"
          placeholder="请选择"
          @change="onStatusChange"
        />
      </div>

      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        type="primary"
        @click="handleExport"
      >
        导出Excel
      </Button>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="statusColor(row.Status)">
          {{
            APPLY_SERVICE_STATUS_MAP[Number(row.Status)] ||
            String(row.Status ?? '-')
          }}
        </Tag>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
      <template #action="{ row }">
        <div v-if="canShowActions" class="flex flex-wrap gap-1">
          <Button
            v-if="isProcessing(row) && canPass"
            size="small"
            type="primary"
            @click="openAction(row, 'pass')"
          >
            通过
          </Button>
          <Button
            v-if="isProcessing(row) && canReject"
            danger
            size="small"
            @click="openAction(row, 'reject')"
          >
            驳回
          </Button>
          <Button
            v-if="canCheck"
            size="small"
            type="default"
            @click="openCheck(row)"
          >
            查看
          </Button>
        </div>
        <span v-else>-</span>
      </template>
    </Grid>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      destroy-on-close
      :title="form.mode === 'pass' ? '通过工单' : '驳回工单'"
      @ok="submitAction"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="备注" required>
          <Input.TextArea
            v-model:value="form.Remark"
            :rows="3"
            placeholder="请输入备注"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      destroy-on-close
      title="查看工单"
      width="720px"
    >
      <div v-if="detailRow" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-2">
          <div>订单编号：{{ detailRow.OrderId || '-' }}</div>
          <div>
            状态：
            {{
              APPLY_SERVICE_STATUS_MAP[Number(detailRow.Status)] ||
              String(detailRow.Status ?? '-')
            }}
          </div>
          <div>游戏账号：{{ detailRow.LoginAccount || '-' }}</div>
          <div>所属产品：{{ detailRow.PackageName || '-' }}</div>
          <div>问题类型：{{ resolveQuestTypeLabel(detailRow) }}</div>
          <div>新问题：{{ resolveNewQuest(detailRow) }}</div>
          <div>申请人：{{ detailRow.SupporterName || detailRow.SupporterUsername || '-' }}</div>
          <div>审核人：{{ detailRow.OperatorUsername || '-' }}</div>
        </div>
        <div v-if="detailContent.name || detailContent.before || detailContent.after">
          <div class="mb-1 font-medium">工单内容</div>
          <div>字段：{{ detailContent.name || '-' }}</div>
          <div>修改前：{{ detailContent.before || '-' }}</div>
          <div>修改后：{{ detailContent.after || '-' }}</div>
        </div>
        <div>
          <div class="mb-1 font-medium">处理记录</div>
          <div
            v-for="(item, index) in recordList"
            :key="`${item.Time}-${index}`"
            class="mb-1 rounded border border-gray-100 px-2 py-1"
          >
            {{ item.Time }} ·
            {{
              item.Record === 0
                ? '创建工单'
                : APPLY_SERVICE_STATUS_MAP[item.Record] || item.Record
            }}
            · {{ item.User || '-' }}
            <div v-if="item.RemarkStatusChange" class="text-gray-500">
              {{ item.RemarkStatusChange }}
            </div>
          </div>
        </div>
        <div>
          <div class="mb-1 font-medium">历史工单</div>
          <div v-if="historyLoading">加载中…</div>
          <div v-else-if="!historyList.length" class="text-gray-400">暂无</div>
          <div v-else class="max-h-48 overflow-auto">
            <div
              v-for="item in historyList"
              :key="String(item.Id)"
              class="mb-1 flex justify-between gap-2 border-b border-gray-50 py-1"
            >
              <span>{{ item.OrderId || item.Id }}</span>
              <span>
                {{
                  APPLY_SERVICE_STATUS_MAP[Number(item.Status)] ||
                  String(item.Status ?? '-')
                }}
              </span>
              <span>{{ formatOperationDateTime(item.CreateTime as string) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
