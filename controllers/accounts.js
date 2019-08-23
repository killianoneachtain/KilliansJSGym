'use strict';

const userStore = require("../models/user-store");
const trainerStore = require("../models/trainer-store");
const logger = require("../utils/logger");
const uuid = require("uuid");

const accounts = {
  index(request, response) {
    const viewData = {
      title: "Login or Signup"
    };
    response.render("index", viewData);
  },

  login(request, response) {
    const viewData = {
      title: "Login to the Service"
    };
    response.render("login", viewData);
  },

  logout(request, response) {
    logger.info("logging out");
    response.cookie('assessment', "");
    response.redirect("/");
  },

  signup(request, response) {
    const viewData = {
      title: "Login to the Service"
    };
    response.render("signup", viewData);
  },

  register(request, response)
  {
    const member = userStore.getUserByEmail(request.body.email);

    if (member != null)
    {
      const memberEmail = member.email;
      if (memberEmail === request.body.email)
      {
        logger.info("Email already exists :" + memberEmail);
        response.render("emailExists.hbs");
      }
    }
    else {

      const user =
          {
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            gender: request.body.gender,
            email: request.body.email,
            password: request.body.password,
            address: request.body.address,
            height: Number(request.body.height),
            startingWeight: Number(request.body.startingWeight),
            id: uuid(),
            numberOfAssessments: 0
          };

      userStore.addUser(user);
      logger.info(`registering ${user.email}`);
      response.redirect("/");
    }
  },

  authenticate(request, response)
  {
    const user = userStore.getUserByEmail(request.body.email);
    const trainer = trainerStore.getTrainerByEmail(request.body.email);
    logger.info("authenticating");
    if (user)
    {
      response.cookie("assessment", user.email);
      logger.info(`logging in ${user.email}`);
      response.redirect("/dashboard");
    }
    else if (trainer)
    {
      response.cookie("trainer", trainer.email);
      logger.info(`logging in ${trainer.email}`);
      response.redirect("/trainer");
    }
    else {
      response.redirect("/login");
    }
  },

  getCurrentUser(request)
  {
    const memberEmail = request.cookies.assessment;
    logger.info("accounts / getCurrentUser email is : " + memberEmail);
    return userStore.getUserByEmail(memberEmail);
  },

  getCurrentTrainer(request)
  {
    const trainerEmail = request.cookies.trainer;
    logger.info("the trainer is : " + trainerEmail);
    return trainerStore.getTrainerByEmail(trainerEmail);
  }
};

module.exports = accounts;