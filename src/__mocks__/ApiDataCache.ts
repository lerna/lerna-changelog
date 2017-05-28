let localCache: { [id: string]: any } = {};
export function __resetDefaults() {
  localCache = {};
}
export function __setCache(cache: any) {
  localCache = {};
  for (const key of Object.keys(cache)) {
    let value = cache[key];

    for (const key2 of Object.keys(value)) {
      let value2 = value[key2];
      let combinedKey = `${key}/${key2}`;
      localCache[combinedKey] = value2;
    }
  }
}

class MockedApiDataCache {
  get(key: string) {
    return localCache[key];
  }

  async getOrRequest(key: string) {
    return this.get(key);
  }
}

export default MockedApiDataCache;
