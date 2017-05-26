let localCache;
export function __resetDefaults() {
  localCache = undefined;
}
export function __setCache(cache) {
  localCache = cache;
}

class MockedApiDataCache {
  get(type, key) {
    return localCache[type][key];
  }
}

export default MockedApiDataCache;
