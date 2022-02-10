const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');
const json2html = require('json-to-html');

const datastore = ds.datastore;

const USER = "User"
const WINE = "Wine";
const WINERY = "Winery";


router.use(bodyParser.json());

//=================================================//
//------------- Begin Model Functions -------------//
//=================================================//


async function get_wine_details(key){
    return await datastore.get(key)
    .then( (wine) => {
        var wine_details = {"id": key.id, 
                            "name": wine[0].name, 
                            "year": wine[0].year};
        return wine_details;
    });
}

async function get_winery_details(key){
    return await datastore.get(key)
    .then( (winery) => {
        var winery_details = {"id": key.id,
                              "name": winery[0].name};
        return winery_details;
    });
}

async function get_user_favorite_wines(wine_list){
    var pretty_favorite_wine_list = [];

    var promises = await wine_list.map( async (wine) => {
        const key = await datastore.key([WINE, parseInt(wine, 10)]);
        wine = await get_wine_details(key);
        var result = await pretty_favorite_wine_list.push(wine);
        return new Promise((res, rej) => res(result));
    });

    return await Promise.all(promises)
    .then( async (results) => {
        return pretty_favorite_wine_list;
    });
}

async function get_user_favorite_wineries(winery_list){
    var pretty_favorite_winery_list = [];

    var promises = await winery_list.map( async (winery) => {
        const key = await datastore.key([WINERY, parseInt(winery, 10)]);
        winery = await get_winery_details(key);
        var result = await pretty_favorite_winery_list.push(winery);
        return new Promise((res, rej) => res(result));
    });

    return await Promise.all(promises)
    .then( async (results) => {
        return pretty_favorite_winery_list;
    });
}

async function user_return(key){
    return await datastore.get(key)
    .then( async (user) => {
        var favorite_wines = await get_user_favorite_wines(user[0].favorite_wines);
        var favorite_wineries = await get_user_favorite_wineries(user[0].favorite_wineries);

        const formatted_user = {"id": key.id, 
                                "name": user[0].name, 
                                "email": user[0].email, 
                                "favorite_wines": favorite_wines, 
                                "favorite_wineries": favorite_wineries};
        return formatted_user;
    });
}

async function get_users(){
    var q = datastore.createQuery(USER);

    return datastore.runQuery(q)
    .then( async (entities) => {
        var users = await entities[0].map(ds.fromDatastore);
        pretty_users = [];

        var promises = await users.map( async (user) => {
            const key = await datastore.key([USER, parseInt(user.id, 10)]);
            user = await user_return(key);
            var result = await pretty_users.push(user);
            return new Promise((res, rej) => res(result));
        });

        return await Promise.all(promises)
        .then( async (results) => {
            var return_users = {"users": pretty_users};
            return return_users;
        });
    });
}

async function get_user(id){
    const key = datastore.key([USER, parseInt(id,10)]);
    return await user_return(key);
}

function post_user(name, email){
    var key = datastore.key(USER);
    const new_user = {"name": name, "email": email, "favorite_wines": [], "favorite_wineries": []};
    return datastore.save({"key":key, "data":new_user})
    .then(() => {return key});
}

function put_user(id, name, email){
    const key = datastore.key([USER, parseInt(id,10)]);
    const user = {"name": name, "email": email};
    return datastore.save({"key": key, "data":user});
}

function put_favorite_wine(uid, wid){
    const u_key = datastore.key([USER, parseInt(uid,10)]);
    return datastore.get(u_key)
    .then( (user) => {
        if( typeof(user[0].favorite_wines) === 'undefined'){
            user[0].favorite_wines = [];
        }
        user[0].favorite_wines.push(wid);
        return datastore.save({"key":u_key, "data":user[0]});
    });
}

function put_favorite_winery(uid, wid){
    const u_key = datastore.key([USER, parseInt(uid,10)]);
    return datastore.get(u_key)
    .then( (user) => {
        if( typeof(user[0].favorite_wineries) === 'undefined'){
            user[0].favorite_wineries = [];
        }
        user[0].favorite_wineries.push(wid);
        return datastore.save({"key":u_key, "data":user[0]});
    });
}

function delete_user(id){
    const key = datastore.key([USER, parseInt(id,10)]);
    return datastore.delete(key);
}

function delete_favorite_wine(uid, wid){
    const u_key = datastore.key([USER, parseInt(uid,10)]);
    return datastore.get(u_key)
    .then( (user) => {
        if( user[0].favorite_wines.indexOf(wid.toString()) !== -1
            && user[0].favorite_wines.splice(user[0].favorite_wines.indexOf(wid.toString()), 1)){
            console.log("deleted favorite wine: " + wid);
            return datastore.save({"key":u_key, "data":user[0]});
        }

        else {
            console.log("failed to delete favorite");
            console.log(wid);
        }
    });
}

function delete_favorite_wine(uid, wid){
    const u_key = datastore.key([USER, parseInt(uid,10)]);
    return datastore.get(u_key)
    .then( (user) => {
        if( user[0].favorite_wines.indexOf(wid.toString()) !== -1
            && user[0].favorite_wines.splice(user[0].favorite_wines.indexOf(wid.toString()), 1)){
            console.log("deleted favorite wine: " + wid);
            return datastore.save({"key":u_key, "data":user[0]});
        }

        else {
            console.log("failed to delete favorite wine: " + wid);
        }
    });
}

function delete_favorite_winery(uid, wid){
    const u_key = datastore.key([USER, parseInt(uid,10)]);
    return datastore.get(u_key)
    .then( (user) => {
        if( user[0].favorite_wineries.indexOf(wid.toString()) !== -1
            && user[0].favorite_wineries.splice(user[0].favorite_wineries.indexOf(wid.toString()), 1)){
            console.log("deleted favorite winery: " + wid);
            return datastore.save({"key":u_key, "data":user[0]});
        }

        else {
            console.log("failed to delete favorite winery: " + wid);
        }
    });
}

//=================================================//
//-------------- End Model Functions --------------//
//=================================================//

//=================================================//
//----------- Begin Controller Functions ----------//
//=================================================//

router.get('/', async function(req, res){
    await get_users()
    .then( async (users) => {
        res.status(200);
        res.render('users', users);
    });
});

router.get('/:id', async function(req, res){
    await get_user(req.params.id)
    .then( async (user) => {
        res.status(200).json(user);
    });
});

router.get('/:id/wines', async function(req, res){
    const key =  await datastore.key([USER, parseInt(req.params.id, 10)]);
    await datastore.get(key)
    .then( async (user) => {
        await get_user_favorite_wines(user[0].favorite_wines)
        .then( async (favorite_wines) => {
            res.status(200).json(favorite_wines);
        });
    });

});

router.get('/:id/wineries', async function(req, res){
    const key = await datastore.key([USER, parseInt(req.params.id, 10)]);
    await datastore.get(key)
    .then( async (user) => {
        await get_user_favorite_wineries(user[0].favorite_wineries)
        .then( async (favorite_wineries) => {
            res.status(200).json(favorite_wineries);
        });
    });
});

router.post('/', function(req, res){
    post_user(req.body.name, req.body.email)
    .then( key => user_return(key))
    .then( user => {res.status(200).send(user)});
});

router.put('/:id', function(req, res){
    put_user(req.params.id, req.body.name, req.body.email)
    .then(res.status(200).end());
});

router.put('/:uid/wines/:wid', function(req, res){
    put_favorite_wine(req.params.uid, req.params.wid)
    .then(res.status(200).end());
});

router.put('/:uid/wineries/:wid', function(req, res){
    put_favorite_winery(req.params.uid, req.params.wid)
    .then(res.status(200).end());
});

router.delete('/:id', function(req, res){
    delete_user(req.params.id).then(res.status(200).end());
});

router.delete('/:uid/wines/:wid', function(req, res){
    delete_favorite_wine(req.params.uid, req.params.wid)
    .then(res.status(200).end());
});

router.delete('/:uid/wineries/:wid', function(req, res){
    delete_favorite_winery(req.params.uid, req.params.wid)
    .then(res.status(200).end());
});

//=================================================//
//------------ End Controller Functions -----------//
//=================================================//

module.exports = router;