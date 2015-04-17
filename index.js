var async = require('async');
var path = require('path');
var xlsParser = require('./lib/xls-parser');
var geocoder = require('./lib/yandex-geocoder-api');
var db = require('./lib/db');
var options = require('./options');

var xlsToMongoDb = function (xlsFilePath) {
    console.time('xlsToMongoDB');
    async.waterfall([
        function (callback) {
            xlsParser.toJson(xlsFilePath, callback);
        },
        function (schoolCamList, callback) {
            console.time('geocoder');
            console.log('Получено камер: ' + schoolCamList.length);
            console.log('Выполняется геокодирование..');
            var schoolCamsWithCoords = [];
            async.eachLimit(schoolCamList, 10, function (cam, done) {
                var addressString = cam['Адрес - натменование для ITV'];
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
                        schoolCamsWithCoords.push(cam);
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
                return callback(null, schoolCamsWithCoords);
            });
        },
        function (schoolCamsWithCoords, callback) {
            console.log('Геокодировано камер: ' + schoolCamsWithCoords.length);
            console.log('Выполняется загрузка в базу..');
            // todo записать в коллекцию SchoolCameras
            console.time('db insert');
            async.eachLimit(schoolCamsWithCoords, 10, function (cam, done) {
                var schoolCam = db.SchoolCameras();
                schoolCam.geometry = cam['geometry'];
                var properties = schoolCam.properties;
                properties.address = cam.address;
                properties.status = "Включена";
                properties.cameraModel = "hikvision";
                properties.schoolName = cam['Наименование Школы'];
                properties.archHEX = cam['HEX архив'];
                properties.routerIp = cam['IP-адрес маршрутизатора'];
                var itvServerIpPrep = function (itvServerName) {
                    var ip;
                    options.ITV_SERVER_REESTR.forEach(function (itvServer) {
                            if (itvServer.name === itvServerName) {
                                ip = itvServer.ip;
                            }
                        }
                    );
                    return ip;
                };

                properties.connectionOptions = {
                    cameraType: "hikvision",
                    direct: {
                        ip: cam['IP-адрес регистратора'],
                        userName: options.DEFAULT_DIRECT_USERNAME,
                        password: options.DEFAULT_DIRECT_PASSWORD,
                        numCam: cam['№ камеры в школе']
                    },
                    itv: {
                        ip: itvServerIpPrep(cam['видеосервера']),
                        camId: cam['номер камеры в ITV']
                    }
                };


                schoolCam.save(function (err) {
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
        console.timeEnd('xlsToMongoDB');
    });
};

var xlsFilePath = path.resolve(__dirname, 'files/school-cameras.xls');
xlsToMongoDb(xlsFilePath);
