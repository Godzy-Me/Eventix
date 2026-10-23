// File: src/modules/movie/movie.seed.ts

import mongoose from "mongoose";
import { MovieModel } from "../modules/movie/movie.model";
import { config } from "../config/config";

const movies = [
  {
    title: "Maa",
    genre: ["Fantasy", "Horror", "Mythological", "Thriller"],
    rating: 7.2,
    votes: 2700,
    languages: ["Hindi"],
    certification: "UA16+",
    duration: "2h 15m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790461/jn7silixkmp7caq0gpwr.avif",
    releaseDate: new Date("2025-06-27"),
    description:
      "The story of a mother who becomes Kali to end a demonic curse rooted in fear, blood, and betrayal.",
  },
  {
    title: "Kannappa",
    genre: ["Action", "Mythological"],
    rating: 7.3,
    votes: 10700,
    languages: ["Telugu", "Hindi", "Tamil", "Malayalam"],
    certification: "UA13+",
    duration: "2h 30m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790461/fkbk6wzzxrvbn3ysrums.avif",
    releaseDate: new Date("2025-08-01"),
    description: "The tale of Kannappa, a devoted follower of Lord Shiva.",
  },
  {
    title: "Mission: Impossible - The Final Reckoning",
    genre: ["Action", "Thriller"],
    rating: 8.6,
    votes: 84100,
    languages: ["English", "Hindi", "Telugu", "Tamil"],
    certification: "UA13+",
    duration: "2h 40m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790462/yomilxtf8umhsqekxzvv.avif",
    releaseDate: new Date("2025-07-18"),
    description:
      "Ethan Hunt returns for a high-stakes mission to save the world from impending doom.",
  },
  {
    title: "F1: The Movie",
    genre: ["Sports", "Documentary"],
    rating: 9.5,
    votes: 6800,
    languages: ["English", "Hindi", "Tamil", "Telugu"],
    certification: "UA16+",
    duration: "2h",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790461/psdublbrlv4crojvtzqc.avif",
    releaseDate: new Date("2025-07-10"),
    description:
      "An inside look at the world of Formula 1 racing and its iconic champions.",
      format: ["2D", "3D", "IMAX 3D"]
  },
  {
    title: "From the World of John Wick: Ballerina",
    genre: ["Action", "Thriller"],
    rating: 8.7,
    votes: 15200,
    languages: ["English"],
    certification: "A",
    duration: "2h 10m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790461/pdw9hxw1xlz1abpyenzc.avif",
    releaseDate: new Date("2025-07-25"),
    description:
      "A ballerina assassin seeks revenge in the dark world of the High Table.",
  },
  {
    title: "Metro In Dino",
    genre: ["Romance", "Drama"],
    rating: 7.5,
    votes: 8600,
    languages: ["Hindi"],
    certification: "UA",
    duration: "2h 10m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751826680/u4vtkrc4iinsiyjwqrsu.avif",
    releaseDate: "2025-09-02",
    description:
      "Multiple stories of love and life intertwine in the bustling metro city of Mumbai.",
  },
  {
    title: "How to Train Your Dragon: Return of Night Fury",
    genre: ["Animation", "Fantasy", "Adventure"],
    rating: 8.8,
    votes: 32500,
    languages: ["English", "Hindi"],
    certification: "UA",
    duration: "1h 45m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751826680/lkpu6rs2rxu4jckxtony.avif",
    releaseDate: "2025-09-10",
    description:
      "Hiccup and Toothless return for a magical journey as a new Night Fury rises.",
      format: ["2D", "3D"]
  },

  {
    title: "Jurassic Park: Rebirth",
    genre: ["Sci-Fi", "Adventure", "Action"],
    rating: 9.0,
    votes: 60500,
    languages: ["English", "Hindi", "Tamil", "Telugu"],
    certification: "UA16+",
    duration: "2h 35m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790815/kw1gearclw4vjmnkxw0o.avif",
    releaseDate: "2025-09-01",
    description:
      "Dinosaurs return in a world no longer in control — the race for survival begins anew.",
    format: ["2D", "3D", "IMAX 3D"]
  },
  {
    title: "Sitaare Zameen Par",
    genre: ["Drama", "Family"],
    rating: 8.5,
    votes: 39600,
    languages: ["Hindi"],
    certification: "UA",
    duration: "2h 20m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790462/huw3x0efjerh3zxoqtaq.avif",
    releaseDate: "2025-07-12",
    description:
      "A heartwarming story of a teacher who helps a dyslexic child discover the star within.",
  },
  {
    title: "M3GAN 2.0",
    genre: ["Horror", "Sci-Fi", "Thriller"],
    rating: 8.4,
    votes: 117,
    languages: ["English", "Hindi"],
    certification: "A",
    duration: "1h 55m",
    posterUrl:
      "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751790461/zfxzrvffdu8zfled6nzt.avif",
    releaseDate: "2025-07-22",
    description:
      "M3GAN returns with upgraded AI and deadlier instincts in this spine-chilling tech horror sequel.",
  },
];

const seedMovies = async () => {
  try {
    await mongoose.connect(config.databaseUrl as string);
    console.log("Connected to DB");

    await MovieModel.deleteMany();
    await MovieModel.insertMany(movies);

    console.log("Movies seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding movies:", err);
    process.exit(1);
  }
};

seedMovies();
