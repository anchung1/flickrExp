var userMongoose = require('mongoose');

userMongoose.connect('mongodb://localhost/users1');
var userdb = userMongoose.connection;
userdb.on('error', function () {
    console.log('userMongoose connection error');
});

userdb.once('open', function () {
    console.log('userMongoose connection open');
});

var usersSchema = userMongoose.Schema({
    name: String,
    password: String,
    email: String
});
var Users = userMongoose.model('users1', usersSchema);

//========================================================

var doraMongoose = require('mongoose');

doraMongoose.connect('mongodb://localhost/dora');
var doradb = doraMongoose.connection;
doradb.on('error', function () {
    console.log('doraMongoose connection error');
});

doradb.once('open', function () {
    console.log('doraMongoose connection open');
});

var doraSchema = doraMongoose.Schema({
    name: String,
    occupation: String
});
var Dora = doraMongoose.model('dora', doraSchema);

//=========================================================
var entryMongoose = require('mongoose');

entryMongoose.connect('mongodb://localhost/entry');
var entrydb = entryMongoose.connection;
entrydb.on('error', function () {
    console.log('entryMongoose connection error');
});

entrydb.once('open', function () {
    console.log('entryMongoose connection open');
});

var entrySchema = entryMongoose.Schema({
    title: String,
    userID: String,
    data: String
});
var Entry = entryMongoose.model('entry', entrySchema);


module.exports = {
    Dora: Dora,
    Entry: Entry,
    Users: Users
};

