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

let logged = false;

app.post("/login", (req, res) => {
  if (findUser(req.body.email,users)) {
    let temp = users[findUser(req.body.email, users)].id;
    if (bcrypt.compareSync(req.body.password, users[findUser(req.body.email, users)].password)) {
      req.session.user_id = temp;
      logged = true;
      res.redirect("/urls");
    } else {
      res.send(403);
    }
  } else {
    res.send(403);
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;

  res.redirect("/urls");
  logged = false;
});

app.post("/urls", (req, res) => {
  let tempUrl = generateRandString();
  if (logged) {
    urlDatabase[tempUrl] = {longURL:"", userID:""};
    urlDatabase[tempUrl].longURL = req.body.longURL;
    urlDatabase[tempUrl].userID = req.session.user_id;
    console.log(req);
    
    res.redirect(`/urls/${tempUrl}`);
  } else {
    res.redirect("/urls");
  }
  // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = {longURL: req.body.updateLongUrl, userID: req.session.user_id};

  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (logged) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send(403);
  }
});

app.post("/registration/register", (req,res) => {
  let tempId = generateRandString();
  if (req.body.email === "" || req.body.password === "" || findUser(req.body.email, users)) {
    res.send(400);
  } else {
    users[tempId] = {
      id: tempId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };

    logged = true;
    req.session.user_id = tempId;
    res.redirect("/urls");
  }
});
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send(400);
  } else {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get("/registration", (req, res) => {
  let templateVars = {user: users[req.session.user_id], urls: urlDatabase };
  res.render("registration", templateVars);
});

app.get("/login", (req,res) =>{
  let templateVars = {user: users[req.session.user_id], urls: urlDatabase};
  res.render("login",templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!logged) {
    res.redirect("/login");
  } else {
    res.render("urls_new", {user: users[req.session.user_id]});
  }
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
  let allowed = urlsForUser(req.session.user_id);

  let templateVars = {user: users[req.session.user_id], urls: allowed };
  if (!logged) {
    res.render("alert", templateVars);
  } else {
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {};
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send(400);
  } else {
    if (logged) {
      if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
        templateVars = {
          user: users[req.session.user_id], shortURL: shortURL, longURL: urlDatabase[shortURL].longURL
        };
        res.render("prohib",templateVars);
      } else {
        templateVars = {
          user: users[req.session.user_id], shortURL: shortURL, longURL: urlDatabase[shortURL].longURL
        };
        
        res.render("urls_show", templateVars);
      }
    } else {
      templateVars = {
        user: users[req.session.user_id], shortURL: shortURL, longURL: urlDatabase[shortURL].longURL
      };
      res.render("alert", templateVars);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


const urlsForUser = function(userid) {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userid) {
      result[url] = urlDatabase[url].longURL;
    }
  }
  return result;
};
