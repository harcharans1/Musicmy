import'dotenv/config';import express from'express';import cors from'cors';import helmet from'helmet';import rateLimit from'express-rate-limit';import{connectDB}from'./config/db.js';import auth from'./routes/auth.js';import tools from'./routes/tools.js';import ai from'./routes/ai.js';import user from'./routes/user.js';import payment from'./routes/payment.js';import admin from'./routes/admin.js';import{notFound,errorHandler}from'./middleware/error.js';const app=express();app.use(helmet());const allowedOrigins = [
  "https://musicmyy.netlify.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: true,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());app.use(express.json({limit:'2mb'}));app.use(rateLimit({windowMs:15*60*1000,max:300}));app.get('/api/health',(q,s)=>s.json({status:'ok',demoMode:process.env.DEMO_MODE==='true'}));app.use('/api/auth',auth);app.use('/api/tools',tools);app.use('/api/ai',ai);app.use('/api/user',user);app.use('/api/payment',payment);app.use('/api/admin',admin);app.use(notFound);app.use(errorHandler);connectDB().then(()=>app.listen(process.env.PORT||5000,()=>console.log('AIForge API running'))).catch(e=>{console.error(e);process.exit(1)});
