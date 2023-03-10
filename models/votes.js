'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class votes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      votes.belongsTo(models.voters, {
        foreignKey: "voterid",
      });
      votes.belongsTo(models.option, {
        foreignKey: "optionid",
      });
      votes.belongsTo(models.question, {
        foreignKey: "questionid",
      });

    }
 



    static async addvotes(voterid,questionid,optionid){
      return this.create({ voterid:voterid, questionid:questionid, optionid: optionid });
    }
    
    static async getall(Id)
    {
      return this.findAll({
        where:{
          voterid:Id,
        },
      });
    }

    static async getall1(Id)
    {
      return this.findAll({
        where:{
          optionid:Id,
        },
      });
    }
    static countvotes(id) {
      return this.count({
        where: {
          optionid:id,
        },
      });
    }
    static countvoters(id) {
      return this.count({
        where: {
          voterid:id,
         
        },
        
      });
    }

  }
  votes.init({
    voterid: DataTypes.INTEGER,
    optionid: DataTypes.INTEGER,
    questionid:DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'votes',
  });
  return votes;
};