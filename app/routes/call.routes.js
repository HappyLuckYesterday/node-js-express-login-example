const { authJwt } = require("../middleware");
const controller = require("../controllers/call.controller");

module.exports = function (app) {
  app.get("/api/calls", [authJwt.verifyToken, authJwt.isAdmin], controller.getCalls);
};
