const express = require("express");
const { client } = require("../db");
const router = express.Router();

const userCollection = client.db("MyTask").collection("users");


router.get('/', async (req, res) =>{
    const users = await userCollection.find().toArray();
    res.send(users);
})

router.get('/:email', async(req,res) =>{
    const userData = await userCollection.find({
        email : req.params.email
    }).toArray();
})

router.post('/', async(req,res) =>{
    const newUserData = req.body;
    const userExists = await userCollection.findOne({email : newUserData.email})
    newUserData.isAdmin = false;

    if(userExists){
        res.send("User already exists");
    }
    else{
        const result = await userCollection.insertOne(newUserData);
        console.log("new user data : ", newUserData);
        res.json(newUserData);
    }
})

module.exports = router;