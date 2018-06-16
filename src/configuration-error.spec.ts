import ConfigurationError from "./configuration-error";

describe("ConfigurationError", function() {
  it("can be identified using `instanceof`", function() {
    const configError = new ConfigurationError("foobar");
    expect(configError instanceof ConfigurationError).toEqual(true);

    const error = new Error("foobar");
    expect(error instanceof ConfigurationError).toEqual(false);
  });

  it("`message` property equals first constructor argument", function() {
    const error = new ConfigurationError("foobar");
    expect(error.message).toEqual("foobar");
  });
});
