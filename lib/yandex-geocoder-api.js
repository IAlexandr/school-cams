var superagent = require('superagent');
var _ = require('lodash');
var path = 'http://geocode-maps.yandex.ru/1.x/?format=json&geocode=';

module.exports = {
    search: function (queryString, done) {
        if (queryString === "улица Ашмарина, 33") {
            return done(null, [{
                geometry: {
                    type: "Point",
                    coordinates: [
                        '56.082833',
                        '47.283948'
                    ]
                },
                address: 'улица Ашмарина, 33'
            }]);
        }
        if (queryString === "улица Рихарда Зорге, 9") {
            return done(null, [{
                geometry: {
                    type: "Point",
                    coordinates: [
                        '56.076232',
                        '47.279492'
                    ]
                },
                address: 'улица Рихарда Зорге, 9'
            }]);
        }
        queryString += '&ll=47.23808716,56.13893683&spn=0.25920868,0.10778972&rspn=1';
        // queryString += '&ll=47.23808716,56.13893683&spn=0.77338294,0.10778972&rspn=1';

        superagent
            .get(path + 'г. Чебоксары ' + queryString)
            .end(function (err, res) {
                if (!res.status) {
                    console.log('no status: ' + queryString);
                } else {
                    if (res.status == 200) {
                        var resData = JSON.parse(res.text);
                        var finaly = _.map(resData.response.GeoObjectCollection.featureMember, function (item) {
                            var coords = item.GeoObject.Point.pos.split(' ');
                            return {
                                address: item.GeoObject.name,
                                geometry: {
                                    type: "Point",
                                    coordinates: [
                                        coords[1],
                                        coords[0]
                                    ]
                                }
                            };
                        });
                        done(null, finaly);
                    } else {
                        done(res.text);
                    }
                }
            });
    },

    byCoords: function (queryString, done) {
        superagent
            .get(path + queryString) // string -  '47.264841,56.096644'
            .end(function (res) {
                if (res.status == 200) {
                    var resData = JSON.parse(res.text);
                    var finaly = _.map(resData.response.GeoObjectCollection.featureMember, function (item) {
                        return {
                            displayName: item.GeoObject.metaDataProperty.GeocoderMetaData.text,
                            points: resData.response.GeoObjectCollection
                                .metaDataProperty.GeocoderResponseMetaData.request
                        };
                    });
                    done(null, finaly);
                } else {
                    done(res.text);
                }
            });
    },

    find: function (queryData, putRes, finalize) {
        this.search(queryData.rowQuery, function (err, res) {
            if (!err) {
                var resWrapper = _.map(res, function (item) {
                    return {
                        resData: {
                            displayName: item.displayName,
                            coords: item.points,
                            description: item.addressDetails
                        },
                        viewComponent: searchResListItem
                    };
                });
                putRes(resWrapper);
                finalize();
            } else {
                console.log('ERROR', err);
            }
        });
    }

};
