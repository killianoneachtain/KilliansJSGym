"use strict";

const accounts = require("./accounts.js");
const logger = require("../utils/logger");
const assessmentStore = require("../models/assessment-store");
const userStore = require("../models/user-store");
const goalStore = require("../models/goal-store");
const analytics = require("../controllers/analytics");

const uuid = require("uuid");


const dashboard = {
    index(request, response) {

        const currentUser = accounts.getCurrentUser(request);

        const assessments = assessmentStore.getUserAssessments(currentUser.id);
        const sortedAssessments = assessmentStore.sortAssessmentsByDate(assessments);

        dashboard.checkUserGoals(currentUser.id);

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
            achievedGoals : achievedGoals,
            upperGoalWeight: dashboard.maxGoalWeight(analytics.idealBodyWeight(latestAssessment),currentUser.id),
            lowerGoalWeight: dashboard.minGoalWeight(analytics.idealBodyWeight(latestAssessment),currentUser.id)
        };

        response.render("memberGoals", viewData);
    },

    maxGoalWeight(weight, userId)
    {

        let idealWeight = Number(weight);
        const x = 20;
        let upperLimit = x + idealWeight;

        let currentWeight = assessmentStore.returnLatestWeight(userId);
        if (currentWeight > upperLimit)
        {
            upperLimit = currentWeight;

        }
        return upperLimit;
    },

    minGoalWeight(weight, userId)
    {

        let idealWeight = Number(weight);
        const x = -20;
        let lowerLimit = x + idealWeight;

        let currentWeight = assessmentStore.returnLatestWeight(userId).toFixed(2);
        if (currentWeight < lowerLimit)
        {
            lowerLimit = currentWeight;
        }
        return lowerLimit;
    },

    memberAddGoal(request, response) {
        const loggedInUser = accounts.getCurrentUser(request);

        const now = Date(Date.now());
        const currentDate = now.toString();

        const addedByFirst = loggedInUser.firstName;
        const addedByLast = loggedInUser.lastName;
        const addedBy = addedByFirst + " " + addedByLast;

        //const creationDate = dashboard.formatGoalCreationDate(currentDate);

        const goalDate = request.body.completionDate;
        logger.info("Inputted Goal Date is : " + goalDate);
        let year = goalDate.substring(0,4);
        logger.info("Inputted Year is : " + year);
        let month = goalDate.substring(5,7);
        month = month -1;
        logger.info("Inputted month Date is : " + month);
        let day = goalDate.substring(8,10);
        logger.info("goalDate day is : " + day);
        const goalCompletionDate = new Date(year, month, day, 23, 59, 59, 59);
        let goalExpiryDate = goalCompletionDate.toString();
        logger.info("In AddingGoal, Goal Completion Date is : " + goalCompletionDate);


        const goal =
            {
                id: uuid(),
                userId: loggedInUser.id,
                createdBy: addedBy,
                creationDate: currentDate,
                weightDecision: request.body.weightChoice,
                creationWeight: Number(assessmentStore.returnLatestWeight(loggedInUser.id)),
                completionDate: goalExpiryDate,
                goalWeight: Number(request.body.goalWeight),
                goalAchievementDate: "",
                status: "Open"
            };


        goalStore.addGoal(goal);

        response.redirect("/memberGoals");
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

        const loggedInUser = accounts.getCurrentUser(request);

        const viewData = {
            title: "Editing Member Details",
            user: loggedInUser
        };
        response.render("editProfile", viewData);
    },

    saveProfile(request,response)
    {
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
    },

    checkUserGoals(userId)
    {
        const allOpenGoals = goalStore.getOpenGoals(userId);
        //const sortedGoals = goalStore.sortGoalsByDate(allOpenGoals);

        const now = Date(Date.now());
        const currentDate = now.toString();


        const currentWeight = assessmentStore.returnLatestWeight(userId);

        let i = 0;

        for (i=0;i<allOpenGoals.length;i++)
        {
            if ((currentWeight > allOpenGoals[i].goalWeight) && (allOpenGoals[i].weightDecision === "Gain"))
            {
                allOpenGoals[i].status = "Achieved";
                allOpenGoals[i].goalAchievementDate = assessmentStore.formatDate(currentDate);
                goalStore.saveGoals();
            }

            if ((currentWeight < allOpenGoals[i].goalWeight) && (allOpenGoals[i].weightDecision === "Lose"))
            {
                allOpenGoals[i].status = "Achieved";
                allOpenGoals[i].goalAchievementDate = assessmentStore.formatDate(currentDate);
                goalStore.saveGoals();
            }

            else if (new Date(allOpenGoals[i].completionDate).getTime() < new Date(currentDate).getTime())
            {
                allOpenGoals[i].status = "Missed";
                goalStore.saveGoals();
            }

        }


    }

};

module.exports = dashboard;
