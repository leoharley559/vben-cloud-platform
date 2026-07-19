import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import { h } from 'vue';

import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';

import { Button, Image } from 'ant-design-vue';

import {
  getTableListHeightPx,
  TABLE_LIST_MIN_HEIGHT,
} from '#/utils/table-height';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
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

/**
 * height:'auto' → 按视口计算的固定像素高度，表体占满下方留白；
 * 弹窗等已显式传 number 高度的不覆盖。
 */
export const useVbenVxeGrid = <T extends Record<string, any>>(
  ...rest: Parameters<typeof useGrid<T, ComponentType, ComponentPropsMap>>
) => {
  const [options, ...others] = rest;
  const gridOptions = options?.gridOptions;
  if (!gridOptions) {
    return useGrid(...rest);
  }

  const height = gridOptions.height;
  const isAutoHeight = height === 'auto' || height === undefined;
  if (!isAutoHeight) {
    return useGrid(...rest);
  }

  const enhanced = {
    ...options,
    gridOptions: {
      ...gridOptions,
      height: getTableListHeightPx(),
      minHeight: gridOptions.minHeight ?? TABLE_LIST_MIN_HEIGHT,
    },
  };

  return useGrid(
    enhanced as Parameters<
      typeof useGrid<T, ComponentType, ComponentPropsMap>
    >[0],
    ...(others as []),
  );
};

export type * from '@vben/plugins/vxe-table';
