import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import { h, onMounted, onUnmounted } from 'vue';

import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';

import { Button, Image } from 'ant-design-vue';

import {
  getTableListHeightPx,
  TABLE_DEFAULT_PAGE_SIZE,
  TABLE_LIST_MIN_HEIGHT,
} from '#/utils/table-height';

import { useVbenForm } from './form';

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

type VxeColumn = NonNullable<VxeTableGridOptions['columns']>[number];

function isMobileViewport() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia(MOBILE_MEDIA_QUERY).matches
  );
}

/** 移动端去掉 fixed，避免固定层占宽；桌面端保留原配置 */
function cloneColumnsWithoutFixed(
  columns?: VxeTableGridOptions['columns'],
): VxeTableGridOptions['columns'] {
  if (!columns?.length) {
    return columns;
  }
  return columns.map((column) => {
    const next: VxeColumn = { ...column };
    delete (next as { fixed?: unknown }).fixed;
    if (Array.isArray(next.children) && next.children.length > 0) {
      next.children = cloneColumnsWithoutFixed(next.children);
    }
    return next;
  });
}

function withMobileColumns(
  gridOptions: VxeTableGridOptions,
  mobile = isMobileViewport(),
): VxeTableGridOptions {
  if (!mobile || !gridOptions.columns?.length) {
    return gridOptions;
  }
  return {
    ...gridOptions,
    columns: cloneColumnsWithoutFixed(gridOptions.columns),
  };
}

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      table: {
        rowConfig: {
          keyField: 'Id',
        },
      },
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        height: getTableListHeightPx(),
        minHeight: TABLE_LIST_MIN_HEIGHT,
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        rowConfig: {
          // vxe-table 4.18+ 必填；业务表主键多为 Id，个别表可自行覆盖
          keyField: 'Id',
        },
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(Image, { src: row[column.field], ...props });
      },
    });

    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          Button,
          { size: 'small', type: 'link' },
          { default: () => props?.text },
        );
      },
    });
  },
  useVbenForm,
});

function bindMobileColumnSync(
  api: { setGridOptions: (options: Partial<VxeTableGridOptions>) => void },
  sourceColumns?: VxeTableGridOptions['columns'],
) {
  if (typeof window === 'undefined' || !sourceColumns?.length) {
    return;
  }

  const media = window.matchMedia(MOBILE_MEDIA_QUERY);
  const syncColumns = () => {
    api.setGridOptions({
      columns: media.matches
        ? cloneColumnsWithoutFixed(sourceColumns)
        : sourceColumns,
    });
  };

  onMounted(() => {
    media.addEventListener('change', syncColumns);
    // 首屏若已是移动端，确保与初始 columns 一致（防止后续业务重设带回 fixed）
    if (media.matches) {
      syncColumns();
    }
  });

  onUnmounted(() => {
    media.removeEventListener('change', syncColumns);
  });
}

/**
 * height:'auto' → 按「表头 + 每页条数」计算固定高度（默认约 700）；
 * height:'content' → 按实际行数撑开（不强制最小高度）；
 * 弹窗等已显式传 number 高度的不覆盖。
 * 移动端统一移除 columns.fixed，避免固定列挤占可视宽度且内容丢失。
 */
export const useVbenVxeGrid = <T extends Record<string, any>>(
  ...rest: Parameters<typeof useGrid<T, ComponentType, ComponentPropsMap>>
) => {
  const [options, ...others] = rest;
  const gridOptions = options?.gridOptions;
  if (!gridOptions) {
    return useGrid(...rest);
  }

  const sourceColumns = gridOptions.columns;
  const height = gridOptions.height;

  let resolvedGridOptions: VxeTableGridOptions = { ...gridOptions };

  if (height === 'content') {
    resolvedGridOptions = {
      ...resolvedGridOptions,
      height: 'auto',
      minHeight: gridOptions.minHeight ?? 0,
    };
  } else if (height === 'auto' || height === undefined) {
    const pager = gridOptions.pagerConfig;
    const pageSize =
      pager && typeof pager === 'object' && typeof pager.pageSize === 'number'
        ? pager.pageSize
        : TABLE_DEFAULT_PAGE_SIZE;
    resolvedGridOptions = {
      ...resolvedGridOptions,
      height: getTableListHeightPx(pageSize),
      minHeight: gridOptions.minHeight ?? TABLE_LIST_MIN_HEIGHT,
    };
  }

  const enhanced = {
    ...options,
    gridOptions: withMobileColumns(resolvedGridOptions),
  };

  const [Grid, api] = useGrid(
    enhanced as Parameters<
      typeof useGrid<T, ComponentType, ComponentPropsMap>
    >[0],
    ...(others as []),
  );

  bindMobileColumnSync(api, sourceColumns);

  return [Grid, api] as const;
};

export type * from '@vben/plugins/vxe-table';
