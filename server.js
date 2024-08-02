const mongoose = require("mongoose");
const dotenv = require("dotenv");

///handling exception error like sync code eg: console.log(x) and x not define:should be place on top
process.on("uncaughtException", (err) => {
  console.log("UNHANDLE EXCEPTION ...shuting down");
  console.log(err.name, err.message);

  process.exit(1);
});

const app = require("./app");
/////it enable accesibility of env file
dotenv.config({ path: "./config.env" });

// const DB = process.env.DATABASE.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );

const DB =
  process.env.DATABASE ||
  "mongodb+srv://mosesmwangime:9SPqAj4JOaXBxDrI@cluster0.sqjq7km.mongodb.net/natours?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(DB).then((con) => {
  console.log("Database connection successfull");
});

// const port = process.env.PORT;
const server = app.listen(3001, "127.0.0.1", () => {
  console.log(`listening to port 3001 ll`);
});

///handling mongoDb error like bad auth eg wrong paasworg / connection to database problem
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLE REJECTION ...shuting down");
  console.log(err);

  server.close(() => {
    process.exit(1);
  });
});

//////npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev
