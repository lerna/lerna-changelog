export default class ConfigurationError {
  public name = "ConfigurationError";
  public message: string;

  constructor(message: string) {
    // @ts-ignore
    Error.apply(this, arguments);
    this.message = message;
  }
}
