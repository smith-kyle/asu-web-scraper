const config = require('../config');

const Twilio = {
  sendUserSMS(user, course) {
    const client = require('twilio')(
      config.accounts.twilio.accountSid,
      config.accounts.twilio.authToken
    );

    return new Promise((resolve, reject) => {
      client.messages.create({
        to: user.phoneNumber,
        from: '4803605672',
        body: `${course.course} has opened!`
      }, err => err ? reject(err) : resolve()
      );
    });
  }
};

module.exports = Twilio;
