const express = require('express');
const router = express.Router();
const getDb = require('../database/database').getDb;

router.use('/giveIssue', (req, res, next)=>{
    const {name, giver, } = req.body
    db.collection('productGive').insertOne({name, giver}).then((response)=>{
        console.log(response)
        res.send(response)
    })
})

exports.giverouter = router 