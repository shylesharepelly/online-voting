'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn('options','questionid',{
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('options',{
      fields: ['questionid'],
      type: 'foreign key',
      references:{
        table: 'questions',
        field: 'id',
        
      },
      onDelete: 'CASCADE',
      allowNull: true,
      
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.removeColumn('options','questionid')
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
