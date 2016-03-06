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

  insertCourses(courses) {
    const _this = this;
    return new Promise((resolve, reject) =>
      _this.coursesCollection.insert(courses, err => err ? reject(err) : resolve())
    );
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
