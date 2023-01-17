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
      option.belongsTo(models.question, 
        {
        foreignKey: "questionid",
        onDelete: "set null",
       
        });

    }

  static async addoption(title,id){
    this.create({questionid:id,option:title});
  } 



  static async modifyoption(title,rid,questionid,){
    console.log("title", title);
    console.log("ques", questionid);
    return this.update({option:title},
      {
        where:
        {id:rid,questionid:questionid}
      });
  }
  static async getall(Id)
  {
    return this.findAll({
      where:{
        questionid:Id,
      },
    });
  }


  static async removeoption(id,questionid) {
    return this.destroy({
      where: {
        questionid:questionid,
        id:id,
      
    },
    onDelete: "cascade",
  });


  }

  static async deletealloptions(questionid) {
    return this.destroy({
      where: {
        questionid:questionid,
        
      
    },
    onDelete: "cascade",
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