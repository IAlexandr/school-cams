var mongoose = require('mongoose');
var options = require('./../../options');

var db = mongoose.createConnection(options.mongoDbUrl);

db.mongoose = mongoose;

var SchoolCameras = require('./dbmodels/school-camera');
db.SchoolCameras = db.model('SchoolCameras', SchoolCameras);

var BdCameras = require('./dbmodels/bd-camera');
db.Bd2014Cameras = db.model('Bd2014Cameras', BdCameras);

module.exports = db;
