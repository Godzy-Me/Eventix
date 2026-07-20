import app from "./app";
import {config} from "./config/config"
import connectDB from "./config/db"

const startServer = async () => {
  const port = config.port;

  //connect to database
  await connectDB();

  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
};

startServer();