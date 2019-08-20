"use strict";

const logger = require("../utils/logger");
const userStore = require("../models/user-store");
const assessments = require("../models/assessment-store");
const accounts = require("../controllers/accounts");
const dashboard = require("../controllers/dashboard");


const analytics = {
    calculateBMI(assessment,id)
    {
        const loggedInUser = accounts.getCurrentUser(id);
        const latestAssessment = assessments.getUserAssessments(loggedInUser)[0];

        const height = loggedInUser.height;
        let weight = latestAssessment.weight;
        if (weight === 0)
        {
            weight = loggedInUser.startingWeight;
            return weight / Math.pow(height, 2.0);
        }
    },

    determineBMICategory(userBMI)
    {

        let verdict= "No Verdict";

        if((userBMI >0) &&(userBMI < 16))
        {
            verdict = "SEVERELY UNDERWEIGHT";
        }

        if((userBMI >=16) && (userBMI <18.5))
        {
            verdict = "UNDERWEIGHT";
        }

        if((userBMI >= 18.5) && (userBMI <25))
        {
            verdict="NORMAL";
        }

        if((userBMI >= 25) && (userBMI <30))
        {
            verdict="OVERWEIGHT";
        }

        if((userBMI >= 30) && (userBMI <35))
        {
            verdict="MODERATELY OBESE";
        }

        if(userBMI >= 35)
        {
            verdict="SEVERELY OBESE";
        }

        return verdict;

    },

    folderColour(gender)
    {
        let colour = "olive";
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

    isIdealBodyWeight(assessment)
    {
        let idealBodyWeight = 0;
        const user = userStore.getUserById(assessment.userid);

        if (user.gender === "male")
        {
            idealBodyWeight = 50.00 + ((((user.height*100)  - 152.4) / 2.54) * 2.3);
        }
        else if ((user.gender === "female") || (!user.gender))
        {
            idealBodyWeight = 45.5 + ((((user.height*100) - 152.4) / 2.54) * 2.3);
        }

        if((assessment.getWeight() >= (idealBodyWeight - 0.3)) &&
            ((assessment.getWeight() <= (idealBodyWeight + 0.3))))
        {

            return true;
        }
        else
        {
            return false;
        }
    },

    userTrend(user)
    {
        logger.info(user);
        logger.info("user id is: " + user);
        const userAssessments = assessments.getUserAssessments(user);
        logger.info("The users assessments are : " + userAssessments);
        const sortedAssessments = dashboard.sortAssessmentsByDate(userAssessments);
        const arrayLength = sortedAssessments.length;
        let i =0;

        if(sortedAssessments.length > 1)
        {
            for (i =0;i< (arrayLength) - 1; i++)
            {
                if(sortedAssessments[i].weight > sortedAssessments[i+1].weight)
                //if (member.assessmentdetailslist.get(i).getWeight() > member.assessmentdetailslist.get(i + 1).getWeight())
                {
                    sortedAssessments[i].trend = "red";
                    this.store.save();
                    //member.assessmentdetailslist.get(i).setTrend("red");
                    //member.assessmentdetailslist.get(i).save();
                } else if (sortedAssessments[i].weight <= sortedAssessments[i+1].weight)
                {
                    sortedAssessments[i].trend = "olive";
                    this.store.save();
                }
                //else
                //{
                //  assessments[i].trend = "blue";
                //   this.store.save();
                // }

            }
            // This sets the oldest(last) assessment in the list to blue
            sortedAssessments[arrayLength-1].trend = "blue";
            this.store.save();
            //member.assessmentdetailslist.get((member.assessmentdetailslist.size())-1).setTrend("blue");

            //member.assessmentdetailslist.get((member.assessmentdetailslist.size())-1).save();
        }

        //If there is only one assessment for the user, the trend is set to'Blue"
        if(sortedAssessments.length === 1)
        {
            sortedAssessments[arrayLength-1].trend = "blue";
            this.store.save();
        }

    }


};

module.exports = analytics;
