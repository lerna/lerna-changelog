const Release = require.requireActual("../release").Release;

Release.getToday = function() {
  return "2099-01-01";
};

export { Release };
