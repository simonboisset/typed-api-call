import { buildDollarBracePhrase } from 'phrase-builder';
import type { ZodType } from 'zod';

type FetchFactoryParams<T, In, Out, P extends Record<string, string>> = {
  url: string;
  headers?: Partial<T>;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  input?: ZodType<any, any, In>;
  response: ZodType<Out, any, any>;
  params?: ZodType<P>;
  onError?: (error: any, url: string) => void;
};

type CreateApiCallParams<T> = {
  url: string;
  getHeaders: (args: T) => Headers;
  onError?: (error: any, url: string) => void;
};

export const createApiCall =
  <T>({ url: prefixUrl, getHeaders, onError: onErrorRoot }: CreateApiCallParams<T>) =>
  <In, Out, P extends Record<string, string>>({
    method,
    url,
    headers: headersOverrideBeforeCall,
    params: paramsSchema,
    response: responseSchema,
    input: inputSchema,
    onError,
  }: FetchFactoryParams<T, In, Out, P>) =>
  async ({
    data,
    params,
    headers: headersOverride,
  }: {
    headers?: Partial<T>;
    data: In extends Object ? In : undefined;
    params: P extends undefined ? undefined : P;
  }) => {
    try {
      const validatedInputs = inputSchema?.parse(data);
      const safeParams = paramsSchema?.parse(params);
      const headerParams = (
        headersOverrideBeforeCall && headersOverride
          ? { ...headersOverrideBeforeCall, ...headersOverride }
          : headersOverrideBeforeCall || headersOverride
      ) as T;
      const headers = getHeaders(headerParams);
      const fullUrl = buildDollarBracePhrase(`${prefixUrl}${url}`, safeParams);
      const urlWithSearch = new URL(fullUrl);
      if (method === 'GET') {
        Object.entries(validatedInputs || {}).forEach(([key, value]) => {
          urlWithSearch.searchParams.append(key, value as string);
        });
      }

      const response = await fetch(urlWithSearch.toString(), {
        method,
        headers,
        body: method === 'GET' ? undefined : validatedInputs ? JSON.stringify(validatedInputs) : undefined,
      });
      if (response.status >= 400) {
        const error = await response.json();
        throw error;
      }
      const body = await response.json();

      const result = responseSchema.parse(body);

      return result;
    } catch (error) {
      if (onError) {
        throw onError(error, url);
      }
      if (onErrorRoot) {
        throw onErrorRoot(error, url);
      }
      throw error;
    }
  };
