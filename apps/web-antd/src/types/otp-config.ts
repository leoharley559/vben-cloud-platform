export interface OtpConfigItem {
  DeviceLimit?: number | string;
  IpLimit?: number | string;
  [key: string]: unknown;
}

export interface OtpConfigPayload {
  DeviceLimit: number | string;
  IpLimit: number | string;
}
