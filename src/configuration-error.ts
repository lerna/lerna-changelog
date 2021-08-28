export default class ConfigurationError {
  public name = "ConfigurationError";
  public message: string;

  constructor(message: string) {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    Error.apply(this, arguments);
    this.message = message;
  }
}
