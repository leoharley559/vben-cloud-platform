/** 登录设备平台显示（对齐 cloudPlatform playerDetailHandle.js） */
export function formatLoginPlatform(value?: string) {
  if (!value) {
    return '-';
  }
  if (value.includes('uniapp2')) {
    return value.replace('uniapp2', '原生2.0');
  }
  if (value.includes('uniapp')) {
    return value.replace('uniapp', '原生1.0');
  }
  return value;
}

export function formatLoginChannel(
  channelName?: string,
  channelId?: number | string,
) {
  if (
    !channelName &&
    (channelId === undefined || channelId === null || channelId === '')
  ) {
    return '-';
  }
  if (
    channelName &&
    channelId !== undefined &&
    channelId !== null &&
    channelId !== ''
  ) {
    return `${channelName}(${channelId})`;
  }
  return channelName || String(channelId);
}
