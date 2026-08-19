<script lang="ts" setup>
import { reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  FormItem,
  message,
  Modal,
  Radio,
  RadioGroup,
  Tooltip,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import { fixDayReportDataApi } from '#/api/dataClose/game-statement';

defineOptions({ name: 'UpdateReportBtn' });

const visible = ref(false);
const loading = ref(false);
const form = reactive({
  Date: '' as string,
  Type: 'day' as 'day' | 'month',
});

function disabledDate(current: Dayjs) {
  if (!current) return false;
  if (form.Type === 'day') {
    // 日报：不可选今天及未来（对齐旧站 Date.now()-1天）
    return current.isAfter(dayjs().subtract(1, 'day'), 'day');
  }
  // 月报：当前月及之后不可选（对齐旧站 setMonth(month-1)）
  return current.isAfter(dayjs().subtract(1, 'month'), 'month');
}

function onTypeChange() {
  form.Date = '';
}

async function handleConfirm() {
  if (!form.Date) {
    message.warning(form.Type === 'day' ? '请选择日期' : '请选择月份');
    return;
  }
  loading.value = true;
  try {
    await fixDayReportDataApi({
      Date: form.Date,
      Type: form.Type,
    });
    message.success('已提交修复，请稍后刷新查看');
    form.Date = '';
    form.Type = 'day';
    visible.value = false;
  } catch {
    /* requestClient 已提示 */
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  loading.value = false;
  visible.value = false;
}
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <Tooltip title="重新跑日报/月报数据（修复异常日期）">
      <span class="cursor-help text-gray-400">ⓘ</span>
    </Tooltip>
    <Button type="primary" @click="visible = true">
      修复日报
    </Button>
    <Modal
      v-model:open="visible"
      title="修复日报"
      :confirm-loading="loading"
      ok-text="确认"
      cancel-text="取消"
      destroy-on-close
      @ok="handleConfirm"
      @cancel="handleClose"
    >
      <Form layout="vertical">
        <FormItem>
          <RadioGroup v-model:value="form.Type" @change="onTypeChange">
            <Radio value="day">日报</Radio>
            <Radio value="month">月报</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem>
          <DatePicker
            v-model:value="form.Date"
            class="w-full"
            :picker="form.Type === 'day' ? 'date' : 'month'"
            :value-format="form.Type === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM-DD'"
            :disabled-date="disabledDate"
            :placeholder="form.Type === 'day' ? '选择日期' : '选择月份'"
          />
        </FormItem>
      </Form>
    </Modal>
  </span>
</template>
