var async = require('async');
var xlsParser = require('./xls-parser/bd-2014');
var geocoder = require('./../lib/yandex-geocoder-api');
var db = require('./../lib/db');
var options = require('./../options');

module.exports = function (xlsFilePath) {
    console.time('xlsToMongoDB bd-2014');
    async.waterfall([
        function (callback) {
            xlsParser.toJson(xlsFilePath, callback);
        },
        function (bd2014CamList, callback) {
            console.time('geocoder');
            console.log('Получено камер: ' + bd2014CamList.length);
            console.log('Выполняется геокодирование..');
            var bd2014CamsWithCoords = [];
            async.eachLimit(bd2014CamList, 1, function (cam, done) {
                var addressString = cam['Адрес дома'];
                if (cam['дополнительный адрес для геокодирования']) {
                    addressString = cam['дополнительный адрес для геокодирования'];
                }
                geocoder.search(addressString, function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    if (result.length > 0) {
                        cam['geometry'] = result[0].geometry;
                        cam['address'] = result[0].address;
                        bd2014CamsWithCoords.push(cam);
                    } else {
                        console.log('Неудачное геокодирование по адресу: ' + addressString);
                    }
                    return done();
                });
            }, function (err) {
                console.timeEnd('geocoder');
                if (err) {
                    return callback(err);
                }
                return callback(null, bd2014CamsWithCoords);
            });
        },
        function (bd2014CamsWithCoords, callback) {
            console.log('Геокодировано камер: ' + bd2014CamsWithCoords.length);
            console.log('Выполняется загрузка в базу..');
            // todo записать в коллекцию SchoolCameras
            console.time('db insert');
            async.eachLimit(bd2014CamsWithCoords, 10, function (cam, done) {
                var bdCam = db.Bd2014Cameras();
                bdCam.geometry = cam['geometry'];
                var properties = bdCam.properties;
                properties.address = cam.address;
                properties.status = "Включена";
                properties.cameraModel = "etrovision";
                properties.numInHouse = cam['№ камеры в доме'];
                properties.numPorch = cam['№ подъезда / № обзорной камеры'];

                properties.connectionOptions = {
                    cameraType: "etrovision",
                    itv: {
                        ip: "",
                        camId: ""
                    },
                    direct: {
                        ip: cam['IP-адрес'],
                        userName: cam['Имя'],
                        password: cam['Пароль']
                    }
                };

                bdCam.save(function (err) {
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
        console.timeEnd('xlsToMongoDB bd-2014');
    });
};
