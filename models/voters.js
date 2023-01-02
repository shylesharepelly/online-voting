'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      voters.belongsTo(models.election, {
        foreignKey: "electionid",
      });
    }

    static async addvoter(electionid,{email,password}){
      const hashedpassword = await bcrypt.hash(password, saltRounds);
      return this.create({email:email,password:hashedpassword,electionid:electionid})
    }

    static async deletevoter(email) {
      return voters.destroy({
        where: {
          id: this.id,
        }
      });
    }



  }
  voters.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'voters',
  });
  return voters;
};