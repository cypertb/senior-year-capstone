const router = module.exports = require('express').Router();

router.use('/', require('express').static('public'));
router.get('/', function (req, res){
    res.render('home');
});
router.get('/home', function (req, res){
    res.render('home');
});
router.use('/users', require('./users'));
router.use('/wines', require('./wines'));
router.use('/wineries', require('./wineries'));
router.use(function (req, res){
    res.status(404);
    res.render('404');
});
router.use(function (err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});