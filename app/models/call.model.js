module.exports = (sequelize, Sequelize) => {
    const Call = sequelize.define("calls", {
        name: {
            type: Sequelize.STRING
        },
        with: {
            type: Sequelize.STRING
        },
        fromtime: {
            type: Sequelize.DATE
        },
        duration: {
            type: Sequelize.STRING
        },
        file: {
            type: Sequelize.STRING
        }
    });

    return Call;
};