"use strict";

const path = require('path');
const fs = require('fs');
const storage = require('./storage.js');
const daemon = require('./daemon.js');
const logger = require('./log.js');
const realm = require("realm-js")
const readline = require('readline');
const os = require("os");

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

   static setup() {

      class Setup {
         initialize() {
               logger.detail("--> Make sure you are running as sudo");
               logger.detail("--> Updating /etc/rc.local");
               this.autostartFile = "/etc/rc.local";
            }
            // make sure we are on the right system
         checkFileExists() {
               var fileExists = fs.existsSync(this.autostartFile);
               if (!fileExists) {
                  throw {
                     message: this.autostartFile + " does not exist!"
                  }
               }
            }
            // Spits and error if the file is not writable
         checkWritabilty() {
            fs.accessSync(this.autostartFile, fs.W_OK);
         }

         // reading contents
         setContent() {
            return fs.readFileSync(this.autostartFile).toString();
         }

         // Asking user about scripts' userName
         // What user should we be launching as?
         setUserName() {
            const rl = readline.createInterface({
               input: process.stdin,
               output: process.stdout
            });
            let defaultUserName = "jenkins";

            return new Promise((resolve, reject) => {
               rl.question('    User (' + defaultUserName + '): ', (answer) => {
                  rl.close();
                  return resolve(answer || defaultUserName)
               });
            });
         }

         // Modify /etc/rc.local
         modifyContents() {
            var line = "sudo su " + this.userName + " -c \"launchy restore &\"";
            logger.info(line)
            if (!this.content.match(line)) {
               logger.info("File update requires")
               var lines = this.content.split('\n');
               lines.splice(1, 0, line);
               fs.writeFileSync(this.autostartFile, lines.join('\n'))
               logger.success("Modified!")
            } else {
               logger.info("File is modified already!");
            }

         }

      }
      return realm.chain(Setup).then(function() {

      }).catch(function(e) {
         if (e.message) {
            logger.error(e.message)
         }
      });
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
