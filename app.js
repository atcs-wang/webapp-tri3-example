//set up the server
const express = require( "express" );
const logger = require( "morgan" );
const app = express();

const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT;

//Configure Express to use EJS
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

const db = require('./db/db_pool');

//Configure Auth0
const { auth } = require('express-openid-connect');

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// configure express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({extended : false}));

//defining middleware that logs all incoming requests.
app.use(logger("dev"));

// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));

// req.isAuthenticated is provided from the auth router
app.get('/testLogin', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

const { requiresAuth } = require('express-openid-connect');

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.render('index');
} );

const read_stuff_all_sql = `
    SELECT
        id, item, quantity
    FROM
        stuff
    WHERE
        email = ?
`

// define a route for the stuff inventory page
app.get( "/stuff", requiresAuth(), ( req, res ) => {
    db.execute(read_stuff_all_sql, [req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else 
            res.render("stuff", { inventory : results, username : req.oidc.user.name});
        // inventory's shape:
        // [
        //  {id: __, item: ___, quantity: ____},
        //  {id: __, item: ___, quantity: ____},
        //  {id: __, item: ___, quantity: ____},
        //  ...
        // ]
    })
} );

const read_stuff_item_sql = `
    SELECT
        id, item, quantity, description
    FROM
        stuff
    WHERE
        id = ?
        AND email = ?
`

// define a route for the item detail page
app.get( "/stuff/item/:id", requiresAuth(), ( req, res ) => {
    db.execute(read_stuff_item_sql, [req.params.id, req.oidc.user.email], (error, results) =>{
        if(error)
            res.status(500).send(error); //Internal Server Error
        else if (results.length == 0)
            res.status(404).send(`No item found with id = ${req.params.id}`); // NOT FOUND
        else {
            let data = results[0]; // results is still an array
            //{id: ___,  item: ___ , quantity:___, description: ___}
            res.render('item', data)
        }
    })
} );

const delete_stuff_sql = `
    DELETE
    FROM 
        stuff
    WHERE 
        id = ?
        AND email = ?
`

app.get("/stuff/item/:id/delete", requiresAuth(), ( req, res) => {
    db.execute(delete_stuff_sql, [req.params.id, req.oidc.user.email], ( error, results) => {
        if(error)
            res.status(500).send(error); //Internal Server Error
        else {
            // res.send("<h1>Item deleted!</h1> <a href='/stuff'>inventory</a>")
            res.redirect("/stuff");
        }
    })
})
const create_item_sql = `
INSERT INTO stuff
    (item, quantity, email)
VALUES
    (?, ?, ?)
`
app.post("/stuff", requiresAuth(), (req, res) => {
    // to get the form input values:
    //req.body.name 
    //req.body.quantity
    db.execute(create_item_sql, [req.body.name, req.body.quantity, req.oidc.user.email ], (error , results) => {
        if(error)
            res.status(500).send(error); //Internal Server Error
        else {
            //res.redirect(`/stuff`);
            res.redirect(`/stuff/item/${results.insertId}`);
        }
    })
});

const update_item_sql = `
    UPDATE
        stuff
    SET 
        item = ?,
        quantity = ?,
        description = ?
    WHERE 
        id = ?
        AND email = ?
`
app.post("/stuff/item/:id", requiresAuth(), (req, res) => {
    //req.params.id
    // to get the form input values:
    //req.body.name 
    //req.body.quantity
    //req.body.description
    db.execute(update_item_sql, [req.body.name, req.body.quantity, 
                                req.body.description, req.params.id, req.oidc.user.email], 
                                (error, results) => {
        if(error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/stuff/item/${req.params.id}`);
        }
    })
})


// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );