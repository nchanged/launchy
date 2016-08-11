"use strict";

const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const fork = require('child_process').fork;
const logger = require('./log.js');
const moment = require('moment');
const path = require("path");
const mkdirp = require('mkdirp');
const fs = require("fs");
const realm = require('realm-js');

/**
 * Finding pids that match particular port
 */
let findPidsByPort = (port) => {
   return new Promise((resolve, reject) => {
      // Preventing google chrome from destroying itself...
      exec("lsof -c ^Google -ti :" + port, {}, function(error, stdout, stderr) {
         var pids = stdout.match(/(\d{1})/g);
         if (pids && pids.length > 0) {
            return resolve(pids);
         } else {
            return resolve([]);
         }
      });
   });
}

/**
 * Kill pids
 */
let kill = (pids) => {
   return new Promise((resolve, reject) => {
      exec("kill " + pids.join(' '), {}, function(error, stdout, stderr) {
         if (!error) {
            return reject(error);
         }
         return resolve();
      });
   });
}

let spawnProcess = (pName, opts, logs, specialEnv) => {
   let LOCAL_ENV = process.env;
   specialEnv = specialEnv || {};
   for (let key in specialEnv) {
      LOCAL_ENV[key] = specialEnv[key];
   }
   logger.highlight(pName + " " + opts)
   return spawn(pName, opts, {
      stdio: ['ignore', logs.out, logs.err],
      detached: true,
      env: LOCAL_ENV
   });
}

/**
 * ProjectLogs
 * Takes care of log rotation
 */
class ProjectLogs {
   constructor(cfg) {
      this.cfg = cfg;
   }

   // make sure all folders are in place
   setFolders() {
      var logsFolder = this.cfg.logs || "/var/log/launchy";
      var projectLogs = path.join(logsFolder, this.cfg.name);
      mkdirp.sync(projectLogs);
      var outFile = path.join(projectLogs, "logs.txt");
      var errFile = path.join(projectLogs, "error.txt");
      return {
         folder: projectLogs,
         errFile: errFile,
         outFile: outFile
      }
   }

   rotateLogs() {
      var out = this.folders.outFile;
      var err = this.folders.errFile;
      var folder = path.join(this.folders.folder, "archive", moment().format('MMMM-Do-YYYY'));
      mkdirp.sync(folder);
      if (fs.existsSync(out)) {
         var newFileName = "logs-" + moment().format('HH-mm-ss') + ".txt";
         var fullPath = path.join(folder, newFileName);
         fs.renameSync(out, fullPath);
      }
      if (fs.existsSync(err)) {
         var newFileName = "error-" + moment().format('HH-mm-ss') + ".txt";
         var fullPath = path.join(folder, newFileName);
         fs.renameSync(err, fullPath);
      }
   }

   setupCurrentLogs() {
      this.folders.out = fs.openSync(this.folders.outFile, 'a');
      this.folders.err = fs.openSync(this.folders.errFile, 'a');
   }

   format() {
      return this.folders;
   }
}

/**
 * PortChecker
 * realm chain that resolves true or false
 */
class PortChecker {
   constructor(cfg) {
      this.cfg = cfg;
      this.attempt = 0;
      this.max = this.cfg.attempts || 5;
   }
   initialize() {
      logger.info("Waiting for alive port %s", this.cfg.port);
   }

   ping() {
      var port = this.cfg.port;
      var name = this.cfg.name;
      var self = this;
      if (this.attempt === this.max) {
         return this.$break(false)
      }

      return findPidsByPort(port).then(pid => {
         if (pid.length) {
            logger.success("The app (%s) is running on port %s with pid (%s)", name, port, pid);
            return self.$break(true);
         } else {
            logger.info("#%s check port (%s) - not ready", self.attempt, port);
            self.attempt++;
            setTimeout(() => {
               self.ping()
            }, 1000);
         }
      });
   }
}

class Daemon {

   /**
    * static - Restoring configurations
    *
    * @param  {type} cfg  Object with configurations
    * @param  {type} opts Additions options
    * @return {Promise}
    */
   static start(cfg, opts) {
      opts = opts || {};
      class Start {
         initialize() {
            logger.action("Launch %s at %s", cfg.name, cfg.script);
         }
         setPids() {
            return findPidsByPort(cfg.port);
         }

         needsKilling() {
            if (this.pids.length) {
               logger.warn("Port is busy %s", cfg.port);
               logger.warn("Found pids to kill " + this.pids);
               return kill(this.pids);
            }
         }

         setLogs() {
            return realm.chain(new ProjectLogs(cfg));
         }

         spawnApplication() {
            logger.info("Logs folder %s", this.logs.folder);
            let ps;
            if (cfg.nodeVersion) {
               ps = spawnProcess("n", ["use", nodeVersion, cfg.script], this.logs, cfg.env || {});
            } else {
               ps = spawnProcess("node", [cfg.script], this.logs, cfg.env || {});
            }
            // if process is spawend
            if (ps && ps.pid) {
               ps.unref(); // background process
            }
         }

         setIsRunning() {
            return realm.chain(new PortChecker(cfg));
         }

         printError() {
            if (!this.isRunning) {
               logger.error("Application did not start!")
               var errLog = fs.readFileSync(this.logs.errFile).toString();
               throw {
                  error: 1
               }
            }
         }
      }
      return realm.chain(Start);
   }
}

module.exports = Daemon;
