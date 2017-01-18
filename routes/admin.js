var express = require('express')
var passport = require('passport')
var slugify = require('slug')
var moment = require('moment')
var path = require('path')
var Async = require('async')
var Converter = require("csvtojson").Converter
var converter = new Converter({})
var Location = require('../models/location')
var Log = require('../models/log')

slugify.defaults.modes['pretty'] = {
  replacement: '-',
  symbols: true,
  remove: /[.]/g,
  lower: true,
  charmap: slugify.charmap,
  multicharmap: slugify.multicharmap
}


/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

module.exports = function (app, passport) { 
  app.get('/admin/', function(req, res, next) {  
    var db = req.db
    var locations = []
    return Location.find({}, {}, function (err, locations) {
      if (err) {
        return res.render('/')
      } else {
        return res.render('admin/index', {
          locations: locations,
          scripts: ['admin'],
          styles: ['admin'],
          errs: err
        })
      }  
    })
  })

  app.get('/admin/signup', function(req, res) {
    if(req.user)
      return res.redirect('/admin/edit')
    return res.render('admin/edit', {
      styles: ['admin'],
      action: 'create',
      errs: res.locals.errs || null
    })
  })

  app.post('/admin/create', function(req, res, next) {
    var data = req.body
    if(data.password != data.confirmPassword) {
      console.log('Passwords do not match.')
      return res.redirect('/admin/signup')
    }
    var location = new Location(data)
    Location.register(location, data.password, function(err, location) {
      if (err) {
        console.log('Error on signup: ', err.message)
        res.locals.errs = err.message
        res.redirect('/admin/signup')
      } else {
        console.log('Location created', location)
        req.logIn(location, function(err) {
          return res.redirect('/admin/edit')
        })
      }
    })
  })

  app.get('/admin/edit/', isLoggedIn, function(req, res, next) {  
    var slug = req.params.slug
    var location = req.user
    res.redirect('/admin/edit/'+location.slug)
  })

  app.get('/admin/edit/:slug', isLoggedIn, function(req, res, next) {  
    var slug = req.params.slug
    var location = req.user
    Async.waterfall([
      function(callback) {
        Location.findOne({slug: slug}, function(err, location) {
          if(err) {
            callback(err)
          } else {
            callback(null, location)
          }
        })
      },
      function(location, callback) {
        Log.find({location: location._id}).sort({date:1}).exec(function(err, logs) {
          logs.sort(function (b, a) {
            return moment.utc(a.date).diff(moment.utc(b.date))
          })
          if(err) {
            callback(err)
          } else {
            return res.render('admin/edit', {
              loc: location,
              logs: logs,
              scripts: ['moment', 'admin'],
              styles: ['admin'],
              action: 'update',
            })
          }
        })
      }
    ])
  })

  app.post('/admin/update/:id', function(req, res) {
    var data = req.body
    var type = req.params.type
    var id = req.params.id
    var errs
    data.username = data.email
    if(data.name) {
      var slug = slugify(data.name, {lower: true})
      data.slug = slug
    }
    Location.findOneAndUpdate({_id: id}, data, {new: true, runValidators: true}, function(err, location) {
      if(err) {
        console.log('Error on user update', err)
        res.render('admin/edit.pug', {
          errs: err,
          location: location,
          action: 'update'
        })
      } else {
        if(data.password) {
          if(data.password != data.confirmPassword) {
            console.log('Passwords do not match.')
            return res.redirect('/admin/edit/'+slug)
          }
          location.setPassword(data.password, function(err) {
            if (err) {
              console.log('Error on password update', err)
              return res.redirect('/admin/edit/'+slug)
            }
            location.save(function(err){
              if(err)
                console.log('Error on user update', err)
              req.session.save(function (err) {
                if (err) {
                  console.log('Error on user session save', err)
                  return next(err)
                }
                console.log('Updated location', location)
                return res.redirect('/admin/edit/'+slug)
              })
            })
          })
        } else {
          location.save(function(err){
            if(err)
              console.log('Error on user update', err)
            req.session.save(function (err) {
              if (err) {
                console.log('Error on user session save', err)
                return next(err)
              }
              console.log('Updated location', location)
              return res.redirect('/admin/edit/'+slug)
            })
          })
        }
      }
    })
  })

  app.delete('/admin/delete/log/:id', function(req, res) {
    var id = req.params.id
    Log.remove({ '_id' : id }, function(err, log) {
      console.log()
      res.send((err === null) ? { msg: log } : { msg:'err: ' + err })
    })
  })

/////////////////////////////////////////////////////////////////
//////////////////////////////LOGS///////////////////////////////
//////////////////////////////LOGS///////////////////////////////
//////////////////////////////LOGS///////////////////////////////
//////////////////////////////LOGS///////////////////////////////
/////////////////////////////////////////////////////////////////


  app.post('/admin/create/log/:location', function(req, res, next) {
    var location = req.params.location
    var data = req.body
    Location.findOne({_id: location}, function(err, location) {
      if(err) {
        return next(err)
      } else {
        var date = datify(data.month, data.day, data.year)
        data.date = date
        data.dateDisplay = moment(date).format('MMMM Do, YYYY')
        data.createdAt = moment().toJSON()
        data.updatedAt = moment().toJSON()
        data.location = location._id
        var log = new Log(data)
        log.save({new: true}, function(err, object) {
          res.send(
            (err === null) ? { msg: '' } : { msg: err }
          )
        })
      }
    })
  })

  app.post('/admin/update/log/:id', function(req, res, next) {
    var id = req.params.id
    var data = req.body
    var date = datify(data.month, data.day, data.year)
    data.dateDisplay = moment(date).format('MMMM Do, YYYY')
    data.updatedAt = moment().toJSON()
    Log.findOneAndUpdate({_id: id}, data, {new: true, runValidators: true}, function(err, log) {
      if(err) {
        return next(err)
      } else {
        res.send(
          (err === null) ? { msg: log } : { msg: err }
        )
      }
    })
  })

  app.post('/admin/delete/log/:id', function(req, res, next) {
    var id = req.params.id
    Log.remove({ '_id' : id }, function(err, log) {
      res.send((err === null) ? { msg: log } : { msg:'err: ' + err })
    })
  })

/////////////////////////////////////////////////////////////////
/////////////////////////////LOGIN///////////////////////////////
/////////////////////////////LOGIN///////////////////////////////
/////////////////////////////LOGIN///////////////////////////////
/////////////////////////////LOGIN///////////////////////////////
/////////////////////////////////////////////////////////////////

  app.get('/admin/login', function(req, res, next) {
    res.render('admin/login', {
      scripts: ['admin'],
      styles: ['admin']
    })
  })

  app.post('/admin/login', function(req, res, next) {
    passport.authenticate('local', function(err, user) {
      console.log('Logging in', err, user)
      if (err) {
        console.log('Error on login (authenticate)', err)
        return next(err)
      }
      if (!user) {
        console.log(user + ' is not a user')
        return res.redirect('/admin/login')
      }
      req.logIn(user, function(err) {
        if (err) {
          console.log('Error on login', err)
          return next(err)
        }
        return res.redirect('/admin/edit')
      });
    })(req, res, next)
  })


  app.get('/admin/logout', function(req, res) {
    req.logout()
    req.session.save(function (err) {
      if (err) {
        return next(err)
      }
      res.redirect('/')
    })
  })
}

function importCsv() {
  converter.on("end_parsed", function (csv) {
    var slug = 'purchase-college'
    Location.findOne({slug: slug}, function(err, location) {
      data = []
      for(var i = 0; i < csv.length; i++) {
        dateStr = csv[i].date
        date = moment(dateStr, 'YYYY MM DD')
        data[i] = {
          scraps: csv[i].scraps,
          browns: csv[i].browns,
          compost: csv[i].compost,
          date: date.toJSON(),
          month: date.get('M')+1,
          day: date.get('D'),
          year: date.get('Y'),
          createdAt: moment().toJSON(),
          updatedAt: moment().toJSON(),
          dateDisplay: moment(date).format('MMMM Do, YYYY'),
          location: location.id
        }
        var log = new Log(data[i])
        log.save({new: true}, function(err, object) {
          // console.log(object)
        })
      }
    })
  })
  require("fs").createReadStream("./pclogs.csv").pipe(converter)
}

var isLoggedIn = function(req, res, next) {
  if(req.isAuthenticated())
    return next();
  res.redirect('/admin/login');
}

var datify = function(month, day, year) {
  var dateString = year+' '+month+' '+day
  var dateObject = moment(dateString, 'YYYY M D').toISOString()
  return dateObject
}
