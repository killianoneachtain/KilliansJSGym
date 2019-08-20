"use strict";

const _ = require("lodash");
const JsonStore = require("./json-store");

const trainerStore = {
    store: new JsonStore("./models/trainer-store.json", { trainers: [] }),
    collection: "trainers",

    getAllTrainers() {
        return this.store.findAll(this.collection);
    },

    getTrainerById(id) {
        return this.store.findOneBy(this.collection, { id: id });
    },

    getTrainerByEmail(email) {
        return this.store.findOneBy(this.collection, { email: email });
    }
};

module.exports = trainerStore;
