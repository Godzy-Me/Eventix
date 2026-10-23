// seed/showSeeder.ts
import mongoose from "mongoose";
import dayjs from "dayjs";
import { MovieModel } from "../modules/movie/movie.model";
import { TheaterModel } from "../modules/theater/theater.model";
import { ShowModel } from "../modules/show/show.model";
import { config } from "../config/config";
import { generateSeatLayout } from "../utils/index";

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
  // 🔥 Fetch dynamically to prevent stale/broken ObjectIds
  const movies = await MovieModel.find({});
  
  // 🔍 Try matching by state, fallback or adjust if your schema uses `location`
  const theatres = await TheaterModel.find({ 
    $or: [{ state: "West Bengal" }, { location: "West Bengal" }] 
  });

  console.log(`📦 Found ${movies.length} movies and ${theatres.length} theaters in database.`);

  if (!movies.length || !theatres.length) {
    console.error("❌ Movies or theatres not found. Please ensure you seed movies and theaters first!");
    return;
  }

  const today = dayjs().startOf("day");

  for (const movie of movies) {
    for (const theatre of theatres) {
      for (let d = 0; d < 7; d++) { // ✅ next 7 days (matches the date picker on the movie page)
        const showDate = today.add(d, "day");
        const formattedDate = showDate.format("DD-MM-YYYY");
        const numShows = Math.floor(Math.random() * 3) + 3; // 3–5 shows
        const selectedSlots = fixedTimeSlots.slice(0, numShows);

        for (const slot of selectedSlots) {
          const newShow = new ShowModel({
            movie: movie._id,
            theater: theatre._id,
            location: theatre.state || theatre.location || "West Bengal",
            format: formats[Math.floor(Math.random() * formats.length)],
            audioType: "Dolby 7.1",
            startTime: slot.start, 
            date: formattedDate, // ✅ "DD-MM-YYYY" matches frontend/query format
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

  console.log("✅ Show seeding completed successfully for all movies in West Bengal.");
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