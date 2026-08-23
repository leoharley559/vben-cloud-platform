export interface EmailVerifyCodeListQuery {
  EmailAccount?: string;
  LoginAccount?: string;
  PackageId?: number | string;
}

export interface EmailVerifyCodeListItem {
  [key: string]: unknown;
  EmailAccount?: string;
  HandlerTime?: number | string;
  LoginAccount?: string;
  PackageId?: number | string;
  PackageName?: string;
  VerifyCode?: string;
}

export interface EmailOutgoingAccountItem {
  [key: string]: unknown;
  EmailAccount?: string;
  EmailPassword?: string;
  EmailSmtp?: string;
  Id?: number | string;
  IsPrimary?: boolean | number;
}

export interface EmailOutgoingAccountForm {
  EmailAccount: string;
  EmailPassword: string;
  EmailSmtp: string;
  Id?: number | string;
}
