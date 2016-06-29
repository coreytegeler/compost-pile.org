var express = require('express')
var passport = require('passport')
var slugify = require('slug')
var moment = require('moment')
var path = require('path')
var Converter = require("csvtojson").Converter
var converter = new Converter({})
var Location = require('../models/location')

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

  app.get('/admin/signup', function(req, res) {
    if(req.user)
      return res.redirect('/admin/profile')
    return res.render('admin/edit', {
      styles: ['admin'],
      action: 'create'
    })
  })

  app.post('/admin/location/create', function(req, res, next) {
    var data = req.body
    if(data.password != data.confirmPassword) {
      console.log('Passwords do not match.')
      return res.redirect('/admin/signup')
    }
    console.log(data)
    Location.register(
      new Location({
        name: data.name,
        email: data.email.toLowerCase(),
        username: data.email.toLowerCase(),
        dropoff: data.dropoff,
        what: data.what,
        who: data.who,
        how: data.how,
        compostable: data.compostable
      }), data.password, function(error, location) {
        console.log(error, location)
        if (error) {
          console.log('Error on signup', error)
          return next(error)
        }
        console.log('Location created', location)
        req.logIn(location, function(error) {
          if (error) {
            console.log('Error on login', error)
            return res.redirect('/admin/login')
          }
          return res.redirect('/admin/edit')
        })
      })
  })

  app.get('/admin/edit', isLoggedIn, function(req, res, next) {  
    var db = req.db
    var slug = req.params.slug
    var location = req.user
    return res.render('admin/edit', {
      loc: location,
      scripts: ['moment', 'admin/edit'],
      styles: ['admin'],
      action: 'update',
    })
  })

  app.post('/admin/location/update/:id', function(req, res) {
    var data = req.body
    var type = req.params.type
    var id = req.params.id
    var errors
    data.username = data.email
    if(data.name) {
      var slug = slugify(data.name, {lower: true})
      data.slug = slug
    }
    User.findOne({_id: id}, function(error, location) {
      if(error) {
        console.log('Error on user update', error)
        res.render('admin/edit.pug', {
          errors: error,
          location: location,
          action: 'update'
        })
      } else {
        if(data.password != data.confirmPassword) {
          console.log('Passwords do not match.')
          return res.redirect('/admin/'+slug)
        }
        location.setPassword(data.password, function(error) {
          if (error) {
            console.log('Error on password update', error)
            return res.redirect('/admin/'+slug)
          }
          location.save(function(error){
            if(error)
              console.log('Error on user update', error)
            req.session.save(function (error) {
              if (error) {
                console.log('Error on user session save', error)
                return next(error)
              }
              console.log('Updated location', location)
              return res.redirect('/admin/'+slug)
            })
          })
        })
      }
    })
  })

  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////


  app.get('/admin/', function(req, res, next) {  
    var db = req.db
    var collection = db.get('locations')
    var locations = []
    return collection.find({}, {}, function (err, locationsDoc) {
      for (var i=0; i<locationsDoc.length; i++) {
        var slug = locationsDoc[i].slug
        var name = locationsDoc[i].name
        var location = {}
        location.slug = slug
        location.name = name
        locations.push(location)
      }
      if (err) {
        return res.render('/')
      } else {
        return res.render('admin/index', {
          locations: locations,
          scripts: ['admin/index'],
          styles: ['admin'],
          errors: err
        })
      }  
    })
  })
  // Find all records from 'locations' collection in database
  app.get('/admin/data', function(req, res) {
  	var db = req.db
  	var collection = db.get('locations')
  	collection.find({},{},function(e, location) {
  		res.json(location)
  	})
  })

  // Find single record from 'locations' collection in database with given slug
  app.get('/admin/data/:slug', function(req, res) {
    var db = req.db
    var collection = db.get('locations')
    var slug = req.params.slug
    collection.findOne({'slug':slug},{},function(e, location) {
      res.json(location)
    })
  })

  app.get('/admin/login', function(req, res, next) {
    res.render('admin/login', {
      scripts: ['admin/login'],
      styles: ['admin']
    })
  })

  app.post('/admin/login', function(req, res, next) {
    passport.authenticate('local', function(error, user, info) {
      console.log('Logging in', error, user, info)
      if (error) {
        console.log('Error on login (authenticate)', error)
        return next(error)
      }
      if (!user) {
        console.log(user + ' is not a user')
        return res.redirect('/admin/login')
      }
      req.logIn(user, function(err) {
        if (error) {
          console.log('Error on login', error)
          return next(error)
        }
        return res.redirect('/admin/edit')
      });
    })(req, res, next)
  })


  app.get('/admin/logout', function(req, res) {
    req.logout()
    req.session.save(function (error) {
      if (error) {
        return next(error)
      }
      res.redirect('/')
    })
  })



  // app.get('/new', function(req, res, next) {
  //   res.render('admin/new', {
  //     title: 'New Location',
  //     scripts: ['admin/new'],
  //     styles: ['admin']
  //   })
  // })

  // app.post('/create/location', function(req, res) {
  //   var db = req.db
  //   var collection = db.get('locations')
  //   var data = req.body
  //   data.slug = slug(data.name)
  //   collection.insert(data, function(error, location) {
  //     if(error) {
  //       res.render('admin/new', {
  //         error: error
  //       })
  //     } else {
  //       return res.redirect('/admin/'+location.slug)
  //     }
  //   })
  // })

  // app.post('/update/location/:id', function(req, res) {
  //     var db = req.db
  //     var collection = db.get('locations')
  //     var id = req.params.id
  //     var data = req.body
  //     // data.slug = slug(req.body.name)
  //     data.slug = 'purchase-college'
  //     collection.update({'_id':id}, data, function(err, result){
  //         console.error(err)
  //         res.send(
  //             (err === null) ? { msg: '' } : { msg: err }
  //         )
  //     })
  // })

  app.delete('/admin/delete/location/:id', function(req, res) {
      var db = req.db
      var collection = db.get('locations')
      var id = req.params.id
      collection.remove({ '_id' : id }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err })
      })
  })


  function importCsv(db, collection, slug) {
    converter.on("end_parsed", function (json) {
      var slug = 'purchase-college'
      var data = json
      for(var i = 0; i< data.length; i++) {
        var date = data[i].date.split(/\//g)
        var m = date[0]
        var d = date[1]
        var y = date[2]
        var validDate = y+' '+m+' '+d
        var ISODate = moment(validDate, "YYYY MM DD").toISOString()
        data[i].date = ISODate
        data[i].createdAt = moment().toJSON()
        data[i].updatedAt = moment().toJSON()
      }
      var collectionName = slug.replace(/-/g, '_') + '_logs'
      var collectionLogs = db.get(collectionName)
      collectionLogs.insert(data, function(err, result){
        
      })
    })
     
    require("fs").createReadStream("./data.csv").pipe(converter)
  }


  app.get('/admin/logs/:slug', function(req, res) {
    var slug = req.params.slug
    var collectionName = slug.replace(/-/g, '_') + '_logs'
    var db = req.db
    var collection = db.get(collectionName)
    collection.find({}, {sort: {'date': -1}}, function(e, location) {
      res.json(location)
    })
  })

  app.post('/admin/create/log/:slug', function(req, res) {
    var slug = req.params.slug
    var collectionName = slug.replace(/-/g, '_') + '_logs'
    var db = req.db
    var collection = db.get(collectionName)
    var data = req.body
    data.createdAt = moment().toJSON()
    data.updatedAt = moment().toJSON()
    collection.insert(data, function(err, result){
      res.send(
          (err === null) ? { msg: '' } : { msg: err }
      )
    })
  })

  app.post('/admin/update/log/:slug/:id', function(req, res) {
    var id = req.params.id
    var slug = req.params.slug
    var collectionName = slug.replace(/-/g, '_') + '_logs'
    var db = req.db
    var collection = db.get(collectionName)
    var data = req.body
    data.updatedAt = moment().toJSON()
    collection.update({'_id':id}, data, function(err, result){
      res.send(
          (err === null) ? { msg: '' } : { msg: err }
      )
    })
  })

  app.delete('/admin/delete/log/:slug/:id', function(req, res) {
    var slug = req.params.slug
    var id = req.params.id
    var collectionName = slug.replace(/-/g, '_') + '_logs'
    var db = req.db
    var collection = db.get(collectionName)
    collection.remove({ '_id' : id }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err })
    })
  })

}

var isLoggedIn = function(req, res, next) {
  if(req.isAuthenticated())
    return next();
  res.redirect('/admin/login');
}