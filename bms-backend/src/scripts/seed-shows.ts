// seed/showSeeder.ts
import mongoose from "mongoose";
import dayjs from "dayjs";
import { MovieModel } from "../modules/movie/movie.model";
import { TheaterModel } from "../modules/theater/theater.model";
import { ShowModel } from "../modules/show/show.model";
import { config } from "../config/config";
import { generateSeatLayout } from "../utils/index"


const generatePriceMap = () =>
  new Map([
    ["PREMIUM", 510],
    ["EXECUTIVE", 290],
    ["NORMAL", 270],
  ]);

const formats = ["2D", "3D", "IMAX", "PVR PXL"];

// 🎞️ Realistic time slots
const fixedTimeSlots = [
  { start: "09:00 AM", end: "11:30 AM" },
  { start: "12:30 PM", end: "03:00 PM" },
  { start: "04:00 PM", end: "06:30 PM" },
  { start: "07:30 PM", end: "10:00 PM" },
  { start: "10:30 PM", end: "01:00 AM" },
];

const toDateWithTime = (baseDate: Date, timeStr: string) => {
  return dayjs(baseDate)
    .hour(dayjs(timeStr, ["hh:mm A"]).hour())
    .minute(dayjs(timeStr, ["hh:mm A"]).minute())
    .second(0)
    .toDate();
};

export const seedShow = async () => {

// NOTE:
// First seed your movies and then theaters.
// After that, select any two movies for which you want to create shows
// and paste their IDs in the movieIds array below.
// Also, pass your current state (e.g., "West Bengal") to filter theatres.
// This setup is only for testing purposes to avoid creating shows for all movies.

// Otherwise, you can also do the things below commented if you want to create shows for all movies and states
//  const movies = await MovieModel.find({});
//  const theatres = await TheaterModel.find({});

  
  const movieIds = ["68e224451aeabaafaa43ac58", "68e224451aeabaafaa43ac57"];
  const movies = await MovieModel.find({ _id: { $in: movieIds } });
  const theatres = await TheaterModel.find({ state: "West Bengal" });

  if (!movies.length || !theatres.length) {
    console.error("Movies or theatres not found. Please check IDs or state name.");
    return;
  }

  const today = dayjs().startOf("day");

  for (const movie of movies) {
    for (const theatre of theatres) {
      for (let d = 0; d < 2; d++) { // ✅ today and tomorrow
        const showDate = today.add(d, "day");
        const formattedDate = showDate.format("DD-MM-YYYY");
        const numShows = Math.floor(Math.random() * 3) + 2; // 2–4 shows
        const selectedSlots = fixedTimeSlots.slice(0, numShows);

        for (const slot of selectedSlots) {
          const startTime = toDateWithTime(showDate.toDate(), slot.start);
          const endTime = toDateWithTime(showDate.toDate(), slot.end);

          const newShow = new ShowModel({
            movie: movie._id,
            theater: theatre._id,
            location: theatre.state,
            format: formats[Math.floor(Math.random() * formats.length)],
            audioType: "Dolby 7.1",
            startTime: slot.start, 
            date: formattedDate, // ✅ "DD-MM-YYYY"
            priceMap: generatePriceMap(),
            seatLayout: generateSeatLayout(),
          });

          await newShow.save();
          console.log(
            `🎬 Show created for ${movie.title} at ${theatre.name} on ${formattedDate} (${slot.start} - ${slot.end})`
          );
        }
      }
    }
  }

  console.log("✅ Show seeding completed for selected movies in West Bengal.");
};

mongoose
  .connect(config.databaseUrl as string)
  .then(async () => {
    console.log("DB connected");
    await ShowModel.deleteMany({});
    console.log("🧹 Existing shows deleted.");
    await seedShow();
    mongoose.disconnect();
  })
  .catch((err) => console.log(err));
