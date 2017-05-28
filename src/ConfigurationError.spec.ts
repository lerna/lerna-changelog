import ConfigurationError from "../src/ConfigurationError";

describe("ConfigurationError", function() {
  it("can be identified using `instanceof`", function() {
    const configError = new ConfigurationError('foobar');
    expect(configError instanceof ConfigurationError).toEqual(true);

    const error = new Error('foobar');
    expect(error instanceof ConfigurationError).toEqual(false);
  });
});
