var path = require('path');

//var bd2014 = require('./xls-to-mongo-db/bd-2014');
//var stadium = require('./xls-to-mongo-db/stadium');

//var xlsBd2014FilePath = path.resolve(__dirname, 'files/bd-2014-cameras.xls');
//var xlsStadiumFilePath = path.resolve(__dirname, 'files/stadium-cameras.xls');

// bd2014(xlsBd2014FilePath);
//stadium(xlsStadiumFilePath);
var type = 'nedb-school';
switch (type) {
  case 'school':
    var school = require('./xls-to-mongo-db/school');
    var xlsSchoolFilePath = path.resolve(__dirname, 'files/school-cameras.xls');
    school(xlsSchoolFilePath);
    break;
  case 'nedb-school':
    var nedbSchool = require('./xls-to-mongo-db/nedb-school');
    var xlsSchoolFilePath = path.resolve(__dirname, 'files/school-cameras.xls');
    nedbSchool(xlsSchoolFilePath);
    break;
  case 'bd2014':
    break;
  case 'stadium':
    break;
}