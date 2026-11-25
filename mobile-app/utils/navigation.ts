export const pickParam = (v?: string | string[]): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export const safeBack = (router: any, fallback: string = '/(tabs)') => {
  if (router?.canGoBack?.()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
};
