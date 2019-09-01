"use strict";

const _ = require("lodash");
const JsonStore = require("./json-store");
const userStore = require("../models/user-store");
const assessmentStore = require("../models/assessment-store");
const trainerStore = require("../models/trainer-store");
const logger = require("../utils/logger");
const analytics = require("../controllers/analytics");
const dashboard = require("../controllers/dashboard");
const uuid = require("uuid");



const goalStore = {
    store: new JsonStore("./models/goal-store.json", {
        goalCollection: []
    }),
    collection: "goalCollection",

    getGoal(id) {
        return this.store.findOneBy(this.collection, { id: id });
    },

    getUserGoals(userId) {
        return this.store.findBy(this.collection, { userId: userId });
    },

    getOpenGoals(userId)
    {
        const allGoals = goalStore.getUserGoals(userId);


        const openGoals = [];
        let i = 0;
        for (i=0;i<allGoals.length;i++)
        {
            if (allGoals[i].status === "Open")
            {
               openGoals.push(allGoals[i]);
            }
        }

        const sortedGoals = goalStore.sortGoalsByDate(openGoals);
        logger.info("Sorted goal dates are:", openGoals);
        return openGoals;
    },

    getMissedGoals(userId)
    {
        const allGoals = goalStore.getUserGoals(userId);
        const sortedGoals = goalStore.sortGoalsByDate(allGoals);
        const missedGoals = [];
        let i = 0;
        for (i=0;i<sortedGoals.length;i++)
        {
            if (sortedGoals[i].status === "Missed")
            {
                missedGoals.push(sortedGoals[i]);
            }
        }
        return missedGoals;

    },

    getAchievedGoals(userId)
    {
        const allGoals = goalStore.getUserGoals(userId);
        const sortedGoals = goalStore.sortGoalsByDate(allGoals);

        const achievedGoals = [];
        let i = 0;

        for (i=0;i<sortedGoals.length;i++)
        {
            if (sortedGoals[i].status === "Achieved")
            {
                achievedGoals.push(sortedGoals[i]);
            }
        }
        return achievedGoals;

    },

    addGoal(goal)
    {
        this.store.add(this.collection, goal);
        this.store.save();
    },



    removeGoal(id)
    {
        const goal = this.getGoal(id);
        this.store.remove(this.collection, goal);
        this.store.save();
    },

    removeUserGoals(userId) {
        const goalCollection = goalStore.getUserGoals(userId);
        logger.info("Deleting goals for :" + userId);

        let index = 0;

        for(index = 0; index < goalCollection.length; index ++ )
        {
            const thisGoal = goalCollection[index].id;
            goalStore.removeGoal(thisGoal);
            this.store.save();
        }
        this.store.save();
    },

    saveGoals()
    {
        this.store.save();
    },

    formatDate(date)
    {
        let day = date.slice(8,10);
        let month = date.slice(4,7);
        let year = date.slice(11,15);
        let time = date.slice(16,24);
        return day + "-" + month + "-" + year + " " + time;
    },

    sortGoalsByDate(goals)
    {
        return goals.sort(assessmentStore.compareValues('completionDate','desc'));
    }
    /*
    formatDate(date)
  {
    let day = date.slice(8,10);
    let month = date.slice(4,7);
    let year = date.slice(11,15);
    let time = date.slice(16,24);
    return day + "-" + month + "-" + year + " " + time;
  },

  sortAssessmentsByDate(assessments)
  {
    logger.info("sorting Assessment dates here");
    return assessments.sort(assessmentStore.compareValues('date','desc'));
  },

  compareValues(key,order='asc')
  //https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
  {
    return function (a, b) {
      if (!a.hasOwnProperty(key) ||
          !b.hasOwnProperty(key)) {
        return 0;
      }

      const varA = (typeof a[key] === 'string') ?
          a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string') ?
          b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return ( (order === 'desc') ?(comparison * -1) : comparison );
    };
  }
     */

};

module.exports = goalStore;
