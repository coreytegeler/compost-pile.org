var mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose')
var slugify = require('slug')

var locationSchema = mongoose.Schema({
	name: {
		type: String
	},
	dropoff: String,
	what: String,
	who: String,
	how: String,
	compostable: String,
	email: {
		type: String
	},
	username: String
}, { 
	timestamps: true
});

locationSchema.pre('save', function(next) {
	this.username = this.email
	this.slug = slugify(this.name)
  next();
});

locationSchema.plugin(passportLocalMongoose, {
	usernameField: 'email',
  usernameQueryFields: ['email'],
  usernameLowerCase: true
});

module.exports = mongoose.model('Location', locationSchema);