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

  app.get('/admin/edit', isLoggedIn, function(req, res, next) {  
    var db = req.db
    var slug = req.params.slug
    var location = req.user
    return res.render('admin/edit', {
      data: location,
      scripts: ['moment', 'tinymce/tinymce.min', 'tools', 'admin/edit'],
      styles: ['admin'],
      action: 'update',
    })
  })

  app.post('/admin/location/create', function(req, res, next) {
    var data = req.body
    if(data.password != data.confirmPassword) {
      console.log('Passwords do not match.')
      return res.redirect('/admin/signup')
    }
    if(data.slug) {
      var slug = slugify(data.slug)
    } else {
      var slug = slugify(data.name)
    }
    Location.register(
      new Location({
        name: data.name,
        email: data.email.toLowerCase(),
        username: data.email.toLowerCase(),
        slug: slug
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

  app.post('/admin/location/update/:id', function(req, res) {
    var data = req.body
    var type = req.params.type
    var id = req.params.id
    var errors
    data.username = data.email
    if(data.slug) {
      data.slug = slugify(data.slug)
    } else {
      data.slug = slugify(data.name)
    }
    Location.findOne({_id: id}, function(error, location) {
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
          return res.redirect('/admin/edit')
        }
        location.setPassword(data.password, function(error) {
          if (error) {
            console.log('Error on password update', error)
            return res.redirect('/admin/edit')
          }
          Location.update({_id: id}, data, {upsert: true}, function(error) {
            if(error)
              console.log('Error on user update', error)
            req.session.save(function (error) {
              if (error) {
                console.log('Error on user session save', error)
                return next(error)
              }
              console.log('Updated location', location)
              return res.redirect('/admin/edit')
            })
          })
        })
      }
    })
  })

  app.delete('/admin/delete/location/:id', function(req, res) {
    var id = req.params.id
    Location.findOneAndDelete({_id: id}, function(error, location) {
      if(error) {
        console.log('Error finding location to delete', error)
        return res.send({error: 'Error finding location to delete'})
      }
      return res.send({success: location.name + ' has been deleted'})
    });
  })


  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  ///////////////////////////////api///////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////

  app.get('/api/all', function(req, res) {
  	
  })

  app.get('/api/:slug', function(req, res) {
   
  })

  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  //////////////////////////////login//////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

  app.get('/admin/signup', function(req, res) {
    if(req.user)
      return res.redirect('/admin/edit')
    return res.render('admin/edit', {
      styles: ['admin'],
      action: 'create'
    })
  })

  app.get('/admin/login', function(req, res, next) {
    res.render('admin/login', {
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

  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////

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
    var data = req.body
    Location.findOne({slug: slug}, function(error, location) {
      if(error) {
        console.log('Error finding location', error)
        return res.send({error: 'Error finding location'})
      }
      location.logs.push(data)
      location.save(function(error) {
        if(error) {
          console.log('Error adding log', error)
          return res.send({error: 'Error adding log'})
        }
        return res.send({success: 'Log added'})
      });
    });
  })

  app.post('/admin/update/log/:slug/:id', function(req, res) {
    var slug = req.params.slug
    var id = req.params.id
    var data = req.body
    Location.findOneAndUpdate({slug: slug, 'logs._id': id}, {
      '$set': {
        'logs.$.scraps': data.scraps,
        'logs.$.compost': data.compost,
        'logs.$.date': data.date
      }
    }, function(error, location) {
      if(error) {
        console.log('Error updating log', error)
        return res.send({error: 'Error updating log'})
      }
      console.log(location)
      return res.send({success: 'Log updated'})
    });
  })

  app.delete('/admin/delete/log/:slug/:id', function(req, res) {
    var slug = req.params.slug
    var id = req.params.id
    var data = req.body
    Location.findOne({slug: slug}, function(error, location) {
      if(error) {
        console.log('Error finding location on log delete', error)
        return res.send({error: 'Error finding location on log delete'})
      }
      location.logs.id(id).remove();
      location.save(function(error) {
        if(error) {
          console.log('Error deleting log', error)
          return res.send({error: 'Error deleting log'})
        }
        return res.send({success: 'Log deleted'})
      });
    });
  })
}

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

var isLoggedIn = function(req, res, next) {
  if(req.isAuthenticated())
    return next();
  res.redirect('/admin/login');
}