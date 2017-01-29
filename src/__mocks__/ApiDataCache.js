let localCache;
export function __resetDefaults() {
  localCache = undefined;
}
export function __setCache(cache) {
  localCache = cache;
}

class MockedApiDataCache {
  get(type, key) {
    return JSON.stringify(localCache[type][key]);
  }
}

export default MockedApiDataCache;
