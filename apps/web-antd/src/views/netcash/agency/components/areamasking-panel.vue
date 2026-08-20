<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Button, Card, message, Result, Spin, Switch } from 'ant-design-vue';

import {
  fetchCountriesConfigListApi,
  fetchGameCountriesApi,
  updateGameCountriesApi,
} from '#/api/netcash/agency';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'AreamaskingPanel' });

interface CountryItem {
  Belong: string;
  FieldName: string;
  Id: number;
}

const { checkPermission } = useCloudPermission();
/** 对齐旧站：Tab 入口 11571，面板查看 11572，编辑 11573 */
const canView = computed(() => checkPermission(11_572));
const canEdit = computed(() => checkPermission(11_573));
const loading = ref(false);
const saving = ref(false);
const configurationList = ref<CountryItem[]>([]);
const selectedIds = ref<number[]>([]);
const originalIds = ref('');

const continents = computed(() =>
  configurationList.value.filter((item) => item.Belong === '-1'),
);

function getCountriesByContinent(continentId: number) {
  return configurationList.value.filter(
    (item) => String(item.Belong) === String(continentId),
  );
}

function isSelected(id: number) {
  return selectedIds.value.includes(id);
}

function toggleCountry(checked: boolean, id: number) {
  if (!canEdit.value) {
    return;
  }
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id);
    }
  } else {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
  }
  selectedIds.value.sort((a, b) => a - b);
}

const hasChanges = computed(
  () => selectedIds.value.join(',') !== originalIds.value,
);

async function loadData() {
  loading.value = true;
  try {
    const [configResult, stateResult] = await Promise.all([
      fetchCountriesConfigListApi({ Page: 1, PageSize: 9999, PageType: 1 }),
      fetchGameCountriesApi({ PageType: 1 }),
    ]);
    configurationList.value = (configResult?.Items ||
      []) as unknown as CountryItem[];
    const countriesForBackstage = String(
      stateResult?.CountriesForBackstage || '',
    );
    selectedIds.value = countriesForBackstage
      .split(',')
      .filter(Boolean)
      .map(Number)
      .filter((item) => !Number.isNaN(item));
    originalIds.value = [...selectedIds.value].toSorted((a, b) => a - b).join(',');
  } catch {
    configurationList.value = [];
    selectedIds.value = [];
    originalIds.value = '';
  } finally {
    loading.value = false;
  }
}

async function saveChanges() {
  if (!hasChanges.value) {
    return;
  }
  saving.value = true;
  try {
    await updateGameCountriesApi({
      Countries: selectedIds.value.join(','),
      PageType: 1,
    });
    originalIds.value = selectedIds.value.join(',');
    message.success('区域屏蔽设置已保存');
  } catch {
    // 全局拦截已提示
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (canView.value) {
    loadData();
  }
});
</script>

<template>
  <Result
    v-if="!canView"
    status="403"
    sub-title="无区域屏蔽查看权限（11572）"
    title="403"
  />
  <Spin v-else :spinning="loading">
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm text-gray-500">
        推广地区屏蔽（保存后约 5 分钟生效，不会踢线）
      </div>
      <Button
        v-if="canEdit"
        :disabled="!hasChanges"
        :loading="saving"
        type="primary"
        @click="saveChanges"
      >
        保存并提交
      </Button>
    </div>

    <div
      v-if="!loading && continents.length === 0"
      class="py-8 text-center text-gray-400"
    >
      暂无国家/地区配置数据
    </div>

    <div class="grid gap-4">
      <Card
        v-for="continent in continents"
        :key="continent.Id"
        size="small"
        :title="continent.FieldName"
      >
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="country in getCountriesByContinent(continent.Id)"
            :key="country.Id"
            class="flex items-center justify-between rounded border px-3 py-2"
          >
            <span>{{ country.FieldName }}</span>
            <Switch
              :checked="isSelected(country.Id)"
              :disabled="!canEdit"
              @change="(checked) => toggleCountry(!!checked, country.Id)"
            />
          </div>
        </div>
      </Card>
    </div>
  </Spin>
</template>
