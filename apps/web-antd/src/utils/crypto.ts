import CryptoJS from 'crypto-js';

const key = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_CRYPTO_KEY || '');
const iv = CryptoJS.enc.Utf8.parse(import.meta.env.VITE_CRYPTO_IV || '');

/** 开发环境不加密，与旧项目 isDevMode 行为一致 */
export const isDevMode = import.meta.env.DEV;

export function decrypt(text: string) {
  try {
    const cipher = text.replaceAll(/\s/g, '');
    const decrypted = CryptoJS.AES.decrypt(cipher, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted) as unknown;
  } catch (error) {
    console.error('[crypto] decrypt failed', error);
    return null;
  }
}

export function encrypt(data: unknown) {
  try {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(text, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  } catch (error) {
    console.error('[crypto] encrypt failed', error);
    return null;
  }
}

export function encryptData(data: string) {
  if (isDevMode) {
    return data;
  }
  return `EncryptData=${encodeURIComponent(encrypt(data) || '')}`;
}

export function decryptResponse<T = unknown>(res: { data: unknown }) {
  if (isDevMode) {
    return res;
  }
  const decryptedData = decrypt(String(res.data));
  res.data = decryptedData;
  return res as { data: T };
}

/** WebSocket 消息解密（客服/聊天室） */
export function wsDecrypt(message: string) {
  const aesKey = 'zf2edfef4tweade1fe2u83kd2l4o2us2';
  return CryptoJS.AES.decrypt(message, CryptoJS.enc.Utf8.parse(aesKey), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.ZeroPadding,
  }).toString(CryptoJS.enc.Utf8);
}

/** 与旧站 `$md5` 对齐的请求防重 Hash */
export function md5Hash(text: string) {
  return CryptoJS.MD5(text).toString();
}

export function createRequestHash() {
  return md5Hash(String(Date.now()));
}
