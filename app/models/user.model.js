module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    username: {
      type: Sequelize.STRING
    },
    userid: {
      type: Sequelize.STRING
    },
    machineid: {
      type: Sequelize.STRING
    },
    machinename: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    check: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  return User;
};
