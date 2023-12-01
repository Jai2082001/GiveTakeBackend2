const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoConnect = require('./database/database').mongoConnect;
const {giverouter} = require('./router/give');
const {ObjectId} = require('mongodb')
const { getDb } = require('./database/database');
const { send } = require('express/lib/response');

let port = process.env.PORT || 3002;


app.use(giverouter)

app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000', 'http://localhost:3001']
}))

app.use(cookieParser())

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}))

app.use('/addProduct', (req, res, next)=>{
  let db = getDb();
  const dateAdded = new Date()
  let {name, quantity, desc, image, state, city, address1, address2, user} = req.body
  name = name.trim()
  quantity = quantity.trim();
  desc = desc.trim();
  state = state.trim();
  city = city.trim();
  address1 = address1.trim();
  address2 = address2.trim();
  user = user.trim()
  db.collection('pendingProduct').insertOne({name: name, quantity: quantity, image: image, state: state, city: city, address1: address1, address2: address2, userId: user,dateAdded: dateAdded, desc: desc }).then((response)=>{
    res.send(response)
  })
})

app.use('/pendingProduct', (req, res, next)=>{
  let db = getDb();
  db.collection('pendingProduct').find().toArray().then((response)=>{
    res.send(response) 
  })
})

app.use('/displayProduct', (req, res, next)=>{
  let db = getDb();
  let {userid} = req.headers;
  if(userid){
    if(userid === 'false'){
      res.send([])
    }else if(userid === 'undefined'){
      res.send([])
    }else{
      let userFetchId = userid;
      db.collection('product').find().toArray().then((response)=>{
        let sendingArray = [];
        response.map((singleItem)=>{
          if(singleItem.userId !== userFetchId){
            sendingArray.push(singleItem);
          }
        })
        res.send(sendingArray)
      })
    }
  }else{
    res.send([])
  }
})
app.use('/acceptProduct', (req,res, next)=>{
  console.log('Accept Product')
  let db = getDb();
  let {productid} = req.headers
  db.collection('pendingProduct').findOne({_id: new ObjectId(productid)}).then((response)=>{
    console.log(response);  
    db.collection('product').insertOne(response).then((resp)=>{
      console.log(resp);        
        db.collection('pendingProduct').deleteOne({_id: new ObjectId(productid)}).then((response)=>{
          console.log(response)
          res.send(resp)
        })
    })
  })
})
app.use('/rejectProduct', (req, res, next)=>{
  let db = getDb();
  let {productid} = req.headers
  db.collection('pendingProduct').deleteOne({_id: new ObjectId(productid)}).then((response)=>{
    console.log(response)
    res.send(response)
  })
})

app.use('/claimUser', (req, res, next)=>{
  let db = getDb();
  let {user} = req.headers;
  db.collection('users').updateOne({_id: new ObjectId(user)}, {$set: {
    awardStatus: 'pending'
  }}).then((response)=>{
    console.log(response)
    const res1 = {...response};
    res1.status = 'pending'    
    res.send(res1)
  })
})

app.use('/takerClaimArray', (req, res, next)=>{
  let db = getDb();
  let {user} = req.headers;
  console.log("taker claim array")
  db.collection('users').findOne({_id: new ObjectId(user)}).then((response)=>{
    console.log(response)
    res.send(response);
  })
})
app.use('/claimHandler', (req, res, next)=>{
  let db = getDb();
  let {user} = req.headers;
  // db.collection('user').updateOne({_id: new ObjectId(user)}, {}).then((response)=>{
  //   console.log(response)
  // })
  db.collection('users').findOne({_id: new ObjectId(user)}).then((response)=>{
    console.log(response)
    db.collection('awardReq').insertOne(response).then((response2)=>{
      console.log(response2);
      db.collection('users').updateOne({_id: new ObjectId(user)}, {$set: {
        awardStatus: 'pending'
      }}).then((response3)=>{
        console.log(response3)
        res.send(response3)
      })
    })
  })
})

app.use('/awardClaims', (req, res, next)=>{
  console.log("Award Claims");
  const array = [];
  let db = getDb();
 
  db.collection('awardReq').find({}).toArray().then((response)=>{
    console.log(response);
    res.send(response)
  })
})
app.use('/awardAccept', (req, res, next)=>{
  console.log("Award Accept");
  let db = getDb();
  let {user, award} = req.headers;  
  // db.collection('users').updateOne({_id: new ObjectId(user)}, {$set: {awardStatus: "accepted", giveArray: []}}).then((response)=>{
  //   console.log(response);
  //   res.send(response);
  // })
  db.collection('users').updateOne({_id: new ObjectId(user)}, {$set: {awardStatus: 'accepted', tempClaimArray: []}}).then((response)=>{
    console.log(response);
    db.collection('awardReq').findOne({_id: new ObjectId(user)}).then((response)=>{
      console.log(response)
      db.collection('award').insertOne(response).then((response)=>{
        console.log(response);
        db.collection('awardReq').deleteOne({_id: new ObjectId(award)}).then((response)=>{
          console.log(response);
          res.send(response)
        })
      })
    })
    
  })
})
app.use('/awardReject', (req, res, next)=>{
  console.log('Award Reject');
  let db = getDb();
  let {user, award} = req.headers
  db.collection('users').updateOne({_id: new ObjectId(user)}, {$set: {
    awardStatus: undefined,
    tempClaimArray: []
  }}).then((response)=>{
    console.log(response);
    db.collection('awardReq').deleteOne({_id: new ObjectId(award)}).then((response)=>{
      console.log(response);
      res.send(response)
    })
  })
})

app.use('/takeReq', (req, res, next)=>{
  let db = getDb();
  let {userid} = req.headers;
  db.collection('users').findOne({_id: new ObjectId(userid)}).then((response)=>{
    if(response.takeReq){
      res.send(response.takeReq);
    }else{
      res.send([]);
    }
  })
})



app.use('/takeProduct', (req, res, next)=>{
  const {productid, userid} = req.headers;
  let db = getDb();
  db.collection('product').findOne({_id: new ObjectId(productid)}).then((response)=>{
    if(response.takers){
      let flag = 0;
      response.takers.map((singleItem)=>{
        if(singleItem == userid)  {
          flag++
        }
      })
      if(flag == 0){
        db.collection('product').updateOne({_id: new ObjectId(productid)}, {$push: {
          takers: userid
        }}).then((response)=>{
          db.collection('users').updateOne({_id: new ObjectId(userid)}, {
            $push: {
              takeReq: productid
            }
          }).then((response)=>{
            res.send(response)
          })
        })    
      }else{
        res.send({status: 'not done'});
      }
    }else{
      db.collection('product').updateOne({_id: new ObjectId(productid)}, {$push: {
        takers: userid
      }}).then((response)=>{
        db.collection('users').updateOne({_id: new ObjectId(userid)}, {
          $push: {
            takeReq: productid
          }
        }).then((response)=>{
          res.send(response)
        })
      })    
    }
  })
  
})

app.use('/forgotList', (req, res, next)=>{
  console.log("forgot List");
  let {email} = req.headers;
  let db = getDb() 
  db.collection("users").findOne({email: email}).then((response)=>{
    if(response){
    db.collection('forgotList').insertOne({response}).then((resp)=>{
      console.log(resp)
      res.send({msg: 'done'})
    })
    }else{
      res.send({msg: 'not reg'})
    }
  })
})

app.use('/forgotAdmin', (req, res, next)=>{
  let db = getDb();
  db.collection('forgotList').find().toArray().then((response)=>{
    res.send(response)
  })
})

app.use('/doneHandler', (req, res, next)=>{
  let db = getDb();
  let {doneid} = req.headers;
  db.collection('forgotList').deleteOne({_id: new ObjectId(doneid)}).then((response)=>{
    console.log(response);
    res.send(response)
  })
})

app.use('/deleteElement', (req, res, next)=>{
  let db = getDb()
  let {deleteid} = req.headers;
  console.log(deleteid)
  db.collection('product').deleteOne({_id: new ObjectId(deleteid)}).then((response)=>{
    console.log(response);
    res.send(response)
  })
})

app.use('/checkUser', (req, res, next)=>{
  let db = getDb()
  const user = req.cookies['user'];
  if(user){
    db.collection('users').findOne({_id: new ObjectId(user)}).then((response)=>{
      const data = {...response}
      data.status = true
      res.send(data)
    })
  }else {
    res.send({status: false})
  }
})
app.use('/loginAdmin', (req, res, next)=>{
  console.log("Login Admin")
  let db = getDb();
  const {username, password} = req.body;
  db.collection('admin').findOne({username: username, password: password}).then((response)=>{
    if(response){
      const token = response._id
      res.cookie('admin', token)
      const data = {...response};
      data.status = true
      res.send(data);
    }
    else {
        res.send({message: 'no authentication'})
        }
  })
})

app.use('/checkAdmin', (req, res, next)=>{
  let db = getDb();
  const user = req.cookies['admin'];
  console.log("check Admin");
  console.log(user);
  if(user){
    db.collection('admin').findOne({_id: new ObjectId(user)}).then((response)=>{
      console.log(response)
      const data = {...response};
      data.status = true;
      res.send(data)
    })    
  }else{
    res.send({status: false})
  }
})

app.use('/listUser', (req, res, next)=>{
  console.log("list user")
  let db = getDb();
  db.collection('users').find().toArray().then((response)=>{
    res.send(response)
  })
})

app.use('/registerUser', (req, res, next) => {
  let db = getDb();
  let {name, email, password, number, ward, gali, state, city} = req.body;
  console.log(req.body)

  db.collection('users').find({email: email}).toArray().then((already)=>{
    if(already.length>0){
        res.send({msg: 'already'})
    }else{
      db.collection('users').insertOne({name: name, email: email, password: password, number: number, ward: ward, gali: gali, state: state, city: city}).then((response)=>{
        res.send(response)
      })
    }
  })
 
})

app.use('/loginUser', (req, res, next)=>{
  let db = getDb();
    const { email, password } = req.body;
    db.collection('users').find({email: email}).toArray().then((response)=>{
      if(response.length>0){
        db.collection('users').findOne({ email: email, password: password }).then((response) => {
          if (response) {
              const token = response._id
              res.cookie('user', token)
              const data = {...response};
              data.status = true
              res.send(data);
          } else {
              res.send({message: 'no authentication'})              
          }
      })
      }else{
        res.send({message: 'not reg'})
      }
    })
    
})

app.use('/logout', (req, res, next)=>{
  res.cookie('user', '', {maxAge: 0})
  res.send({message: 'done'})
})
app.use('/takerTracker', (req, res, next)=>{
  // console.log('Response');
  // res.send({status: 'response'});
  const {product} = req.headers;
  let db = getDb();
  db.collection("produt").findOne({_id: new ObjectId(product)}).then((response)=>{
    res.send({takers: response.takers});
  })
})

app.use('/takerFinal', (req, res, next)=>{
  let db = getDb();
  let {taker, product} = req.headers
  db.collection('product').updateOne({_id: new ObjectId(product)}, {$set: {
    takerFinal: taker
  }}).then((response)=>{
    db.collection('product').findOne({_id: new ObjectId(product)}).then((response)=>{
      console.log
      db.collection('users').findOne({_id: new ObjectId(response.userId)}).then((userRecord)=>{
        console.log(userRecord)
        if(userRecord.takerClaimArray){
          const sampleArray2 = userRecord.takerClaimArray;
          let flag = 0;
          sampleArray2.map((singleItem)=>{
            if(singleItem === taker){
              flag++  
            }
          })
          if(flag > 0){
            res.send(userRecord)
          }else{
            db.collection('users').updateOne({_id: new ObjectId(response.userId)}, {$push: {takerClaimArray: taker}},).then((response2)=>{
              db.collection('users').updateOne({_id: new ObjectId(response.userId)}, {$push: {tempClaimArray: taker}}).then((response)=>{
                console.log('Temp Claim Array')
                console.log(response)
                res.send(response)
              })
            })
          }
        }else{
          const sample = [];
          sample.push(taker)
          db.collection('users').updateOne({_id: new ObjectId(response.userId)}, {$set: {
            takerClaimArray: sample
          }}).then((response2)=>{
            db.collection('users').updateOne({_id: new ObjectId(response.userId)}, {$set: {tempClaimArray: sample}}).then((response)=>{
              console.log('Temp Array')
              console.log(response)
              res.send(response)
            })
          })
        }
      })  
    })
  })
})


app.use('/productDisplay', (req, res, next)=>{
  let db = getDb();
  let {productid} = req.headers;
  db.collection("product").findOne({_id: new ObjectId(productid)}).then((response)=>{
    res.send(response);
  })
})

app.use('/displayDonation', (req, res, next)=>{
  let {id} = req.headers
  let db = getDb();
  db.collection('product').find({userId: id}).toArray().then((response)=>{
    res.send(response)
  })
})

app.use('/takerDisplay', (req, res, next)=>{
  let {takerid} = req.headers;
  let db = getDb();
  db.collection('users').findOne({_id: new ObjectId(takerid)}).then((response)=>{
    res.send(response)  
  })
})

app.use('/takerProductDisplay', (req, res, next)=>{
  let {productid} = req.headers;
  let db = getDb();
  db.collection('product').findOne({_id: new ObjectId(productid)}).then((response)=>{
    res.send(response);
  })
})

app.get('/', (req, res, next)=>{
  console.log('hitted')  
})


mongoConnect(()=>{
    app.listen(port, ()=>{
        console.log('Connected')
    })
})