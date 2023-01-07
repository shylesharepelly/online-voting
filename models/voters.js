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

    static async addvoters(electionid,email,password){
      // const hashedpassword = await bcrypt.hash(password, saltRounds);
      console.log("email ", electionid.email);
      console.log("password ", electionid.password);
      console.log("electionid ", electionid.electionid);
      return this.create({email:electionid.email,password:electionid.password,electionid:electionid.electionid})
    }
    static countvoters(electioniD) {
      return this.count({
        where: {
          electionid:electioniD,
        },
      });
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