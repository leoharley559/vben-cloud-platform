<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'PackageCreate' });

const route = useRoute();
const router = useRouter();

onMounted(() => {
  void router.replace({
    path: '/gameManage/addPackage',
    query: route.query,
  });
});
</script>

<template>
  <div></div>
</template>
