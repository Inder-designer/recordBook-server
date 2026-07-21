import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import './config/passport.ts';
import { errorMiddleware } from "./middleware/errorMiddleware";
import { validateSession } from "./middleware/validateSession";
import routes from "./routes";

const app = express();

const isProduction = process.env.NODE_ENV === 'PROD';

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        callback(null, true)
    },
    credentials: true,
    exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: (Number(process.env.COOKIE_EXPIRE)) * 24 * 60 * 60 * 1000, // same as cookie
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    },
    proxy: isProduction,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI!,
        collectionName: "sessions",
    }),
}))
app.use(passport.initialize());
app.use(passport.session());

// Public API docs
app.use("/api-docs", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <html>
            <head>
                <title>API Documentation</title>
            </head>
            <body>
                <h1>API Documentation</h1>
                <p>Welcome to the API Documentation!</p>
            </body>
        </html>
    `);
});

// Validate session for all other routes
// app.use(validateSession);

// Routes
app.use("/api/v1", routes);

// Error handling middleware
app.use(errorMiddleware);

export default app;