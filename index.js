// If you have different module names for iOS and Android, you will need an if-else
module.exports = (Ti.Platform.osname === 'android') ? require('{{android_module_id}}') : require('{{ios_module_id}}');
