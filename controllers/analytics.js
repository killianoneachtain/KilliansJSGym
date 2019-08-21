"use strict";

const logger = require("../utils/logger");
const userStore = require("../models/user-store");
const assessmentStore = require("../models/assessment-store");
const accounts = require("../controllers/accounts");


const analytics = {
    calculateBMI(assessment,id)
    {
        const loggedInUser = userStore.getUserById(id);
        logger.info("here calculating BMI");
        logger.info(loggedInUser);

        const height = loggedInUser.height;

        let BMI = 0;

        if (loggedInUser.numberOfAssessments === 0)
        {
            const weight = loggedInUser.startingWeight;
            BMI = (weight / Math.pow((height), 2.0) * 10000).toFixed(2);
        }
        else {

            BMI = (assessment.weight / Math.pow((height), 2.0) * 10000).toFixed(2);
        }

        return BMI;
    },

    heartColour(BMI)
    {

        const currentBMI = BMI;

      let category = analytics.determineBMICategory(currentBMI);
      if (category != null) {
          switch (category) {
              case "SEVERELY UNDERWEIGHT":
                  return "violet";
                  break;

              case "UNDERWEIGHT": return "teal";
              break;

              case "NORMAL": return "green";
              break;

              case "OVERWEIGHT": return "yellow";
              break;

              case "MODERATELY OBESE": return "orange";
              break;

              case "SEVERELY OBESE": return "red";
              break;

              default: return "olive";
              break;
          }
      }
    },

    determineBMICategory(BMI)
    {
        const userBMI = BMI;

        let verdict= "No Verdict";

        if((userBMI >0) &&(userBMI < 16))
        {
            verdict = "SEVERELY UNDERWEIGHT"; //violet
        }

        if((userBMI >=16) && (userBMI <18.5))
        {
            verdict = "UNDERWEIGHT"; //teal
        }

        if((userBMI >= 18.5) && (userBMI <25))
        {
            verdict="NORMAL";//green
        }

        if((userBMI >= 25) && (userBMI <30))
        {
            verdict="OVERWEIGHT";//yellow
        }

        if((userBMI >= 30) && (userBMI <35))
        {
            verdict="MODERATELY OBESE";//orange
        }

        if(userBMI >= 35)
        {
            verdict="SEVERELY OBESE";//red
        }

        return verdict;

    },

    folderColour(gender)
    {
        let colour = "red";
        if (gender === "male")
        {
            colour = "blue";
            //colour = "<i class=" + '"' + "big blue folder icon" + '"' + "></i>";
        }
        else if (gender === "female")
        {
            colour = "pink";
            //colour = "<i class=" + '"' + "big pink folder icon" + '"' + "></i>";
        }
        return colour;
    },

    idealBodyWeight(assessment)
    {
        const user = userStore.getUserById(assessment.userId);
        logger.info("users gender is:" + user.gender);

        if (user.gender === "male")
        {
            return (50.00 + ((((user.height) - 152.4) / 2.54) * 2.3)).toFixed(2);
            //return ((50 + 2.3) * ((user.height * 0.393701) - 60)).toFixed(2);
        } else
        {
            return (45.5 + ((((user.height) - 152.4) / 2.54) * 2.3)).toFixed(2);
            //return ((45.5 + 2.3) * ((user.height * 0.393701) - 60)).toFixed(2);
        }


    },

    isIdealWeight(assessment)
    {
        /*
        (((assessment.weight >= (analytics.idealBodyWeight(assessment) - 0.3)) &&
        ((assessment.weight <= (analytics.idealBodyWeight(assessment) + 0.3)))))

         */
        const currentWeight = assessment.weight;
        const idealBodyWeight = analytics.idealBodyWeight(assessment);
        logger.info("The users current weight is : " + currentWeight);
        logger.info("The users ideal weight is : " + idealBodyWeight);
        const differential = (Math.abs(idealBodyWeight - currentWeight)).toFixed(2);
        logger.info("Differential is : " + differential);
        if (differential <= 0.30)
        {
            logger.info("GREEN");
            return "green";
        }
        else
        {
            return "red";
        }
    },

    idealWeightDifferential(assessment)
    {
        return  Math.abs(analytics.idealBodyWeight(assessment)  - assessment.weight).toFixed(2);
    }

};

module.exports = analytics;
