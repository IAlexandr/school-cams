var mongoose = require('mongoose');

var BdCameraSchema = new mongoose.Schema({
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
            default: "включена"
        },
        cameraModel: {
            type: String,
            required: true
        },
        ping: {
            type: Object,
            requried: false
        },
        cameraPingerId: {
            type: String,
            required: false
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
        address: String, // Адрес установки
        descr: String,
        numInHouse: String,
        numPorch: String
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

module.exports = BdCameraSchema;
