"use strict";

const path = require('path');
const fs = require('fs');
const storage = require('./storage.js');
const daemon = require('./daemon.js');
const logger = require('./log.js');

class Launcher {
   static restore() {
      let projects = storage.getProjects();
      logger.detail(">> Restoring projects %s", projects.length);
      console.log('');
      for (let p in projects) {
         var cfg = projects[p];
         daemon.start(cfg, {
            log: false,
            portCheck: false
         }).catch(function(e) {
            console.log(e.stack)
         })
      }
   }

   static start() {
      var argv = process.argv;
      let target = argv[3];

      if (!target) {
         logger.fatal("Please, provide configuration");
         return;
      }
      let workingDir = process.cwd();
      if (target[0] !== "/") {
         target = path.join(workingDir, target)
      }
      if (!fs.existsSync(target)) {
         logger.fatal("File was not found %s", target);
         return;
      }
      let projectDir = path.dirname(target);
      // Require target script
      let cfg = require(target)

      // Main script (e.g app.js)
      if (!cfg.script) {
         return logger.fatal("Script is required. e.g {script : 'app.js'}");
      }
      // Name is required
      if (!cfg.name) {
         return logger.fatal("name is required. e.g {name : 'hello'}");
      }
      // autostart (self script)
      cfg.autostart = target;

      cfg.script = cfg.script[0] === "/" ? cfg.script : path.join(projectDir, cfg.script);

      // saving current configuration for later launch (when restoring)
      storage.saveProject(cfg.name, cfg);
      daemon.start(cfg);
   }
}

module.exports = Launcher;
