'use strict';

function decorator(controller) {
    controller.select('-password -secret');
}

module.exports = decorator;
