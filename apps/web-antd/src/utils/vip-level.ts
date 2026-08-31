import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

/** 文本展示（导出、复制等），对齐玩家详情：VIP 与等级数字之间留空格 */
export function formatVipLevelLabel(value?: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return `VIP ${value}`;
}

/** VXE 表格列：配合模板 slot #vipLevel 与 VipLevelTag */
export const vipLevelGridColumn = {
  field: 'VipLevel',
  minWidth: 90,
  slots: { default: 'vipLevel' },
  title: 'VIP等级',
} as const;

/** OperationListPanel 列配置（面板内自动渲染 VipLevelTag） */
export const vipLevelOpsColumn: OperationListConfig['columns'][number] = {
  field: 'VipLevel',
  minWidth: 90,
  slot: 'vipLevel',
  title: 'VIP等级',
};
