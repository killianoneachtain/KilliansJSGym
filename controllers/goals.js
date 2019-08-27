"use strict";

const accounts = require("./accounts.js");
const logger = require("../utils/logger");
const assessmentStore = require("../models/assessment-store");
const userStore = require("../models/user-store");
const goalStore = require("../models/goal-store");
const analytics = require("../controllers/analytics");
const trainerStore = require("../models/trainer-store");
const uuid = require("uuid");
const goals = require("../controllers/goals.js");

const dashboard = {
    index(request, response) {
        logger.info("dashboard rendering");
        const currentUser = accounts.getCurrentUser(request);
        logger.info("dashboard current user is ");
        logger.info(currentUser);

        const assessments = assessmentStore.getUserAssessments(currentUser.id);
        const sortedAssessments = assessmentStore.sortAssessmentsByDate(assessments);
        logger.info("Current User ID is : " + currentUser.id);

        const openGoals = goalStore.getOpenGoals(currentUser.id);
        const missedGoals = goalStore.getMissedGoals(currentUser.id);
        const achievedGoals = goalStore.getAchievedGoals(currentUser.id);

        logger.info("Goals are : " + openGoals);

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
            logger.info("Weight is starting weight");
        }
        else
        {
            currentWeight = latestAssessment.weight;
            logger.info("Weight is latest weight");
        }


        const currentBMI = analytics.calculateBMI(latestAssessment,currentUser.id);

        const viewData = {
            title: "Member Goals",
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
        response.render("memberGoals", viewData);
    },

    memberAddGoal(request, response) {
        const loggedInUser = accounts.getCurrentUser(request);

        logger.info("Member to add Goal to is " + loggedInUser);

        const now = Date(Date.now());
        const currentDate = now.toString();

        const addedByFirst = loggedInUser.firstName;
        const addedByLast = loggedInUser.lastName;
        const addedBy = addedByFirst + " " + addedByLast;

        logger.info("The loggedInUer.id is : " + loggedInUser.id);


        const goal =
            {
                id: uuid(),
                userId: loggedInUser.id,
                createdBy: addedBy,
                creationDate: assessmentStore.formatDate(currentDate),
                creationWeight: Number(assessmentStore.returnLatestWeight(loggedInUser.id)),
                completionDate: request.body.completionDate,
                goalWeight: Number(request.body.goalWeight),
                status: "Open"
            };
        logger.info("Adding Goal" + goal);

        goalStore.addGoal(goal);

        response.redirect("/dashboard");
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
        logger.info("about to render profile");
        response.render("profile", viewData);
    },

    genderColour(user)
    {
        logger.info("In genderColour function using: " + user.firstName);

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
