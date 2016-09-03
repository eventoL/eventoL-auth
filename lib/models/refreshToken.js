'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const RefreshTokenSchema = new mongoose.Schema({
    token: String,
    user: mongoose.Schema.Types.ObjectId
});

RefreshTokenSchema.statics.createToken = function createToken(id) {
    const token = crypto
        .createHash('md5')
        .update(id.toString())
        .update(`${Date.now()}`)
        .update(crypto.randomBytes(40).toString('hex'))
        .digest('hex');

    return this.create({
        user: id,
        token
    });
};

RefreshTokenSchema.statics.validateToken = function validateToken(token, id) {
    return this
        .findOne({
            token,
            user: id
        })
        .then((refreshToken) => {
            if (refreshToken === undefined || refreshToken === null) {
                throw new Error('The token isn\'t valid.');
            }
            return true;
        });
};

RefreshTokenSchema.statics.removeToken = function removeToken(token) {
    return this
        .findOneAndRemove({
            token
        });
};

RefreshTokenSchema.statics.reasignToken = function reasignToken(fromUser, toUser) {
    return this
        .findOneAndUpdate({
            user: fromUser
        }, {
            user: toUser
        }, {
            new: true
        });
};

module.exports = mongoose.model('refreshToken', RefreshTokenSchema);
