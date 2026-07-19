<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Radio } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import SelfCheckListPanel from './self-check-list.vue';
import SelfCheckVisitRecord from './self-check-visit-record.vue';

defineOptions({ name: 'SelfCheckTabs' });

const { checkPermission } = useCloudPermission();

const canSelfCheck = computed(() => checkPermission(12260));
const canVisitRecord = computed(() => checkPermission(12265));

const pageType = ref<1 | 2>(1);

onMounted(() => {
  if (canSelfCheck.value) {
    pageType.value = 1;
  } else if (canVisitRecord.value) {
    pageType.value = 2;
  }
});
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group v-model:value="pageType" button-style="solid">
        <Radio.Button v-if="canSelfCheck" :value="1">自助查单</Radio.Button>
        <Radio.Button v-if="canVisitRecord" :value="2">访问记录</Radio.Button>
      </Radio.Group>
    </div>

    <SelfCheckListPanel v-if="pageType === 1 && canSelfCheck" />
    <SelfCheckVisitRecord v-else-if="pageType === 2 && canVisitRecord" />
  </div>
</template>
