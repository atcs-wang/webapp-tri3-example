const db = require("./db_connection");

db.execute('SELECT 1 + 1 AS solution', 
    (error, results) => {
        if (error) 
            throw error;
        console.log(results);
        console.log(results[0].solution);
    }
);

db.end(); // optional: close the connection after the queue is empty.