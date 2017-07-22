var express = require('express');
var Async = require('async')
var Location = require('../models/location')
var Log = require('../models/log')

module.exports = function (app) {

  app.get('/', function(req, res, next) {
    slug = req.query.slug
    res.render('index', {
      template: 'home',
      scripts: ['paper','moment','public'],
      styles: ['public']
    })
  })

  app.get('/:slug', function(req, res, next) {
    var slug = req.params.slug
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
            res.render('single', {
              template: 'single',
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
}