const ApiDataCache = require.requireActual("../api-data-cache").default;

export default class extends ApiDataCache  {
  async getOrRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return await fn();
  }

  set(key: string, data: any) {}
}
