const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const fs = require('fs');
const userDb = require("./userDb.js");
const peopleDb = require("./peopleDb.js");
const initializePassport = require('./passport-config')
const { response } = require('express')
initializePassport(
  passport,
  email => userDb.getUsers().users.find(user => user.email === email),
  id => userDb.getUsers().users.find(user => user.id === id),
)

const users = []

app.use(express.json())
app.set('view-engine', 'ejs')

app.set('views', './views')

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }))
app.use(flash())
app.use(session({ secret: 'somevalue' }));
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))




//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


app.get('/chat',checkAuthenticated,  (req, res) => {
  res.render('chat.ejs', 
)
})

const users1 = {}

io.on('connection', socket => {
  socket.on('new-user', name => {
    users1[socket.id] = name
    socket.broadcast.emit('user-connected', name)
  })
  socket.on('send-chat-message', message => {
    socket.broadcast.emit('chat-message', { message: message, name: users1[socket.id] })
  })
  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', users1[socket.id])
    delete users1[socket.id]
  })
})







app.get('/viewActor', checkAuthenticated,function(req, res) {
  let rawdata = fs.readFileSync('movie-data.json');
  let mascots = JSON.parse(rawdata);
  peopleDb.initializePeople();
  let addedPeople = [];
  let currentPpl = peopleDb.readPeople().people;
  for (let i = 0; i < currentPpl.length; i++) {
    if (req.query.searchInput != null &&currentPpl[i].name.toLowerCase().includes(req.query.searchInput.toLocaleLowerCase())) {
      addedPeople.push(currentPpl[i]);
    }
  }
  res.render('ViewingPeople.ejs', {
      mascots: addedPeople,
    
  });
});
app.get("/backToNormal", function(req, res) {
  req.user.status="regular";
  userDb.updateUser(req.user);
  res.redirect("/");
});

app.get('/',checkAuthenticated,  function(req, res) {
  if (req.user.status == "contributing") {
    res.redirect("/special");
    return;
  }
  res.render('index.ejs')   
  });



app.get('/addPerson',checkAuthenticated,  function(req, res) {
    res.render('addPerson.ejs');
    let name = req.query.personName;
    if (name == null) {return;}
    peopleDb.writePeople(name);
    setPeopleDisplay();
    });


app.get('/intrested',checkAuthenticated,  function(req, res) {
  res.render('intrested.ejs', {recommendedMovies: userDb.recommendMovies(req.user)});   
  });

app.get('/similar',checkAuthenticated,  function(req, res) {
  res.render('similar.ejs')   
  });

app.get('/clock',checkAuthenticated,  function(req, res) {
  res.render('clock.ejs')   
  });

app.get('/like',checkAuthenticated,  function(req, res) {
  res.render('like.ejs')   
  });


app.get('/userFollow',checkAuthenticated,  function(req, res) {
  res.render('userFollow.ejs', {users: getFollowingUsersbyUser(req.user)});
  });
  
app.get('/addMovie', checkAuthenticated, (req, res) => {
  res.render('addMovie.ejs');
  let movieName = req.query.movieName;
  let actorName = req.query.actorName;
  let directorName = req.query.directorName;
  let writerName = req.query.writerName;
  if (movieName == null || actorName == null || directorName == null || writerName == null) {
    return;
  }
  let movies = require("./movie-data.json");
  if (directorName != null&& actorName != null &&peopleDb.containsPerson(directorName) &&  peopleDb.containsPerson(actorName)) {
    movies.push({    Title: movieName,
      Year: "N/A",
      Rated: "Not Rated",
      Released: "N/A",
      Runtime: "59 min",
      Genre: "Added Movie",
      Director: directorName,
      Writer: writerName,
      Actors: actorName,
      Plot: "Added movie",
      Language: "English",
      "Country": "Iran",
      Awards: "2 wins & 2 nominations.",
      Poster: "https://image.shutterstock.com/image-vector/online-cinema-art-movie-watching-260nw-584655766.jpg",
      Ratings: [{ "Source": "Internet Movie Database", "Value": "8.3/10" }],
      Metascore: "N/A",
      imdbRating: "8.3",
      imdbVotes: "39",
      imdbID: typeof movies[movies.length - 1].imdbID == "string"? 10000: movies[movies.length - 1].imdbID + 1,
      Type: "movie",
      DVD: "N/A",
      BoxOffice: "N/A",
      Production: "N/A",
      Website: "N/A",
      Response: "True"});
      fs.writeFile("./movie-data.json", JSON.stringify(movies), function(err) {
        if (err) console.log(err);
      });
      app.get("/"+movies[movies.length - 1].imdbID, function(req, res) {
        res.render("movies.ejs", {mascot:movies[movies.length - 1], calculateAverage:calculateAverage, idByName:peopleDb.idByName});
      });
  } 
  
});


app.get('/manageUsers', checkAuthenticated, (req, res) => {
  let rawdata = fs.readFileSync('users.json');

  let mascots = JSON.parse(rawdata);
  res.render('manageUsers.ejs', {
    mascots: userDb.getUsers().users,
    
    
      
  });
});
function peopleUserFollows(user) {
  let people = [];
  for (let i = 0; i < user.followingPeople.length; i++) {
    people.push(getPersonById(user.followingPeople[i]));
  }
  return people;
}

function getPersonById(id) {
  for (let i = 0; i < peopleDb.readPeople().people.length; i++) {
    if (peopleDb.readPeople().people[i].id === id) {
      return peopleDb.readPeople().people[i];
    }
  }
  return null;
}
app.get('/managePeople', checkAuthenticated, (req, res) => {

  let users = peopleUserFollows(req.user);
  res.render('managePeople.ejs', {
    users: users,
    
      
  });
});


app.get('/special',checkAuthenticated,  function(req, res) {
  let rawdata = fs.readFileSync('users.json');
  
  req.user.status = "contributing";
  userDb.updateUser(req.user);
  let mascots = JSON.parse(rawdata);
  
  
  
  res.render('specialUser.ejs', {
    mascots: mascots,
    
      
  });
});



app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})


app.get('/search', checkAuthenticated, function(req, res) {
  let rawdata = fs.readFileSync('movie-data.json');
  let mascots = JSON.parse(rawdata);

    let searched = req.query.searchbar;
    let items = []
    for (let i = 0; i < mascots.length; ++i) {
      if (searched == null) break;
      let rating = calculateAverage(mascots[i].Ratings) + "";
      if (mascots[i].Genre.toLowerCase().includes(searched.toLowerCase()) || mascots[i].Title.toLowerCase().includes(searched.toLowerCase()) || mascots[i].Year.toLowerCase().includes(searched.toLowerCase())
      || rating.includes(searched.toLowerCase())) {
        items.push(mascots[i]);
      }
    }
    res.render('search.ejs', {
      mascots: items,
      calculateAverage:calculateAverage
  });
  
});







//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))



app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    userDb.addUser(req.body.name, req.body.password, req.body.email, setUsersDisplay);
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})


app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

function calculateAverage(ratings) {
  let totalPercentage = 0;
  let totalCounted = 0;
  for (let i = 0; i < ratings.length;i++) {
    if (ratings[i].Value.indexOf('/') >-1) {
      let components = ratings[i].Value.split("/");
      totalPercentage+=(parseFloat(components[0])/parseFloat(components[1]))*100;
    } else {
      totalPercentage+=parseFloat(ratings[i].Value.replace("%",""));
    }
    totalCounted++;
  }
  return Math.round((totalPercentage / totalCounted)*100)/100;
}
function getReviews(movieId) {
  let users = userDb.getUsers().users;
  let finalReviews = [];
  for (let i = 0; i < users.length; i++) {
    let reviews = users[i].reviews;
    for (let j = 0; j < reviews.length; j++) {
      if (reviews[j][0] == movieId) {
        
        finalReviews.push([users[i].username, reviews[j][1], reviews[j][2]]);
      }
    }
  }
  
  return finalReviews;
}

function writeTheReview(rating, user, comment, movieId) {
  user.reviews.push([movieId, rating, comment]);
  userDb.updateUser(user);
}
function updateMovie(movie) {
  let movies = peopleDb.loadMovies();
  for (let i = 0; i < movies.length; i++) {
    if (movie.imdbID == movies[i].imdbID) {
      movies[i] = movie;
      break;
    }
  }
  fs.writeFile("movie-data.json", JSON.stringify(movies), function(err) {
    if (err) {
      console.log(err);
    }
  });
}
function setTheGets(){
  let rawdata = fs.readFileSync('movie-data.json');
  let mascots = JSON.parse(rawdata);
   mascots.forEach(function(mascot) { 
      app.get("/"+mascot.imdbID, function(req, res) {
        if (req.url.includes("?")) {
          writeTheReview(req.query.rating, req.user, req.query.comments, mascot.imdbID);
          res.redirect("/"+mascot.imdbID);
          return;
        }
        res.render("movies.ejs", {mascot:mascot, calculateAverage:calculateAverage, idByName:peopleDb.idByName, reviews: getReviews(mascot.imdbID)});
      });
      app.get("/edit/"+mascot.imdbID, (req, res) => {
        if (req.user.status == "contributing") {
          res.render('basicReveiw.ejs')   
          if (req.url.includes("?")) {
            // Todo: Modify the movie components
            mascot.Actors += ", "+ req.query.actorName;
            mascot.Director +=", "+ req.query.directorName;
            mascot.Writer += ", "+ req.query.writerName;
            updateMovie(mascot);
          }
        } else res.redirect("/"+mascot.imdbID);
      });
   })
}
setTheGets();

function followTxtUvU(user, id) {
  for (let i = 0; i <user.followingUsers.length; i++) {
    if (id == user.followingUsers[i]) {
      return "unfollow";
    }
  }
  return "follow";
}
function getUserById(id) {
  let users = userDb.getUsers().users;
  for (let i = 0; i < users.length; i++) {
    if (id == users[i].id) return users[i];
  }
  return null;
}
function getFollowingUsersbyUser(user) {
  let users = [];
  for (let i = 0; i < user.followingUsers.length; i++) {
    
    users.push(getUserById(user.followingUsers[i]));
  }
  return users;
}
function handleFollowUsersOperations(user, id) {
  for (let i = 0; i < user.followingUsers.length; i++) {
    if (user.followingUsers[i] == id) {
      user.followingUsers.splice(i, 1);
      userDb.updateUser(user);
      return;
    }
  }
  user.followingUsers.push(id);
  userDb.updateUser(user);
}
function movieNameById(id) {
  let movies = peopleDb.loadMovies();
  for (let i = 0; i < movies.length; i++) {
    if (movies[i].imdbID == id) {
      return movies[i].Title;
    }
  }
  return null;
}
function setUsersDisplay() {
  for (let i = 0; i < userDb.getUsers().users.length; i++) {
    let curusers = userDb.getUsers().users[i];
    app.get("/users/"+curusers.id, function(req, res) {
      if (curusers.id == req.user.id) {
        res.redirect("/");
        return;
      }
      if (req.url.toLowerCase().includes("?followbtn=")) {
        // Hnadling the following events
        handleFollowUsersOperations(req.user, curusers.id);
        res.redirect("/users/"+curusers.id);
        return;
      }
      res.render("userProf.ejs", {mascot:curusers, followtxt:followTxtUvU(req.user, curusers.id), followingUsers: getFollowingUsersbyUser(req.user), movieNames: movieNameById, userById: userDb.userByID, peopleName: peopleDb.nameById});

    });
  }
}
setUsersDisplay();

function followTxt(user, personId){
  if (user.followingPeople.includes(personId)) {
    return "unfollow";
  }
  return "follow";
}

function followPerson(user, personId){
  for (let i = 0; i < user.followingPeople.length; i++) {
    if (personId === user.followingPeople[i]){
      user.followingPeople.splice(i, 1);
      return;
    }
  }
  user.followingPeople.push(personId);
  userDb.updateUser(user);
}

function setPeopleDisplay() {
  let people = peopleDb.readPeople().people;
  for (let i = 0; i < people.length; i++) {
    app.get("/people/"+people[i].id, function(req, res) {
      if (req.url.includes("?followbtn=")) {
        followPerson(req.user, people[i].id);
        res.redirect("/people/"+people[i].id);
        return;
      }
      res.render("peopleProf.ejs", {mascots: people[i], findId: peopleDb.getMovieId, followTxt: followTxt(req.user, people[i].id)});
    });
  }
}
peopleDb.initializePeople();
setPeopleDisplay();

var PORT = process.env.PORT || 3000;
server.listen(PORT);
