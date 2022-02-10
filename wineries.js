const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

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

async function get_winery_wines(winery_id){
    var q = await datastore.createQuery(WINE).filter('winery', '=', winery_id.toString());
    
    return await datastore.runQuery(q)
    .then( async (entities) => {
        var wines = await entities[0].map(ds.fromDatastore);
        var pretty_wine_details = [];

        var promises = await wines.map( async (wine) => {
            const key = await datastore.key([WINE, parseInt(wine.id, 10)]);
            wine = await get_wine_details(key);
            var result = await pretty_wine_details.push(wine);
            return new Promise((res, rej) => res(result));
        });

        return await Promise.all(promises)
        .then( async (results) => {
            return pretty_wine_details;
        });
    });
}

async function winery_return(key){
    return await datastore.get(key)
    .then( async (winery) => {
        var wines = await get_winery_wines(key.id);
        const formatted_winery = {"id": key.id, 
                                  "name": winery[0].name, 
                                  "email": winery[0].email, 
                                  "address": winery[0].address, 
                                  "wines": wines};
        return formatted_winery;
    });
}

async function get_wineries(){
    var q = await datastore.createQuery(WINERY);
    return await datastore.runQuery(q)
    .then( async (entities) => {
        var wineries = await entities[0].map(ds.fromDatastore);
        pretty_wineries = [];

        var promises = await wineries.map( async (winery) => {
            const key = await datastore.key([WINERY, parseInt(winery.id, 10)]);
            winery = await winery_return(key);
            var result = await pretty_wineries.push(winery);
            return new Promise((res, rej) => res(result));
        });

        return await Promise.all(promises)
        .then( async (results) => {
            var return_wineries = {"wineries": pretty_wineries};
            return return_wineries;
        });
    });
}

async function get_winery(id){
    const key = datastore.key([WINERY, parseInt(id,10)]);
    return await winery_return(key);
}

function post_winery(name, email, address){
    var key = datastore.key(WINERY);
    const new_winery = {"name": name, "email": email, "address": address};
    return datastore.save({"key": key, "data": new_winery})
    .then(() => {return key});
}

function put_winery(id, name, email, address){
    const key = datastore.key([WINERY, parseInt(id,10)]);

    //need to account for already existing wines by accessing the db or sending them again?

    const winery = {"name": name, "email": email, "address": address};
    return datastore.save({"key": key, "data": winery});
}

function put_winery_wine(id, wid){
    const key = datastore.key([WINERY, parseInt(id,10)]);
    return datastore.get(key)
    .then( (winery) => {
        if( typeof(winery[0].wines) === 'undefined'){
            winery[0].wines = [];
        }
        winery[0].wines.push(parseInt(wid,10));
        return datastore.save({"key": key, "data": winery[0]});
    });
}

function delete_winery(id){
    const key = datastore.key([WINERY, parseInt(id,10)]);
    return datastore.delete(key);
}

//=================================================//
//-------------- End Model Functions --------------//
//=================================================//

//=================================================//
//----------- Begin Controller Functions ----------//
//=================================================//

router.get('/', async function(req, res){
    await get_wineries()
    .then( async (wineries) => {
        res.status(200);
        res.render('wineries', wineries);
    });
});

router.get('/:id', async function(req, res){
    await get_winery(req.params.id)
    .then( async (winery) => {
        res.status(200).json(winery);
    });
});

router.get('/:id/wines', async function(req, res){
    await get_winery_wines(req.params.id)
    .then( async (wines) => {
        res.status(200).json(wines);
    });
});

router.post('/', function(req, res){
    post_winery(req.body.name, req.body.email, req.body.address)
    .then( key => winery_return(key))
    .then( winery => {res.status(200).send(winery)});
});

router.put('/:id', function(req, res){
    put_winery(req.params.id, req.body.name, req.body.email, req.body.address)
    .then(res.status(200).end());
});

router.put('/:id/wines/:wid', function(req, res){
    put_winery_wine(req.params.id, req.params.wid)
    .then(res.status(200).end());
});

router.delete('/:id', function(req, res){
    delete_winery(req.params.id).then(res.status(200).end());
});

//=================================================//
//------------ End Controller Functions -----------//
//=================================================//

module.exports = router;