const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

const DataLayer = {
  connectDB() {
    const _this = this;
    return new Promise((resolve, reject) => {
      MongoClient.connect('mongodb://localhost:27017/asu', (connectErr, mdb) => {
        if (connectErr) {
          reject(connectErr);
        }

        _this.mdb = mdb;
        _this.coursesCollection = mdb.collection('courses');
        resolve();
      });
    });
  },

  getCourse(courseNumber) {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.coursesCollection.findOne({ courseNumber }, (err, result) => {
        if (err) {
          return reject(err);
        }

        resolve(result);
      });
    });
  },

  getWaitingUsers() {
    return new Promise((resolve, reject) => {
      MongoClient.connect('mongodb://localhost:27017/parse', (connectErr, mdb) => {
        if (connectErr) {
          reject(connectErr);
        }

        const usersCollection = mdb.collection('_User');
        usersCollection.find({ waitingForUpdate: true }).toArray((err, result) => {
          if (err) {
            return reject(err);
          }

          resolve(result);
        });
      });
    });
  },

  insertCourses(courses) {
    const _this = this;
    return new Promise((resolve, reject) =>
      _this.coursesCollection.insert(courses, err => err ? reject(err) : resolve())
    );
  },

  isCourseOpen(courseNumber) {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.coursesCollection.findOne({ courseNumber }, (err, result) => {
        if (err) {
          return reject(err);
        }

        resolve(_.toNumber(result.availableSeats) > 0);
      });
    });
  },

  markAsNotfied(username, courseNumber) {
    return new Promise((resolve, reject) => {
      MongoClient.connect('mongodb://localhost:27017/parse', (connectErr, mdb) => {
        if (connectErr) {
          reject(connectErr);
        }
        const usersCollection = mdb.collection('_User');
        usersCollection.update(
          { username, 'courses.number': courseNumber },
          { $set: { 'courses.$.status': 'notified' } },
          { upsert: false },
          err => err ? reject(err) : resolve()
        );
      });
    });
  },

  removeAllCourses() {
    const _this = this;
    return new Promise(
      (resolve, reject) => _this.coursesCollection.remove({}, err => err ? reject(err) : resolve())
    );
  },

  updateCourses(courses) {
    const _this = this;
    return new Promise((resolve, reject) => {
      const bulk = _this.coursesCollection.initializeUnorderedBulkOp();
      _.forEach(courses, course => {
        bulk.find({ courseNumber: course.courseNumber }).upsert().replaceOne(course);
      });
      bulk.execute(err => err ? reject(err) : resolve());
    });
  }
};

module.exports = DataLayer;
