const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "Henry": {
    id: "Henry", 
    email: "Henry@1.com", 
    password: "123"
  },
 "123": {
    id: "123", 
    email: "123@1.com", 
    password: "123"
  }
}

app.post("/login", (req, res) => {
  if(findUser(req.body.email)){
    let temp = users[findUser(req.body.email)].id;
    if(users[findUser(req.body.email)].password === req.body.password){
      res.cookie('user_id', temp);
      res.redirect("/urls");
    }else{
      res.send(403);
    }
  }else{
    res.send(403);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  console.log(users);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let tempUrl = generateRandString();
  urlDatabase[tempUrl] = req.body.longURL;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${tempUrl}`);        // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.updateLongUrl;
  res.redirect("/urls");
});


app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/registration/register", (req,res) => {
  let tempId = generateRandString();
  if(req.body.email === "" || req.body.password === "" || findUser(req.body.email)){
    res.send(400);
  }else{
    users[tempId] = {
      id: tempId,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie("user_id", tempId);
    //console.log(users[tempId]);
    res.redirect("/urls");
  }
});
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/registration", (req, res) => {
  let templateVars = {user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("registration", templateVars);
});

app.get("/login", (req,res) =>{
  let templateVars = {user: users[req.cookies["user_id"]], urls: urlDatabase};
  res.render("login",templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {user: users[req.cookies["user_id"]]});
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {
    user: users[req.cookies["user_id"]], shortURL: shortURL, longURL: urlDatabase[shortURL]
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


const generateRandString = function(){
  let result = '';
  const alph = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for(let i = 0; i < 6; i++){
    result += alph.charAt(Math.floor(Math.random() * alph.length));
  }
  return result;
}

const findUser = function(email){
  for(let user in users){
    if(users[user].email === email){
      return user;
    }
  }
}