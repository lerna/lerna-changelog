export default class ConfigurationError {
  name = "ConfigurationError";
  message: string;

  constructor(message: string) {
    Error.apply(this, arguments);
    this.message = message;
  }
}
