declare module '#/utils/third-detail-display.js' {
  export function normalizeDetail(detail: unknown): Record<string, unknown>;

  export function getFieldLabel(key: string): string;

  export function formatFieldValue(key: string, value: unknown): string;

  export function detectDetailMode(
    detail: unknown,
    rowData?: Record<string, unknown>,
  ): string;

  export function buildDetailSections(
    detail: unknown,
    rowData?: Record<string, unknown>,
  ): {
    mode: string;
    sections: Array<Record<string, unknown>>;
  };

  export function getDetailModeLabel(mode: string): string;
}
