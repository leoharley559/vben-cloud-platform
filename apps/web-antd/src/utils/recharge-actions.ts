import type { RechargeListItem } from '#/types/operation-manage';

export const RECHARGE_SECURITY_PAGE_ID = 20;
export const RECHARGE_SECOND_REVIEW_SECURITY_PAGE_ID = 27;

export function canShowRechargeReplaceOrder(row: RechargeListItem) {
  return Number(row.Status) === 2 && String(row.Process) === 'f';
}

export function canShowRechargeConfirmEmptyOrder(row: RechargeListItem) {
  return (
    Number(row.Status) === 1 &&
    !!row.RelatedOrderId &&
    String(row.RelatedOrderId) !== ''
  );
}

export function canShowRechargeDeleteEmptyOrder(row: RechargeListItem) {
  return Number(row.Status) === 1 && Number(row.HandleType) === 3;
}

export function canShowRechargeManualReview(row: RechargeListItem) {
  const status = Number(row.Status);
  const handleType = Number(row.HandleType);
  return (
    (status === 1 || status === 12) && handleType !== 2 && handleType !== 3
  );
}

export function canShowRechargeSecondReview(row: RechargeListItem) {
  const status = Number(row.Status);
  const handleType = Number(row.HandleType);
  return status === 4 && handleType !== 2 && handleType !== 3;
}
