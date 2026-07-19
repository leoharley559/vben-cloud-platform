/** 兜底最小高度（窄屏 / 嵌入场景） */
export const TABLE_LIST_MIN_HEIGHT = 420;

/** 预留给顶栏、多页签、筛选区、页边距的默认偏移 */
export const TABLE_LIST_VIEWPORT_OFFSET = 280;

/**
 * 列表页表格高度（像素）。
 * vxe-table 的 height 只认 number / 'auto' / '100%' / 百分比，不支持 CSS calc。
 */
export function getTableListHeightPx(extraOffset = 0): number {
  const offset = TABLE_LIST_VIEWPORT_OFFSET + extraOffset;
  if (typeof window === 'undefined') {
    return TABLE_LIST_MIN_HEIGHT;
  }
  return Math.max(TABLE_LIST_MIN_HEIGHT, window.innerHeight - offset);
}

/** @deprecated 使用 getTableListHeightPx；保留常量兼容旧引用 */
export const TABLE_LIST_HEIGHT = TABLE_LIST_MIN_HEIGHT;

/** @deprecated 同 TABLE_LIST_HEIGHT */
export const TABLE_LIST_MAX_HEIGHT = TABLE_LIST_MIN_HEIGHT;

/** Ant Design Table 纵向滚动（像素高度，与 Vxe 列表策略一致） */
export function antTableScrollY(extraOffset = 0) {
  return getTableListHeightPx(extraOffset);
}
