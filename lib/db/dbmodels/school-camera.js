var mongoose = require('mongoose');

var SchoolCameraSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Feature'],
        default: 'Feature'
    },
    properties: {
        ptz: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            required: true,
            default: "новая"
        },
        cameraModel: {
            type: String,
            required: true
        },
        cameraPingerId: {
            type: String,
            required: false
        },
        ping: {
            type: Object,
            requried: false
        },
        connectionOptions: {
            cameraType: {
                type: String,
                required: true
            },
            itv: {
                ip: String,
                camId: String,
                blocked: Boolean
            },
            direct: {
                ip: String,
                userName: String,
                password: String,
                blocked: Boolean
            }
        },
        positionInfo: {
            height: Number, // Высота над уровнем поверхности земли
            azimuth: Number, // Азимут
            angle: Number, // Угол наклона относительно горизонта
            imageNames: [String]
        },
        address: String, // Адрес установки
        descr: String
    },
    geometry: {
        type: {
            type: String,
            required: true,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

module.exports = SchoolCameraSchema;
