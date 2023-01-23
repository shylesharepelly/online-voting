'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      admin.hasMany(models.election, {
        foreignKey: "adminId",
      });
    }

  }


  admin.init({
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
          }
    },
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'admin',
  });
  return admin;
};