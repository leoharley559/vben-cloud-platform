<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  AvailableChannel,
  ChannelId,
  ChannelPackageOption,
} from '#/types/channel-config';
import type { CloneChannelPlanItem } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchChannelPackageOptionsApi } from '#/api/gameManage/channel';
import {
  addCloneChannelPlanApi,
  deleteCloneChannelPlanApi,
  editCloneChannelPlanApi,
  fetchAvailableMoneyChannelsApi,
  fetchCloneChannelPlanListApi,
} from '#/api/netcash/create-money-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'CloneChannelPanel' });

const { checkPermission } = useCloudPermission();
const canAdd = computed(() => checkPermission(12_914));
const canEdit = computed(() => checkPermission(12_915));
const canDelete = computed(() => checkPermission(12_916));
const packages = ref<ChannelPackageOption[]>([]);
const channels = ref<AvailableChannel[]>([]);
const rows = ref<CloneChannelPlanItem[]>([]);
const filters = reactive({
  ChannelId: [] as ChannelId[],
  PackageId: [] as ChannelId[],
});
const modalOpen = ref(false);
const saving = ref(false);
const editId = ref<ChannelId>();
const formRef = ref<FormInstance>();
const form = reactive({
  ChannelIds: [] as ChannelId[],
  PlanName: '',
});

function packageId(item: ChannelPackageOption) {
  return item.PackageId ?? item.Id;
}

const packageMap = computed(
  () =>
    new Map(
      packages.value.map((item) => [
        String(packageId(item)),
        item.PackageName || item.PackageAlias || String(packageId(item)),
      ]),
    ),
);

function packageNames(ids: unknown) {
  return String(ids || '')
    .split(',')
    .map((id) => packageMap.value.get(id) || id)
    .filter(Boolean)
    .join('、');
}

const columns: VxeTableGridOptions<CloneChannelPlanItem>['columns'] = [
  { type: 'seq', title: '序号', width: 60 },
  { field: 'Name', minWidth: 160, title: '方案名称' },
  {
    field: 'ChannelId',
    minWidth: 240,
    showOverflow: 'tooltip',
    title: '渠道号',
  },
  {
    field: 'PackageId',
    formatter: ({ cellValue }) => packageNames(cellValue),
    minWidth: 180,
    showOverflow: 'tooltip',
    title: '产品名称',
  },
  {
    field: 'actions',
    minWidth: 140,
    slots: { default: 'actions' },
    title: '操作',
  },
];
const gridOptions: VxeTableGridOptions<CloneChannelPlanItem> = {
  columns,
  height: 'auto',
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async () => {
        try {
          const result = await fetchCloneChannelPlanListApi({
            ChannelId: filters.ChannelId.join(','),
            PackageId: filters.PackageId.join(','),
          });
          rows.value = result.Items;
          return { items: rows.value, total: rows.value.length };
        } catch {
          rows.value = [];
          return { items: [], total: 0 };
        }
      },
    },
  },
  rowClassName: ({ row }) =>
    Number(row.IsHidden) === 2 ? 'clone-channel-disabled-row' : '',
  rowConfig: { keyField: 'Id' },
};
const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function openCreate() {
  if (rows.value.length >= 10) return void message.warning('克隆方案最多 10 个');
  editId.value = undefined;
  form.PlanName = '';
  form.ChannelIds = [];
  modalOpen.value = true;
  formRef.value?.clearValidate();
}

function openEdit(row: CloneChannelPlanItem) {
  editId.value = row.Id;
  form.PlanName = String(row.Name || '');
  form.ChannelIds = String(row.ChannelId || '')
    .split(',')
    .filter(Boolean);
  modalOpen.value = true;
  formRef.value?.clearValidate();
}

async function submit() {
  await formRef.value?.validate();
  const duplicate = rows.value.some(
    (item) =>
      String(item.Id) !== String(editId.value) &&
      String(item.Name).trim() === form.PlanName.trim(),
  );
  if (duplicate) return void message.error('方案名称已存在');
  saving.value = true;
  try {
    const payload = {
      ChannelId: form.ChannelIds.join(','),
      PlanName: form.PlanName.trim(),
      ...(editId.value == null ? {} : { Id: editId.value }),
    };
    await (editId.value == null ? addCloneChannelPlanApi(payload) : editCloneChannelPlanApi(payload));
    message.success(editId.value == null ? '方案已新增' : '方案已编辑');
    modalOpen.value = false;
    await gridApi.reload();
  } catch {
    // 请求层已提示
  } finally {
    saving.value = false;
  }
}

function remove(row: CloneChannelPlanItem) {
  Modal.confirm({
    content: `确认删除克隆方案“${row.Name || row.Id}”？`,
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await deleteCloneChannelPlanApi(row.Id!);
        message.success('方案已删除');
        await gridApi.reload();
      } catch {
        // 请求层已提示
      }
    },
    title: '删除克隆方案',
  });
}

async function initialize() {
  try {
    const [packageList, channelList] = await Promise.all([
      fetchChannelPackageOptionsApi(),
      fetchAvailableMoneyChannelsApi({
        ChannelType: '2',
        DataSearchType: 0,
        Hidden: 1,
        ParentChannel: true,
        Status: 1,
      }),
    ]);
    packages.value = Array.isArray(packageList) ? packageList : [];
    channels.value = channelList.Item ?? [];
    filters.PackageId = packages.value
      .map((item) => packageId(item))
      .filter((id): id is ChannelId => id != null);
    await gridApi.query();
  } catch {
    packages.value = [];
    channels.value = [];
  }
}

onMounted(() => void initialize());
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <Space wrap>
        <Space.Compact>
          <span class="query-field-addon">产品名称</span>
          <Select
            v-model:value="filters.PackageId"
            allow-clear
            :max-tag-count="2"
            mode="multiple"
            :options="
              packages.map((item) => ({
                label:
                  item.PackageName || item.PackageAlias || packageId(item),
                value: packageId(item),
              }))
            "
            style="min-width: 260px"
            placeholder="请选择产品名称"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">渠道号</span>
          <Select
            v-model:value="filters.ChannelId"
            allow-clear
            :max-tag-count="2"
            mode="multiple"
            :options="
              channels.map((item) => ({
                label: `${item.ChannelId}（${item.ChannelName || '-'}）`,
                value: item.ChannelId,
              }))
            "
            show-search
            style="min-width: 300px"
            placeholder="请选择渠道号"
          />
        </Space.Compact>
        <Button type="primary" @click="gridApi.query()">查询</Button>
        <Button
          @click="
            filters.ChannelId = [];
            filters.PackageId = packages
              .map(packageId)
              .filter((id) => id != null);
            gridApi.query();
          "
        >
          重置
        </Button>
      </Space>
      <Button
        v-if="canAdd"
        :disabled="rows.length >= 10"
        type="primary"
        @click="openCreate"
      >
        新增方案
      </Button>
    </div>
    <Grid>
      <template #actions="{ row }">
        <Space :size="2">
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="remove(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      :title="editId == null ? '新增克隆方案' : '编辑克隆方案'"
      @cancel="modalOpen = false"
      @ok="submit"
    >
      <Form
        ref="formRef"
        class="pt-3"
        layout="vertical"
        :model="form"
        :rules="{
          PlanName: [
            { required: true, message: '请输入方案名称' },
            { max: 30, message: '方案名称最多 30 个字符' },
          ],
          ChannelIds: [{ required: true, message: '请选择渠道' }],
        }"
      >
        <Form.Item label="方案名称" name="PlanName">
          <Input
            v-model:value="form.PlanName"
            :maxlength="30"
            placeholder="请输入方案名称"
            show-count
          />
        </Form.Item>
        <Form.Item label="渠道号" name="ChannelIds">
          <Select
            v-model:value="form.ChannelIds"
            :max-tag-count="4"
            mode="multiple"
            :options="
              channels.map((item) => ({
                label: `${item.ChannelId}（${item.ChannelName || '-'}）`,
                value: item.ChannelId,
              }))
            "
            placeholder="请选择渠道"
            show-search
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style>
.vxe-body--row.clone-channel-disabled-row > .vxe-body--column {
  background: #fff1f0 !important;
  color: #a8071a;
}
</style>
