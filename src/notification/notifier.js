const _ = require('lodash');
const datalayer = require('../datalayer');
const mail = require('./mail');
const twilio = require('./twilio');

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
        const notifyPromiseArray = _.map(openCourses, openCourse =>
          this.sendUserNotifications(user, openCourse)
            .then(() => datalayer.markAsNotfied(user.username, openCourse.courseNumber))
        );

        const waitingForUpdate = _.some(
          user.courses,
          course => course.status === 'pending'
            && !_.some(openCourses, openCourse => openCourse.courseNumber === course.number)
        );
        return Promise.all(notifyPromiseArray)
          .then(() => datalayer.updateIsUserWaiting(user.username, waitingForUpdate));
      });
  },

  sendUserNotifications(user, course) {
    const { notificationMethods } = user;
    return Promise.resolve()
      .then(() =>
        _.some(notificationMethods, m => m === 'sms') ? twilio.sendUserSMS(user, course) : null
      )
      .then(() =>
        _.some(notificationMethods, m => m === 'email') ? mail.sendUserEmail(user, course) : null
      );
  }
};

module.exports = Notifier;
