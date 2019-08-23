"use strict";

const _ = require("lodash");
const JsonStore = require("./json-store");

const userStore = {
  store: new JsonStore("./models/user-store.json", { users: [] }),
  collection: "users",

  getAllUsers() {
    return this.store.findAll(this.collection);
  },

  getAllGenders()
  {
    const users = userStore.getAllUsers();

  },

  addUser(user) {
    this.store.add(this.collection, user);
    this.store.save();
  },

  getUserById(id) {
    return this.store.findOneBy(this.collection, { id: id });
  },

  getUserByEmail(email) {
    return this.store.findOneBy(this.collection, { email: email });
  },

  getGenderById(id)
  {
    const user = this.store.findOneBy(this.collection,{id:id});
    return user.gender;
  },

  saveUser()
  {
    this.store.save();
  },

  getGender()
  {
    return this.gender;
  },

  removeMember(id)
  {
    const user = this.getUserById(id);
    this.store.remove(this.collection, user);
    this.store.save();
  }

  /*getUserByAssessment(id) {
    var user= this.store.findOneBy(this.collection, { assessmentid: id });
    return this.getUserById(user.id);
  },*/
};

module.exports = userStore;
