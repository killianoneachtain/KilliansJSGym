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

        const currentUser = accounts.getCurrentUser(request);

        logger.info(currentUser);

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
        logger.info("For Max weight, Ideal weight is : " + weight);
        let idealWeight = Number(weight);
        const x = 20;
        let upperLimit = x + idealWeight;

        logger.info("For Max weight, Upper weight is : " + upperLimit);

        let currentWeight = assessmentStore.returnLatestWeight(userId);
        if (currentWeight > upperLimit)
        {
            upperLimit = currentWeight;
            logger.info("For Max weight, Upper weight is : (currentWeight)" + upperLimit);
        }
        return upperLimit;
    },

    minGoalWeight(weight, userId)
    {
        logger.info("For Min weight, Ideal weight is : " + weight);
        let idealWeight = Number(weight);
        const x = -20;
        let lowerLimit = x + idealWeight;

        logger.info("For Min weight, Lower weight is : " + lowerLimit);

        let currentWeight = assessmentStore.returnLatestWeight(userId).toFixed(2);
        if (currentWeight < lowerLimit)
        {
            lowerLimit = currentWeight;
            logger.info("For Min weight, Lower weight is : (currentWeight)" + lowerLimit);
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

        const creationDate = dashboard.formatGoalCreationDate(currentDate);

        const goalDate = dashboard.formatGoalCompletionDate(request.body.completionDate);

        const goal =
            {
                id: uuid(),
                userId: loggedInUser.id,
                createdBy: addedBy,
                creationDate: creationDate,
                creationWeight: Number(assessmentStore.returnLatestWeight(loggedInUser.id)),
                completionDate: goalDate,
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

    formatGoalCreationDate(date)
    {
        let day = date.slice(8,10);
        let month = date.slice(4,7);
        let year = date.slice(11,15);

        return day + "-" + month + "-" + year;
    },

    formatGoalCompletionDate(date)
    {
        let year = date.slice(0,4);
        let month = date.slice(5,7);
        let monthName = dashboard.monthName(month);
        let day = date.slice(8,10);

        return day + "-" + monthName + "-" + year;
    },

    monthName(monthNumber)
    {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"  ];

        let month = monthNumber - 1;

        return monthNames[month];
    },

    checkUserGoals(userId)
    {
        const allOpenGoals = goalStore.getOpenGoals(userId);
        //const sortedGoals = goalStore.sortGoalsByDate(allOpenGoals);

        const now = Date(Date.now());
        const currentDate = now.toString();

        const currentWeight = assessmentStore.returnLatestWeight(userId);
        logger.info("Check User Goals Current Weight is : " + currentWeight);

        let i = 0;

        for (i=0;i<allOpenGoals.length;i++)
        {
            if((currentWeight < allOpenGoals[i].goalWeight) && ((currentDate > allOpenGoals[i].completionDate)))
            {
                allOpenGoals[i].status = "Achieved";
                allOpenGoals[i].goalAchievementDate = assessmentStore.formatDate(currentDate);
                goalStore.saveGoals();
            }
        }


    }

};

module.exports = dashboard;
