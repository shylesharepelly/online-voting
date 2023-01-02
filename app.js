const express = require("express");
const app = express();


app.use(express.json());
//var csrf = require("tiny-csrf");
const { Voter,Admin,Election,Vote,Question,Option } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const flash = require("connect-flash");
app.set("view engine","ejs");
const path = require('path');

app.use(express.urlencoded({extended:false}));
var cookieParser=require("cookie-parser");

const bcrypt = require('bcrypt');

const saltRounds=10;

const passport=require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');

//app.use(cookieParser("ssh! some secret string"));
//app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));



app.use(express.static(path.join(__dirname,"public")));


app.set("views", path.join(__dirname, "views"));
app.get('/',function(req,res){
    res.render('index');
});


app.post("/admins",async (request,response)=>{

    const hashedpwd = await bcrypt.hash(request.body.password,saltRounds)
    console.log(hashedpwd)
  try{
    const admin= await Admin.create({
      firstName:request.body.firstname,
      lastName:request.body.lastname,
      email:request.body.email,
      password:hashedpwd,
    
    });
    request.login(admin,(err)=>{
      if(err){
        console.log(err);
        response.redirect("/admin-login");
  
      }
      response.redirect("/elections");
    })
  }
  catch(error){
  console.log(error);
  //request.flash("error", error.message);
      return response.redirect("/signup");
  }
  
});


app.post("/elections/new", async (request, response)=> {
  
  const title=request.body.title;
 
  try {
    await Election.addelection({
      title:title,
    });
    return response.redirect("/elections1");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});



app.get('/new',function(req,res){
    res.render('new');
});

app.get('/elections1',function(req,res){
  res.render('elections1');
});

app.get('/elections/new', async function(request,response){
  const election = await Election.findByPk(request.params.id);
  const questions = await Question.findAll({ where: { electionid: election.id } });
  const options = await Option.findAll({ where: { questionid: questions.id } });
  const voters = await Voter.findAll({ where: { electionid: election.id } });
  const fullUrl = request.protocol + "://" + request.hostname + ":" + app.get('PORT') + "/elections/" + election.id + "/vote";
  response.render("elections1", {
      questions,
      options,
       voters, 
       fullUrl
  
});
});

app.get('/index1',function(req,res){
    res.render('index1');
});
app.get('/signup',function(req,res){
    res.render('signup');
});


app.get('/admin-login',function(req,res){
    res.render('admin-login');
});

app.get('/user-login',function(req,res){
    res.render('user-login');
});

app.get('/elections',function(req,res){
    res.render('elections');
});


module.exports = app;