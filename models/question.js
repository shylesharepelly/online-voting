'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
      question.belongsTo(models.election, {
        foreignKey: "electionid",
      });
      question.hasMany(models.option, {
        foreignKey: "questionid",
      });

    }


static async addquestion(question,description,electionid){
  console.log("add,", question);
  console.log("add,", description);
  return this.create({question:question,description:description,electionid:electionid});
}

static async getall(Id)
    {
      return this.findAll({
        where:{
          electionid:Id,
        },
      });
    }

    static async countquestions(electionid) {
      return this.count({
        where: {
          electionid,
        },
      });
    }
    static async deletequestion1(id,eid) {
      return this.destroy({
        where: {
          id: id,
          electionid:eid
        }
      });
    }


  }
  
  
  question.init({
    question:{
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
          notEmpty: true
            }
    },
    description: DataTypes.STRING,
    
  }, {
    sequelize,
    modelName: 'question',
  });
  return question;
};