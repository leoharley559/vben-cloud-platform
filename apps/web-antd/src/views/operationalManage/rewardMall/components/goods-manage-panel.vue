<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Radio } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import GoodsActivePanel from './goods-active-panel.vue';
import GoodsHistoryPanel from './goods-history-panel.vue';

defineOptions({ name: 'GoodsManagePanel' });

const { checkPermission } = useCloudPermission();

const subTabs = computed(() =>
  [
    { key: 'active', label: '商品列表', permission: 13_379 },
    { key: 'history', label: '商品记录', permission: 13_380 },
  ].filter((item) => checkPermission(item.permission)),
);

const activeSubTab = ref('active');

onMounted(() => {
  activeSubTab.value = subTabs.value[0]?.key || 'active';
});
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group v-model:value="activeSubTab" button-style="solid">
        <Radio.Button v-for="item in subTabs" :key="item.key" :value="item.key">
          {{ item.label }}
        </Radio.Button>
      </Radio.Group>
    </div>

    <GoodsActivePanel v-if="activeSubTab === 'active'" />
    <GoodsHistoryPanel v-else-if="activeSubTab === 'history'" />

    <div v-if="!subTabs.length" class="py-8 text-center text-gray-400">
      无商品设置查看权限
    </div>
  </div>
</template>
