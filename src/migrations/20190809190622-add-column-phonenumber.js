'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'phoneNumber', Sequelize.STRING)
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('Users', 'phoneNumber');
  }
};
