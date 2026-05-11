// src/server.js
import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import 'dotenv/config';
import helmet from "helmet";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(
    pino({
        level: 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
                messageFormat: '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
                hideObject: true,
            },
        },
    }),
);
app.use((err, req, res, next) => {
    console.error(err);

    const isProd = process.env.NODE_ENV === "production";

    res.status(500).json({
        message: isProd
            ? "Something went wrong. Please try again later."
            : err.message,
    });
});
// Логування часу
app.use((req, res, next) => {
    console.log(`Time: ${new Date().toLocaleString()}`);
    next();
});
// Перший маршрут
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello world!' });
});
// Список усіх користувачів
app.get('/users', (req, res) => {
    res.status(200).json([{ id: 1, name: 'Alice' }]);
});

app.post('/users', (req, res) => {
    console.log(req.body); // тепер тіло доступне як JS-об’єкт
    res.status(201).json({ message: 'User created' });
});

// Конкретний користувач за id
app.get('/users/:userId', (req, res) => {
    const { userId } = req.params;
    res.status(200).json({ id: userId, name: 'Jacob' });
});

app.get('/test-error', (req, res) => {
    // Штучна помилка для прикладу
    throw new Error('Something went wrong');
});
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message,
    });
});



// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
