/**
 * 查询游戏称号分组列表（兼容导出，请迁移至 memberManage）
 * @param query 查询参数（分组名称、状态等筛选及分页）
 * @returns 称号分组行 Items 及 Pagination
 * @see views/operationalManage/gameTitle/index.vue
 * @deprecated 请使用 `#/api/memberManage/game-title`
 */
export { fetchGameTitleGroupListApi } from '#/api/memberManage/game-title';

/**
 * 查询游戏称号列表（兼容导出，请迁移至 memberManage）
 * @param query 查询参数（称号名称、分组、状态等筛选及分页）
 * @returns 称号行 Items 及 Pagination
 * @see views/operationalManage/gameTitle/index.vue
 * @deprecated 请使用 `#/api/memberManage/game-title`
 */
export { fetchGameTitleListApi } from '#/api/memberManage/game-title';
