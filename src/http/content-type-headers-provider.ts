import { HeadersProviderFn } from './types/headers-provider.js';

export const contentTypeHeadersProvider =
  (contentType: string): HeadersProviderFn =>
  () => ({ 'Content-Type': contentType });
