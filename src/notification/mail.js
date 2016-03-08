const config = require('../config');
const nodemailer = require('nodemailer');

const Mail = {
  sendUserEmail(user, course) {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: config.accounts.gmail.username,
        pass: config.accounts.gmail.password
      }
    });

    const mailOptions = {
      from: '"ASU Seat Finder" <kyle.r.smiff@gmail.com>', // sender address
      to: user.username, // list of receivers
      subject: `${course.course} seat has opened!`, // Subject line
      text: `A seat has opened ${course.courseNumber}`, // plaintext body
      html: `<a href='https://webapp4.asu.edu/catalog/course?r=${course.courseNumber}'>Sign up</a>` // html body
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
};

module.exports = Mail;
