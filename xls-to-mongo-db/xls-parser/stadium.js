var xls = require('./../../lib/xlsfile');

module.exports.toJson = function (filePath, callback) {
    console.log('Идет считывание xls-файла, пожалуйста подождите..');
    xls.read(filePath, function (err, rawData) {
        if (err) {
            return callback({ "message": "Ошибка в части содержимого книги либо неверный путь к файлу." }, null);
        }
        validCheck(rawData, function (isChecked) {
            if (isChecked) {
                console.time('Подготовка списка');
                var data = getData(rawData);
                console.timeEnd('Подготовка списка');
                return callback(null, data);
            } else {
                return callback({ "message": "Неверная структура данных в файле" }, null);
            }
        });
    });
};

var getData = function (sheet) {
    var val, rowObject, range, columnHeaders, emptyRow, C;
    var outSheet = [];
    if (sheet["!ref"]) {
        range = xls.decode_range(sheet["!ref"]);
        range.s.r = 0;
        columnHeaders = prepareColumnHeaders(range, sheet);
        for (var R = range.s.r + 1; R <= range.e.r; ++R) {
            emptyRow = true;
            rowObject = Object.create({ __rowNum__: R });

            for (C = range.s.c; C <= range.e.c; ++C) {
                val = sheet[xls.encode_cell({
                    c: C,
                    r: R
                })];

                if (val !== undefined) switch (val.t) {
                    case 's':
                    case 'str':
                    case 'b':
                    case 'n':
                        if (val.v !== undefined) {
                            rowObject[columnHeaders[C]] = val.v;
                            emptyRow = false;
                        }
                        break;
                    case 'e':
                        break;
                    default:
                        throw 'unrecognized type ' + val.t;
                }
            }
            if (!emptyRow) {
                outSheet.push(rowObject);
            }
        }
    }
    return outSheet;
};

var validCheck = function (sheet, callback) {
    if (sheet["!ref"]) {
        var isChecked = true;
        var checkCells = [
            { c: 0, r: 0, value: '№ пп' },
            { c: 1, r: 0, value: '№ камеры' },
            { c: 2, r: 0, value: 'type' },
            { c: 3, r: 0, value: 'coord' },
            { c: 4, r: 0, value: 'Адрес дома' }
        ];
        checkCells.forEach(function (cell) {
            var value = sheet[xls.encode_cell(cell)];

            if (value != undefined) {
                if (value.v != cell.value) {
                    isChecked = false;
                }
            } else {
                isChecked = false;
            }
        });
        return callback(isChecked);
    }
};

var prepareColumnHeaders = function (range, sheet) {
    columnHeaders = [];
    for (C = range.s.c; C <= range.e.c; ++C) {
        val = sheet[xls.encode_cell({
            c: C,
            r: range.s.r
        })];
        if (val) {
            switch (val.t) {
                case 's':
                case 'str':
                    columnHeaders[C] = val.v;
                    break;
                case 'n':
                    columnHeaders[C] = val.v;
                    break;
            }
        }
    }
    return columnHeaders;
};
