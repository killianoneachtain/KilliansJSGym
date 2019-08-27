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
        return openGoals;
    },

    getMissedGoals(userId)
    {
        const allGoals = goalStore.getUserGoals(userId);
        const missedGoals = [];
        let i = 0;
        for (i=0;i<allGoals.length;i++)
        {
            if (allGoals[i].status === "Missed")
            {
                missedGoals.push(allGoals[i]);
            }
        }
        return missedGoals;

    },

    getAchievedGoals(userId)
    {
        const allGoals = goalStore.getUserGoals(userId);
        const achievedGoals = [];
        let i = 0;
        for (i=0;i<allGoals.length;i++)
        {
            if (allGoals[i].status === "Achieved")
            {
                achievedGoals.push(allGoals[i]);
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
        const user = userStore.getUserById(goal.userId);
        const goalCollection = goalStore.getUserGoals(user);
        user.goals -= 1;
        userStore.saveUser(user);
        this.store.save();
    },

    removeUserGoals(userId) {
        const goalCollection = goalStore.getUserGoals(userId);
        logger.info("Deleting goals for :" + userId);
        logger.info(assessmentCollection.length);

        let index = 0;

        for(index = 0; index < goalCollection.length; index ++ )
        {
            const thisGoal = goalCollection[index].id;
            goalStore.removeGoal(thisGoal);
            this.store.save();
        }
        this.store.save();
    },

    saveGoal()
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
    }
};

module.exports = goalStore;
