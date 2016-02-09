const request = require('request');
const _ = require('lodash');
const cheerio = require('cheerio');

const asuOnlineCookie = 'onlineCampusSelection=O;';
const inPersonOrICourseCookie = 'onlineCampusSelection=C;';

const asu = {
  getCoursesFromUrl(url, courses = []) {
    console.log(`Collecting courses from ${url}`);
    const _this = this;
    return new Promise((resolve, reject) => {
      const jSessionId = _this.jSessionId;
      if (!jSessionId || !jSessionId.expirationDate || jSessionId.expirationDate < new Date()) {
        _this.getJSessionId()
          .then(_jSessionId => {
            _this.jSessionId = _jSessionId;
            const config = {
              url,
              headers: {
                cookie: `JSESSIONID=${_this.jSessionId.id};`
              },
              timeout: 5000
            };
            _this.sendRequests(config, courses, resolve, reject);
          });
      }
      else {
        const config = {
          url,
          headers: {
            cookie: `JSESSIONID=${_this.jSessionId.id};`
          },
          timeout: 5000
        };
        _this.sendRequests(config, courses, resolve, reject);
      }
    });
  },

  getCourses(urls) {
    return _.reduce(
      urls,
      (promise, url) => promise.then(this.getCoursesFromUrl.bind(this, url)),
      Promise.resolve()
    );
  },

  getJSessionId() {
    return new Promise((resolve, reject) => {
      const options = {
        url: 'https://webapp4.asu.edu/catalog/',
        followRedirect: false
      };

      request.get(options, (error, response) => {
        if (!response || !response.headers || !response.headers['set-cookie'] || error) {
          return reject(error);
        }

        const cookieString = _.reduce(
          response.headers['set-cookie'],
          (cookies, cookie) => cookie + cookies,
          ''
        );
        const id = cookieString.split('JSESSIONID=').pop().split(';').shift();
        const expirationDate = new Date(cookieString.split('expires=').pop().split(';').shift());
        resolve({ id, expirationDate });
      });
    });
  },

  // This will change at runtime
  jSessionId: null,

  scrapeHtml(html) {
    const $ = cheerio.load(html);
    const courseGroups = $('.grpOdd, .grpEven, .grpOddTitle, .grpEvenTitle');
    if (!courseGroups) {
      return [];
    }

    function normalizeText(text) {
      return text
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(/\t/g, '')
        .trim();
    }

    // Need to use the context given by cheerio, thus no arrow function
    return courseGroups.map(function () {
      const location = normalizeText($('.locationBuildingColumnValue a', this).text()); // eslint-disable-line
      return {
        courseNumber: normalizeText($('.classNbrColumnValue a', this).text()),
        course: normalizeText($('.subjectNumberColumnValue', this).text()),
        title: normalizeText($('.titleColumnValue a', this).text()),
        dates: normalizeText($('.startDateColumnValue span a', this).text()),
        days: normalizeText($('.dayListColumnValue', this).text()),
        startTime: normalizeText($('.startTimeDateColumnValue', this).text()),
        endTime: normalizeText($('.endTimeDateColumnValue', this).text()),
        location: normalizeText($('.locationBuildingColumnValue a', this).text())
          || normalizeText($('.locationBuildingColumnValue span', this).text())
          || normalizeText($('.locationBuildingColumnValue', this).text()),
        instructor: normalizeText(
          $('.instructorListColumnValue span span span span a span', this).text()
        ),
        availableSeats: normalizeText($('.availableSeatsColumnValue tr td', this)
          .text().split('of').shift()),
        totalSeats: normalizeText(
          $('.availableSeatsColumnValue tr td', this).text().split('of').pop()
        )
      };
    });
  },

  sendASUOnlineRequest(config, courses) {
    const asuOnlineConfig = _.clone(config);
    asuOnlineConfig.headers.cookie = `${config.headers.cookie} ${asuOnlineCookie}`;

    return this.sendRequest(asuOnlineConfig, courses)
      .then(_courses => {
        console.log(`ASU Online courses scraped. Accumulated course count: ${_.size(_courses)} `);
        return _courses;
      });
  },

  sendInPersonOrICourseRequest(config, courses) {
    const inPersonOrICourseConfig = _.clone(config);
    inPersonOrICourseConfig.headers.cookie =
      `${config.headers.cookie} ${inPersonOrICourseCookie}`;

    return this.sendRequest(inPersonOrICourseConfig, courses)
      .then(_courses => {
        console.log(
          `In person and ICourses scraped. Accumulated course count: ${_.size(_courses)}`
        );
        return _courses;
      });
  },

  sendRequest(config, courses) {
    return new Promise((resolve, reject) => {
      const _this = this;
      request(config, (err, res, html) => {
        if ((err && err.code === 'ETIMEDOUT') || !html) {
          config.timeout += 1000;
          console.log(`Retrying ${config.url} with a ${config.timeout}ms timeout...`);
          return this.sendRequest(config, courses);
        }
        else if (err) {
          reject(err);
        }

        let scrapedCourses;
        try {
          scrapedCourses = _this.scrapeHtml(html);
        }
        catch (error) {
          return this.sendRequest(...arguments);
        }
        const nonDuplicateCourses = _.filter(scrapedCourses, scrapedCourse =>
          !_.find(courses, c => c.courseNumber === scrapedCourse.courseNumber)
        );
        courses.push.apply(courses, nonDuplicateCourses);
        resolve(courses);
      });
    });
  },

  sendRequests(config, courses, resolve, reject) {
    this.sendInPersonOrICourseRequest(config, courses)
      .then((_courses) => this.sendASUOnlineRequest(config, _courses))
      .then(resolve)
      .catch(reject);
  }
};

module.exports = asu;
