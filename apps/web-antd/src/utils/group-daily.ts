import { calcDailyReportRow } from '#/utils/everyday-data-calc';
import type { DailyReportRow } from '#/utils/everyday-data-calc';
import type { AgentGroupNode } from '#/api/operationalData/group-daily';

export type GroupDailyRow = DailyReportRow & {
  GroupStyle?: string;
  GroupStyle1?: string;
  GroupStyle2?: string;
  GroupStyle3?: string;
};

/** 对齐旧站 getBeforeDateStr(2)：前天 */
export function defaultGroupDailyRange(): [string, string] {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const text = `${y}-${m}-${day}`;
  return [text, text];
}

/** 月报默认：约 90 天前月份 ~ 上月（对齐 getBeforeMonthStr） */
export function defaultGroupMonthlyRange(): [string, string] {
  const end = new Date();
  end.setMonth(end.getMonth() - 1);
  const begin = new Date();
  begin.setDate(begin.getDate() - 89);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return [fmt(begin), fmt(end)];
}

export function normalizeGroupTree(
  items: AgentGroupNode[] | null | undefined,
): AgentGroupNode[] {
  if (!items?.length) return [];
  return items.map((item) => {
    const children = normalizeGroupTree(item.List);
    return {
      ...item,
      // Cascader 对数字 0 容易当空值，统一转字符串
      Id: item.Id === undefined || item.Id === null ? item.Id : String(item.Id),
      List: children.length ? children : undefined,
    };
  });
}

/**
 * 对齐旧站 filterchangeStyle：去重包含路径，拼 ParentTreeStr，推算 Level
 */
export function buildParentTreeState(
  groupTemp: Array<Array<number | string>>,
  keepLevel?: number,
) {
  const arr = groupTemp.map((path) => [...path]);
  const temp = arr.filter((item, index) => {
    const str = `,${item.join(',')},`;
    for (let i = 0; i < arr.length; i += 1) {
      if (i === index) continue;
      const test = `,${arr[i]!.join(',')},`;
      if (test.includes(str)) return false;
    }
    return true;
  });

  for (const ele of temp) {
    for (let i = 0; i < ele.length; i += 1) {
      if (ele.indexOf(ele[i]!) !== i) {
        ele.splice(i, 1);
        i -= 1;
      }
    }
  }

  const sorted = [...temp].toSorted((a, b) => b.length - a.length);
  const level = keepLevel === undefined ? sorted[0]?.length || 0 : keepLevel;

  const parentTreeStr = temp.map((item) => `,${item.join(',')},`).join('#');

  return {
    level,
    parentTreeStr,
    showAgentCount: !temp.some((item) => item.length > 3) && level !== 4,
  };
}

/** 对齐旧站点击层级后的可下钻样式标记 */
export function applyGroupDrillStyles(
  rows: GroupDailyRow[],
  level: number,
): GroupDailyRow[] {
  return rows.map((row) => {
    const next = { ...row } as GroupDailyRow;
    delete next.GroupStyle;
    delete next.GroupStyle1;
    delete next.GroupStyle2;
    delete next.GroupStyle3;
    if (level === 0) {
      next.GroupStyle1 = 'GroupStyle1';
    } else if (level === 1) {
      next.GroupStyle1 = 'GroupStyle1';
      next.GroupStyle2 = 'GroupStyle2';
    } else if (level === 2) {
      next.GroupStyle1 = 'GroupStyle1';
      next.GroupStyle2 = 'GroupStyle2';
      next.GroupStyle3 = 'GroupStyle3';
    } else {
      next.GroupStyle1 = 'GroupStyle1';
      next.GroupStyle2 = 'GroupStyle2';
      next.GroupStyle3 = 'GroupStyle3';
      next.GroupStyle = 'GroupStyle';
    }
    return next;
  });
}

export function calcGroupDailyRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => calcDailyReportRow({ ...row }) as GroupDailyRow);
}
