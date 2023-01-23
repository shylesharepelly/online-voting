/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
//const csrf = require("tiny-csrf")
const db = require("../models/index");
const app = require("../app");
let server, agent;
const { election, admin, option, voters, votes, question} = require("../models");

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  //console.log("ccc",$("[name=_csrf]"))
  return $("[name=_csrf]").val();
}



let login = async (agent, username, password) => {
  let res = await agent.get("/admin-login");
  let csrfToken = extractCsrfToken(res);
  console.log("Csrf2",csrfToken)
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken
  });
  return res;
  //console.log("res0", res);

}
describe("My-Voting-App", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => { });
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  test("Sign up for first user", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    console.log("Csrf1",csrfToken)
    res = await agent.post("/users").send({
      firstname: "Test",
      lastname: "User A",
      email: "user.a@test.com",
      password: "12345678",
      _csrf: csrfToken
    })
    console.log("res-sign:", res.text);
    expect(res.statusCode).toBe(302);
    
  });

  // test("Sign Out for first user", async () => {
  //   let res = await agent.get("/elections");
  //   const csrfToken = extractCsrfToken(res);
  //   res = await agent.get("/signout").send({
  //     _csrf: csrfToken
  //   })
  //   expect(res.statusCode).toBe(302);
  // });



  test("Sign up for first user signout", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });



  test("Sign up for second user", async () => {
    let response = await agent.get("/signup");
    const csrfToken = extractCsrfToken(response);
    response = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User B",
      email: "user.b@test.com",
      password: "12345678",
      _csrf: csrfToken
    })
    expect(response.statusCode).toBe(302);
  })

  

  test("Sign Out for second user", async () => {
    let response = await agent.get("/elections");
    const csrfToken = extractCsrfToken(response);
    response = await agent.get("/signout").send({
      _csrf: csrfToken
    })
    expect(response.statusCode).toBe(302);
  })


  test("Creates a new election", async () => {
    const r1 = await login(agent, "user.a@test.com", "12345678");
    let res1 = await agent.get("/new");
    const csrfToken = extractCsrfToken(res1);
      console.log("csrf3",csrfToken)
      const response = await agent.post("/elections/new").send({
        title: "President elections",
       _csrf: csrfToken,
      });
      //console.log("response",response.text)
      expect(response.statusCode).toBe(302);
  });
  

  test("Add Questions to election", async () => {
    const user1 = await login(agent, "user.a@test.com", "12345678");
    let res1 = await agent.get("/elections");
    const allElections = await election.findallelections();
    console.log("Count of elections:", allElections.length);
    const election1 = allElections[allElections.length - 1]

    let res = await agent.get("/elections1/" + election1.id );
    let csrfToken = extractCsrfToken(res);
    console.log("csrftoken 4 " + csrfToken);
    res = await agent.post("/addquestion/" + election1.id ).send({
      questiontext: "Who is the mayor",
      description: "Vote for mayor",
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302);

    const questions = await question.findAll();
    const question1 = questions[questions.length - 1]
    console.log("csrf token 5 " + csrfToken);

    res = await agent.get("/elections1/" + election1.id+ "/question/"+ question1.id);
    csrfToken = extractCsrfToken(res);

    res = await agent.post("/elections1/"+ election1.id + "/options/" + question1.id).send({
      title: "Nani",
     _csrf: csrfToken,
      quesid:question1.id
    })
    console.log("csrf token 6 " + csrfToken);
    //console.log("options1",res.text)
     let optionscount = await option.findAll();
     console.log("optionss",optionscount.length)
     expect(optionscount.length).toBe(1);

    res = await agent.get("/elections1/" + election1.id+ "/question/"+ question1.id);
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/elections1/"+ election1.id + "/options/" + question1.id).send({
      title: "Raj",
      _csrf: csrfToken,
      quesid:question1.id
    })
    console.log("csrf token 7 " + csrfToken);
    //console.log("options2",res.text)
     optionscount = await option.findAll();
    console.log("optionss",optionscount.length)
    expect(optionscount.length).toBe(2);
  });



  test("Adding Voter", async () => {
    const user1 = await login(agent, "user.a@test.com", "12345678");
    let res1 = await agent.get("/elections");
    const allElections = await election.findallelections();
    console.log("Count of elections:", allElections.length);
    const election1 = allElections[allElections.length - 1]

    let res = await agent.get("/elections1/" + election1.id );
    let csrfToken = extractCsrfToken(res);
    console.log("csrftoken 8 " + csrfToken);
    
    res = await agent.post("/addvoters/"+ election1.id ).send({
      voterid: "test@gmail.com",
      password: "test",
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302);
  });



  test("launch the election", async () => {
    const user1 = await login(agent, "user.a@test.com", "12345678");
    let res1 = await agent.get("/elections");
    const allElections = await election.findallelections();
    console.log("Count of elections:", allElections.length);
    const election1 = allElections[allElections.length - 1]
    let res = await agent.get("/elections1/" + election1.id );
    let csrfToken = extractCsrfToken(res);
    console.log("csrftoken 9 " + csrfToken);
    res = await agent.put("/elections/" + election1.id ).send({
      launched: true,
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(200);
    console.log(JSON.parse(res["text"])["launched"])
    const launchedStatus = JSON.parse(res["text"])["launched"];
    expect(launchedStatus).toBe(true);
  });




});