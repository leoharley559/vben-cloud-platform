/** 去除对象中字符串字段首尾空格（对齐 cloudPlatform trimSpace） */
export function trimSpace<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = value.trim();
    }
  }
  return result;
}
