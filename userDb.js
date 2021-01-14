const fs = require("fs");


function getUsers(){
    return require("./users.json");
}


function addIfNotExist(user) {
    let users = getUsers().users;
    for (let i = 0; i < users.length; i++) {
        if (users[i].id === user.id || users[i].email == user.email) {
            return false;
        }
    }
    return true;
}

function addUser(username, password, email, setUsers) {
    let currentUsers = getUsers().users;
    let user = {id: currentUsers.length == 0 ? 10000: currentUsers[currentUsers.length - 1].id + 1, username: username, password: password, email: email, status: "regular", followingPeople: [], followingUsers: [], reviews: []};
    if (addIfNotExist(user)) {
        currentUsers.push(user);
        fs.writeFile("./users.json", JSON.stringify({users: currentUsers}), function(err) {
            if (err) console.log("Error writing to the file");
        });
        setUsers();
    }
    
}


function updateUser(user) {
    let currentUsers = getUsers().users;
    for (let i = 0; i < currentUsers.length; i++) {
        if (currentUsers[i].id === user.id) {
            currentUsers[i] = user;
        }
    }
    fs.writeFile("./users.json", JSON.stringify({users: currentUsers}), function(err) {
        if (err) {console.log(err);}
    });
}

function userByID(id) {
    let users = getUsers().users;
    for (let i = 0; i < users.length; i++) {
        if (id === users[i].id) {
            return users[i];
        }
    }
    return null;
}

function provideMoviesGenresByID(id) {
    let allMovies = require("./movie-data.json");
    let ratedMovies;
    for (let i = 0; i < allMovies.length; i++) {
        if (id === allMovies[i].imdbID) {
            ratedMovies = allMovies[i].Genre.split(", ");
            return ratedMovies;
        }
    }
    return null;
}

function findMaximumIndex(array) {
    let index = 0;
    for (let i = 1; i < array.length; i++) {
        if (array[index] < array[i]) {
            index = i;
        }
    }
    return index;
}

function nextInt(bound) {
    let number = Math.floor(Math.random() * bound);
    return number;
}

function provideAMovie(times, types) {
    let highestIndex = findMaximumIndex(times);
    let allMovies = require("./movie-data.json");
    let recommendedMovie = allMovies[nextInt(allMovies.length)];
    if (times.length == 0) {
        return recommendedMovie;
    }
    while (!recommendedMovie.Genre.includes(types[highestIndex])) {
        recommendedMovie = allMovies[nextInt(allMovies.length)];
    }
    return recommendedMovie;
}

function recommendMovies(user) {
    let times = [];
    let types = [];
    for (let i = 0; i < user.reviews.length; i++) {
        let genres = provideMoviesGenresByID(user.reviews[i][0]);
        for (let j = 0; j < genres.length; j++) {
            if (!types.includes(genres[j])) {
                times.push(1);
                types.push(genres[j]);
            } else{
                let index = types.indexOf(genres[j]);
                times[index]++;
            }
        }
    }
    let recommended = [];
    for (let i = 0; i < 8; i++) {
        recommended.push(provideAMovie(times, types));
    }
    return recommended;
}

module.exports = {getUsers, addUser, updateUser, userByID, recommendMovies};