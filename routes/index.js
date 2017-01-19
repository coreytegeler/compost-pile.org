var express = require('express');
var Async = require('async')
var Location = require('../models/location')
var Log = require('../models/log')

module.exports = function (app) { 
  app.get('/', function(req, res, next) {
    slug = 'purchase-college'
    Async.waterfall([
      function(callback) {
        Location.findOne({slug: slug}, {}, function (err, location) {
          if(err) {
            callback(err)
          } else {
            callback(null, location)
          }
        })
      }, function(location, callback) {
        Log.find({location: location._id}).sort({date:-1}).exec(function (err, logs) {
          if (err) {
            res.render('error', {
              error: err,
              styles: ['public']
            });
          } else {
            location.what = location.what.replace(/(?:\r\n|\r|\n)/g, '<br />')
            location.who = location.who.replace(/(?:\r\n|\r|\n)/g, '<br />')
            location.how = location.how.replace(/(?:\r\n|\r|\n)/g, '<br />')
            location.compostable = location.compostable.replace(/(?:\r\n|\r|\n)/g, '<br />')
            location.dropoff = location.dropoff.replace(/(?:\r\n|\r|\n)/g, '<br />')
            res.render('index', {
              pageType: 'single',
              location: location,
              logs: logs,
              scripts: ['paper','moment','public'],
              styles: ['public'],
              errors: err
            })
          } 
        }) 
      }
    ])
  })

  app.get('/logs/:id', function(req, res) {
    var id = req.params.id
    Log.find({location: id}).sort({date:1}).exec(function(e, logs) {
      if(logs)
        res.json(logs)
    })
  })
}