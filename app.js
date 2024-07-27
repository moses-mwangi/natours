const express = require("express");
const path = require("path");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorControler");
const tourRouter = require("./routes/tourRoute");
const userRouter = require("./routes/userRoute");
const reviewRouter = require("./routes/reviewRoute");

const app = express();

const allowedOrigins = [
  "https://try-one-xi.vercel.app",
  "http://localhost:3002",
  "http://localhost:3000",
  "https://try-lake.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

https: app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

///////Set Security HTTP Headers
app.use(helmet());

///// development logging (it enabe express app to runs)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

////////// LIMIT REQUEST FROM SAME API
const limiter = rateLimit({
  max: 200, /// only 100 request in one hour
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP.Please try again in an hour",
});
app.use("/api", limiter);

///// BODY PARSER reading data from body to req.body
app.use(express.json());
app.use(cookieParser());

///Data sanitization agaisnt Nosql Injection
app.use(mongoSanitize());

///Data sanitization agaisnt xss
app.use(xss());

/// Serving static files
app.use(express.static(`${__dirname}/public`));

/// Test middleware
app.use((req, res, next) => {
  console.log("Test middleware");
  next();
});

/////////////routes api

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

////// EXPRESSMIDDLEWARE: routeErrorHandler to handle all un specified api route
app.all("*", (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`));
});

//////EXPRESSMIDDLEWARE: globalErorHandler to handle all error globaly
app.use(globalErrorHandler);

module.exports = app;
