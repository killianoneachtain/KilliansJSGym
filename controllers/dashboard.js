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
    logger.info("dashboard current user is ");
    logger.info(currentUser);

    const assessments = assessmentStore.getUserAssessments(currentUser.id);
    const sortedAssessments = assessmentStore.sortAssessmentsByDate(assessments);
    const currentBMI = analytics.calculateBMI(sortedAssessments[0],currentUser.id);

    let currentWeight = 0;
    let latestAssessment = sortedAssessments[0];
    let idealWeight = 0;
    let idealWeightIndicator = "Blue";
    let weightDifferential = 0;
    if (assessments.length == 0)
    {
      currentWeight = currentUser.startingWeight;
      logger.info("Weight is starting weight");
    }
    else
    {
      currentWeight = latestAssessment.weight;
      idealWeight = analytics.idealBodyWeight(sortedAssessments[0]);
      idealWeightIndicator = analytics.isIdealWeight(sortedAssessments[0]);
      weightDifferential = analytics.idealWeightDifferential(sortedAssessments[0]);
      logger.info("Weight is latest weight");
    }




    dashboard.userTrend(currentUser.id);

    const viewData = {
      title: "Member Dashboard",
      assessments: sortedAssessments,
      user: userStore.getUserById(currentUser.id),
      currentBMI: currentBMI,
      BMICategory: analytics.determineBMICategory(currentBMI),
      heartColour: analytics.heartColour(currentBMI),
      idealWeight: idealWeight,
      tachometerColour: idealWeightIndicator,
      currentWeight: currentWeight,
      weightDifferential: weightDifferential
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
    logger.info("Creating a new Assessment", newAssessment);
    assessmentStore.addAssessment(newAssessment);

    response.redirect("/dashboard");
  },

  userTrend(userId)
  {
    logger.info("In analytics");
    logger.info(userId);
    logger.info("user id is: " + userId);
    const userAssessments = assessmentStore.getUserAssessments(userId);
    logger.info(userAssessments);
    const sortedAssessments = assessmentStore.sortAssessmentsByDate(userAssessments);
    const arrayLength = sortedAssessments.length;
    let i =0;

    if(sortedAssessments.length > 1)
    {
      for (i =0;i< (arrayLength) - 1; i++)
      {
        if(sortedAssessments[i].weight > sortedAssessments[i+1].weight)
        //if (member.assessmentdetailslist.get(i).getWeight() > member.assessmentdetailslist.get(i + 1).getWeight())
        {
          sortedAssessments[i].trend = "red";
          assessmentStore.saveAssessment();
          //member.assessmentdetailslist.get(i).setTrend("red");
          //member.assessmentdetailslist.get(i).save();
        } else if (sortedAssessments[i].weight <= sortedAssessments[i+1].weight)
        {
          sortedAssessments[i].trend = "olive";
          assessmentStore.saveAssessment();
        }
        //else
        //{
        //  assessments[i].trend = "blue";
        //   this.store.save();
        // }

      }
      // This sets the oldest(last) assessment in the list to blue
      sortedAssessments[arrayLength-1].trend = "blue";
      assessmentStore.saveAssessment();
      //member.assessmentdetailslist.get((member.assessmentdetailslist.size())-1).setTrend("blue");

      //member.assessmentdetailslist.get((member.assessmentdetailslist.size())-1).save();
    }

    //If there is only one assessment for the user, the trend is set to'Blue"
    if(sortedAssessments.length === 1)
    {
      sortedAssessments[arrayLength-1].trend = "blue";
      assessmentStore.saveAssessment();
    }
  },

  viewProfile(request,response)
  {
    logger.info("profile rendering");
    const currentUser = accounts.getCurrentUser(request);

    const viewData = {
      title: "Member Profile",
      user: currentUser
    };
    logger.info("about to render");
    response.render("profile", viewData);
  },

  editProfile(request, response)
  {
    logger.info("Editing User Profile ");
    const loggedInUser = accounts.getCurrentUser(request);

    const viewData = {
      title: "Editing Member Details",
      user: loggedInUser
    };
    response.render("editProfile", viewData);
  },

  saveProfile(request,response)
  {
    logger.info("Saving User Profile");
    const loggedInUser = accounts.getCurrentUser(request);

    loggedInUser.firstName = request.body.firstName;
    loggedInUser.lastName = request.body.lastName;
    loggedInUser.gender = request.body.gender;
    loggedInUser.email = request.body.email;
    loggedInUser.password = request.body.password;
    loggedInUser.address = request.body.address;
    loggedInUser.height = Number(request.body.height);
    loggedInUser.startingWeight = Number(request.body.startingWeight);

    userStore.saveUser();
    logger.info(`saving editted user profile ${loggedInUser.email}`);

    const viewData = {
      title: "Member Profile",
      user: loggedInUser
    };
    logger.info("about to render");
    response.render("profile", viewData);

  }

};

module.exports = dashboard;
