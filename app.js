const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const flash = require("connect-flash");
const { election, admin, option, voters, vote, question} = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
var cookieParser=require("cookie-parser");

const bcrypt = require('bcrypt');

const saltRounds=10;
const passport=require('passport');
const session = require('express-session');
const connectEnsureLogin = require('connect-ensure-login');
app.use(cookieParser("ssh! some secret string"));
app.set("view engine","ejs");
const path = require('path');


const LocalStrategy = require('passport-local');
//const voters = require("./models/voters");

app.use(express.static(path.join(__dirname,"public")));


//const path = require("path");
app.set("views", path.join(__dirname, "views"));

app.use(flash());

app.use(session({
  secret:"my-secret-super-key-21728172615261562",
  cookie:{
    maxAge:24*60*60*1000
  }
}))


app.use(function(request, response, next) {
  response.locals.messages = request.flash();
  next();
});


app.use(passport.initialize());
app.use(passport.session());



passport.use(new LocalStrategy({
  usernameField:'email',
  passwordField:'password'
},(username,password,done)=>{
  admin.findOne({ where: { email: username } })
  .then(async function (user) {
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      return done(null, user);
    } else {
      return done(null, false, { message: "Invalid password" });
    }
  })
  .catch((error) => {
    return done(null, false, { message: "Invalid Email-Id" });
  });
}
))


passport.serializeUser((user,done)=>{
  console.log("Serializing user in session",user.id)
  done(null,user.id)
});
passport.deserializeUser((id,done)=>{
  admin.findByPk(id)
  .then(user=>{
    done(null,user)
  })
  .catch(error=>{
    done(error,null)
  })
});




app.get('/', async function(request,response){
  console.log(request.user)
    response.render('index');
});


app.post("/users", async (request,response)=>{

    const hashedpwd = await bcrypt.hash(request.body.password,saltRounds)
    const fname=request.body.firstname
    const lname=request.body.lastname
    const email=request.body.email
    
    console.log(hashedpwd)
  try{
    const admin1= await admin.create({
      firstname:request.body.firstname,
      lastname:request.body.lastname,
      email:request.body.email,
      password:hashedpwd,
      
    });
    request.login(admin1,(err)=>{
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


app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/admin-login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/elections");
  }
);

app.get('/elections',connectEnsureLogin.ensureLoggedIn(),async (request,response)=>{

  const loggedInUser = request.user.id;
  const ongoing1 = await election.ongoing(loggedInUser);
  const completed1 = await election.completed1(loggedInUser);

  if (request.accepts("html")) {
    response.render("elections", {
      ongoing1,
      completed1,
      //csrfToken: request.csrfToken(),
    });
  }
  else{
    response.json({
      ongoing1,
      completed1,
    })
  }


  //res.render('elections');
});



app.put("/election/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const Election1 = await election.findByPk(request.params.id);
  try {
    const updatedelection = await Election1.setCompletionStatus(true);
    return response.json(updatedelection);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});


app.delete("/election/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const Election1 = await election.findByPk(request.params.id);
  try{
    await election.deleteelection(request.params.id);
    return response.json(true);
  }
  catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});



app.get("/election/:id",connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  try {
    const Election1 = await election.findByPk(request.params.id);
    return response.json(Election1);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/elections/new",connectEnsureLogin.ensureLoggedIn(), async (request, response)=> {
  const title1= request.body.title;
  const loggedInUser = request.user.id;
  try {
    const Election1=await election.addelection({
      title:request.body.title,
      adminId:loggedInUser

    });
    //return response.redirect("/elections1");
    response.render("elections1", {
      Election1,
      title1,
 });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});




app.get('/elections1', connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  
  const elections = await election.findByPk(request.params.id);
  const questions = await question.getall(elections);
  const options = await option.findAll({ where: { questionid: questions } });
  const voters = await voter.findAll({ where: { electionid: elections } });
  
  response.render("elections1", {
      elections,
      questions,
      options,
       voters, 
       
  
});
});


app.post("/voters", connectEnsureLogin.ensureLoggedIn(),async (request,response)=>{

  const hashedpwd = await bcrypt.hash(request.body.password,saltRounds)
  
  const email=request.body.voterid
  const election1 = await election.findByPk(request.params.elections);
  console.log(email)
  console.log("newelec", election1)
try{
  
  const voter1 = await voters.addvoters({
    email:email,
    password:hashedpwd,
    electionid:request.params.id,
    
  });
  
//   if (request.accepts("html")) {
//     console.log("Html Request");
//     return response.redirect("/voters");
// }
// else {
//     return response.json(election1);
// }
  
}
catch(error){
console.log(error);
request.flash("error", error.message);
// return response.redirect("/elections1");
}

});

app.get('/voters',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
  const election1 = await election.findByPk(request.params.id);
  const voter1 = await voter.findAll({ where: { electionid: election1.id } });
  
  response.render("voters", {
    election1,
       voter1, 
      
  
});
});


app.delete("/voters", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("We have to delete a Voter with ID: ", request.params.id);
  // First, we have to query our database to delete a Todo by ID.
  const voter1 = await voter.findByPk(request.params.id);
  try {
      if (voter1 == null)
          return response.send(false);
      else {
          voter1.deleteVoter();
          return response.send(true);
      }
  } catch (error) {
      console.log(error);
      return response.status(422).json(error);
  }

});


app.get('/new',connectEnsureLogin.ensureLoggedIn(),function(req,res){
    res.render('new');
});


app.post("/addquestion",connectEnsureLogin.ensureLoggedIn(),async (request, response)=> {
  const electionID = await election.findByPk(request.params.id);
  console.log("id ",electionID);
  console.log("id2", request.params.id);
  const Questions = await question.findAll({ where: { electionId: electionID } });
  try {
    await question.addquestion({
      question:request.body.questiontext,
      description:request.body.description,
      electionid: request.params.id,
    });
    return response.redirect("/elections1");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/questions", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  const Election = await election.findByPk(request.params.id);
  const Questions = await question.findAll({ where: { electionId: Election.id } });
  if (Election.status == false) {
      response.render("question", {
           Election, Questions
      });
  }
  else {
      return response.redirect("/elections1");
  }

});




// app.get('/index1',function(req,res){
//     res.render('index1');
// });
app.get('/signup',function(req,res){
    res.render('signup');
});

app.get("/signout",(request,response,next)=>{
  request.logout((err)=>{
    if(err)
    {
      return next(err);
    }
    response.redirect("/");
  })
})

app.get('/admin-login',function(req,res){
    res.render('admin-login');
});

app.get('/user-login',function(req,res){
    res.render('user-login');
});




module.exports = app;