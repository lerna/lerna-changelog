export default class ConfigurationError {
  name = "ConfigurationError";

  constructor(message: string) {
    Error.apply(this, arguments);
  }
}
