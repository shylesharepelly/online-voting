const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
const flash = require("connect-flash");
const { election, admin, option, voters, votes, question} = require("./models");
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
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));


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



passport.use("admin-local",new LocalStrategy({
  usernameField:'email',
  passwordField:'password'
},(username,password,done)=>{
  admin.findOne({ where: { email: username } })
  .then(async function (user) {
    if (!user) {
      return done(null, false, {
          message:
              "An Account does not exist",
      });
  }
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      session.role = 'admin'
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



passport.use("voter-local",new LocalStrategy({
  usernameField:'email',
  passwordField:'password',
  passReqToCallback: true,
},(request,username,password,done)=>{
  voters.findOne({ where: { email: username ,electionid: request.params.id} })
  .then(async function (user) {
    if (!user) {
      return done(null, false, {
          message:
              "An Account with this voter email does not exist",
      });
  }
  const election1 = await election.findByPk(
    request.body.id
  );
  
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      session.role = 'voter'
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



passport.deserializeUser((req,id,done)=>{
  if (session.role == 'admin') {
  admin.findByPk(id)
  .then(user=>{
    done(null,user)
  })
  .catch(error=>{
    done(error,null)
  })
}
else if (session.role == 'voter') {
  voters.findByPk(id)
      .then(user => {
          done(null, user,req)
      })
      .catch((error) => {
          done(error, null)
      })
}
});




app.get('/', async function(request,response){
  console.log(request.user)
    response.render('index',{
      csrfToken: request.csrfToken(),
    });
});


app.post("/users", async (request,response)=>{

    const hashedpwd = await bcrypt.hash(request.body.password,saltRounds)
    const fname=request.body.firstname
    const lname=request.body.lastname
    const email=request.body.email
    const pwd = request.body.password
    if (!fname) {
      request.flash("error", "Please make sure you enter first name");
      return response.redirect("/signup");
    }
    if (!lname) {
      request.flash("error", "Please make sure you enter last name");
      return response.redirect("/signup");
    }
    if (!email) {
      request.flash("error", "Please make sure you enter Email-ID");
      return response.redirect("/signup");
    }
    if (!pwd) {
      request.flash("error", "Please make sure you enter password");
      return response.redirect("/signup");
    }
    
    
    
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
  request.flash("error", error.message);
      return response.redirect("/signup");
  }
  
});


app.post(
  "/session",
  passport.authenticate("admin-local", {
    failureRedirect: "/admin-login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/elections");
  }
);


app.post(
  "/session1",
  passport.authenticate("voter-local", {
    
    failureRedirect: "back",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    console.log("user login fail");
    response.redirect(`/elections1/${request.params.id}/voting`);
  }
);

app.get('/elections',connectEnsureLogin.ensureLoggedIn(),async (request,response)=>{

  const loggedInUser = request.user.id;
  const newelections1 = await election.newelections(loggedInUser);
  const ongoing1 = await election.ongoing(loggedInUser);
  const completed1 = await election.completed1(loggedInUser);

  if (request.accepts("html")) {
    response.render("elections", {
      newelections1,
      ongoing1,
      completed1,
      csrfToken: request.csrfToken(),
    });
  }
  else{
    response.json({
      newelections1,
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
app.put("/elections/:id",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const Election1 = await election.findByPk(request.params.id);
  try {
    const updatedelection = await Election1.setLaunchedStatus(true);
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

app.post("/elections/new", async (request, response)=> {
  const title1= request.body.title;
  const loggedInUser = request.user.id;
  //const loggedInUser = request.body.id;

  try {
    const Election1=await election.addelection({
      title:request.body.title,
      adminId:loggedInUser,
      
    });
    
    //return response.redirect("/elections1");
    response.redirect("/elections");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});




app.get("/elections1/:id/preview",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const Election1 = await election.findByPk(request.params.id);
  const questions = await question.getall(request.params.id);
  //const options = await option.findAll({ where: { questionid: questions } });
  const questionoptions = [];
  for (let i = 0; i < questions.length; i++) {
      const alloptions = await option.getall(questions[i].id);
      questionoptions.push(alloptions);
      }
  
  try {
    response.render("preview", {
      id: request.params.id,
      title1:request.params.id.title,
        Election1,
        data:questions,
        questionoptions,
        csrfToken: request.csrfToken(),
  })
}
   catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});




app.get('/elections1', connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  console.log(request.params.id)
  const elections = await election.findByPk(request.params.id);
  const questions = await question.getall(elections);
  const options = await option.findAll({ where: { questionid: questions } });
  const voters1 = await voters.findAll({ where: { electionid: elections } });
  const questionscount = await question.countquestions(
    request.params.id
  );
  const voterscount = await voters.countvoters(request.params.id);
  response.render("elections1", {
    id: request.params.id,
    title1: request.params.id.title,
      elections,
      questions,
      options,
       voters1,
      questionscount,
      voterscount, 
      csrfToken: request.csrfToken(),
       
  
});
});



app.get('/elections1/:id', connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  console.log(request.params.id)
  const Election1 = await election.findByPk(request.params.id);
  const questions = await question.getall(request.params.id);
  //const options = await option.findAll({ where: { questionid: questions } });
  const voters1 = await voters.findAll({ where: { electionid: request.params.id } });
  const questionscount = await question.countquestions(
    request.params.id
  );
  const voterscount = await voters.countvoters(request.params.id);
  response.render("elections1", { 
    id: request.params.id,
    title1:request.params.id.title,
      Election1,
      questions,
     // options,
       voters1,
      questionscount,
      voterscount, 
      csrfToken: request.csrfToken(),
  
});
});




app.get("/elections1/:id/launch",connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const Election1 = await election.findByPk(request.params.id);
  const voters1 = await voters.findAll({ where: { electionid: request.params.id } });
  const questions = await question.getall(request.params.id);
  const questionscount = await question.countquestions(
    request.params.id
  );
  const questionoptions = [];
  const voteslist =  [];
      for (let i = 0; i < questions.length; i++) {
          const alloptions = await option.getall(questions[i].id);
          questionoptions.push(alloptions);
          for (let j=0;j<alloptions.length;j++){
            const voted = await votes.countvotes(alloptions[j].id);
            voteslist.push(voted);
          }
          }
      
  
  const electionurl = "elections1/" + Election1.id + "/voting";
  const voterscount = await voters.countvoters(request.params.id);


  const allvoters = await voters.getall(request.params.id);
  let count1=0
for (let j=0;j<allvoters.length;j++){
  const voted = await votes.countvoters(allvoters[j].id);
  if(voted>0){
    count1=count1+1
  }
  
}



  try {
    const updatedelection = await Election1.setLaunchedStatus(true);
    response.render("result", {
      id: request.params.id,
      title1:request.params.id.title,
        Election1,
        data:questions,
        count1,
        questionoptions,
         voters1,
        questionscount,
        voteslist,
        url:electionurl,
        voterscount, 
        csrfToken: request.csrfToken(),
  })
}
   catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});


app.get('/elections1/:id/voting', async function(request,response){
  console.log(request.params.id)
  
  const Election1 = await election.findByPk(request.params.id);
  const questions = await question.getall(request.params.id);
  const voters1 = await voters.findAll({ where: { electionid: request.params.id } });
  const questionscount = await question.countquestions(
    request.params.id
  );
      const questionoptions = [];
      const voteslist =  [];
      for (let i = 0; i < questions.length; i++) {
          const alloptions = await option.getall(questions[i].id);
          questionoptions.push(alloptions);
          for (let j=0;j<alloptions.length;j++){
            const voted = await votes.countvotes(alloptions[j].id);
            voteslist.push(voted);
          }
          }
      const electionurl =  "elections1/" + Election1.id + "/voting";
      const voterscount = await voters.countvoters(request.params.id);
    
      console.log("voters",voterscount)
    
      const allvoters = await voters.getall(request.params.id);
        let count1=0
      for (let j=0;j<allvoters.length;j++){
        const voted = await votes.countvoters(allvoters[j].id);
        if(voted>0){
          count1=count1+1
        }
        
      }



  if(Election1.status)
  {
    
  response.render("user-login", {
    id: request.params.id,
    title1:Election1.title,
      Election1,
      data:questions,
      questionoptions,
       voters1,
       count1,
       voteslist,
       voterscount,
      questionscount,
      voterscount, 
      csrfToken: request.csrfToken(),
  
});
  }
  else{

  
  response.render("user-login", {
    id: request.params.id,
    title1:Election1.title,
      Election1,
      csrfToken: request.csrfToken(),
  
});
  }
});




app.get('/elections1/:id/vote', async function(request,response){
  console.log("electionid",request.params.id)
  console.log("userid",request.user.id)

  const Election1 = await election.findByPk(request.params.id);

  const voter = await votes.getall(request.user.id);
  console.log("voter voted",voter)
  if (Election1.launched==true) {
    const questions = await question.getall(request.params.id);
    const questionscount = await question.countquestions(
      request.params.id
    );

  const questionoptions = [];
  for (let i = 0; i < questions.length; i++) {
      const alloptions = await option.getall(questions[i].id);
      questionoptions.push(alloptions);
      }
  

  response.render("vote", {
    voterid:request.user.id,
    id: request.params.id,
    title1:Election1.title,
      Election1,
      questions,
      questionoptions,
      questionscount,
      csrfToken: request.csrfToken(),
      voter
});
  }
});


app.post("/elections1/:id/addvote",async (request, response) => {
    const Election1 = await election.findByPk(request.params.id);
    console.log("voterid",request.user.id)
    try {
      const questions = await question.getall(request.params.id);
      const responseoptions = [];
      for (let i = 0; i < questions.length; i++) {
          const optionsids = await request.body[`${questions[i].id}`];
          await votes.addvotes(request.user.id, questions[i].id,optionsids);
          }
      return response.redirect(`/elections1/${request.params.id}/vote`);
    } catch (error) {
      console.log(error);
      return response.send(error);
    }
  }
);



app.post('/elections1/:id/vote',
  passport.authenticate("voter-local", {
    failureRedirect: "back",
    failureFlash: true,
  }),
  function (request, response) {
    return response.redirect(`/elections1/${request.params.id}/vote`);
  }
);





app.get('/result/:id', connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  console.log("id",request.params.id)
  const Election1 = await election.findByPk(request.params.id);
  const questions = await question.getall(request.params.id);
  const questionscount = await question.countquestions(
    request.params.id
  );
  const questionoptions = [];
  const voteslist =  [];
  for (let i = 0; i < questions.length; i++) {
      const alloptions = await option.getall(questions[i].id);
      questionoptions.push(alloptions);
      for (let j=0;j<alloptions.length;j++){
        const voted = await votes.countvotes(alloptions[j].id);
        voteslist.push(voted);
      }
      }
  const electionurl =  "elections1/" + Election1.id + "/voting";
  const voterscount = await voters.countvoters(request.params.id);

  console.log("voters",voterscount)

  const allvoters = await voters.getall(request.params.id);
    let count1=0
  for (let j=0;j<allvoters.length;j++){
    const voted = await votes.countvoters(allvoters[j].id);
    if(voted>0){
      count1=count1+1
    }
    
  }
console.log("count",count1)
  response.render("result", {
    id: request.params.id,
    title1:Election1.title,
      Election1,
      url:electionurl,
      data:questions,
      questionoptions,
      voteslist,
      questionscount,
      voterscount, 
      count1,
      csrfToken: request.csrfToken(),
  
});
});



app.post("/addvoters/:id", async (request,response)=>{

  const hashedpwd = await bcrypt.hash(request.body.password,saltRounds)
  
  const email=request.body.voterid
  const Election1 = await election.findByPk(request.params.id);
  console.log(email)
  console.log("newelec", request.params.id)
  
try{
  
  const voters1 = await voters.addvoters({
    email:email,
    password:hashedpwd,
    electionid:request.params.id,
    
  });
  
  if (request.accepts("html")) {
    console.log("Html Request");
    return response.redirect(`/elections1/${request.params.id}/voters`);
}
else {
    return response.json(voters1);
}
  
}
catch(error){
console.log(error);
request.flash("error", error.message);
// return response.redirect("/elections1");
}

});

app.get('/elections1/:id/voters',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
  const election1 = await election.findByPk(request.params.id);
  const voters1 = await voters.findAll({ where: { electionid: request.params.id } });
  //const elections = await election.findByPk(request.params.id);
  //const questions = await question.getall(elections);
  //const options = await option.findAll({ where: { questionid: questions } });
  //const voters1 = await voters.findAll({ where: { electionid: elections } });
  
  response.render("voters", {
    id:request.params.id,
    election1,
    data:voters1, 
    csrfToken: request.csrfToken(),
  
});
});



app.put('/elections1/:id/:vid',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
  
  const elections1 = await election.findByPk(request.params.id);
  const voters1 = await voters.findAll({ where: { id: request.params.vid } });
  
  console.log("votersid", request.params.vid)
  console.log("email",request.body.email)
  try {
    await voters.modifyvoters(
      request.body.email,
      request.params.vid,
      request.params.id,
      
      );
      
    return response.redirect(`/elections1/${request.params.id}/question/${request.params.quesid}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }


});



app.delete("/elections1/:id/:voterId", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("We have to delete a Voter with ID: ", request.params.voterId);
  const voter1 = await voters.findByPk(request.params.voterId);
  try {
      if (voter1 == null)
          return response.send(false);
      else {
          voters.deletevoter(request.params.voterId);
          return response.send(true);
      }
  } catch (error) {
      console.log(error);
      return response.status(422).json(error);
  }

});


app.get('/new',connectEnsureLogin.ensureLoggedIn(),function(req,res){
    res.render('new',{csrfToken: req.csrfToken()});
});



app.post("/addvoters/:id", async (request,response)=>{

  const hashedpwd = await bcrypt.hash(request.body.password,saltRounds)
  
  const email=request.body.voterid
  const Election1 = await election.findByPk(request.params.id);
  console.log(email)
  console.log("newelec", request.params.id)
  
try{
  
  const voters1 = await voters.addvoters({
    email:email,
    password:hashedpwd,
    electionid:request.params.id,
    
  });
  
  if (request.accepts("html")) {
    console.log("Html Request");
    return response.redirect(`/elections1/${request.params.id}/voters`);
}
else {
    return response.json(voters1);
}
  
}
catch(error){
console.log(error);
request.flash("error", error.message);
// return response.redirect("/elections1");
}

});

app.get('/elections1/:id/question',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
  const election1 = await election.findByPk(request.params.id);
  const questions1 = await question.findAll({ where: { electionid: request.params.id } });
  //const elections = await election.findByPk(request.params.id);
  //const questions = await question.getall(elections);
  
  //const options = await option.findAll({ where: { questionid: questions1[i] } });
  //const voters1 = await voters.findAll({ where: { electionid: elections } });
  
  response.render("question", {
    id:request.params.id,
    election1,
    data:questions1, 
    //options,
    csrfToken: request.csrfToken(),
  
});
});




app.post("/addquestion/:id",connectEnsureLogin.ensureLoggedIn(),async (request, response)=> {
  //const electionID = await election.findByPk(request.params.id);
 // console.log("id ",electionID);
  console.log("id2", request.params.id);
  
  //const Questions = await question.findAll({ where: { electionId: electionID } });
  try {
    const ques=await question.addquestion(
      request.body.questiontext,
      request.body.description,
      request.params.id);
      console.log("questionid", ques.id);
    return response.redirect(`/elections1/${request.params.id}/question/${ques.id}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});




app.post("/elections1/:id/options/:quesid",connectEnsureLogin.ensureLoggedIn(),async (request, response)=> {
  //const electionID = await election.findByPk(request.params.id);
 // console.log("id ",electionID);
  console.log("electionid", request.params.id);
  console.log("questionid", request.params.quesid);
  console.log("title", request.body.title);
  //const Questions = await question.findAll({ where: { electionId: electionID } });
  try {
    await option.addoption(
      request.body.title,
      request.params.quesid);
    return response.redirect(`/elections1/${request.params.id}/question/${request.params.quesid}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/elections1/:id/options/:quesid", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("We have to delete an option with ID: ", request.params.id);
  const option1 = await option.findByPk(request.params.id);
  console.log("option",option1.option)
  console.log("option",request.params.quesid)
  try {
      if (option1 == null)
          return response.send(false);
      else {  
        option.removeoption(request.params.id,request.params.quesid);
          return response.send(true);
      }
  } catch (error) {
      console.log(error);
      return response.status(422).json(error);
  }

});



app.put('/elections1/:id/options/:rid',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
  
  const questions1 = await question.findByPk(request.params.id);
  const options = await option.findAll({ where: { questionid: request.params.rid } });
  
  console.log("questions",questions1)
  console.log("option",options)
  console.log("title",request.body.title)
  try {
    await option.modifyoption(
      request.body.title,
      request.params.rid,
     
      request.params.id,
      
      );
      
    return response.redirect(`/elections1/${request.params.id}/question/${request.params.quesid}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }


});



app.get('/elections1/:id/question/:quesid',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
  const election1 = await election.findByPk(request.params.id);
  const questions1 = await question.findByPk(request.params.quesid);
  const options = await option.findAll({ where: { questionid: request.params.quesid } });
  
  console.log("questions",questions1)
  console.log("questionstext",questions1.question)
  console.log("questions description",questions1.description)
  

  response.render("addoption", {
    id:request.params.id,
    election1,
    data:questions1, 
    options,
    quesid:request.params.quesid,
    csrfToken: request.csrfToken(),
  
});
});



app.put('/elections1/:id/question/:quesid',connectEnsureLogin.ensureLoggedIn(), async function(request,response){
  const election1 = await election.findByPk(request.params.id);
  const questions1 = await question.findByPk(request.params.quesid);
  const options = await option.findAll({ where: { questionid: request.params.quesid } });
  
  console.log("questions",questions1)
  console.log("questionstext",request.body.question)
  console.log("questions description",request.body.description)
  try {
    await question.modifyquestion(
      request.body.question,
      request.body.description,
      request.params.quesid,
      request.params.id,
      
      );
      
    return response.redirect(`/elections1/${request.params.id}/question/${request.params.quesid}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }


});
 
app.delete("/elections1/:id/question/:questionid", connectEnsureLogin.ensureLoggedIn(), async function (request, response) {
  console.log("We have to delete a question  with ID: ", request.params.questionid);
  const question1 = await question.findByPk(request.params.questionid);
  try {
      if (question1 == null)
          return response.send(false);
      else {
        option.deletealloptions(request.params.questionid);
        await question.deletequestion1(request.params.questionid,request.params.id);
          return response.send(true);
      }
  } catch (error) {
      console.log(error);
      return response.status(422).json(error);
  }

});





 
app.get('/signup',function(req,res){
    res.render('signup',{csrfToken: req.csrfToken()});
});

app.get("/signout",(request,response,next)=>{
  const role1 = session.role;
  request.logout((err)=>{
    if(err)
    {
      return next(err);
    }
    else {
      if (role1 == 'admin') {
          return response.redirect("/");
      } else {
          return response.redirect("/user-login");
      }
  }
    
  })
})

app.get('/admin-login',function(req,res){
    res.render('admin-login',{csrfToken:req.csrfToken()});
});

app.get('/user-login',function(req,res){
    res.render('user-login',{csrfToken:req.csrfToken()});
});




module.exports = app;