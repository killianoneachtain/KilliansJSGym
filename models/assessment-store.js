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

  getAssessment(id) {
    return this.store.findOneBy(this.collection, { id: id });
  },

  getUserAssessments(userId) {
    return this.store.findBy(this.collection, { userId: userId });
  },

  addAssessment(assessment) {
    this.store.add(this.collection, assessment);
    const user=userStore.getUserById(assessment.userId);

    const now = Date(Date.now());
    const currentDate = now.toString();
    assessment.date = assessmentStore.formatDate(currentDate);

    user.numberOfAssessments += 1;

    //analytics.userTrend(user.id);

    userStore.saveUser(user);

    this.store.save();
  },

  removeAssessment(id)
  {
    const assessment = this.getAssessment(id);
    const user = userStore.getUserById(assessment.userId);
    const assessmentCollection = assessmentStore.getUserAssessments(user);
    const lastAssessment = user.numberOfAssessments-1;
    logger.info("deleting assessment", assessmentCollection[lastAssessment]);
    user.numberOfAssessments -= 1;
    userStore.saveUser(user);
    this.store.remove(this.collection, assessment);
    //user.BMI = ((assessmentCollection[(user.numberOfAssessments) -1].weight)/ Math.pow((user.height), 2.0) * 10000).toFixed(2);
    this.store.save();
  },

  removeUserAssessments(userId) {
    const assessmentCollection = assessmentStore.getUserAssessments(userId);
    logger.info("Deleting assessments for :" + userId + " array length is : ");
    logger.info(assessmentCollection.length);

    let index = 0;

    for(index = 0; index < assessmentCollection.length; index ++ )
    {
      const thisAssessment = assessmentCollection[index].id;
      assessmentStore.removeAssessment(thisAssessment);
      this.store.save();
    }
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

  sortAssessmentsByDate(assessments)
  {
    logger.info("sorting dates here");
    return assessments.sort(assessmentStore.compareValues('date','desc'));
  },

  compareValues(key,order='asc')
  //https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
  {
    return function (a, b) {
      if (!a.hasOwnProperty(key) ||
          !b.hasOwnProperty(key)) {
        return 0;
      }

      const varA = (typeof a[key] === 'string') ?
          a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string') ?
          b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return ( (order === 'desc') ?(comparison * -1) : comparison );
    };
  }

};

module.exports = assessmentStore;
