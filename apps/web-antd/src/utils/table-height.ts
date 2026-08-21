/** 列表行高（与当前页面实测一致） */
export const TABLE_ROW_HEIGHT = 40;

/** 默认每页条数（对齐游戏记录 / Vxe 全局分页） */
export const TABLE_DEFAULT_PAGE_SIZE = 20;

/**
 * 列表页容量选项（对齐 use-vxe-grid 全局 pagerConfig.pageSizes）。
 * Vxe 用数字数组；Ant Pagination / Table 用字符串数组。
 */
export const TABLE_PAGE_SIZES = [10, 20, 30, 50, 100, 200] as const;

export const TABLE_ANT_PAGE_SIZE_OPTIONS = TABLE_PAGE_SIZES.map(String);

/** 列表高度先按 700 试看（默认 20 条） */
export const TABLE_LIST_MIN_HEIGHT = 700;

/** @deprecated 视口扣减规则已废弃，保留避免旧引用报错 */
export const TABLE_LIST_VIEWPORT_OFFSET = 0;

/**
 * 列表页表格高度（像素）。
 * 默认 20 条用 700；其它 pageSize 按 700 / 21 折算。
 */
export function getTableListHeightPx(
  pageSize = TABLE_DEFAULT_PAGE_SIZE,
): number {
  if (pageSize === TABLE_DEFAULT_PAGE_SIZE) {
    return TABLE_LIST_MIN_HEIGHT;
  }
  const rows = Math.max(1, pageSize);
  return Math.round((TABLE_LIST_MIN_HEIGHT / 21) * (rows + 1));
}

/** @deprecated 使用 getTableListHeightPx；保留常量兼容旧引用 */
export const TABLE_LIST_HEIGHT = TABLE_LIST_MIN_HEIGHT;

/** @deprecated 同 TABLE_LIST_HEIGHT */
export const TABLE_LIST_MAX_HEIGHT = TABLE_LIST_MIN_HEIGHT;

/** Ant Design Table 表体滚动高度（不含表头） */
export function antTableScrollY(extraOffset = 0) {
  return Math.max(
    TABLE_ROW_HEIGHT * 5,
    TABLE_ROW_HEIGHT * TABLE_DEFAULT_PAGE_SIZE - extraOffset,
  );
}
