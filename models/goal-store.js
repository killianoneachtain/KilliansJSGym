"use strict";

const _ = require("lodash");
const JsonStore = require("./json-store");
const assessmentStore = require("../models/assessment-store");
const logger = require("../utils/logger");




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
        logger.info("The assessment is: " + goal.id);

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

    sortGoalsByDate(goals)
    {
        return goals.sort(assessmentStore.compareValues('completionDate','desc'));
    }

};

module.exports = goalStore;
