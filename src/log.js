const vsprintf = require('sprintf').vsprintf;
const sliced = require("sliced");

const colors = {
   HEADER: '\033[45m',
   OKBLUE: '\033[94m',
   OKGREEN: '\033[92m',
   WARNING: '\033[93m',
   RED: '\033[41m',
   GRAY: '\033[37m',
   BROWN: '\033[33m',
   MAGENTA: '\033[45m',
   SETTING: '\033[1m',
   FAIL: '\033[91m',
   ENDC: '\033[0m',
   BOLD: '\033[1m',
   UNDERLINE: '\033[4m'
}

module.exports = {
   _print: function(str, args) {
      console.log(vsprintf(str, args || []));
   },
   important: function(str) {
      this._print("  " + colors.HEADER + str + colors.ENDC, sliced(arguments, 1));
   },
   success: function(str) {
      this._print("    " + colors.OKGREEN + str + colors.ENDC, sliced(arguments, 1));
   },
   action: function(str) {
      this._print("  " + colors.BOLD + str + colors.ENDC, sliced(arguments, 1));
   },
   info: function(str) {
      this._print("    " + colors.GRAY + str + colors.ENDC, sliced(arguments, 1));
   },

   bash: function(str) {
      this._print("    " + colors.GRAY + str + colors.ENDC, sliced(arguments, 1));
   },
   highlight: function(str) {
      this._print("    " + colors.UNDERLINE + str + colors.ENDC, sliced(arguments, 1));
   },
   setting: function(str) {
      this._print("     " + str, sliced(arguments, 1));
   },
   detail: function(str) {
      this._print("  " + colors.GRAY + str + colors.ENDC, sliced(arguments, 1));
   },
   error: function(str) {
      this._print("    " + colors.RED + str + colors.ENDC, sliced(arguments, 1));
   },
   warn: function(str) {
      this._print("    " + colors.WARNING + str + colors.ENDC, sliced(arguments, 1));
   }
}
