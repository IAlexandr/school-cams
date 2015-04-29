var path = require('path');

var school = require('./xls-to-mongo-db/school');
var bd2014 = require('./xls-to-mongo-db/bd-2014');

var xlsSchoolFilePath = path.resolve(__dirname, 'files/school-cameras.xls');
var xlsBd2014FilePath = path.resolve(__dirname, 'files/bd-2014-cameras.xls');

// school(xlsFilePath);
bd2014(xlsBd2014FilePath);
