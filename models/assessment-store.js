"use strict";

const _ = require("lodash");
const JsonStore = require("./json-store");
const userStore = require("../models/user-store");
const logger = require("../utils/logger");
const analytics = require("../controllers/analytics");
const dashboard = require("../controllers/dashboard");

const assessmentStore = {
  store: new JsonStore("./models/assessment-store.json", {
    assessmentCollection: []
  }),
  collection: "assessmentCollection",

  getAllAssessments() {
    return this.store.findAll(this.collection);
  },

  getAssessment(id) {
    return this.store.findOneBy(this.collection, { id: id });
  },

  getUserAssessments(userid) {
    return this.store.findBy(this.collection, {  });
  },


  addAssessment(assessment) {
    this.store.add(this.collection, assessment);
    const user=userStore.getUserById(assessment.userId);
    user.BMI = ((assessment.weight / Math.pow((user.height), 2.0) * 10000)).toFixed(2);
    const now = Date(Date.now());
    const currentDate = now.toString();
    assessment.date = assessmentStore.formatDate(currentDate);
    user.numberOfAssessments += 1;
    userStore.saveUser(user);
    assessmentStore.userTrend(user);
    this.store.save();
  },

  removeAssessment(id) {
    const assessment = this.getAssessment(id);
    const user =userStore.getUserById(assessment.userid);
    const assessmentCollection = assessmentStore.getUserAssessments(user);
    const lastAssessment = user.numberOfAssessments-1;
    logger.info("deleting assessment", assessmentCollection[lastAssessment]);
    user.numberOfAssessments -= 1;
    userStore.saveUser(user);
    this.store.remove(this.collection, assessment);
    //user.BMI = ((assessmentCollection[(user.numberOfAssessments) -1].weight)/ Math.pow((user.height), 2.0) * 10000).toFixed(2);
    this.store.save();
  },

  removeAllAssessments() {
    this.store.removeAll(this.collection);
    this.store.save();
  },

  saveAssessment()
  {
    this.store.save();
  },

  formatDate(date)
  {
    let day = date.slice(8,10);
    let month = date.slice(4,7);
    let year = date.slice(11,15);
    let time = date.slice(16,24);
    return day + "-" + month + "-" + year + " " + time;
  },

};

module.exports = assessmentStore;
