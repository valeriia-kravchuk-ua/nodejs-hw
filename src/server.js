import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import helmet from "helmet";
import { connectMongoDB } from './db/connectMongoDB.js';
import {logger} from "./middleware/logger.js";
import {notFoundHandler} from "./middleware/notFoundHandler.js";
import {errorHandler} from "./middleware/errorHandler.js";
import notesRoutes from "./routes/notesRoutes.js";
import {errors} from "celebrate";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(logger);
app.use(helmet());
app.use(express.json({
    limit: '100kb',
}));
app.use(cors());

// додає req.cookies в контролер
app.use(cookieParser())

app.use(authRoutes)
app.use(notesRoutes);
app.use(userRoutes)

app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
