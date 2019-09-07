'use strict';
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    size: DataTypes.BIGINT
  }, {});
  File.associate = function(models) {
    console.log('running file associate');
    // associations can be defined here
    File.belongsTo(models.User);
  };
  return File;
};