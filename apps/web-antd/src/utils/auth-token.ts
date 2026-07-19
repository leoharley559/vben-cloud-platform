import Cookies from 'js-cookie';

const TOKEN_KEY = 'Cloud-Token';
const AUTH_TOKEN_KEY = 'auth';

export function getCloudToken() {
  return Cookies.get(TOKEN_KEY);
}

export function setCloudToken(token: string) {
  return Cookies.set(TOKEN_KEY, token);
}

export function removeCloudToken() {
  return Cookies.remove(TOKEN_KEY);
}

export function getAuthToken() {
  return Cookies.get(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  return Cookies.set(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken() {
  return Cookies.remove(AUTH_TOKEN_KEY);
}

export function getLanguageCookie() {
  return Cookies.get('language') || 'zh-CN';
}

export function setLanguageCookie(language: string) {
  return Cookies.set('language', language);
}

/** 协助工单临时登录凭证（对齐旧站 HelpLinkKey） */
const HELP_LINK_KEY = 'HelpLinkKey';

export function getHelpLink() {
  return Cookies.get(HELP_LINK_KEY);
}

export function setHelpLink(link: string) {
  return Cookies.set(HELP_LINK_KEY, link);
}

export function removeHelpLink() {
  return Cookies.remove(HELP_LINK_KEY);
}
