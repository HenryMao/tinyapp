const express = require("express");
const {findUser, generateRandString} = require('./helpers');
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['123']
}));

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userID1"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "userID2"}
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
};
//global flag to keep track of whether any user is logged in
let logged = false;
//endpoint for when logging in
app.post("/login", (req, res) => {
  //first determines whether the user is found in database 
  // makes sure that a user has registered before
  if (findUser(req.body.email,users)) {
    let temp = users[findUser(req.body.email, users)].id;
    //if the user is registered this if checks email and encrypted passwords
    if (bcrypt.compareSync(req.body.password, users[findUser(req.body.email, users)].password)) {
      req.session.user_id = temp;
      logged = true;
      res.redirect("/urls");
    } else {
      //situation for when user enters the wrong passwords
      let templateVars = {user: users[req.session.user_id], content: "wrong password"};
      res.render("alert", templateVars);
    }
  } else {
    //situation for when attempting to login without being registered
    let templateVars = {user: users[req.session.user_id], content: "no account found, please register"};
    res.render("alert", templateVars);
  }
});
//endpoint for logging out, changes the logged flag to false, redirects to url
app.post("/logout", (req, res) => {
  req.session.user_id = null;

  res.redirect("/urls");
  logged = false;
});
//endpoint for adding urls
app.post("/urls", (req, res) => {
  let tempUrl = generateRandString();
  if (logged) {
    urlDatabase[tempUrl] = {longURL:"", userID:""};
    urlDatabase[tempUrl].longURL = req.body.longURL;
    urlDatabase[tempUrl].userID = req.session.user_id;
    
    res.redirect(`/urls/${tempUrl}`);
  } else {
    res.redirect("/urls");
  }
});
//endpoint for updating urls
app.post("/urls/:shortURL/update", (req, res) => {
  if (logged) {
    urlDatabase[req.params.shortURL] = {longURL: req.body.updateLongUrl, userID: req.session.user_id};

    res.redirect("/urls");
  } else {
    res.send(403);
  }
  
});
//endpoint for deleting url
app.post("/urls/:shortURL/delete", (req, res) => {
  if (logged) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send(403);
  }
});
//endpoint for registering a new user
app.post("/registration/register", (req,res) => {
  let tempId = generateRandString();
  //checks whether email and passwords are valid
  if (req.body.email === "" || req.body.password === "" || findUser(req.body.email, users)) {
    let templateVars = {user: users[req.session.user_id], content: "email and passwords not valid"};
    res.render("alert", templateVars);
  } else {
    //when valid, add user to database
    users[tempId] = {
      id: tempId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    //turn logged flag to true
    logged = true;
    req.session.user_id = tempId;
    res.redirect("/urls");
  }
});
//endpoint for when user clicks the shortlink
app.get("/u/:shortURL", (req, res) => {
  //checks for whether the shortlink exists
  if (urlDatabase[req.params.shortURL] === undefined) {
    let templateVars = {user: users[req.session.user_id], content: "Nonexistent short Link"};
    res.render("alert", templateVars);
  } else {
    //if short link exists redirect to original long link
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});
//page for registration
app.get("/registration", (req, res) => {
  let templateVars = {user: users[req.session.user_id], urls: urlDatabase };
  res.render("registration", templateVars);
});
//page for login
app.get("/login", (req,res) =>{
  let templateVars = {user: users[req.session.user_id], urls: urlDatabase};
  res.render("login",templateVars);
});
//page for creating a new url only when logged in
app.get("/urls/new", (req, res) => {
  if (!logged) {
    res.redirect("/login");
  } else {
    res.render("urls_new", {user: users[req.session.user_id]});
  }
});
//simply redirects to url page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//page for urls
app.get("/urls", (req, res) => {
  let allowed = urlsForUser(req.session.user_id);

  let templateVars = {user: users[req.session.user_id], urls: allowed, content: "Please Log in"};
  if (!logged) {
    res.render("alert", templateVars);
  } else {
    res.render("urls_index", templateVars);
  }
});
//page for showing the shortlink matching the original long link
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {};
  //checks whether the link was ever created
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send(400);
  } else {
    //if created and the user is logged in
    if (logged) {
      //and the author of the link does not match the current logged in user
      if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
        templateVars = {
          user: users[req.session.user_id], shortURL: shortURL, longURL: urlDatabase[shortURL].longURL
        };
        //display appropriate message
        res.render("prohib",templateVars);
      } else {
        //if all conditions pass then display urls show
        templateVars = {
          user: users[req.session.user_id], shortURL: shortURL, longURL: urlDatabase[shortURL].longURL
        };
        
        res.render("urls_show", templateVars);
      }
    } else {
      //if not logged in then prompt log in
      templateVars = {
        user: users[req.session.user_id], shortURL: shortURL, longURL: urlDatabase[shortURL].longURL, content: "Please log in first"
      };
      res.render("alert", templateVars);
    }
  }
});
//server listening
app.listen(PORT, () => {
  
});

//takes in a user id and return an object having short link as key and long link as value
const urlsForUser = function(userid) {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userid) {
      result[url] = urlDatabase[url].longURL;
    }
  }
  return result;
};
