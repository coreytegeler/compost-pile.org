var mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose')
var slugify = require('slug')

var logSchema = mongoose.Schema({
	compost: String,
	scraps: String,
	date: Date,
	comment: String
}, { 
	timestamps: true
});

var locationSchema = mongoose.Schema({
	name: {
		type: String
	},
	text: String,
	email: {
		type: String
	},
	username: String,
	slug: String,
	logs: [logSchema]
}, { 
	timestamps: true
});

locationSchema.pre('save', function(next) {
	this.username = this.email
  next();
});

locationSchema.plugin(passportLocalMongoose, {
	usernameField: 'email',
  usernameQueryFields: ['email'],
  usernameLowerCase: true
});

module.exports = mongoose.model('Location', locationSchema);