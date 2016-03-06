const MongoClient = require('mongodb').MongoClient;

const DataLayer = {
  connectDB() {
    const _this = this;
    return new Promise((resolve, reject) => {
      MongoClient.connect('mongodb://localhost:27017/asu', (connectErr, mdb) => {
        if (connectErr) {
          reject(connectErr);
        }

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
  }
};

module.exports = DataLayer;
