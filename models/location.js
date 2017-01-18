var mongoose = require('mongoose')
var passportLocalMongoose = require('passport-local-mongoose')
var slugify = require('slug')

var LocationSchema = mongoose.Schema({
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
	username: String,
	slug: String
}, { 
	timestamps: true
});

LocationSchema.pre('save', function(next) {
	this.username = this.email
	this.slug = slugify(this.name, {lower: true})
  next();
});

LocationSchema.plugin(passportLocalMongoose, {
	usernameField: 'email',
  usernameQueryFields: ['email'],
  usernameLowerCase: true
});

module.exports = mongoose.model('Location', LocationSchema);