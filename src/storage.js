"use strict";

const path = require("path");
const mkdirp = require('mkdirp');
const fs = require("fs");

const _home = process.env.HOME || process.env.USERPROFILE;
const _config_folder = path.join(_home, '.launchy');
const _projects_folder = path.join(_config_folder, 'projects');
const _settings = path.join(_config_folder, 'settings.json');

/**
 * Storage class
 */
class Storage {
   constructor() {
      // initialize folders
      // Make sure we have them
      mkdirp(_config_folder);
      mkdirp(_projects_folder);
      this.initSettings();
   }

   /**
    * saveProject - Saving project settings into a folder
    * @param  {type} name project name
    * @param  {type} obj  project data
    */
   saveProject(name, obj) {
      this.saveJSON(path.join(_projects_folder, name + '.json'), obj);
   }

   getProjects() {
      var files = fs.readdirSync(_projects_folder);
      var projects = [];
      for (var i in files) {
         var filePath = path.join(_projects_folder, files[i]);
         projects.push(this.readJSON(filePath));
      }
      return projects;
   }

   /**
    * initSettings - initialize settings
    * Reads settings from a file and stores it into "this.settings"
    */
   initSettings() {
      this.settings = this.readJSON(_settings);
   }

   /**
    * readJSON - reading JSON from a file
    *
    * @param  {string}
    * @return {object}  javascript object
    */
   readJSON(f) {
      if (!fs.existsSync(f)) {
         fs.writeFileSync(f, '{}');
      }
      return JSON.parse(fs.readFileSync(f).toString());
   }

   /**
    * saveJSON - saves object to files§
    *
    * @param  {string} f   string path
    * @param  {obj} obj javscript object
    */
   saveJSON(f, obj) {
      let json = JSON.stringify(obj, 2, 2);
      if (!fs.existsSync(f)) {
         return fs.writeFileSync(f, json);
      }
      return fs.writeFileSync(f, json);
   }

   /**
    * set - sets key and value
    *
    * @param  {type} key   key
    * @param  {type} value value
    */
   set(key, value) {
      this.settings[key] = value;
   }

   /**
    * get - gets a key from settings
    *
    * @param  {string} key string key
    * @return {obj}  javascript object
    */
   get(key, d) {
      return this.settings[key] !== undefined ? this.settings[key] : d;
   }

   save() {
      this.saveJSON(_settings, this.settings);
   }

}

module.exports = new Storage();
