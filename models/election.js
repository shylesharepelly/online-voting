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
        onDelete: "cascade",
        
      });
    }


    static async addelection({ title,adminId}) {
      return this.create({ title: title, status: false,launched:false,adminId:adminId});
    }



    static async newelections(id) {
      return this.findAll({
        where: {
          status: false,
          launched:false,
          adminId: id,
        },
      });
    }


    static async ongoing(id) {
      return this.findAll({
        where: {
          status:false,
          launched:true,
          adminId: id,
        },
      });
    }
    static async completed1(id) {
      return this.findAll({
        where: {
          status: true,
          
          adminId: id,
        },
      });
    }
    static async deleteelection(eid) {
      return this.destroy({
        where: {
          id:eid,
          
        },
      });
    }
    setLaunchedStatus(completed) {
      return this.update({ launched:completed});
    }
    setCompletionStatus(completed) {
      return this.update({ status:completed});
    }


  }

  
  election.init({
    title: DataTypes.STRING,
    status: DataTypes.BOOLEAN,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    launched:DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'election',
  });
  return election;
};