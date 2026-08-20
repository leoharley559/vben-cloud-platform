const ERROR_CODE_MAPPING: Record<number, Record<number, string> | string> = {
  10_003: '',
  10_008: '',
  10_017: '',
  10_033: '',
  10_039: '',
  10_125: {
    1000: "请求数据没有'Data'节点",
    1001: '请求修改房间数据未找到',
    1002: '请求数据解析错误',
    1003: '代理没有对应的游戏房间信息',
  },
  10_168: '',
  10_505: '',
};

export function mapErrorMessage(status: number, message?: string) {
  const mapping = ERROR_CODE_MAPPING[status];
  if (!mapping) {
    return message || '';
  }
  if (typeof mapping === 'string') {
    return message || '';
  }
  if (!message) {
    return '';
  }
  try {
    const msgObj = JSON.parse(message) as { res?: number };
    if (msgObj.res !== undefined) {
      return mapping[msgObj.res] || '';
    }
  } catch {
    // ignore parse error
  }
  return '';
}

export const LOGOUT_ERROR_CODES = [10_008, 10_003, 10_039];
export const FORCE_LOGOUT_CODE = 10_033;
export const PASSTHROUGH_ERROR_CODES = [10_168, 10_517, 10_505];
