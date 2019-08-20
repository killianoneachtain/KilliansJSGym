"use strict";

const accounts = require("./accounts.js");
const logger = require("../utils/logger");
const assessmentStore = require("../models/assessment-store");
const userStore = require("../models/user-store");
const analytics = require("../controllers/analytics");
const uuid = require("uuid");

const dashboard = {
  index(request, response) {
    logger.info("dashboard rendering");
    const currentUser = accounts.getCurrentUser(request);
    logger.info("dashboard current user is " , currentUser);

    //const assessments = assessmentStore.getUserAssessments(currentUser.id);

    const viewData = {
      title: "Member Dashboard",
      assessments: assessmentStore.getUserAssessments(currentUser.id),
      user: userStore.getUserById(currentUser.id),
      BMI: analytics.determineBMICategory(currentUser.BMI),
      trend: analytics.userTrend(currentUser)
    };
    logger.info("about to render");
    response.render("dashboard", viewData);
  },

  deleteAssessment(request, response) {
    const assessmentId = request.params.id;
    logger.debug(`Deleting Playlist ${assessmentId}`);
    assessmentStore.removeAssessment(assessmentId);
    response.redirect("/dashboard");
  },

  addAssessment(request, response) {
    const loggedInUser = accounts.getCurrentUser(request);
    const newAssessment = {
      id: uuid(),
      userId: loggedInUser.id,
      weight: Number(request.body.weight),
      chest: Number(request.body.chest),
      thigh: Number(request.body.thigh),
      upperArm: Number(request.body.upperArm),
      waist: Number(request.body.waist),
      hips: Number(request.body.hips),
      comment: "",
      date: "",
      trend: ""
    };
    logger.debug("Creating a new Assessment", newAssessment);
    assessmentStore.addAssessment(newAssessment);

    response.redirect("/dashboard");
  },

  sortAssessmentsByDate(userId)
  {
    const assessments = assessmentStore.getUserAssessments(userId);
    logger.info("sorting dates here");
    return assessments.sort(dashboard.compareValues('date','desc'));
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
      return (
          (order === 'desc') ?
              (comparison * -1) : comparison
      );
    };
  }

};

module.exports = dashboard;
