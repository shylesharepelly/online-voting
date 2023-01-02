'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      election.belongsTo(models.admin, {
        foreignKey: "adminId",
        onDelete: "CASCADE",
      });
      election.hasMany(models.question, {
        foreignKey: "electionid",
        
      });
    }


    static async addelection({ title}) {
      return this.create({ title: title, completed: false});
    }

    static async ongoing() {
      return this.findAll({
        where: {
          completed: false,
        },
      });
    }
    static async completed() {
      return this.findAll({
        where: {
          completed: true,
        },
      });
    }
    static async deleteelection(electionid) {
      return this.destroy({
        where: {
          electionid,
          
        },
      });
    }

    setCompletionStatus(completed) {
      return this.update({ completed});
    }


  }

  
  election.init({
    title: DataTypes.STRING,
    status: DataTypes.INTEGER,
    start: DataTypes.DATE,
    end: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'election',
  });
  return election;
};