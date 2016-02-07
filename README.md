# asu-web-scraper
Node web scraper that collects ASU course information.

## How to
After [installing mongo](https://docs.mongodb.org/manual/installation/) run the following
```
git clone https://github.com/smith-kyle/asu-web-scraper
cd asu-web-scraper
npm install
npm start
```
asu-web-scraper will create a mongo database named `asu` with a collection named `courses`. Each course in the collection will have the following structure:

```
{
  "_id" : ObjectId("56b6dc81a4a0200510dfc877"),
  "courseNumber" : "12800",
  "course" : "AST 114 (LAB)",
  "title" : "Astronomy Laboratory II",
  "dates" : "01/11 - 04/29(C)",
  "days" : "T",
  "startTime" : "8:30 PM",
  "endTime" : "11:00 PM",
  "location" : "Tempe - PSH461",
  "instructor" : "Windhorst",
  "availableSeats" : "0",
  "totalSeats" : "24"
}
```
