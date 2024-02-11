const db = require("../models");
const config = require("../config/auth.config");
const { QueryTypes } = require('sequelize');
const User = db.user;
const Call = db.call;
const Computer = db.Computer;
const sequelize = db.sequelize




exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.getUsers = async (req, res) => {
  const selectedUsers = []
  const users = await User.findAll({
  });
  for (var i = users.length - 1; i >= 0; i--) {
    const roles = await users[i].getRoles()
    for (var j = roles.length - 1; j >= 0; j--) {
      if(roles[j].name == "admin")continue;
      selectedUsers.push(users[i])
    }
  }
  res.status(200).send(selectedUsers);

};

exports.updateUser = async (req, res) => {
  console.log(req.body);
  console.log(req.body.id);
  const check = req.body.check == false ? 1 : 0;
  console.log(check);
  const records = await sequelize.query("UPDATE `testdb`.`users` SET `check` = '" + check + "' WHERE `id` = '"+req.body.id+"';", {
    type: QueryTypes.UPDATE
  });
  // const user = await User.update(req.body, {
  //   where: {
  //     id: req.body.id,
  //   },
  // });
  res.status(200).send({"k":"K"});
};

exports.deleteUser = async (req, res) => {
  // console.log(records)
  const user = await User.findOne({
    where:{
      id: req.params.id
    }
  })
  const records2 = await sequelize.query("DELETE FROM `testdb`.`computers` WHERE `name` = '"+user.username+"';", {
    type: QueryTypes.DELETE
  });
  const records = await sequelize.query("DELETE FROM `testdb`.`users` WHERE `id` = '"+req.params.id+"';", {
    type: QueryTypes.DELETE
  });



  
  res.status(200).send({"k":"K"});
};