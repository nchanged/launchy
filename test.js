module.exports = {
   script: 'app.js',
   name: 'my-test',
   port: 3000,
   attempts: 5,
   logs: __dirname + "/logs/",
   env: {
      nodeVersion: "4.2.0",
      NODE_ENV: "production"
   }
}
