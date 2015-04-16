var mongoose = require('mongoose');
var options = require('./../../options');

var db = mongoose.createConnection(options.mongoDbUrl);

db.mongoose = mongoose;

var SchoolCameras = require('./dbmodels/school-camera');
db.SchoolCameras = db.model('SchoolCameras', SchoolCameras);

module.exports = db;
