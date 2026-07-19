import { requestClient } from '#/api/request';
import type {
  EmailOutgoingAccountForm,
  EmailOutgoingAccountItem,
  EmailVerifyCodeListItem,
  EmailVerifyCodeListQuery,
} from '#/types/email-verify-code';
import { trimSpace } from '#/utils/string';

export function fetchEmailVerifyCodeListApi(query: EmailVerifyCodeListQuery) {
  return requestClient.get<EmailVerifyCodeListItem[]>(
    '/backend/emailverifycode/list',
    {
      params: trimSpace({ ...query }),
    },
  );
}

export function fetchEmailOutgoingAccountListApi() {
  return requestClient.get<EmailOutgoingAccountItem[]>(
    '/backend/emailverifycode/listemailconfig',
  );
}

export function addEmailOutgoingAccountApi(form: EmailOutgoingAccountForm) {
  return requestClient.post('/backend/emailverifycode/addemailconfig', {
    Params: JSON.stringify(trimSpace({ ...form })),
  });
}

export function updateEmailOutgoingAccountApi(
  id: number | string,
  form: EmailOutgoingAccountForm,
) {
  return requestClient.put('/backend/emailverifycode/editemailconfig', {
    Id: id,
    Params: JSON.stringify(trimSpace({ ...form })),
  });
}

export function deleteEmailOutgoingAccountApi(id: number | string) {
  return requestClient.delete(
    `/backend/emailverifycode/deleteemailconfig/${id}`,
  );
}

export function setPrimaryEmailOutgoingAccountApi(id: number | string) {
  return requestClient.put('/backend/emailverifycode/selectemailconfig', {
    Id: id,
  });
}
