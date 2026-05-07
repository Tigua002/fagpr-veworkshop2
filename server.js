// Load all necessary Node.js modules
require("dotenv").config();
const express = require("express");
const app = express();
const testing = process.env.TEST;
const path = require("path");
const md5 = require("md5");
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Dataspot port: ${PORT}`));

// Middleware for parsing request bodies
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const mysql = require("mysql2");
const { error } = require("console");
// Test database connection
const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DB,
});
const Database = process.env.DB;
app.use(express.static("public"));

// Connect to the database with error handling
connection.connect();

const MENU = [
    {
        id: 1,
        cat: "mains",
        emoji: "🍝",
        name: "Pasta Bolognese",
        desc: "Classic beef ragù with tagliatelle",
        price: 89,
        isNew: false,
    },
    {
        id: 2,
        cat: "mains",
        emoji: "🥗",
        name: "Caesar Salad",
        desc: "Romaine, parmesan, croutons",
        price: 72,
        isNew: false,
    },
    {
        id: 3,
        cat: "mains",
        emoji: "🌯",
        name: "Chicken Wrap",
        desc: "Grilled chicken with tzatziki",
        price: 79,
        isNew: true,
    },
    {
        id: 4,
        cat: "mains",
        emoji: "🍲",
        name: "Soup of the Day",
        desc: "Ask staff for today's selection",
        price: 55,
        isNew: false,
    },
    {
        id: 5,
        cat: "snacks",
        emoji: "🥨",
        name: "Pretzel & Dip",
        desc: "Soft pretzel with cheese sauce",
        price: 39,
        isNew: false,
    },
    {
        id: 6,
        cat: "snacks",
        emoji: "🧆",
        name: "Falafel Bites",
        desc: "5 pieces with hummus",
        price: 45,
        isNew: true,
    },
    {
        id: 7,
        cat: "drinks",
        emoji: "☕",
        name: "Flat White",
        desc: "Double espresso with steamed milk",
        price: 35,
        isNew: false,
    },
    {
        id: 8,
        cat: "drinks",
        emoji: "🍵",
        name: "Matcha Latte",
        desc: "Ceremonial grade, oat milk",
        price: 38,
        isNew: false,
    },
    {
        id: 9,
        cat: "drinks",
        emoji: "🥤",
        name: "Fresh Juice",
        desc: "Orange or apple, pressed daily",
        price: 32,
        isNew: false,
    },
    {
        id: 10,
        cat: "desserts",
        emoji: "🍰",
        name: "Carrot Cake",
        desc: "Cream cheese frosting",
        price: 48,
        isNew: false,
    },
    {
        id: 11,
        cat: "desserts",
        emoji: "🍫",
        name: "Brownie",
        desc: "Dark chocolate, warm",
        price: 42,
        isNew: false,
    },
    {
        id: 12,
        cat: "mains",
        emoji: "🥙",
        name: "Veggie Burger",
        desc: "Beetroot patty, aioli, fries",
        price: 85,
        isNew: true,
    },
];

// Serve the index.html file
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
// Serve the index.html file
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

app.get("/get/orders/:status", (req, res) => {
    let query = "SELECT * FROM OSVK_Resturant.workshoporder ";
    if (req.params.status != "all" || !req.params.status) {
        query += `WHERE status = '${req.params.status}'`;
    }
    connection.query(query, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send({
                message: "Unknown error occured, please try again later",
                code: 500,
            });
        }
        res.send(JSON.parse(JSON.stringify(result)));
    });
});
app.get("/get/user/:token", (req, res) => {
    const token = req.params.token;
    if (!token) {
        res.status(404).send({
            messae: "Bad request: Invalid token",
            code: 404,
        });
    }
    connection.query(
        "SELECT * FROM OSVK_Resturant.worshopusers WHERE session = ?",
        [req.params.token],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Unknown error occured, please try again later",
                    code: 500,
                });
            }
            return res.status(200).send({
                message: "Successfully retrieved user",
                code: 200,
                data: JSON.parse(JSON.stringify(result)),
            });
        },
    );
});

app.post("/set/status", (req, res) => {
    var status = req.body.status;
    var id = req.body.id;

    if (status != "Preparing" && status != "Ready" && status != "Delivered") {
        res.status(400).send({
            message: "Bad request: Invalid status",
            code: 400,
        });
    } else if (id == null) {
        res.status(400).send({ message: "Bad request: Invalid id", code: 400 });
    }
    connection.query(
        "UPDATE OSVK_Resturant.workshoporder SET status = ? WHERE ID = ?",
        [status, id],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    message: "Unknown error occured, please try again later",
                    code: 500,
                });
            }
            return res.status(200).send({
                message: "Successfully updated order",
                code: 200,
            });
        },
    );
});

app.post("/set/order", async (req, res) => {
    try {
        var body = req.body;
        var cart = body.cart;
        var token = body.token;
        const now = new Date();
        const [rows] = await connection
            .promise()
            .query(
                "SELECT * FROM OSVK_Resturant.worshopusers WHERE session = ?",
                [token],
            );
        const name = rows[0]?.email || body.name;
        const keys = body.keys;
        const status = "Preparing";
        const timeStr = `${now.getHours()}:${now.getMinutes()}`;
        const dayStr = `${now.getDate()}.${now.getMonth()} ${now.getFullYear()}`;
        console.log(name);

        const items = keys.map((id) => {
            const i = MENU.find((m) => m.id === id);
            return { ...i, qty: cart[id] };
        });
        const total = items.reduce((s, i) => s + i.price * i.qty, 0);
        const order = { name, items, total, status, dayStr, timeStr };
        console.log(order);

        connection.query(
            "INSERT INTO OSVK_Resturant.workshoporder (name, items, total, status, day, time) VALUES (?, ?, ?, ?, ?, ?)",
            [name, JSON.stringify(items), total, status, dayStr, timeStr],
        );
        cart = {};
        res.status(200).send({ message: "Successfully sent order", code: 200 });
    } catch (error) {
        console.error(error);

        res.status(500).send({
            message: "Unknown error, please try gain later",
            code: 500,
        });
    }
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let date = new Date();
    let time = `${date.getMonth()}/${date.getDay()}/${date.getFullYear()}-${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
    let token = md5(time + req.body.password);
    let password = md5(req.body.password);
    let existing;
    connection.query(
        "SELECT * FROM OSVK_Resturant.worshopusers WHERE email = ?",
        [email],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send({
                    message: "Unknown error occured, please try again later",
                    code: 500,
                });
            }
            if (result) {
                existing = JSON.parse(JSON.stringify(result));
                if (existing[0].password != password) {
                    return res.status(403).send({
                        message: "Incorrect login credentials, try again",
                        code: 403,
                    });
                }
                connection.query(
                    "UPDATE OSVK_Resturant.worshopusers SET session = ? WHERE email = ?",
                    [token, email],
                    (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send({
                                message:
                                    "Unknown error occured, please try again later",
                                code: 500,
                            });
                        }
                        res.status(200).send({
                            message: "Succesfully logged in",
                            code: 200,
                            token,
                            role: existing[0].role,
                        });
                    },
                );
            }
        },
    );
    connection.query(
        "INSERT INTO OSVK_Resturant.worshopusers (role, email, session, password) VALUES (?, ?, ?, ?)",
        ["user", email, token, password],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send({
                    message: "Unknown error occured, please try again later",
                    code: 500,
                });
            } else {
                return res.status(200).send({
                    message: "Successfully registerd users",
                    code: 200,
                    token,
                    role: "user",
                });
            }
        },
    );
});
