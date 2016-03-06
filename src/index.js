const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const asu = require('./asu');
const config = require('./config');
const datalayer = require('./datalayer');

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

function updateCoursesForever() {
  let courses;
  const startTime = new Date();
  const promiseArray = _.map(urlChunks, urlChunk => asu.getCourses(urlChunk));
  return Promise.all(promiseArray)
    .then((result) => {
      courses = _.flatten(result);
      return datalayer.removeAllCourses();
    })
    .then(() => datalayer.insertCourses(courses))
    .then(() => console.log(`Finished in ${(new Date() - startTime)}ms`))
    .catch(stopIfError)
    .then(updateCoursesForever);
}

datalayer.connectDB()
  .then(updateCoursesForever);
