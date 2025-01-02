import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/Database.js";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import AttendanceRoute from "./routes/AttendanceRoute.js";
import RequestRoute from "./routes/RequestRoute.js";
import OvertimeRoute from "./routes/OvertimeRoute.js";
import SalariesRoute from "./routes/SalariesRoute.js";
import DeductionsRoute from "./routes/DeductionsRoute.js";
import PayrollRoute from "./routes/PayrollRoute.js"

import SequelizeStore from "connect-session-sequelize";
import path from "path";

dotenv.config();
const app = express();
const SequelizeSessionStore = SequelizeStore(session.Store);
const store = new SequelizeSessionStore({
  db: db,
});

app.use(
  session({
    secret: process.env.SESS_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
      domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : 'localhost'
    },
    name: 'connect.sid' 
  })
);

app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store');
  res.header('Pragma', 'no-cache');
  next();
});

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);

app.use(express.json());

app.use((req, res, next) => {
  res.locals.convertToWIB = (date) => {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(new Date(date))
      .replace(/\//g, "-")
      .replace(",", "");
  };
  next();
});

app.use(UserRoute);
app.use(AuthRoute);
app.use(AttendanceRoute);
app.use(RequestRoute);
app.use(OvertimeRoute);
app.use(SalariesRoute);
app.use(DeductionsRoute);
app.use(PayrollRoute)
app.use("/uploads", express.static(path.resolve("uploads")));
// store.sync();
// db.sync();

const PORT = process.env.APP_PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
