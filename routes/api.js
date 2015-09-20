var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');

var db = require('../schema/schema.js');
//var Dora = mongoose.model('dora', doraSchema);
var Dora = db.Dora;
var Users = db.Users;
var Entry = db.Entry;

var api_key = "76cceea6d278cbd158a726e6860951e7";
var flickrApiOptions = ["name=value", "format=json"];

//jsonFlickrApi({"photos":{"page":1,"pages":10,"perpage":100,"total":1000}});


function constructLinks(body) {

    var myRe = /jsonFlickrApi\((.+)\)/;
    var result = myRe.exec(body);

    if (!result[1]) undefined;
    var obj = JSON.parse(result[1]);
    var photo = obj.photos.photo;

    //https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
    var url = 'https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg';
    var images = [];
    photo.forEach(function(pic) {
        var url1 = url.replace('{farm-id}', pic.farm).replace('{server-id}', pic.server)
            .replace('{id}', pic.id).replace('{secret}', pic.secret);
        images.push(url1);
    });

    return images;
}

function flickrRequest(method, options, req, res, next) {
    var baseURL = "https://api.flickr.com/services/rest/";
    var flickreq = "?method="+method + "&api_key="+api_key;

    options.forEach(function(opt) {
        flickreq += "&" + opt;
    });

    request(baseURL+flickreq, function(err, resp, body) {
        if (err) return next(err);

        var urls = constructLinks(body);
        return res.json({urls: urls});
    });


}

/* GET users listing. */
router.get('/greet', function (req, res, next) {
    console.log('greet');


    res.send('greetings');
});

router.get('/flickr', function(req, res, next) {
    flickrApiOptions.push("per_page=3");
    flickrRequest('flickr.photos.getRecent', flickrApiOptions, req, res, next);
});

router.post('/db', function (req, res, next) {
    var id = req.signedCookies._id;

    Users.findOne({_id: id}, 'name', function(err, user) {
        if (err) return next(err);
        if (!user) return next();

        console.log('post with title ' + req.body.title);
        Entry.find({'userID': id}).where('title').equals(req.body.title).exec(
            function(err, entry) {
                if (err) return next(err);

                console.log('entry is');
                console.log(entry);

                if (!entry || entry.length==0) {
                    console.log('new entry');
                    var store = new Entry({title: req.body.title, data: req.body.data, userID: id});
                    store.save(function(err, store) {
                        if (err) return next(err);
                        if (!store) return next();

                        console.log(store);
                        res.send('saved');
                    });
                } else {
                    console.log('updating entry');
                    entry[0].data = req.body.data;
                    entry[0].save(function(err, elem) {
                        if (err) return next(err);
                        if (!elem) return next();

                        console.log(elem);
                        res.send('updated');
                    });
                }
            }
        );

    });
});

router.get('/db/:title', function(req, res, next) {

    var title = req.params.title;
    var id = req.signedCookies._id;

    Users.findOne({_id: id}, 'name', function(err, user) {
        if (err) return next(err);
        if (!user) return next();

        Entry.find({'userID': id}).where('title').equals(title).exec(
            function(err, entry) {
                console.log('entry found ' + entry);
                if (err) return next(err);
                if(!entry || entry.length==0) return next();

                res.json(entry[0]);
            }
        );

    });
});

router.get('/db/userData', function(req, res, next) {

    var id = req.signedCookies._id;

    Users.findOne({_id: id}, 'name', function(err, user) {
        if (err) return next(err);
        if (!user) return next();

        Entry.find({'userID':id}, function(err, entryList) {
            if (err) return next(err);
            if (!entryList || !entryList.length) return next();

            console.log(entryList);
            res.json(entryList);
        })
    });
    //res.send('user data');
});

router.delete('/db/:title', function (req, res, next) {
    /*Dora.findOneAndRemove({name: delItem}, function (err) {
        if (err) return console.log('unable to delete ' + delItem);
        res.send(delItem);
    });*/


    var id = req.signedCookies._id;
    var delItem = req.params.title;

    Users.findOne({_id: id}, 'name', function(err, user) {
        if (err) return next(err);
        if (!user) return next();

        Entry.findOneAndRemove({title: delItem}, function(err) {
            if (err) return next(err);
            res.send('item ' + delItem + ' removed');
        });


    });
});

module.exports = router;
