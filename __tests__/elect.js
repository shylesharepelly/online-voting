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
      console.log("response",response.text)
      expect(response.statusCode).toBe(302);

  });
  
});