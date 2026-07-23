import CryptoJS from 'crypto-js';

import type {
  AdminDetailRecord,
  AdminFormModel,
  AdminSonUserRoleDataField,
} from '#/types/system-manage';

function cleanArray<T>(arr?: T[]) {
  if (!arr?.length) {
    return [] as T[];
  }
  return arr.filter(
    (item) => item !== '' && item !== undefined && item !== null,
  );
}

function toNumberArray(values?: Array<number | string>) {
  return cleanArray(values).map((item) => Number(item));
}

function splitToNumberArray(value?: string) {
  if (!value) {
    return [] as number[];
  }
  return toNumberArray(value.split(','));
}

function splitToStringArray(value?: string) {
  if (!value) {
    return [] as string[];
  }
  return cleanArray(value.split(','));
}

export function createDefaultAdminForm(): AdminFormModel {
  return {
    ConfirmPassword: '',
    ContactInf: '',
    CreateRole: [],
    Name: '',
    Note: '',
    Password: '',
    Role: [],
    SonUserRoleDataField: {
      SeeAccountId: [],
      SeeChannelId: [],
      SeeDevices: [],
      SeePackageId: [],
      ViewOTP: '1',
    },
    Username: '',
  };
}

function parseSonUserRoleDataField(
  raw?: AdminSonUserRoleDataField | string,
): AdminSonUserRoleDataField {
  if (!raw) {
    return createDefaultAdminForm().SonUserRoleDataField;
  }

  const parsed =
    typeof raw === 'string'
      ? (JSON.parse(raw) as Partial<AdminSonUserRoleDataField>)
      : raw;

  return {
    SeeAccountId: splitToNumberArray(String(parsed.SeeAccountId || '')),
    SeeChannelId: splitToStringArray(String(parsed.SeeChannelId || '')),
    SeeDevices: splitToStringArray(String(parsed.SeeDevices || '')),
    SeePackageId: splitToNumberArray(String(parsed.SeePackageId || '')),
    ViewOTP: String(parsed.ViewOTP || '1'),
  };
}

export function parseAdminDetail(data: AdminDetailRecord): AdminFormModel {
  const sonUserRoleDataField = parseSonUserRoleDataField(
    data.SonUserRoleDataField,
  );

  return {
    ConfirmPassword: '',
    ContactInf: data.ContactInf || '',
    CreateRole: splitToNumberArray(String(data.CreateRole || '')),
    Id: data.Id,
    Name: data.Name || '',
    Note: data.Note || '',
    Password: '',
    Role: splitToNumberArray(String(data.Role || '')),
    SonUserRoleDataField: sonUserRoleDataField,
    Status: data.Status,
    Username: data.Username || '',
  };
}

function serializeSonUserRoleDataField(field: AdminSonUserRoleDataField) {
  const seePackageId = cleanArray(field.SeePackageId)
    .filter((item) => item !== '')
    .join(',');
  const seeChannelId = cleanArray(field.SeeChannelId)
    .filter((item) => item !== '全部渠道')
    .join(',');
  const seeDevices = cleanArray(field.SeeDevices).join(',');
  const seeAccountId = cleanArray(field.SeeAccountId)
    .filter((item) => item !== '')
    .join(',');

  return JSON.stringify({
    SeeAccountId: seeAccountId,
    SeeChannelId: seeChannelId,
    SeeDevices: seeDevices,
    SeePackageId: seePackageId,
    ViewOTP: field.ViewOTP || '1',
  });
}

export function serializeAdminPayload(
  form: AdminFormModel,
  mode: 'create' | 'update',
) {
  const { ConfirmPassword: _confirm, ...rest } = form;
  const payload: Record<string, unknown> = {
    ...rest,
    // 对齐旧站：Role / CreateRole 以逗号串提交（表单多选为数组）
    CreateRole: Array.isArray(form.CreateRole)
      ? form.CreateRole.filter((item) => item !== '' && item != null).join(',')
      : form.CreateRole,
    Role: Array.isArray(form.Role)
      ? form.Role.filter((item) => item !== '' && item != null).join(',')
      : form.Role,
    SonUserRoleDataField: serializeSonUserRoleDataField(
      form.SonUserRoleDataField,
    ),
  };

  if (mode === 'create') {
    payload.Hash = CryptoJS.MD5(String(Date.now())).toString();
  }

  if (!payload.Password) {
    delete payload.Password;
  }

  return payload;
}

export function isValidRemark(value?: string) {
  if (!value) {
    return true;
  }
  return /^.{1,400}$/.test(value);
}

export function isValidUsername(value: string) {
  return /^[a-z][a-z0-9_]{6,19}$/i.test(value);
}

export function isValidPassword(value: string) {
  return /^[a-z0-9_]{6,20}$/i.test(value);
}
