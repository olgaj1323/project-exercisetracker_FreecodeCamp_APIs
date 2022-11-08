const express = require('express')
const mongoose = require('mongoose');
const app = express()
const cors = require('cors')
require('dotenv').config()
const mySecret = process.env['CONNECT_URL']
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
let bodyParser = require('body-parser')

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

let excerciseSessionSchema = new mongoose.Schema({
  description:{type:String, required:true},
  duration:{type:Number, required:true},
  date:String
})

let userSchema = new mongoose.Schema({
  username:{type:String, required:true},
  log:[excerciseSessionSchema]                                     
})

let Session = mongoose.model('Session', excerciseSessionSchema)
let User = mongoose.model('User', userSchema)

app.post('/api/users', bodyParser.urlencoded({extended: false}), (req,res) => {
  
  let newUser = new User({username:req.body.username})
  newUser.save((error, savedUser) => {
    if(!error){
      let responseObject ={}
      
      responseObject['username'] = savedUser.username
      responseObject['_id'] = savedUser.id
      console.log('Create User',responseObject)
      res.json(responseObject)
    }
    else{
      console.log(error)
    }
      
  })
})

app.get('/api/users', (req,res) => {
  User.find({},(error,arrayOfUsers) =>{
    if(!error){
      res.json(arrayOfUsers)
    }
  })
} )

app.post('/api/users/:id/exercises',bodyParser.urlencoded({extended: false}), (req,res) =>{
  let newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: new Date(req.body.date).toDateString()
  })
  console.log('Date Entered', req.body.date, new Date(req.body.date).toDateString() )
  console.log('newSession',newSession.date)
  
  if(newSession.date === '' || req.body.date === undefined ){
    const d = new Date()
    newSession.date = d.toDateString().substring(0,15)
    console.log('day',d.toDateString())
  }
  console.log('newSession',newSession.date)
 
  console.log(req.body[':_id'])
  User.findByIdAndUpdate(
    req.params.id,
    {$push: {log:newSession}},
    {new:true},
    (error, updatedUser) =>{
      if(!error){
        console.log(updatedUser)
        let responseObject ={}
        responseObject['_id'] = updatedUser.id
        responseObject['username']= updatedUser.username
        responseObject['date']= new Date(newSession.date).toDateString()
        responseObject['description'] = newSession.description
        responseObject['duration']= newSession.duration
        res.json(responseObject)
        }
      else{
        console.log(error)
      }
        
      }    
  )
  //res.json({})
})

app.get('/api/users/:_id/logs', (req,res) =>{
  User.findById(req.params._id,(error,result) =>{
    
    if(!error){
      console.log(result);
      let responseObject = {};
        responseObject= result;
      if(req.query.from || req.query.to){
        let fromDate = new Date(0)
        let toDate = new Date()

        if(req.query.from){
          fromDate = new Date(req.query.from)
        }
        if(req.query.to){
          toDate = new Date(req.query.to)
        }
        fromDate= fromDate.getTime()
        toDate = toDate.getTime()
        responseObject.log = responseObject.log.filter((session) =>{
        let sessionDate = new Date(session.date).getTime()
        return sessionDate>=fromDate && sessionDate <=toDate      
        })      
      };
      if(req.query.limit){
        responseObject.log= responseObject.log.slice(0, req.query.limit)
      };
      if(result.log.date === null){
        result.log.date = new Date().toDateString()
      }
      console.log(result);
      /*let responseObject = {}
        responseObject= result
      
      responseObject = responseObject.toJSON()
      responseObject['count'] = result.log.length
      console.log(responseObject['count'])
      res.json(responseObject)*/
      const count= result.log.length;
      const _id = result._id;
      const username = result.username;
      
      const rawLog = result.log;
      const log = rawLog.map((l) => ({
        description:l.description,
        duration:l.duration,
        date:new Date(l.date).toDateString()
          
      }));
      
      responseObject = responseObject.toJSON();
      
      responseObject['_id'] = _id;
      responseObject['username'] = username;
      responseObject['count'] = result.log.length;
      responseObject['log'] = log;
      //console.log(responseObject);
      res.json(responseObject);
     /* console.log(_id,username,count,log)
      res.json(_id,username,count,log)*/
    }
  })
})
