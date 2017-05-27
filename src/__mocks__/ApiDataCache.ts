let localCache: any;
export function __resetDefaults() {
  localCache = undefined;
}
export function __setCache(cache: any) {
  localCache = cache;
}

class MockedApiDataCache {
  get(type: string, key: string) {
    return localCache[type][key];
  }
}

export default MockedApiDataCache;
