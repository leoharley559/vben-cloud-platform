<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Form, Input, message, Modal, Select } from 'ant-design-vue';

import { createCardMultiBindApi } from '#/api/memberManage/card-multi-bind';
import { useOperationOptions } from '#/composables/use-operation-options';
import { CARD_MULTI_BIND_CATEGORY_OPTIONS } from '#/types/card-multi-bind';

defineOptions({ name: 'CardMultiBindFormModal' });

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { packageOptions } = useOperationOptions();

const submitting = ref(false);
const category = ref(2);
const bankCardNum = ref('');
const packageId = ref<number | string>('');

const packageSelectOptions = computed(() =>
  packageOptions.value.filter((item) => item.PackageId !== ''),
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    category.value = 2;
    bankCardNum.value = '';
    packageId.value = packageSelectOptions.value[0]?.PackageId ?? '';
  },
);

function closeModal() {
  emit('update:open', false);
}

async function handleSubmit() {
  if (!bankCardNum.value || !packageId.value) {
    message.warning('请填写完整信息');
    return;
  }

  const value = bankCardNum.value.trim();
  if (
    category.value === 1 &&
    !/^(?=.{11,12}$)(09|639|\*)[0-9*]*$/.test(value)
  ) {
    message.warning('电子钱包账号格式不正确');
    return;
  }
  if (category.value === 2 && !/^.{10,16}$/.test(value)) {
    message.warning('银行卡号长度需为 10–16 位');
    return;
  }
  if (category.value === 3 && !/^(T|0x)/i.test(value)) {
    message.warning('虚拟币地址需以 T 或 0x 开头');
    return;
  }

  submitting.value = true;
  try {
    await createCardMultiBindApi({
      BankCardNum: value,
      Category: category.value,
      PackageId: packageId.value,
    });
    message.success('新增成功');
    closeModal();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    destroy-on-close
    title="新增多账号绑定"
    width="480px"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <Form.Item label="账户类型" required>
        <Select
          v-model:value="category"
          :options="CARD_MULTI_BIND_CATEGORY_OPTIONS"
        />
      </Form.Item>
      <Form.Item label="账号" required>
        <Input
          v-model:value="bankCardNum"
          allow-clear
          placeholder="请输入账号"
        />
      </Form.Item>
      <Form.Item label="所属产品" required>
        <Select
          v-model:value="packageId"
          :field-names="{ label: 'PackageName', value: 'PackageId' }"
          :options="packageSelectOptions"
          placeholder="请选择产品"
          show-search
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
