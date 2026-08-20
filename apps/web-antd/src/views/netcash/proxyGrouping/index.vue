<script lang="ts" setup>
import type { TreeProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { ProxyGroupingListItem, ProxyGroupItem } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Result,
  Space,
  Table,
  Tree,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  addAgentGroupApi,
  deleteProxyGroupingApi,
  fetchProxyGroupingListApi,
  fetchProxyGroupListApi,
  moveProxyGroupingMembersApi,
  sortProxyGroupingApi,
  updateProxyGroupingApi,
} from '#/api/netcash/proxy-grouping';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'ProxyGrouping' });

type GroupDialogMode = 'child' | 'rename' | 'root';

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_139));
const canAddRoot = computed(() => checkPermission(10_140));
const canExport = computed(() => checkPermission(10_141));
const canAddChild = computed(() => checkPermission(10_142));
const canRename = computed(() => checkPermission(10_143));
const canDelete = computed(() => checkPermission(10_144));
const canBatchTransfer = computed(() => checkPermission(10_145));
const canSingleTransfer = computed(() => checkPermission(11_244));

const treeFieldNames = {
  children: 'List',
  key: 'Id',
  title: 'GroupName',
};
const unassignedGroup = (): ProxyGroupItem => ({
  GroupName: '未分组',
  Id: 0,
  Level: 0,
  List: [],
  ParentId: 0,
  ParentTree: '0',
  Sort: Number.MAX_SAFE_INTEGER,
});

const treeLoading = ref(false);
const tableLoading = ref(false);
const exporting = ref(false);
const groups = ref<ProxyGroupItem[]>([]);
const treeData = computed(
  () => groups.value as unknown as NonNullable<TreeProps['treeData']>,
);
const expandedKeys = ref<Array<number | string>>([]);
const selectedKeys = ref<Array<number | string>>([0]);
const transferSelectedKeys = ref<Array<number | string>>([]);
const selectedGroupId = computed(() => selectedKeys.value[0] ?? 0);
const selectedGroup = computed(
  () => findGroup(groups.value, selectedGroupId.value) || unassignedGroup(),
);

const rows = ref<ProxyGroupingListItem[]>([]);
const total = ref(0);
const selectedRowKeys = ref<Array<number | string>>([]);
const selectedRows = ref<ProxyGroupingListItem[]>([]);
const query = reactive({
  DeveloperName: '',
  Group: 0 as number | string,
  GroupBeginTime: '' as number | string,
  GroupEndTime: '' as number | string,
  Page: 1,
  PageSize: 20,
  Username: '',
});
const dateRange = ref<[Dayjs, Dayjs]>();
const rangeSelecting = ref<Dayjs>();

/** 对齐旧站 SearchTypeFour limit-number=30 */
function disabledDate(current: Dayjs) {
  if (!rangeSelecting.value) return false;
  const min = rangeSelecting.value.subtract(30, 'day');
  const max = rangeSelecting.value.add(30, 'day');
  return current.isBefore(min, 'day') || current.isAfter(max, 'day');
}

function onCalendarChange(dates: [Dayjs, Dayjs] | [string, string] | null) {
  const first = dates?.[0];
  rangeSelecting.value = first
    ? (dayjs.isDayjs(first)
      ? first
      : dayjs(first))
    : undefined;
}

const columns = computed(() => [
  { key: 'index', title: '序号', width: 70 },
  { dataIndex: 'grouping', key: 'grouping', title: '分组名称' },
  { dataIndex: 'Username', key: 'Username', title: '代理账号' },
  { dataIndex: 'Name', key: 'Name', title: '代理名称' },
  { dataIndex: 'DeveloperName', key: 'DeveloperName', title: '发展人编码' },
  {
    dataIndex: 'GroupCreateTime',
    key: 'GroupCreateTime',
    title: '入组时间',
    width: 180,
  },
  ...(canSingleTransfer.value
    ? [{ key: 'actions', title: '操作', width: 100 }]
    : []),
]);

const rowSelection = computed(() => ({
  onChange: (
    keys: Array<number | string>,
    selected: ProxyGroupingListItem[],
  ) => {
    selectedRowKeys.value = keys;
    selectedRows.value = selected;
  },
  selectedRowKeys: selectedRowKeys.value,
}));

function normalizeGroups(items: ProxyGroupItem[]) {
  let fallbackSort = 1;
  const walk = (list: ProxyGroupItem[]): ProxyGroupItem[] =>
    list.map((item) => ({
      ...item,
      GroupName: String(item.GroupName || item.Id || '-'),
      List: walk(Array.isArray(item.List) ? item.List : []),
      Sort: Number(item.Sort) || fallbackSort++,
    }));
  return walk(items);
}

function collectGroupIds(items: ProxyGroupItem[]) {
  const ids: Array<number | string> = [];
  for (const item of items) {
    if (Number(item.Id) !== 0) {
      ids.push(item.Id);
    }
    ids.push(...collectGroupIds(item.List || []));
  }
  return ids;
}

function findGroup(
  items: ProxyGroupItem[],
  id: number | string,
): ProxyGroupItem | undefined {
  for (const item of items) {
    if (String(item.Id) === String(id)) {
      return item;
    }
    const child = findGroup(item.List || [], id);
    if (child) {
      return child;
    }
  }
}

function findSiblings(
  items: ProxyGroupItem[],
  id: number | string,
): ProxyGroupItem[] | undefined {
  if (items.some((item) => String(item.Id) === String(id))) {
    return items;
  }
  for (const item of items) {
    const found = findSiblings(item.List || [], id);
    if (found) {
      return found;
    }
  }
}

function groupNameFor(id: unknown) {
  return findGroup(groups.value, String(id ?? 0))?.GroupName || '未分组';
}

async function loadGroups(expandAll = false) {
  treeLoading.value = true;
  try {
    const result = await fetchProxyGroupListApi();
    const normalized = normalizeGroups(result.Items);
    groups.value = [...normalized, unassignedGroup()];
    if (expandAll) {
      expandedKeys.value = collectGroupIds(normalized);
    }
    if (!findGroup(groups.value, selectedGroupId.value)) {
      selectedKeys.value = [0];
      query.Group = 0;
    }
  } catch {
    groups.value = [unassignedGroup()];
    selectedKeys.value = [0];
    query.Group = 0;
  } finally {
    treeLoading.value = false;
  }
}

async function loadMembers() {
  tableLoading.value = true;
  try {
    const result = await fetchProxyGroupingListApi({ ...query });
    const items = Array.isArray(result.Items) ? result.Items : [];
    rows.value = items.map((item) => ({
      ...item,
      grouping: groupNameFor(item.Group ?? query.Group),
    }));
    total.value = Number(result.Pagination?.MaxCount ?? items.length);
    selectedRowKeys.value = [];
    selectedRows.value = [];

    const firstGroup = items[0]?.Group;
    if (
      query.Username &&
      firstGroup !== undefined &&
      String(firstGroup) !== String(query.Group) &&
      findGroup(groups.value, firstGroup)
    ) {
      query.Group = firstGroup;
      selectedKeys.value = [firstGroup];
    }
  } catch {
    rows.value = [];
    total.value = 0;
    selectedRowKeys.value = [];
    selectedRows.value = [];
  } finally {
    tableLoading.value = false;
  }
}

const selectTreeGroup: NonNullable<TreeProps['onSelect']> = async (
  _keys,
  info,
) => {
  const group = (info.node as unknown as { dataRef?: ProxyGroupItem }).dataRef;
  if (!group) {
    return;
  }
  selectedKeys.value = [group.Id];
  query.Group = group.Id;
  query.Username = '';
  query.DeveloperName = '';
  query.GroupBeginTime = '';
  query.GroupEndTime = '';
  dateRange.value = undefined;
  query.Page = 1;
  await loadMembers();
};

function applyDateRange() {
  if (!dateRange.value) {
    query.GroupBeginTime = '';
    query.GroupEndTime = '';
    return;
  }
  query.GroupBeginTime = dateRange.value?.[0]?.unix() || '';
  query.GroupEndTime = dateRange.value?.[1]?.unix() || '';
}

async function search() {
  applyDateRange();
  query.Page = 1;
  await loadMembers();
}

async function resetSearch() {
  query.Username = '';
  query.DeveloperName = '';
  query.GroupBeginTime = '';
  query.GroupEndTime = '';
  dateRange.value = undefined;
  query.Page = 1;
  await loadMembers();
}

async function changePage(page: number, pageSize: number) {
  query.Page = pageSize === query.PageSize ? page : 1;
  query.PageSize = pageSize;
  await loadMembers();
}

const groupDialogOpen = ref(false);
const groupDialogMode = ref<GroupDialogMode>('root');
const groupName = ref('');
const groupSubmitting = ref(false);
const groupDialogTitle = computed(() => {
  if (groupDialogMode.value === 'rename') {
    return '修改分组名称';
  }
  return groupDialogMode.value === 'root' ? '新增一级分组' : '新增子分组';
});

function openGroupDialog(mode: GroupDialogMode) {
  groupDialogMode.value = mode;
  groupName.value =
    mode === 'rename' ? String(selectedGroup.value.GroupName || '') : '';
  groupDialogOpen.value = true;
}

async function submitGroupDialog() {
  const name = groupName.value.trim();
  if (!name) {
    message.warning('请输入分组名称');
    return;
  }
  groupSubmitting.value = true;
  try {
    if (groupDialogMode.value === 'rename') {
      await updateProxyGroupingApi({
        GroupName: name,
        Id: selectedGroup.value.Id,
        ParentId: selectedGroup.value.ParentId,
      });
      message.success('分组名称修改成功');
    } else {
      await addAgentGroupApi({
        GroupName: name,
        ParentId: groupDialogMode.value === 'root' ? 0 : selectedGroup.value.Id,
      });
      message.success('分组新增成功');
    }
    groupDialogOpen.value = false;
    selectedKeys.value = [0];
    query.Group = 0;
    query.Page = 1;
    await loadGroups();
    await loadMembers();
  } catch {
    // requestClient 已提示业务错误
  } finally {
    groupSubmitting.value = false;
  }
}

function deleteGroup() {
  if ((selectedGroup.value.List || []).length > 0) {
    message.warning('该分组包含子分组，请先删除子分组');
    return;
  }
  Modal.confirm({
    content: `确认删除分组「${selectedGroup.value.GroupName || ''}」？删除后成员将归入未分组。`,
    okText: '删除',
    okType: 'danger',
    title: '删除分组',
    onOk: async () => {
      try {
        await deleteProxyGroupingApi(selectedGroup.value.Id);
        message.success('分组删除成功');
        selectedKeys.value = [0];
        query.Group = 0;
        query.Page = 1;
        await loadGroups();
        await loadMembers();
      } catch {
        // requestClient 已提示业务错误
      }
    },
  });
}

async function moveGroup(group: ProxyGroupItem, direction: -1 | 1) {
  const siblings = findSiblings(groups.value, group.Id)?.filter(
    (item) => Number(item.Id) !== 0,
  );
  if (!siblings) {
    return;
  }
  const index = siblings.findIndex(
    (item) => String(item.Id) === String(group.Id),
  );
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
    return;
  }
  const current = { ...siblings[index] } as ProxyGroupItem;
  const target = { ...siblings[targetIndex] } as ProxyGroupItem;
  const currentSort = Number(current.Sort);
  current.Sort = Number(target.Sort);
  target.Sort = currentSort;
  try {
    await sortProxyGroupingApi([current, target]);
    await loadGroups();
  } catch {
    // requestClient 已提示业务错误
  }
}

function canMove(group: ProxyGroupItem, direction: -1 | 1) {
  const siblings = findSiblings(groups.value, group.Id)?.filter(
    (item) => Number(item.Id) !== 0,
  );
  if (!siblings) {
    return false;
  }
  const index = siblings.findIndex(
    (item) => String(item.Id) === String(group.Id),
  );
  return (
    index !== -1 &&
    index + direction >= 0 &&
    index + direction < siblings.length
  );
}

const handleTreeDrop: NonNullable<TreeProps['onDrop']> = async (info) => {
  const drag = (
    info.dragNode as unknown as {
      dataRef?: ProxyGroupItem;
    }
  ).dataRef;
  const drop = (info.node as unknown as { dataRef?: ProxyGroupItem }).dataRef;
  if (!drag || !drop || String(drag.Id) === String(drop.Id)) {
    return;
  }
  if (Number(drag.Level) !== 4 || Number(drop.Level) !== 4) {
    message.warning('仅三级分组支持拖放排序');
    return;
  }
  const dragSiblings = findSiblings(groups.value, drag.Id);
  const dropSiblings = findSiblings(groups.value, drop.Id);
  if (dragSiblings !== dropSiblings) {
    message.warning('三级分组只能在同一父分组内排序');
    return;
  }
  const dragCopy = { ...drag };
  const dropCopy = { ...drop };
  const dragSort = Number(dragCopy.Sort);
  dragCopy.Sort = Number(dropCopy.Sort);
  dropCopy.Sort = dragSort;
  try {
    await sortProxyGroupingApi([dragCopy, dropCopy]);
    await loadGroups();
  } catch {
    // requestClient 已提示业务错误
  }
};

const transferOpen = ref(false);
const transferSubmitting = ref(false);
const transferAccountIds = ref('');
const transferCount = ref(0);

function openBatchTransfer() {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择需要转移的成员');
    return;
  }
  openTransfer(
    selectedRows.value.map((item) => item.Id),
    selectedRows.value.length,
  );
}

function openSingleTransfer(row: Record<string, unknown>) {
  if (row.Id !== undefined) {
    openTransfer([row.Id as number | string], 1);
  }
}

function openTransfer(ids: Array<number | string>, count: number) {
  transferAccountIds.value = ids.join(',');
  transferCount.value = count;
  transferSelectedKeys.value = [];
  transferOpen.value = true;
}

async function submitTransfer() {
  const target = transferSelectedKeys.value[0];
  if (target === undefined) {
    message.warning('请选择目标分组');
    return;
  }
  if (String(target) === String(selectedGroupId.value)) {
    message.warning('成员已在当前分组');
    return;
  }
  transferSubmitting.value = true;
  try {
    await moveProxyGroupingMembersApi({
      AccountIds: transferAccountIds.value,
      ToGroupId: target,
    });
    message.success('成员转移成功');
    transferOpen.value = false;
    await loadMembers();
  } catch {
    // requestClient 已提示业务错误
  } finally {
    transferSubmitting.value = false;
  }
}

async function exportExcel() {
  exporting.value = true;
  try {
    const result = await fetchProxyGroupingListApi({
      ...query,
      CurrPage: 1,
      IsExp: true,
      Page: 1,
      PageSize: 9999,
    });
    if (result.Items.length === 0) {
      message.warning('暂无可导出的数据');
      return;
    }
    const XLSX = await import('xlsx');
    const exportRows = result.Items.map((item, index) => ({
      代理名称: item.Name || '',
      代理账号: item.Username || '',
      入组时间: formatNetcashDateTime(item.GroupCreateTime),
      分组名称: groupNameFor(item.Group ?? query.Group),
      发展人编码: item.DeveloperName || '',
      序号: index + 1,
    }));
    const sheet = XLSX.utils.json_to_sheet(exportRows, {
      header: [
        '序号',
        '分组名称',
        '代理账号',
        '代理名称',
        '发展人编码',
        '入组时间',
      ],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '分组成员');
    const safeName = String(
      selectedGroup.value.GroupName || '未分组',
    ).replaceAll(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(workbook, `${safeName}成员.xlsx`);
  } catch {
    message.error('导出失败');
  } finally {
    exporting.value = false;
  }
}

onMounted(async () => {
  if (!canViewPage.value) {
    return;
  }
  await loadGroups(true);
  await loadMembers();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 代理分组"
    title="代理分组"
  >
    <div class="proxy-grouping-layout">
      <Card class="group-tree-card" :body-style="{ padding: '12px' }">
        <div v-if="canAddRoot" class="mb-3 text-center">
          <Button type="primary" @click="openGroupDialog('root')">
            新增一级分组
          </Button>
        </div>
        <Tree
          v-model:expanded-keys="expandedKeys"
          :draggable="true"
          :field-names="treeFieldNames"
          :loading="treeLoading"
          :selected-keys="selectedKeys"
          :show-line="true"
          :tree-data="treeData"
          block-node
          @drop="handleTreeDrop"
          @select="selectTreeGroup"
        >
          <template #title="{ dataRef }">
            <div class="tree-node-title">
              <span :title="dataRef.GroupName">{{ dataRef.GroupName }}</span>
              <Space
                v-if="dataRef.Level === 2 || dataRef.Level === 3"
                :size="2"
                @click.stop
              >
                <Button
                  :disabled="!canMove(dataRef, -1)"
                  size="small"
                  type="text"
                  @click="moveGroup(dataRef, -1)"
                >
                  ↑
                </Button>
                <Button
                  :disabled="!canMove(dataRef, 1)"
                  size="small"
                  type="text"
                  @click="moveGroup(dataRef, 1)"
                >
                  ↓
                </Button>
              </Space>
              <span v-else-if="dataRef.Level === 4" class="drag-tip">拖放</span>
            </div>
          </template>
        </Tree>
      </Card>

      <Card class="member-card" :body-style="{ padding: '16px' }">
        <div class="ops-query-scope mb-3">
          <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
              <Input
                v-model:value="query.Username"
                allow-clear
                @press-enter="search"
                placeholder="请输入代理账号"
              >
                <template #addonBefore>代理账号</template>
              </Input>
            </div>
            <div class="flex flex-col gap-1">
              <Input
                v-model:value="query.DeveloperName"
                allow-clear
                @press-enter="search"
                placeholder="请输入发展人编码"
              >
                <template #addonBefore>发展人编码</template>
              </Input>
            </div>
            <div class="query-filter-wide">
              <QueryDatetimeRangePicker
                v-model="dateRange"
                :disabled-date="disabledDate"
              />
            </div>
            <div class="query-filter-actions">
              <Button type="primary" @click="search">查询</Button>
              <Button @click="resetSearch">重置</Button>
              <Button
                v-if="canExport"
                :loading="exporting"
                @click="exportExcel"
              >
                导出 Excel
              </Button>
            </div>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Space wrap>
            <Button
              v-if="
                canAddChild &&
                Number(selectedGroup.Id) !== 0 &&
                Number(selectedGroup.Level) !== 0 &&
                Number(selectedGroup.Level) !== 4
              "
              @click="openGroupDialog('child')"
            >
              新增子分组
            </Button>
            <Button
              v-if="canRename && Number(selectedGroup.Id) !== 0"
              @click="openGroupDialog('rename')"
            >
              修改分组名称
            </Button>
            <Button
              v-if="canDelete && Number(selectedGroup.Id) !== 0"
              danger
              @click="deleteGroup"
            >
              删除分组
            </Button>
            <Button v-if="canBatchTransfer" @click="openBatchTransfer">
              批量转移成员
            </Button>
          </Space>
          <span class="text-sm text-gray-500">
            当前分组：{{ selectedGroup.GroupName }}
          </span>
        </div>

        <Table
          :columns="columns"
          :data-source="rows"
          :loading="tableLoading"
          :pagination="false"
          :row-selection="rowSelection"
          :scroll="{ x: 900 }"
          row-key="Id"
          size="middle"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ (query.Page - 1) * query.PageSize + index + 1 }}
            </template>
            <template v-else-if="column.key === 'GroupCreateTime'">
              {{ formatNetcashDateTime(record.GroupCreateTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                size="small"
                type="link"
                @click="openSingleTransfer(record)"
              >
                转移
              </Button>
            </template>
          </template>
        </Table>
        <div class="mt-4 flex justify-end">
          <Pagination
            :current="query.Page"
            :page-size="query.PageSize"
            :page-size-options="['10', '20', '50', '100']"
            :show-total="(value: number) => `共 ${value} 条`"
            :total="total"
            show-size-changer
            @change="changePage"
            @show-size-change="changePage"
          />
        </div>
      </Card>
    </div>

    <Modal
      v-model:open="groupDialogOpen"
      :confirm-loading="groupSubmitting"
      :title="groupDialogTitle"
      @ok="submitGroupDialog"
    >
      <Form layout="vertical">
        <Form.Item label="分组名称" required>
          <Input
            v-model:value="groupName"
            :maxlength="100"
            placeholder="请输入分组名称"
            @press-enter="submitGroupDialog"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="transferOpen"
      :confirm-loading="transferSubmitting"
      title="转移成员"
      @ok="submitTransfer"
    >
      <p class="mb-3">已选择 {{ transferCount }} 名成员，请选择目标分组：</p>
      <div class="transfer-tree">
        <Tree
          v-model:expanded-keys="expandedKeys"
          v-model:selected-keys="transferSelectedKeys"
          :field-names="treeFieldNames"
          :show-line="true"
          :tree-data="treeData"
          block-node
        />
      </div>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无代理分组查看权限" title="403" />
</template>

<style scoped>
.proxy-grouping-layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 12px;
  min-height: 560px;
}

.group-tree-card,
.member-card {
  min-width: 0;
}

.tree-node-title {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}

.tree-node-title > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drag-tip {
  flex: none;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  cursor: grab;
}

.transfer-tree {
  max-height: 420px;
  padding: 8px;
  overflow: auto;
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

@media (max-width: 1100px) {
  .proxy-grouping-layout {
    grid-template-columns: 1fr;
  }
}
</style>
