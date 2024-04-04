const express = require("express");
const cors = require("cors");
require('dotenv').config();
const app = express();

const port = process.env.PORT || 3000;

const { connectToMongoDB } = require("./db");
const userRoutes = require("./routeHandler/users");
const taskRoutes = require("./routeHandler/tasks");


// middleware
app.use(cors());
app.use(express.json());

//connect to mongodb
connectToMongoDB();

// routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);


app.get('/', (req, res) =>{
    res.send("My Task server is running");
})

app.listen(port, () =>{
    console.log(`My Task Server Port: ${port}`);
})