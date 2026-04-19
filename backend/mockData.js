const movies = [
    {
        id: 1,
        title: "Inception",
        overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\".",
        poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
        genre_ids: [28, 878, 12],
        vote_average: 8.4,
        certification: "PG-13",
        providers: ["Netflix", "Amazon Prime"]
    },
    {
        id: 2,
        title: "The Dark Knight",
        overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
        poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        genre_ids: [18, 28, 80, 53],
        vote_average: 8.5,
        certification: "PG-13",
        providers: ["HBO Max"]
    },
    {
        id: 3,
        title: "Interstellar",
        overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
        poster_path: "/gEU2QlsUUHXjNpeEYZa7vP1vGZ1.jpg",
        genre_ids: [12, 18, 878],
        vote_average: 8.4,
        certification: "PG-13",
        providers: ["Paramount+", "Amazon Prime"]
    },
    {
        id: 4,
        title: "Toy Story",
        overview: "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene. Afraid of losing his place in Andy's heart, Woody plots against Buzz.",
        poster_path: "/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg",
        genre_ids: [16, 12, 10751, 35],
        vote_average: 8.0,
        certification: "G",
        providers: ["Disney+"]
    },
    {
        id: 5,
        title: "The Matrix",
        overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
        poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        genre_ids: [28, 878],
        vote_average: 8.2,
        certification: "R",
        providers: ["HBO Max", "Netflix"]
    },
    {
        id: 6,
        title: "Finding Nemo",
        overview: "Nemo, an adventurous young clownfish, is unexpectedly taken from his Great Barrier Reef home to a dentist's office aquarium.",
        poster_path: "/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg",
        genre_ids: [16, 10751],
        vote_average: 7.8,
        certification: "G",
        providers: ["Disney+"]
    },
    {
        id: 7,
        title: "Pulp Fiction",
        overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling, comedic crime caper.",
        poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
        genre_ids: [53, 80],
        vote_average: 8.9,
        certification: "R",
        providers: ["Amazon Prime"]
    },
    {
        id: 8,
        title: "Avengers: Endgame",
        overview: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions.",
        poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
        genre_ids: [12, 878, 28],
        vote_average: 8.3,
        certification: "PG-13",
        providers: ["Disney+"]
    },
    {
        id: 9,
        title: "Spirited Away",
        overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
        poster_path: "/39wmItIWsg5sZMyRUHLkBg8lWOb.jpg",
        genre_ids: [16, 10751, 14],
        vote_average: 8.5,
        certification: "PG",
        providers: ["HBO Max"]
    },
    {
        id: 10,
        title: "Spider-Man: Into the Spider-Verse",
        overview: "Miles Morales is juggling his life between being a high school student and being a spider-man. When Wilson \"Kingpin\" Fisk uses a super collider, others from across the Spider-Verse are transported to this dimension.",
        poster_path: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
        genre_ids: [28, 12, 16, 878],
        vote_average: 8.4,
        certification: "PG",
        providers: ["Netflix"]
    }
];

const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Kids" }, // Usually Family, mapped to Kids
    { id: 14, name: "Fantasy" },
    { id: 878, name: "Sci-Fi" },
    { id: 53, name: "Thriller" }
];

const providers = [
    "Netflix",
    "Amazon Prime",
    "Disney+",
    "HBO Max",
    "Paramount+",
    "Hulu",
    "Apple TV+"
];

const certifications = ["G", "PG", "PG-13", "R"];

module.exports = {
    movies,
    genres,
    providers,
    certifications
};
