#!/usr/bin/env node
/*
  Automatically grade files for the presence of specified HTML tags/attributes.
  Uses commander.js and cheerio. Teaches command line application development
  and basic DOM parsing.

  References:

  + cheerio
  - https://github.com/MatthewMueller/cheerio
  - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
  - http://maxogden.com/scraping-with-node.html

  + commander.js
  - https://github.com/visionmedia/commander.js
  - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  + JSON
  - http://en.wikipedia.org/wiki/JSON
  - https://developer.mozilla.org/en-US/docs/JSON
  - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');

var HTMLFILE_DEFAULT = "index.html";
var TEMP_FILE = "temp.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var startGrading = function (htmlfile, checks) {
    var checkJson = checkHtmlFile(htmlfile, checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks ', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file ', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
        .option('-u, --url <URL>', 'URL to process')
        .parse(process.argv);

    var fileToCheck;
    if (program.url) {
        fileToCheck = TEMP_FILE;

        fs.writeFileSync(fileToCheck);
        rest.get(program.url).on('complete', function(result) {
            if (result instanceof Error) {
                console.log('Error: ' + result.message);
                this.retry(5000); // try again after 5 sec
            } else {
                fs.writeFileSync(fileToCheck, result);
                startGrading(fileToCheck, program.checks);
            }
        });

    } else {
        startGrading(program.file, program.checks);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
