'use strict';

let mockResponses: { [url: string]: string } = {};

export default async function fetch(url: string) {
  const mockResponse = mockResponses[url];
  if (mockResponse) {
    return { json: () => mockResponse };
  }
  console.log(url);
  throw new Error(`Unknown URL: ${url}`);
};

export function __setMockResponses(newMockResponses: { [url: string]: string }) {
  mockResponses = newMockResponses
}

export function __resetMockResponses() {
  __setMockResponses({});
}
