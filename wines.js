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

async function get_winery_name(id){
    const key = datastore.key([WINERY, id]);
    return await datastore.get(key)
    .then( (winery) => {
        return { "id":id, "name":winery[0].name};
    });
}

async function wine_return(key){
    return await datastore.get(key)
    .then( async (wine) => {
        var winery = await get_winery_name(parseInt(wine[0].winery,10));
        const formatted_wine = {"id": key.id, 
                                "name": wine[0].name,
                                "year": wine[0].year, 
                                "qrString": wine[0].qrString, 
                                "winery":winery, 
                                "details": wine[0].details};
        return formatted_wine;
    });
}

async function get_wines(){
    var q = await datastore.createQuery(WINE);
    return await datastore.runQuery(q)
    .then( async (entities) => {
        var wines = await entities[0].map(ds.fromDatastore);
        pretty_wines = [];


        var promises = await wines.map( async (wine) => {
            const key = await datastore.key([WINE, parseInt(wine.id, 10)]);
            wine = await wine_return(key);
            var result = await pretty_wines.push(wine);
            return new Promise((res, rej) => res(result));
        });

        return await Promise.all(promises)
        .then( async (results) => {
            var return_wines = {"wines":pretty_wines};
            return return_wines;
        });
    });
}

async function get_wine(id){
    const key = datastore.key([WINE, parseInt(id,10)]);
    return await wine_return(key);
}

function post_wine(name, year, qrString, winery, details){
    var key = datastore.key(WINE);
    const new_wine = {"name": name, "year": year, "qrString": qrString, "winery": winery, "details": details};
    return datastore.save({"key": key, "data": new_wine})
    .then(() => {return key});
}

function put_wine(id, name, year, qrString, winery, details){
    const key = datastore.key([WINE, parseInt(id,10)]);
    const wine = {"name": name, "year": year, "qrString": qrString, "winery": winery, "details": details};
    return datastore.save({"key": key, "data": wine});
}

function delete_wine(id){
    const key = datastore.key([WINE, parseInt(id,10)]);
    return datastore.delete(key);
}

//=================================================//
//-------------- End Model Functions --------------//
//=================================================//


//=================================================//
//----------- Begin Controller Functions ----------//
//=================================================//

router.get('/', async function(req, res){
    await get_wines()
    .then( (wines) => {
        res.status(200).json(wines);
    });
});

router.get('/:id', async function(req, res){
    await get_wine(req.params.id)
    .then( async (wine) => {
        res.status(200).json(wine);
    });
});

router.post('/', async function(req, res){
    await post_wine(req.body.name, req.body.year, req.body.qrString, req.body.winery, req.body.details)
    .then( async (key) => await wine_return(key))
    .then( (wine) => {res.status(200).send(wine)});
});

router.put('/:id', function(req, res){
    put_wine(req.params.id, req.body.name, req.body.year, req.body.qrString, req.body.winery, req.body.details)
    .then(res.status(200).end());
});

router.delete('/:id', function(req, res){
    delete_wine(req.params.id).then(res.status(200).end());
});

//=================================================//
//------------ End Controller Functions -----------//
//=================================================//

module.exports = router;