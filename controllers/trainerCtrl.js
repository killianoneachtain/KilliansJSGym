"use strict";

const accounts = require("./accounts.js");
const logger = require("../utils/logger");
const assessmentStore = require("../models/assessment-store");
const userStore = require("../models/user-store");
const trainerCtrl = require("../models/trainer-store");
const analytics = require("../controllers/analytics");
const dashboard = require("../controllers/dashboard");
const uuid = require("uuid");

const trainerDashboard = {
    index(request, response) {
        logger.info("trainerCtrl rendering");
        const allMembers = userStore.getAllUsers();

        const viewData = {
            title: "Trainer Dashboard",
            members: userStore.getAllUsers(),
            folderColour: analytics.folderColour(allMembers.gender)
        };

        response.render("trainer", viewData);
    },

    viewAssessments(request, response)
    {
        logger.info("trainer/member rendering");

        const memberID = request.params.id;
        const assessments = assessmentStore.getUserAssessments(memberID);
        const viewData = {
            title: "Member Assessments",
            assessments: dashboard.sortAssessmentsByDate(assessments),
            user: userStore.getUserById(memberID)
        };
        logger.info("about to render", assessmentStore.getUserAssessments(memberID));
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
