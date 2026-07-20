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
