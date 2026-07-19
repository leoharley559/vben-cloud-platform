/** 构建玩家详情路由路径（对齐旧站 PlayerId:LoginAccount） */
export function buildPlayerDetailPath(
  playerId: number | string,
  loginAccount?: string,
) {
  const account = loginAccount || '';
  return `/operationalManage/playerDetails/${playerId}:${account}`;
}

/** 解析路由参数 :id */
export function parsePlayerDetailRouteId(id?: string) {
  if (!id) {
    return { loginAccount: '', playerId: '' };
  }
  const [playerId, loginAccount = ''] = id.split(':');
  return { loginAccount, playerId };
}
