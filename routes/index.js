var express = require('express')
var Location = require('../models/location')
module.exports = function (app) { 
  // GET home page view
  app.get('/', function(req, res, next) {
    Location.find({}, function(error, locations) {
      if(error) {
        console.log('Error finding locations', error)
        return send(error)
      }
      res.render('index.pug', {
        data: locations,
        styles: ['public'],
        scripts: ['moment', 'paper', 'tools', 'main', 'graph']
      })
    })
  })

}