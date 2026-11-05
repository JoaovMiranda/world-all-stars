/** HTTP methods used by the API contracts. */
export const HttpMethod = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
} as const;
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
export const HTTP_METHOD_VALUES = Object.values(HttpMethod) as [HttpMethod, ...HttpMethod[]];
