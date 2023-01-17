'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn('elections','adminId',{
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('elections',{
      fields: ['adminId'],
      type: 'foreign key',
      references:{
        table: 'admins',
        field: 'id',
      },
      onDelete:'cascade'
    })

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    

    await queryInterface.removeColumn('elections','adminId')
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
