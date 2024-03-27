var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");
var cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();
/**
 * Get port from environment and store in Express.
 */

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.log(err.message);
  });

var indexRouter = require("./routes/index");
var adminRouter = require("./modules/admin/Admin.route");
var teamRouter = require("./modules/Team/Team.route");
var userRouter = require("./modules/User/User.route");

var app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer);
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(
  cors({
    origin: "*",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/user", userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app, httpServer, io };