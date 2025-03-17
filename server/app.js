import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error('Serverda xatolik:', err);
    res.status(500).json({ error: err.message });
});

// Server ishga tushirish
app.listen(port, () => {
    console.log(`Server ${port} portda ishga tushirildi`);
});
