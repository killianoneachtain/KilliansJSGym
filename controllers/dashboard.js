"use strict";

const accounts = require("./accounts.js");
const logger = require("../utils/logger");
const assessmentStore = require("../models/assessment-store");
const userStore = require("../models/user-store");
const goalStore = require("../models/goal-store");
const analytics = require("../controllers/analytics");
const goals = require("../controllers/goals");
const uuid = require("uuid");

const dashboard = {
  index(request, response) {
    logger.info("dashboard rendering");
    const currentUser = accounts.getCurrentUser(request);

    const assessments = assessmentStore.getUserAssessments(currentUser.id);
    const sortedAssessments = assessmentStore.sortAssessmentsByDate(assessments);

    goals.checkUserGoals(currentUser.id);


    const allGoals = goalStore.getUserGoals(currentUser.id);
    //const sortedGoals = goalStore.sortGoalsByDate(allGoals);

    const openGoals = goalStore.getOpenGoals(currentUser.id);
    const missedGoals = goalStore.getMissedGoals(currentUser.id);
    const achievedGoals = goalStore.getAchievedGoals(currentUser.id);

    let currentWeight = 0;
    let latestAssessment = sortedAssessments[0];

    if (assessments.length === 0)
    {
      latestAssessment = {
        id: "",
        userId: currentUser.id,
        weight: currentUser.startingWeight,
        chest: 0,
        thigh: 0,
        upperArm: 0,
        waist: 0,
        hips: 0,
        comment: " ",
        date: " ",
        trend: " "
      };
      currentWeight = currentUser.startingWeight;

    }
    else
    {
      currentWeight = latestAssessment.weight;
    }


    const currentBMI = analytics.calculateBMI(latestAssessment,currentUser.id);


    dashboard.userTrend(currentUser.id);

    const viewData = {
      title: "Member Dashboard",
      assessments: sortedAssessments,
      user: userStore.getUserById(currentUser.id),
      currentBMI: currentBMI,
      BMICategory: analytics.determineBMICategory(currentBMI),
      heartColour: analytics.heartColour(currentBMI),
      idealWeight: analytics.idealBodyWeight(latestAssessment),
      tachometerColour: analytics.isIdealWeight(latestAssessment),
      currentWeight: currentWeight,
      weightDifferential: analytics.idealWeightDifferential(latestAssessment),
      userIconColour: dashboard.genderColour(currentUser),
      openGoals: openGoals,
      missedGoals: missedGoals,
      achievedGoals : achievedGoals
    };
    logger.info("about to render");
    response.render("dashboard", viewData);
  },

  deleteAssessment(request, response) {
    const assessmentId = request.params.id;
    logger.debug(`Deleting Assessment ${assessmentId}`);
    assessmentStore.removeAssessment(assessmentId);
    response.redirect("/dashboard");
  },

  deleteGoal(request, response)
  {
    const goalId = request.params.id;
    logger.info("Deleting Goal : " + goalId);
    goalStore.removeGoal(goalId);
    response.redirect("/memberGoals");
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

    assessmentStore.addAssessment(newAssessment);

    response.redirect("/dashboard");
  },

  userTrend(userId)
  {

    logger.info(userId);

    const userAssessments = assessmentStore.getUserAssessments(userId);

    const sortedAssessments = assessmentStore.sortAssessmentsByDate(userAssessments);
    const arrayLength = sortedAssessments.length;
    let i =0;

    if(sortedAssessments.length > 1)
    {
      for (i =0;i< (arrayLength) - 1; i++)
      {
        if(sortedAssessments[i].weight > sortedAssessments[i+1].weight)

        {
          sortedAssessments[i].trend = "red";
          assessmentStore.saveAssessment();

        }
        else if (sortedAssessments[i].weight <= sortedAssessments[i+1].weight)
        {
          sortedAssessments[i].trend = "olive";
          assessmentStore.saveAssessment();
        }

      }

      sortedAssessments[arrayLength-1].trend = "blue";
      assessmentStore.saveAssessment();

    }

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


    const viewData = {
      title: "Member Profile",
      user: loggedInUser
    };

    response.render("profile", viewData);
  },

  genderColour(user)
  {
    if (user.gender === "male")
      {
        return "blue";
      } else if (user.gender === "female")
      {
        return "pink";
      } else
        {
        return "olive";
      }
  }

};

module.exports = dashboard;
