const db = require("./db_connection");

// delete the table if it already exists
const drop_stuff_table_sql = "DROP TABLE IF EXISTS stuff";

db.execute(drop_stuff_table_sql);
// create the table with suitable columns and such

const create_stuff_table_sql = `
CREATE TABLE stuff (
    email VARCHAR(45) NULL,
    item VARCHAR(45) NOT NULL,
    quantity INT NOT NULL,
    description VARCHAR(150) NULL,
    id INT NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (id));  
`
db.execute(create_stuff_table_sql);

// add some sample data to the table
const insert_stuff_table_sql = `
    INSERT INTO stuff
        (item, quantity, description)
    VALUES
        (?, ?, ?)
`

db.execute(insert_stuff_table_sql, [ "Widgets", "5" , "Widgets are cool! You can do ... so many... different things... with them..." ]);

db.execute(insert_stuff_table_sql, [ "Gizmos", "100" , null]);

db.execute(insert_stuff_table_sql, ['Thingamajig', '12345', 'Not to be confused with a Thingamabob']);

db.execute(insert_stuff_table_sql, ['Thingamabob', '54321', 'Not to be confused with a Thingamajig']);

//read the new contents
const read_stuff_table_sql = "SELECT * FROM stuff";

db.execute(read_stuff_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'stuff' initialized with:")
        console.log(results);
    }
);

db.end();