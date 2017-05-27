export default class ConfigurationError {
  constructor(message) {
    Error.apply(this, arguments);
    this.name = "ConfigurationError";
  }
}
