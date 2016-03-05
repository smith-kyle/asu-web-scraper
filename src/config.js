const fs = require('fs');
const path = require('path');

const configFilePath = path.join(__dirname, '..', 'json', 'config.json');
const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

module.exports = config;
