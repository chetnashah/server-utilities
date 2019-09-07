module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        phoneNumber: DataTypes.STRING,
    });
    User.associate = function(models) {
        console.log('running user associate');
        // associations can be defined here
        User.hasMany(models.File, { onUpdate: 'SET NULL'});
      };
    return User;
}
