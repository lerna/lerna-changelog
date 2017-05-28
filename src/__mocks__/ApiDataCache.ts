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

  async getOrRequest(type: string, key: string) {
    return this.get(type, key);
  }
}

export default MockedApiDataCache;
