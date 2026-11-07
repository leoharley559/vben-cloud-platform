export function getServiceImageUrl(path?: string) {
  if (!path) {
    return '';
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = import.meta.env.VITE_SERVICE_IMG || 'https://down.dk888.link/';
  return `${base.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
}

/** 游戏/收款码等资源：固定拼 VITE_GAME_IMG */
export function getGameImageUrl(path?: string) {
  const raw = String(path || '').trim();
  if (!raw) {
    return '';
  }
  const base = (
    import.meta.env.VITE_GAME_IMG || 'https://cloud.dk888.link/g-static/'
  ).replace(/\/?$/, '/');

  let relative = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      relative = new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  relative = relative.replace(/^\//, '');
  if (relative.startsWith('g-static/')) {
    relative = relative.slice('g-static/'.length);
  }
  return `${base}${relative}`;
}

export function getUploadMd5ImageUrl() {
  return import.meta.env.VITE_UPLOAD_MD5_IMG || '/api/resource/uploadimagemd5';
}

export function getUploadFileUrl() {
  return import.meta.env.VITE_UPLOAD_URL || '/api/uploadfile';
}

export function splitImagePaths(value?: string) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
