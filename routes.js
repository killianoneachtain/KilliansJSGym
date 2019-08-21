~"use strict";

const express = require("express");
const router = express.Router();

const accounts = require("./controllers/accounts.js");
const dashboard = require("./controllers/dashboard.js");
const about = require("./controllers/about.js");
const assessment = require("./controllers/assessment.js");
const analytics = require("./controllers/analytics");
const trainer = require("./controllers/trainerCtrl.js");

router.get("/", accounts.index);
router.get("/login", accounts.login);
router.get("/signup", accounts.signup);
router.get("/logout", accounts.logout);
router.post("/register", accounts.register);
router.post("/authenticate", accounts.authenticate);

router.get("/dashboard", dashboard.index);
router.get("/dashboard/deleteAssessment/:id", dashboard.deleteAssessment);
router.post("/dashboard/addAssessment", dashboard.addAssessment);

router.get("/about", about.index);

router.get("/trainer", trainer.index);
router.get("/memberAssessments/:id", trainer.viewAssessments);
router.post("/trainer/:id/addcomment",  trainer.addComment);
router.get("/trainer/:id/deletemember", trainer.deleteMember);


module.exports = router;
