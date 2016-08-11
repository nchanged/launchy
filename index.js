#!/usr/bin/env node

const Launcher = require("./src/launcher.js");

var argv = process.argv;
var procedure = argv[2];

/**
 Start
**/
if (procedure === "start") {
   Launcher.start();
}

if (procedure === "setup") {
   Launcher.setup();
}

if (procedure === "restore") {
   Launcher.restore();
}

module.exports = Launcher;
