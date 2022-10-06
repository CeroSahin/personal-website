require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const https = require("https");

const app = express();
app.use(express.static("public"));

app.set('views', "views");
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));


mongoose
  .connect("mongodb+srv://ceronimo:Toros1989@cluster0.9ceguss.mongodb.net/archiveDB", {
    useNewUrlParser:true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("DB CONNECTED!");
  });

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: String
});

const Post = mongoose.model("post", postSchema);


// --------- APP ROUTES --------//
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/blog", function(req, res) {
  Post.find({}, function(err, foundPosts) {
    if (!err) {
      res.render("blog", {
        allArticles: foundPosts
      });
    } else {
      res.redirect("/"); // if a person is redirected because of some error in the backend, make a popup indicating that.
    }
  });
  
});


// compose a new post.
app.get("/compose", function(req, res) {

  const passedPostName = req.query.postName;

  Post.findOne({title: passedPostName}, function(err, foundPost) {
    const given = foundPost === null ? false : true;
    res.render("compose", {post : foundPost, given : given});
  });

})

// contact page.
app.get("/contact", function(req, res) {
  res.render("contact");
})

// get single post.
app.get("/posts/:postTitle", async function(req, res) {
  const wantedPost = req.params.postTitle;
  const post = await Post.findOne({title:wantedPost});
  res.render("post", {foundPost:post})
}); 

app.get("/control", function(req, res) {
  const msg = req.query.msg;
  res.render("control", {msg: msg});
})

// POST ROUTES

// submit a new post.
app.post("/compose", async function(req, res) {

  const isEdited = req.body.isEdited;
  const newPostTitle = req.body.postTitle;
  const newContent = req.body.content;

  const today = new Date();
  const editedDate = today.toLocaleDateString("tr");

  if (isEdited != "") {
    console.log("I'm here trying to edit!");
    // edit the post.
    const updatedPost = await Post.updateOne({title : isEdited}, {
      title : newPostTitle,
      content : newContent,
      date : editedDate,
    });
  } else {
    console.log("I'm here trying to create a new post.");
    // create new post.
    const post = new Post({
      title: newPostTitle,
      content: newContent,
      date: editedDate,
    });

    console.log(post.editedDate);

    Post.create(post, function(err, response) {
      console.log("created a new post.");
    });
  }

  res.redirect("/blog");

})

// delete or edit a post.
app.post("/handle", function(req, res) {

  const { actions, postTitle, password} = req.body;
  console.log(actions, postTitle, password);
  console.log(req.body);

  if (password === "Ophelia") {
    if (actions ===  "edit") {

      // find the post and render the compose page with that post.
      Post.findOne({title: postTitle}, function(err, foundPost) {
        console.log(foundPost.content);
        if (foundPost != null) {
          res.redirect("/compose?postName="+foundPost.title);
        } else {
          var message = "Couldn't find the post.";
          res.redirect("/control?msg="+message);
        }
      });

    } else if (actions === "delete") {

      // delete the post.
      Post.deleteOne({title:postTitle}, function(err, foundPost) {
        if (foundPost != null) {
          res.redirect("/blog");
        } else {
          var message = "Couldn't find the post.";
          res.redirect("/control?msg="+message);
        }
      });

    }
  } else {
    var message = "Password incorrect.";
    res.redirect("/control?msg="+message);
  }


});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
})
