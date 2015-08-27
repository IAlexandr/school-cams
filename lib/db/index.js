var mongoose = require('mongoose');
var options = require('./../../options');


/*
todo mongo
var db = mongoose.createConnection(options.mongoDbUrl);

db.mongoose = mongoose;

var SchoolCameras = require('./dbmodels/school-camera');
db.SchoolCameras = db.model('SchoolCameras', SchoolCameras);

var BdCameras = require('./dbmodels/bd-camera');
db.Bd2014Cameras = db.model('Bd2014Cameras', BdCameras);

var StadiumBgCameras = require('./dbmodels/stadium-bg');
db.StadiumBgCameras = db.model('stadiumBgCameras', StadiumBgCameras);
*/

/*todo nedb*/
var path = require('path');
var _ = require('lodash');
var Datastore = require('nedb');
const DEFAULT_COLLECTION_PATH = 'lib/db/nedb-collections';
const baseDbPath = path.join(process.cwd(),
  DEFAULT_COLLECTION_PATH);
const AUTO_COMPACTION_INTERVAL = 10 * 1000; // мс
const db = {};
const collections = [];
collections.push('school');
_.each(collections, function each (collection) {
  db[collection] = new Datastore({
    filename: path.join(baseDbPath, collection),
    autoload: true
  });

  db[collection].persistence.setAutocompactionInterval(AUTO_COMPACTION_INTERVAL);
});

module.exports = db;
