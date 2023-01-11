'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class option extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      option.belongsTo(models.question, {
        foreignKey: "questionid",
        
      });

    }

  static async addoption(title,id){
    this.create({questionid:id,option:title});
  } 

  static async removeoption(text,questionid) {
    return this.destroy({
      where: {
        questionid:questionid,
        option:text,
      
    },
  });
}



}



  option.init({
    option: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'option',
  });
  return option;
};