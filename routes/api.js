var express = require('express');
var Async = require('async')
var Location = require('../models/location')
var Log = require('../models/log')

module.exports = function (app) {
  app.get('/api/location', function(req, res, next) {
    var slug = req.query.slug
    if(slug) {
      var query = {slug: slug}
    } else {
      var query = {}
    }
    Location.find(query).sort({name:-1}).exec(function (err, locations) {
      if (err) {
        res.json(err)
      } else {
        res.json(locations)
      } 
    }) 
  })

  app.get('/api/logs/:id', function(req, res) {
    var id = req.params.id
    Log.find({location: id}).sort({date:1}).exec(function(e, logs) {
      var recentLogs = []
      var latestYear = 0
      var latestMonth = 0
      for(var i = 0; i < logs.length; i++) {
        var log = logs[i]
        if (log.month >= latestMonth) {
          latestMonth = log.month
          if (log.year >= latestYear) {
            latestYear = log.year
          }
        }
      }
      for(var i = 0; i < logs.length; i++) {
        var log = logs[i]
        if(log.month == latestMonth && log.year == latestYear) {
          recentLogs.push(log)
        }
      }
      var data = {
        'date': latestMonth+'/'+latestYear,
        'logs': recentLogs
      }
      res.json(data)
    })
  })

  app.get('/api/logs/:id/:month/:year', function(req, res) {
    var id = req.params.id
    var month = req.params.month
    var year = req.params.year
    console.log(month, year)
    Log.find({location: id, month: month, year: year}).sort({date:1}).exec(function(e, logs) {
      if(logs)
        res.json(logs)
    })
  })
}