"use strict";

type Json = { [key: string]: unknown };
type MockResponse = { status: number; statusText: string; ok: boolean; body: Json };

let mockResponses: { [url: string]: Partial<MockResponse> } = {};

const defaultMockResponseParams = {
  status: 200,
  statusText: "OK",
  ok: true,
};

export default async function fetch(url: string) {
  const mockResponse = mockResponses[url];
  if (mockResponse) {
    const fullMockResponse = { ...defaultMockResponseParams, ...mockResponse };
    return {
      status: fullMockResponse.status,
      statusText: fullMockResponse.statusText,
      ok: fullMockResponse.ok,
      json: () => Promise.resolve(fullMockResponse.body),
    };
  }
  throw new Error(`Unknown URL: ${url}`);
}

export function __setMockResponses(newMockResponses: { [url: string]: Partial<MockResponse> }) {
  mockResponses = newMockResponses;
}

export function __resetMockResponses() {
  __setMockResponses({});
}
