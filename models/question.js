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
        onDelete: "CASCADE",
      });
      question.hasMany(models.option, {
        foreignKey: "questionid",
        as: "options",
      });

    }


static async addquestion(text,description,electionid){
  return this.create({question:text,description:description,electionid:electionid});
}





  }
  question.init({
    question: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'question',
  });
  return question;
};