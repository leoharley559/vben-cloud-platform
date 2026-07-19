import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  CardMultiBindFormPayload,
  CardMultiBindListItem,
  CardMultiBindListQuery,
} from '#/types/card-multi-bind';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchCardMultiBindListApi(query: CardMultiBindListQuery) {
  const result = await requestClient.get<
    CloudListResult<CardMultiBindListItem>
  >('/backend/playerbindcardconfig/listcardmultiple', {
    params: trimSpace({ ...query }),
  });
  return normalizeList(result);
}

export function createCardMultiBindApi(data: CardMultiBindFormPayload) {
  return requestClient.post(
    '/backend/playerbindcardconfig/addcardmultiple',
    trimSpace(data),
  );
}

export function deleteCardMultiBindApi(id: number | string) {
  return requestClient.delete(
    `/backend/playerbindcardconfig/delcardmultiple/${id}`,
  );
}
