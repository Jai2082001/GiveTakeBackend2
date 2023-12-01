const mongodb = require('mongodb');
const mongoose = require('mongoose');

const mongoClient = mongodb.MongoClient;


let db;

const mongoConnect = (callback) => {
    mongoose.connect('mongodb://localhost:27017/giveTakeDatabase2', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

    db = mongoose.connection;

    db.on('error', ()=>{
        console.log('some error has occured');
    })

    db.once('open', ()=>{
        console.log('connected to the database');
    })

    callback()
}

const getDb = () => {
    if(db){
        return db;
    }else{
        console.log('Database Middleware has not initialized')
    }
}

exports.getDb = getDb;
exports.mongoConnect = mongoConnect;