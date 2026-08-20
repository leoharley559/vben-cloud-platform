import { computed } from 'vue';

import { useProjectConfig } from '#/composables/use-project-config';

/** 极速支付（旧站特殊 PayType=200） */
export const RECHARGE_SPECIAL_PAY_TYPE = '200';

export function useRechargePayTypeOptions() {
  const { projectConfig } = useProjectConfig();

  const options = computed(() => {
    const list =
      (
        projectConfig.value as null | {
          RechargeTypeList?: Array<{
            IsOpen?: boolean;
            Key?: number | string;
            Name?: string;
          }>;
        }
      )?.RechargeTypeList || [];

    return list
      .filter((item) => item.IsOpen && item.Key !== undefined)
      .map((item) => ({
        label: String(item.Name || item.Key),
        value: String(item.Key),
      }));
  });

  const allOptions = computed(() => [
    ...options.value,
    { label: '极速支付', value: RECHARGE_SPECIAL_PAY_TYPE },
  ]);

  function formatPayTypes(value?: string) {
    if (!value) {
      return '-';
    }
    const map = Object.fromEntries(
      allOptions.value.map((item) => [item.value, item.label]),
    );
    return value
      .split(',')
      .filter(Boolean)
      .map((key) => map[key] || key)
      .join('、');
  }

  return { allOptions, formatPayTypes, options };
}
