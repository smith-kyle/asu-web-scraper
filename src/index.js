const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const asu = require('./asu');
const mongoUrl = 'mongodb://localhost:27017/asu';

function stopIfError(error) {
  if (error) {
    console.error(error);
    process.exit(2);
  }
}

const subjectsFilePath = path.join(__dirname, '..', 'json', 'subjects.json');
const subjects = JSON.parse(fs.readFileSync(subjectsFilePath, 'utf8'));
const urls = _.map(
  subjects,
  subject => `https://webapp4.asu.edu/catalog/classlist?s=${subject}&t=2161&e=all&hon=F`
);

MongoClient.connect(mongoUrl, (connectErr, mdb) => {
  stopIfError(connectErr);

  const mongoDB = mdb;
  const mongoCollection = mongoDB.collection('courses');

  asu.getCourses(urls)
    .then((courses) => {
      mongoCollection.insert(courses, (err) => {
        stopIfError(err);
        console.log('\nSCRAPED!');
        process.exit(0);
      });
    })
    .catch(stopIfError);
});
