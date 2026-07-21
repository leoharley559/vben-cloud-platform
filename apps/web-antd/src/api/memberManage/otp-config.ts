import { requestClient } from '#/api/request';
import type { OtpConfigItem, OtpConfigPayload } from '#/types/otp-config';

/**
 * 获取 OTP 短信通道配置（验证码管理 · OTP 管理 Tab）。
 *
 * @returns OTP 通道配置项列表
 * @see views/memberManage/verifyCode/components/otp-manage-panel.vue
 */
export function fetchOtpConfigApi() {
  return requestClient.get<OtpConfigItem[]>('/backend/gameotpconfig/getconfig');
}

/**
 * 更新 OTP 短信通道配置（验证码管理 · OTP 管理 Tab 保存操作）。
 *
 * @param data OTP 配置表单（通道开关、优先级等）
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/otp-manage-panel.vue
 */
export function updateOtpConfigApi(data: OtpConfigPayload) {
  return requestClient.put('/backend/gameotpconfig/editconfig', data);
}
