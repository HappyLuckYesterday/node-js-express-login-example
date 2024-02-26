const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Call = db.call;

const Op = db.Sequelize.Op;

const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
};

const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: tutorials } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, tutorials, totalPages, currentPage };
};

exports.getCalls = async (req, res) => {
    const calls = await Call.findAll({order: [['createdAt', 'DESC']]
});
    res.status(200).send(calls);
};