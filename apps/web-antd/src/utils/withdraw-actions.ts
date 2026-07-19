import type { WithdrawListItem } from '#/types/operation-manage';

export {
  ACCOUNT_ADJUST_AUDIT_PAGE_ID,
  DOWNLOAD_CSV_SECURITY_PAGE_ID,
  WITHDRAW_FINANCE_EXPORT_PAGE_ID,
  WITHDRAW_REDEEM_EXPORT_PAGE_ID,
  WITHDRAW_RISK_SECURITY_PAGE_ID,
} from '#/utils/security-page-ids';

export function canShowWithdrawManualPay(row: WithdrawListItem) {
  const status = Number(row.Status);
  const process = Number(row.Process);
  return (
    ((status === 1 && process <= 6) ||
      isShowPayMoneyBtn(
        status,
        process,
        Number(row.RefundScore),
        row.SendTime,
      )) &&
    true
  );
}

export function isShowPayMoneyBtn(
  status: number,
  process: number,
  refundScore: number,
  sendTime?: number | string,
) {
  if (status === 2 && process === 7 && refundScore === 0) {
    return true;
  }
  if (status === 4 && process === 8 && sendTime) {
    return true;
  }
  return false;
}

export function canShowWithdrawAutoPay(row: WithdrawListItem) {
  return Number(row.Status) === 1 && Number(row.Process) <= 6;
}

export function canShowWithdrawRiskApprove(row: WithdrawListItem) {
  const riskStatus = Number(row.RiskStatus);
  return riskStatus === -1 || riskStatus === 3;
}

export function canShowWithdrawReject(row: WithdrawListItem) {
  return Number(row.Status) === 1 && Number(row.Process) <= 6;
}

export function isWithdrawRiskBlockingPay(row: WithdrawListItem) {
  const riskStatus = Number(row.RiskStatus);
  return riskStatus === -1 || riskStatus === 3;
}

/** Status=2 Process=7 且未通知 */
export function canShowWithdrawNotice(row: WithdrawListItem) {
  return (
    Number(row.Status) === 2 &&
    Number(row.Process) === 7 &&
    Number(row.NotifyResult) === 0
  );
}

/** 有三方通道且状态为异常/冲正中 */
export function canShowWithdrawCheckThirdParty(row: WithdrawListItem) {
  return (
    Number(row.AgentWithdrawId) !== 0 &&
    Number(row.Status) === 5 &&
    (Number(row.Process) === 4 || Number(row.Process) === 9)
  );
}

export function canShowWithdrawTransitionPending(row: WithdrawListItem) {
  return Number(row.Status) === 5 && Number(row.Process) === 9;
}

/** 到账状态异常且已出款/冲正 */
export function canShowWithdrawReceivedFix(row: WithdrawListItem) {
  const received = Number(row.ReceivedStatus);
  const status = Number(row.Status);
  return ![1, 2].includes(received) && [2, 4].includes(status);
}
