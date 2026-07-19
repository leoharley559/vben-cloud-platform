export type MobileTabKey = 'data' | 'money' | 'query' | 'team' | 'tui' | 'user';

export type MobileCloudTabKey = 'code' | 'member' | 'user';

export interface MobileTabItem {
  icon: string;
  key: MobileTabKey;
  label: string;
}

export interface MobileCloudTabItem {
  icon: string;
  key: MobileCloudTabKey;
  label: string;
}

export const MOBILE_TABS: MobileTabItem[] = [
  { icon: 'lucide:bar-chart-3', key: 'data', label: '数据' },
  { icon: 'lucide:user-plus', key: 'user', label: '开户' },
  { icon: 'lucide:share-2', key: 'tui', label: '推广' },
  { icon: 'lucide:users', key: 'team', label: '团队' },
  { icon: 'lucide:search', key: 'query', label: '查询' },
  { icon: 'lucide:wallet', key: 'money', label: '收益' },
];

export const MOBILE_CLOUD_TABS: MobileCloudTabItem[] = [
  { icon: 'lucide:shield-check', key: 'code', label: '验证码' },
  { icon: 'lucide:users-round', key: 'member', label: '会员' },
  { icon: 'lucide:user-circle', key: 'user', label: '个人中心' },
];
