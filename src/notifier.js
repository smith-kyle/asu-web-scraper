const _ = require('lodash');
const datalayer = require('./datalayer');

const Notifier = {
  notifyAllUsersIfClassOpened() {
    return datalayer.getWaitingUsers()
      .then(users => {
        const promiseArray = _.map(users, user => this.notifyUserIfClassOpened(user));
        return Promise.all(promiseArray);
      });
  },

  notifyUserIfClassOpened(user) {
    const pendingCourses = _.filter(user.courses, course => course.status === 'pending');
    const numberToCoursePromises = _.map(
      pendingCourses,
      course => datalayer.getCourse(course.number)
    );
    return Promise.all(numberToCoursePromises)
      .then((courses) => {
        const openCourses = _.filter(courses, course => _.toNumber(course.availableSeats) > 0);
        _.forEach(openCourses, openCourse => {
          this.notifyUserOfCourse(user, openCourse);
          datalayer.markAsNotfied(user.username, openCourse.courseNumber);
        });
      });
  },

  notifyUserOfCourse(user, course) {
    console.log(`Notfied ${user.username} that ${course.courseNumber} is open`);
  }
};

module.exports = Notifier;
