import mongoose from "mongoose";
import dotenv from "dotenv";
import { TheaterModel } from "../modules/theater/theater.model";
import { config } from "../config/config";

dotenv.config();

mongoose
  .connect(config.databaseUrl as string)
  .then(async () => {
    console.log("Connected to MongoDB ✅");

    const cities = [
      {
        name: "Mumbai",
        state: "Maharashtra",
        areas: ["Andheri", "Bandra", "Powai", "Borivali"],
      },
      {
        name: "Delhi",
        state: "Delhi",
        areas: ["Connaught Place", "Saket", "Dwarka", "Karol Bagh"],
      },
      {
        name: "Bangalore",
        state: "Karnataka",
        areas: ["Whitefield", "Koramangala", "Indiranagar", "Marathahalli"],
      },
      {
        name: "Hyderabad",
        state: "Telangana",
        areas: ["Banjara Hills", "Gachibowli", "Madhapur", "Ameerpet"],
      },
      {
        name: "Kolkata",
        state: "West Bengal",
        areas: ["Salt Lake", "New Town", "Park Street", "Gariahat"],
      },
      {
        name: "Chennai",
        state: "Tamil Nadu",
        areas: ["T Nagar", "Velachery", "Adyar", "Anna Nagar"],
      },
      {
        name: "Ahmedabad",
        state: "Gujarat",
        areas: ["Navrangpura", "Maninagar", "Thaltej", "Vastrapur"],
      },
      {
        name: "Pune",
        state: "Maharashtra",
        areas: ["Hinjewadi", "Kothrud", "Viman Nagar", "Baner"],
      },
      {
        name: "Jaipur",
        state: "Rajasthan",
        areas: ["Malviya Nagar", "Vaishali Nagar", "C Scheme", "Mansarovar"],
      },
      {
        name: "Lucknow",
        state: "Uttar Pradesh",
        areas: ["Hazratganj", "Gomti Nagar", "Alambagh", "Indira Nagar"],
      },
      {
        name: "Chandigarh",
        state: "Chandigarh",
        areas: ["Sector 17", "Sector 35", "Sector 22", "Manimajra"],
      },
      {
        name: "Indore",
        state: "Madhya Pradesh",
        areas: ["Vijay Nagar", "Rajwada", "Palasia", "MG Road"],
      },
      {
        name: "Bhopal",
        state: "Madhya Pradesh",
        areas: ["MP Nagar", "Arera Colony", "Kolar", "TT Nagar"],
      },
      {
        name: "Nagpur",
        state: "Maharashtra",
        areas: ["Sitabuldi", "Dharampeth", "Wardha Road", "Ambazari"],
      },
      {
        name: "Patna",
        state: "Bihar",
        areas: ["Boring Road", "Kankarbagh", "Patliputra", "Bailey Road"],
      },
      {
        name: "Ranchi",
        state: "Jharkhand",
        areas: ["Lalpur", "Harmu", "Morabadi", "Kokar"],
      },
      {
        name: "Surat",
        state: "Gujarat",
        areas: ["Adajan", "Piplod", "Vesu", "Varachha"],
      },
      {
        name: "Noida",
        state: "Uttar Pradesh",
        areas: ["Sector 18", "Sector 62", "Sector 137", "Sector 50"],
      },
      {
        name: "Guwahati",
        state: "Assam",
        areas: ["Paltan Bazar", "Silpukhuri", "Ganeshguri", "Dispur"],
      },
      {
        name: "Vizag",
        state: "Andhra Pradesh",
        areas: ["MVP Colony", "Gajuwaka", "Dwaraka Nagar", "Waltair Uplands"],
      },
    ];

    const brands = ["PVR", "INOX", "Cinepolis"];
    const logos: Record<string, string> = {
      PVR: "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751788726/omht27letnpbbaj2w0op.avif",
      INOX: "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751788726/yxjgnxhxlccfdon3fyzg.avif",
      Cinepolis:
        "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751788726/eebu3t34depdmmgxyknq.avif",
    };

    const theatres = [];

    for (const city of cities) {
      const numTheatres = Math.floor(Math.random() * 2) + 3; // 3 or 4 per city
      for (let i = 0; i < numTheatres; i++) {
        const brand = brands[i % brands.length];
        const area = city.areas[i % city.areas.length];
        theatres.push({
          name: `${brand} ${area}`,
          location: `${area}, ${city.name}`,
          city: city.name,
          state: city.state, // ✅ Added here
          logo: logos[brand],
        });
      }
    }

    await TheaterModel.deleteMany({});
    await TheaterModel.insertMany(theatres);

    console.log(`✅ Seeded ${theatres.length} theatres successfully.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
