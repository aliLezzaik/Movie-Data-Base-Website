const fs = require("fs");
// Loading the movies from the database.
function loadMovies() {
    return require("./movie-data.json");
}
// Reading the people json file
function readPeople() {
    return require("./people.json");
}
// People who played the most movies with this actor
function frequentActors(name) {
    let movies = loadMovies();
    let similarActors = {};
    for (let i = 0; i < movies.length; i++) {
        let actors = movies[i].Actors.split(", ");

        if (!movies[i].Actors.toLowerCase().includes(name.toLowerCase())) {
            continue;
        }
        for (let j = 0; j < actors.length; j++) {
            if (actors[j] == name) continue;
            if (similarActors[actors[j]] == null) {
                similarActors[actors[j]] = 1;
            } else{
                similarActors[actors[j]]++;
            }
        }
        if (movies[i].Director == name) {
            continue;
        }
        if (similarActors[movies[i].Director] == null) {
            similarActors[movies[i].Director] = 1;
        } else similarActors[movies[i].Director]++;
    }
    let arr = Object.keys(similarActors).map(function(key) {
        return [key, similarActors[key]]
    });
    arr.sort(function(a, b) {
        return b[1] - a[1];
    });
    return arr;
}

// Writing people with specified names.
function writePeople(name) {
    let currentPpl = readPeople().people;
    currentPpl.push({name: name, id: currentPpl.length == 0 ? 10000: currentPpl[currentPpl.length-1].id + 1, frequentActors: frequentActors(name), movies: moviesByPerson(name)});
    fs.writeFileSync("./people.json", JSON.stringify({people: currentPpl}), function(err) {
        if (err) console.log(err);
    });
}

// Initializing all of the people
function initializePeople() {
    if (readPeople().people.length == 0) {
        let movies = loadMovies();
        for (let i = 0; i < movies.length; i++) {
            let actors = movies[i].Actors.split(", ");
            for (let j = 0; j < actors.length; j++) {
                if (!hasName(actors[j])) {
                    writePeople(actors[j]);
                }
            }
            if (!hasName(movies[i].Director)) writePeople(movies[i].Director);
        }
    }
}
// Indicates whethter the actor has already been initialized
function hasName(name) {
    let people = readPeople().people;
    for (let i = 0; i < people.length; i++) {
        if (people[i].name === name) {
            return true;
        }
    }
    return false;
}
// Providing the name of the person using their id
function nameById(id) {
    let people = readPeople().people;
    for (let i = 0; i < people.length; i++) {
        if (people[i].id === id) {
            return people[i].name;
        }
    }
    return "";
}
// Providing the id of the person by their name
function idByName(name) {
    let people = readPeople().people;
    for (let i = 0; i < people.length; i++) {
        if (people[i].name === name) {
            return people[i].id;
        }
    }
    return -1;
}
// Getting the movies from the person's name
function moviesByPerson(name) {
    let movies = loadMovies();
    let result = [];
    for ( let i = 0; i < movies.length; i++) {
        if (movies[i].Actors.includes(name)) {
            result.push(movies[i].Title);
        } else if (movies[i].Director.includes(name)) result.push(movies[i].Title);
    }
    return result;
}
// Getting the id of the movie
function getMovieId(name) {
    let movies = loadMovies();
    for (let i = 0; i < movies.length; i++) {
        if (movies[i].Title === name) {
            return movies[i].imdbID;
        }
    }
    return -1;
}

function containsPerson(name) {
    let people = readPeople().people;
    for (let i = 0; i < people.length; i++) {
        if (name === people[i].name) return true;
    }
    return false;
}

module.exports = {initializePeople, writePeople, readPeople, idByName, nameById, getMovieId, loadMovies, containsPerson};