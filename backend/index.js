import sequelize from "./src/config/db.js";
import "./src/models/index.js";
import userRouter from "./src/routes/authRoutes.js"
import tutorRouter from "./src/routes/tutorRoutes.js";
import tutorNoteRouter from "./src/routes/tutorNoteRoutes.js";
import studentRouter from "./src/routes/studentRoutes.js";
import bookingRouter from "./src/routes/bookingRoutes.js";
import reviewRouter from "./src/routes/reviewRoutes.js";
import goalFormRouter from "./src/routes/goalFormRoutes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// DB connection
sequelize.sync({ alter: true })
    // sequelize.sync({ force: true })
    .then(() => {
        console.log("All tables synced successfully in PostgreSQL.");
    })
    .catch((err) => {
        console.error("Failed to sync database:", err);
    });

app.get("/testDB", async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ message: "Connection has been established successfully." });
    } catch (error) {
        res.status(500).json({ error: "Unable to connect to the database." });
    }
});

// access permissions
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"],
    credentials: true
}));

app.use(express.json());

// routes
app.use("/api/user", userRouter);
app.use("/api/tutor", tutorRouter);
app.use("/api/tutorNote", tutorNoteRouter);
app.use("/api/student", studentRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/review", reviewRouter);
app.use("/api/goalForm", goalFormRouter);

// const PORT = process.env.PORT || 5000
// app.listen(PORT, () => console.log(`server is running on port ${PORT}`));

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`server is running on port ${PORT}`);
});