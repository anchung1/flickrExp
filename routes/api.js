var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');

var db = require('../schema/schema.js');
//var Dora = mongoose.model('dora', doraSchema);
var Dora = db.Dora;
var Users = db.Users;
var Entry = db.Entry;
var Flickr = db.Flickr;
var MemoryGame = db.MemoryGame;

var api_key = "76cceea6d278cbd158a726e6860951e7";
var flickrApiOptions = ["name=value", "format=json"];

//jsonFlickrApi({"photos":{"page":1,"pages":10,"perpage":100,"total":1000}});

/* GET users listing. */
router.get('/greet', function (req, res, next) {
    console.log('greet');

    /*Flickr.find({'userID':id}, function(err, entryList) {
        if (err) return next(err);
        if (!entryList || !entryList.length) return next();

        console.log(entryList);
        res.json(entryList);
    });*/
    res.send('greetings');
});

function getDateStr() {
    var date = new Date();
    var dateArr = date.toString().split(' ');
    var dateStr = '';

    dateArr.forEach(function(elem, i) {
        if (i<4) dateStr += elem + " ";
    });
    return (dateStr.trim());
}

router.post('/daily', function(req, res, next) {

    var dateStr = getDateStr();

    //check if its high score
    var thisScore = req.body.score;
    var name = req.body.name;


    MemoryGame.find({}, function(err, entryList) {
        if (err) return next(err);

        if (!entryList || entryList.length ==0 ) {
            var score = new MemoryGame({
                allTimeHighName: name,
                allTimeHighScore: thisScore,
                allTimeHighDate: dateStr,
                dailyHighName: name,
                dailyHighScore: thisScore,
                dailyDate: dateStr
            });
            score.save(function(err, score) {
                if (err) return next(err);
                if (!score) return next();


                return res.json({allTimeHighScore: true, dailyHighScore: true, score: thisScore});
            });
        } else {
            if (entryList[0].allTimeHighScore < thisScore) {

                entryList[0].allTimeHighName = name;
                entryList[0].allTimeHighScore = thisScore;
                entryList[0].allTimeHighDate = dateStr;
                entryList[0].dailyHighName = name;
                entryList[0].dailyHighScore = thisScore;
                entryList[0].dailyDate = dateStr;

                entryList[0].save(function(err, elem) {
                    if (err) return next(err);
                    if (!elem) return next();

                    return res.json({allTimeHighScore: true, dailyHighScore: true, score: thisScore});
                });

            }

            if (entryList[0].dailyHighScore < thisScore) {
                entryList[0] = {
                    dailyHighName: name,
                    dailyHighScore: thisScore,
                    dailyDate: dateStr
                };
                entryList[0].save(function(err, elem) {
                    if (err) return next(err);
                    if (!elem) return next();

                    return res.json({allTimeHighScore: false, dailyHighScore: true, score: thisScore});
                })
            }
        }

    });
});

router.get('/daily', function(req, res, next) {
    var dateStr = getDateStr();
    MemoryGame.find({dailyDate: dateStr}, function(err, entryList) {

        if (err) return next(err);
        if (!entryList || !entryList.length) return next();

        var returnObj = [];
        entryList.forEach(function(elem) {
            returnObj.push(elem)
        });

        res.json(returnObj);
    });
});

router.delete('/daily/:key', function(req, res, next){

    MemoryGame.findOneAndRemove({dailyHighName: req.params.key}, function(err, elem) {
        if (err) return next(err);
        res.send('item deleted: ' + req.params.key);

    })
});

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

router.get('/flickr', function(req, res, next) {
    var count = req.query.count;
    flickrApiOptions.push("per_page="+count);
    flickrRequest('flickr.photos.getRecent', flickrApiOptions, req, res, next);
});

router.get('/flickrSearch', function(req, res, next) {
    var count = req.query.count;
    var text = req.query.text;
    var page = req.query.page;

    console.log('count: ' + count);
    console.log('text: ' + text);
    console.log(req.query);

    flickrApiOptions = ["name=value", "format=json"];
    if (count) flickrApiOptions.push("per_page="+count);
    if (text) flickrApiOptions.push("text="+text);
    if (page) flickrApiOptions.push("page="+page);

    flickrRequest('flickr.photos.search', flickrApiOptions, req, res, next);

});


router.post('/flickrSave', function(req, res, next) {
    var id = req.signedCookies._id;

    Users.findOne({_id: id}, 'name', function(err, user) {
        if (err) return next(err);
        if (!user) return next();

        var store = new Flickr({url: req.body.image, userID: id});
        store.save(function(err, store) {
            if (err) return next(err);
            if (!store) return next();

            //console.log(store);
            res.send('saved');
        });

    });
});

router.get('/flickrSaved', function(req, res, next) {
    var id = req.signedCookies._id;

    Users.findOne({_id: id}, 'name', function(err, user) {
        if (err) return next(err);
        if (!user) return next();

        Flickr.find({'userID':id}, function(err, entryList) {
            if (err) return next(err);
            if (!entryList || !entryList.length) return next();

            console.log(entryList);
            var returnObj = {urls: []};
            entryList.forEach(function(elem) {
                returnObj.urls.push(elem.url);
            });
            res.json(returnObj);
        })

    });
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
