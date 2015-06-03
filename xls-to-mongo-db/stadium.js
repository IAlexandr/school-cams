var async = require('async');
var xlsParser = require('./xls-parser/stadium');
var db = require('./../lib/db');
var options = require('./../options');

function getItvServerIpByNum (num) {
    var ip = "";
    if (options.itv[num]) {
        ip = options.itv[num];
    }
    return ip;
}

function getItvServerIpByName (name) {
    var ip = "";
    if (options.ITV_SERVER_REESTR[name]) {
        ip = options.ITV_SERVER_REESTR[name];
    }
    return ip;
}
function prepGeometry (stringCoord) {
    var geometry = {
        type: "Point",
            coordinates: []
    };
    var latLng = stringCoord.split(',');
    geometry.coordinates[0] = latLng[1];
    geometry.coordinates[1] = latLng[0];
    return geometry;
}
module.exports = function (xlsFilePath) {
    console.time('xlsToMongoDB Stadium');
    async.waterfall([
        function (callback) {
            xlsParser.toJson(xlsFilePath, callback);
        },
        function (stadiumBgCamList, callback) {
            console.log('Получено камер: ' + stadiumBgCamList.length);
            console.log('Выполняется загрузка в базу..');
            // todo записать в коллекцию SchoolCameras
            console.time('db insert');
            async.eachLimit(stadiumBgCamList, 10, function (cam, done) {
                var stadiumCam = db.StadiumBgCameras();
                stadiumCam.geometry = prepGeometry(cam['coord']);
                var properties = stadiumCam.properties;
                properties.address = cam['Имя в ITV'];
                properties.status = "Включена";
                properties.cameraModel = cam['type'];

                properties.connectionOptions = {
                    cameraType: cam['type'],
                    itv: {
                        ip: getItvServerIpByName(cam["№ видеосервера"]),
                        camId: cam["№ ITV"]
                    },
                    direct: {
                        ip: cam['IP-адрес'],
                        userName: cam['Имя'],
                        password: cam['Пароль']
                    }
                };

                stadiumCam.save(function (err) {
                    return done(err);
                });
            }, function (err) {
                console.timeEnd('db insert');
                return callback(err);
            });
        }
    ], function (err) {
        if (err) {
            console.log(err.message);
        }
        console.log("Загрузка завершена.");
        console.timeEnd('xlsToMongoDB Stadium');
        process.exit();
    });
};
