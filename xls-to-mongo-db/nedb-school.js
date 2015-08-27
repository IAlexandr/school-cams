var async = require('async');
var fs = require('fs');
var path = require('path');
var xlsParser = require('./xls-parser/school');
var geocoder = require('./../lib/yandex-geocoder-api');
var db = require('./../lib/db');
var options = require('./../options');
var geocodAddrResults = require('../temp');

module.exports = function (xlsFilePath) {
    console.time('xlsToMongoDB school');
    async.waterfall([
        function (callback) {
            xlsParser.toJson(xlsFilePath, callback);
        },
        function (schoolCamList, callback) {
            console.time('geocoder');
            console.log('Получено камер: ' + schoolCamList.length);
            console.log('Выполняется геокодирование..');
            var schoolCamsWithCoords = [];
            async.eachLimit(schoolCamList, 1, function (cam, done) {
                var addressString = '';
                if (cam['Адрес']) {
                    addressString = cam['Адрес'];
                } else {
                    addrStringSplitArr = cam['Адрес - натменование для ITV'].split(',');
                    addrStringSplitArr.shift();
                    addrStringSplitArr.pop();
                    addrStringSplitArr.forEach(function (str) {
                        addressString += str + ' ';
                    });
                }
                if (addressString === '') {
                    console.log('Неудачное геокодирование по адресу: ' + cam['Адрес - натменование для ITV']);
                    return done();
                } else {
                    if (geocodAddrResults[addressString]) {
                        cam['geometry'] = geocodAddrResults[addressString].geometry;
                        cam['address'] = geocodAddrResults[addressString].address;
                        schoolCamsWithCoords.push(cam);
                        return done();
                    } else {
                        geocoder.search(addressString, function (err, result) {
                            if (err) {
                                return done(err);
                            }
                            if (result.length > 0) {
                                geocodAddrResults[addressString] = {
                                    geometry: result[0].geometry,
                                    address: result[0].address
                                };
                                cam['geometry'] = result[0].geometry;
                                cam['address'] = result[0].address;
                                schoolCamsWithCoords.push(cam);
                            } else {
                                console.log('Неудачное геокодирование по адресу: ' + addressString);
                            }
                            return done();
                        });
                    }
                }
            }, function (err) {
                console.timeEnd('geocoder');
                if (err) {
                    return callback(err);
                }
                console.log('temp file path: ' + path.resolve(__dirname, '../temp.json'));
                fs.writeFile(path.resolve(__dirname, '../temp.json'), JSON.stringify(geocodAddrResults, null, 2), function (err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, schoolCamsWithCoords);
                });
            });
        },
        function (schoolCamsWithCoords, callback) {
            console.log('Геокодировано камер: ' + schoolCamsWithCoords.length);
            console.log('Выполняется загрузка в базу..');
            // todo записать в коллекцию SchoolCameras
            console.time('db insert');
            async.eachLimit(schoolCamsWithCoords, 1, function (cam, done) {
                var schoolCam = {};
                schoolCam.geometry = cam['geometry'];
                var properties = {};
                properties.address = cam.address;
                properties.status = "Включена";
                properties.cameraModel = "hikvision";
                properties.schoolName = cam['Наименование Школы'];
                properties.archHEX = cam['HEX архив'];
                properties.externalStorage = cam['Номервнешнего хранилища'];
                properties.routerIp = cam['IP-адрес маршрутизатора'];

                var itvServerIpPrep = function (itvServerName) {
                    //var ip;
                    //options.ITV_SERVER_REESTR.forEach(function (itvServer) {
                    //        if (itvServer.name === itvServerName) {
                    //            ip = itvServer.ip;
                    //        }
                    //    }
                    //);
                    //return ip;

                    return options.ITV_SERVER_REESTR[itvServerName];
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
                schoolCam.properties = properties;
                db.school.findOne({ 'properties.schoolName': cam['Наименование Школы'], 'properties.connectionOptions.itv.camId': cam['номер камеры в ITV'] }, function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    if (result) {
                        db.school.update({ _id: result._id }, schoolCam, function (err) {
                            return done(err);
                        });
                    } else {
                        db.school.insert(schoolCam, function (err) {
                            return done(err);
                        });
                    }
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
        console.timeEnd('xlsToMongoDB school');
    });
};
