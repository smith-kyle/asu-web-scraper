const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const asu = require('./asu');
const config = require('./config');
const mongoUrl = 'mongodb://localhost:27017/asu';

function stopIfError(error) {
  if (error) {
    console.error(error.stack);
    process.exit(2);
  }
}

const subjectsFilePath = path.join(__dirname, '..', 'json', 'subjects.json');
const subjects = JSON.parse(fs.readFileSync(subjectsFilePath, 'utf8'));
const urls = _.map(
  subjects,
  subject => `https://webapp4.asu.edu/catalog/classlist?s=${subject}&t=2161&e=all&hon=F`
);
const chunkSize = Math.ceil(urls.length / config.concurrentRequests);
const urlChunks = _.chunk(urls, chunkSize);

MongoClient.connect(mongoUrl, (connectErr, mdb) => {
  stopIfError(connectErr);

  const mongoDB = mdb;
  const mongoCollection = mongoDB.collection('courses');

  function updateCoursesForever() {
    let courses;
    const startTime = new Date();
    const promiseArray = _.map(urlChunks, urlChunk => asu.getCourses(urlChunk));
    return Promise.all(promiseArray)
      .then((result) => {
        courses = _.flatten(result);
        return new Promise(
          (resolve, reject) => mongoCollection.remove({}, err => err ? reject(err) : resolve())
        );
      })
      .then(() =>
        new Promise(
          (resolve, reject) =>
            mongoCollection.insert(courses, err => err ? reject(err) : resolve())
        )
      )
      .then(() => console.log(`Finished in ${(new Date() - startTime)}ms`))
      .catch(stopIfError)
      .then(updateCoursesForever);
  }
  updateCoursesForever();
});
