export interface EmailVerifyCodeListQuery {
  EmailAccount?: string;
  LoginAccount?: string;
  PackageId?: number | string;
}

export interface EmailVerifyCodeListItem {
  EmailAccount?: string;
  HandlerTime?: number | string;
  LoginAccount?: string;
  PackageId?: number | string;
  PackageName?: string;
  VerifyCode?: string;
  [key: string]: unknown;
}

export interface EmailOutgoingAccountItem {
  EmailAccount?: string;
  EmailPassword?: string;
  EmailSmtp?: string;
  Id?: number | string;
  IsPrimary?: boolean | number;
  [key: string]: unknown;
}

export interface EmailOutgoingAccountForm {
  EmailAccount: string;
  EmailPassword: string;
  EmailSmtp: string;
  Id?: number | string;
}
