"use strict";

const accounts = require("./accounts.js");
const logger = require("../utils/logger");
const assessmentStore = require("../models/assessment-store");
const userStore = require("../models/user-store");
const trainerStore = require("../models/trainer-store");
const analytics = require("../controllers/analytics");
const dashboard = require("../controllers/dashboard");

const uuid = require("uuid");

const trainerDashboard = {
    index(request, response) {
        logger.info("trainerCtrl rendering");
        const trainer = accounts.getCurrentTrainer(request);


        const viewData = {
            title: "Trainer Dashboard",
            members: userStore.getAllUsers(),
            trainer: trainerStore.getTrainerByEmail(trainer.email)
            //colour: trainerDashboard.pinkOrBlue()
        };

        response.render("trainer", viewData);
    },

    pinkOrBlue()
    {
        let users = trainerDashboard.index.members;
        let i = 0;
        for(i=0; i < users.length;i++)
        {
            if (users.gender === "male") {
                return "blue";
            } else if (users.gender === "female") {
                return "pink";
            } else return "olive";
        }
    },

    viewAssessments(request, response)
    {
        logger.info("trainer/member rendering");
        const memberID = request.params.id;
        const loggedInUser = userStore.getUserById(memberID);

        const assessments = assessmentStore.getUserAssessments(memberID);
        const sortedAssessments = assessmentStore.sortAssessmentsByDate(assessments);

        let currentWeight = 0;
        let latestAssessment = sortedAssessments[0];

        if (assessments.length == 0)
        {
            latestAssessment = {
                id: "",
                userId: loggedInUser.id,
                weight: loggedInUser.startingWeight,
                chest: 0,
                thigh: 0,
                upperArm: 0,
                waist: 0,
                hips: 0,
                comment: " ",
                date: " ",
                trend: " "
            };
            currentWeight = loggedInUser.startingWeight;
            logger.info("Weight is starting weight");
        }
        else
        {
            currentWeight = latestAssessment.weight;
            logger.info("Weight is latest weight");
        }

        const currentBMI = analytics.calculateBMI(sortedAssessments[0],memberID);

        const viewData = {
            title: "Member Assessments",
            assessments: sortedAssessments,
            user: userStore.getUserById(memberID),
            currentBMI: currentBMI,
            BMICategory: analytics.determineBMICategory(currentBMI),
            heartColour: analytics.heartColour(currentBMI),
            idealWeight: analytics.idealBodyWeight(latestAssessment),
            tachometerColour: analytics.isIdealWeight(latestAssessment),
            currentWeight: currentWeight,
            weightDifferential: analytics.idealWeightDifferential(latestAssessment)
        };

        response.render("trainerMember", viewData);
    },

    addComment(request,response)
    {
        logger.info("adding comment");
        const assessment = assessmentStore.getAssessment(request.params.id);
        assessment.comment = request.body.comment;
        assessmentStore.saveAssessment();
        const viewData = {
            title: "Trainer Dashboard",
            members: userStore.getAllUsers(),
        };

        response.render("trainer",viewData);

    },

    deleteMember(request, response)
    {
        const memberID = request.params.id;
        logger.info("Deleting member", memberID);
        assessmentStore.removeUserAssessments(memberID);
        userStore.removeMember(memberID);

        const viewData = {
            title: "Trainer Dashboard",
            members: userStore.getAllUsers(),
        };
        logger.info("about to render", assessmentStore.getUserAssessments(memberID));
        response.render("trainer", viewData);
    },
};

module.exports = trainerDashboard;
