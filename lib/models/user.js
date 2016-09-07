'use strict';

const mongoose = require('mongoose');
const mergeWith = require('lodash.mergewith');

const UserSchema = new mongoose.Schema({
    mail: String,
    facebook: {
        id: String,
        username: String,
        profilePicture: String,
        fullName: String
    },
    google: {
        id: String,
        username: String,
        profilePicture: String,
        fullName: String
    },
    github: {
        id: String,
        username: String,
        profilePicture: String,
        fullName: String
    },
    twitter: {
        id: String,
        username: String,
        profilePicture: String,
        fullName: String
    }
});

UserSchema.statics.findByProfileId = function findByProfileId(provider, id) {
    return this
        .findOne({
            [provider]: id
        })
        .exec();
};

UserSchema.statics.findByMail = function findByMail(mail) {
    return this
        .findOne({
            mail
        })
        .exec();
};
UserSchema.statics.createUser = function createUser(provider, profile) {
    return this.create({
        mail: profile.mail,
        [provider]: profile
    });
};

UserSchema.statics.connect = function connect(id, provider, profile) {
    return this.findOneAndUpdate({
        _id: id
    }, {
        [provider]: profile
    }, {
        new: true
    });
};

UserSchema.statics.merge = function merge(toUser, id) {
    return this
        .findOne({
            _id: id
        })
        .then((fromUser) => {
            if (fromUser === null || fromUser === undefined) {
                throw new Error(`There is no user with id: ${id}`);
            }

            mergeWith(toUser, fromUser, (toProperty) => toProperty);
            return this.findByIdAndRemove(id);
        })
        .then(() => toUser.save());
};

UserSchema.statics.registerMail = function registerMail(id, mail) {
    return this
        .findOne({
            mail
        })
        .then((user) => {
            if (user !== null && user !== undefined) {
                return this.merge(user, id);
            }
            return user;
        })
        .then((user) => {
            if (user === null || user === undefined) {
                return this.findOneAndUpdate({
                    _id: id
                }, {
                    mail
                }, {
                    new: true
                });
            }
            return user;
        });
};

UserSchema.statics.unlink = function unlink(id, provider) {
    return this.findOneAndUpdate({
        _id: id
    }, {
        $unset: {
            [provider]: 1
        }
    }, {
        new: true
    });
};

module.exports = mongoose.model('user', UserSchema);
