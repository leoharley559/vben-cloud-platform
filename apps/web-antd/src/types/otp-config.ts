export interface OtpConfigItem {
  [key: string]: unknown;
  DeviceLimit?: number | string;
  IpLimit?: number | string;
}

export interface OtpConfigPayload {
  DeviceLimit: number | string;
  IpLimit: number | string;
}
