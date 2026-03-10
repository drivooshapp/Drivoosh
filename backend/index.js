import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/config/db.js";
import "./src/models/index.js";
import userRouter from "./src/routes/authRoutes.js"
import tutorRouter from "./src/routes/tutorRoutes.js";
import studentRouter from "./src/routes/studentRoutes.js";


dotenv.config();

const app = express();

app.use(express.json());

// DB connection
sequelize.sync({ alter: true })
    .then(() => {
        console.log("All tables synced successfully in PostgreSQL.");
    })
    .catch((err) => {
        console.error("Failed to sync database:", err);
    });

app.get("/test-db", async (req, res) => {
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
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token"]
}));

// routes
app.use("/api/user", userRouter);
app.use("/api/tutor", tutorRouter);
app.use("/api/student", studentRouter);


const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));