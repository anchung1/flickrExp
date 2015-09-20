var express = require('express');
var router = express.Router();
var path = require('path');

var db = require('../schema/schema.js');
var Users = db.Users;

var cookieResp = {
    signed: true,
    secure: true,
    httpOnly: true
};

/* GET users listing. */
router.get('/:name', function (req, res, next) {
    var search = Users.where({name: req.params.name});

    search.findOne(function (err, entry) {
        if (err) {
            return next(err);
            //return res.json({name: undefined});
        }

        if (entry) {
            return res.json({name: entry.name});
        }

        return next();
    });

    //res.send('respond with a resource');
});

router.post('/create', function(req, res, next) {

    var search = Users.where({name: req.body.name});

    search.findOne(function (err, entry) {
        if (err) {
            return next(err);
        }

        if (entry) {
            var err = {};
            err.status = 500;
            err.message = 'Entry exists.';
            err.error = {};
            return next(err);
        }

        var store = new Users({
            name: req.body.name,
            password: req.body.password,
            email: req.body.email
        });

        store.save(function(err, entry) {
            if (err) next(err);
            res.json({name: entry.name});
        });

    });

});

router.post('/login', function(req, res, next) {
    /*console.log(req.body.name);
    console.log(req.body.password);
    console.log(req.body);*/

    //res.cookie('hola', 'im dora', cookieResp);
    var search = Users.where({name: req.body.name, password: req.body.password});

    //enable to see all User entries
    /*Users.find(function(err, entry) {
        console.log(entry);
    });*/

    search.findOne(function (err, entry) {
        if (err) {
            return next(err);
        }

        if (entry) {
            console.log(entry);
            res.cookie('_id', entry.id, cookieResp);
            res.json({result: 'success'});
        } else {
            next();
        }
    });
});

module.exports = router;
