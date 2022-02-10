const express = require('express');
const exphbs = require('express-handlebars');
const app = express();

app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use('/', require('./index'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});