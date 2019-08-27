"use strict";

const accounts = require("./accounts.js");
const logger = require("../utils/logger");
const assessmentStore = require("../models/assessment-store");
const userStore = require("../models/user-store");
const trainerStore = require("../models/trainer-store");
const goalStore = require("../models/goal-store");
const analytics = require("../controllers/analytics");
const dashboard = require("../controllers/dashboard");


const uuid = require("uuid");

const trainerDashboard = {
    index(request, response) {
        logger.info("trainerCtrl rendering");
        const trainer = accounts.getCurrentTrainer(request);
        const users = userStore.getAllUsers();


        let genderColourArray = [];
        genderColourArray = trainerDashboard.pinkOrBlue();

        let openGoals = [];
        openGoals = trainerDashboard.numberOfOpenGoals();

        const viewData = {
            title: "Trainer Dashboard",
            members: users,
            trainer: trainerStore.getTrainerByEmail(trainer.email),
            userIconColour: genderColourArray,
            openGoals: openGoals
        };
        logger.info("Icon Array is : " + genderColourArray);

        response.render("trainer", viewData);
    },

    pinkOrBlue()
    {
        const users = userStore.getAllUsers();

        let i = 0;
        let genderColourArray = [];

        for(i=0; i < users.length;i++)
        {
            const gender = users[i].gender;
            if (gender === "male")
            {
                genderColourArray[i] =  'blue';
            }
            else if (gender === "female")
            {
                genderColourArray[i] = 'pink';

            } else genderColourArray[i] = 'olive';
        }
        return genderColourArray;
    },

    numberOfOpenGoals()
    {
        const users = userStore.getAllUsers();

        let i = 0;
        let openGoalsArray = [];

        for(i=0; i < users.length;i++)
        {
            const userId = users[i].id;
            let openGoals = goalStore.getOpenGoals(userId);
            openGoalsArray.push(openGoals.length);
        }
        return openGoalsArray;
    },

    trainerAddGoal(request, response)
    {
        const loggedInTrainer = accounts.getCurrentTrainer(request);

        logger.info("Trainer to add Goal to is " + loggedInTrainer);

        const now = Date(Date.now());
        const currentDate = now.toString();

        const addedByFirst = loggedInTrainer.firstName;
        const addedByLast = loggedInTrainer.lastName;
        const addedBy = addedByFirst + " " + addedByLast;


        const goal =
            {
                id: uuid(),
                userId: request.params.id,
                createdBy: addedBy,
                creationDate: assessmentStore.formatDate(currentDate),
                completionDate: request.body.completionDate,
                goalWeight: Number(request.body.goalWeight),
                status: "Open"
            };
        logger.info("Adding Goal" + goal);

        goalStore.addGoal(goal);

        response.redirect("/dashboard");
    },

    viewAssessments(request, response)
    {
        logger.info("trainer/member rendering");
        const memberID = request.params.id;
        const loggedInUser = userStore.getUserById(memberID);

        const assessments = assessmentStore.getUserAssessments(memberID);
        const sortedAssessments = assessmentStore.sortAssessmentsByDate(assessments);

        const openGoals = goalStore.getOpenGoals(loggedInUser.id);
        const missedGoals = goalStore.getMissedGoals(loggedInUser.id);
        const achievedGoals = goalStore.getAchievedGoals(loggedInUser.id);

        let currentWeight = 0;
        let latestAssessment = sortedAssessments[0];

        if (assessments.length === 0)
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
            weightDifferential: analytics.idealWeightDifferential(latestAssessment),
            userIconColour: dashboard.genderColour(loggedInUser),
            openGoals: openGoals,
            missedGoals: missedGoals,
            achievedGoals : achievedGoals
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

        response.redirect("/trainer");

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
