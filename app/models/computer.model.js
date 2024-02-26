module.exports = (sequelize, Sequelize) => {
    const Computer = sequelize.define("computers", {
        name: {
            type: Sequelize.STRING
        },
        resp: {
            type: Sequelize.STRING
        },
        status_s: {
            type: Sequelize.STRING
        },
        status_d: {
            type: Sequelize.STRING
        }
    });

    return Computer;
};