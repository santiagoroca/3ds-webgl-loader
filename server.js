express = require('express');

var app = express();

app.get('*', function (request, response, next) {
    response.set('Access-Control-Allow-Origin','*');
    response.set('Access-Control-Allow-Methods','*');
    response.set('Access-Control-Allow-Headers','*');
    next ();
});

app.use(express.static('./resources'));

app.listen(80, function () {});
