import { requestClient } from '#/api/request';
import type {
  EmailOutgoingAccountForm,
  EmailOutgoingAccountItem,
  EmailVerifyCodeListItem,
  EmailVerifyCodeListQuery,
} from '#/types/email-verify-code';
import { trimSpace } from '#/utils/string';

/**
 * 邮箱验证码查询列表（验证码管理 · 邮箱验证码 Tab）。
 *
 * @param query 查询参数（玩家、邮箱、时间等筛选）
 * @returns 邮箱验证码记录数组（空结果归一为 `[]`）
 * @see views/memberManage/verifyCode/components/email-code-query-list.vue
 */
export async function fetchEmailVerifyCodeListApi(
  query: EmailVerifyCodeListQuery,
) {
  const result = await requestClient.get<
    EmailVerifyCodeListItem[] | { Items?: EmailVerifyCodeListItem[] } | null
  >('/backend/emailverifycode/list', {
    params: trimSpace({ ...query }),
  });
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === 'object' && Array.isArray(result.Items)) {
    return result.Items;
  }
  return [];
}

/**
 * 邮箱发信账号列表（验证码管理 · 邮箱发信账号 Tab）。
 *
 * @returns 发信账号配置项列表（空结果归一为 `[]`）
 * @see views/memberManage/verifyCode/components/email-outgoing-account-list.vue
 */
export async function fetchEmailOutgoingAccountListApi() {
  const result = await requestClient.get<
    EmailOutgoingAccountItem[] | { Items?: EmailOutgoingAccountItem[] } | null
  >('/backend/emailverifycode/listemailconfig');
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === 'object' && Array.isArray(result.Items)) {
    return result.Items;
  }
  return [];
}

/**
 * 新增邮箱发信账号（验证码管理 · 邮箱发信账号新增操作）。
 *
 * @param form 发信账号表单（SMTP 配置等，序列化为 Params 提交）
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/email-outgoing-account-list.vue
 */
export function addEmailOutgoingAccountApi(form: EmailOutgoingAccountForm) {
  return requestClient.post('/backend/emailverifycode/addemailconfig', {
    Params: JSON.stringify(trimSpace({ ...form })),
  });
}

/**
 * 编辑邮箱发信账号（验证码管理 · 邮箱发信账号编辑操作）。
 *
 * @param id 发信账号 Id
 * @param form 发信账号表单（SMTP 配置等，序列化为 Params 提交）
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/email-outgoing-account-list.vue
 */
export function updateEmailOutgoingAccountApi(
  id: number | string,
  form: EmailOutgoingAccountForm,
) {
  return requestClient.put('/backend/emailverifycode/editemailconfig', {
    Id: id,
    Params: JSON.stringify(trimSpace({ ...form })),
  });
}

/**
 * 删除邮箱发信账号（验证码管理 · 邮箱发信账号删除操作）。
 *
 * @param id 发信账号 Id
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/email-outgoing-account-list.vue
 */
export function deleteEmailOutgoingAccountApi(id: number | string) {
  return requestClient.delete(
    `/backend/emailverifycode/deleteemailconfig/${id}`,
  );
}

/**
 * 设为主发信邮箱账号（验证码管理 · 邮箱发信账号设为主账号操作）。
 *
 * @param id 发信账号 Id
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/email-outgoing-account-list.vue
 */
export function setPrimaryEmailOutgoingAccountApi(id: number | string) {
  return requestClient.put('/backend/emailverifycode/selectemailconfig', {
    Id: id,
  });
}
