const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');
require('dotenv').config();
const upload = require('express-fileupload');

const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const allowedOrigins = [
    'http://localhost:3000',
    'https://blog-app-frontend-qnro7aq6m-gaurav-sharmas-projects-668f5bd3.vercel.app'
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }));
  

app.use(upload());
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB and start the server
connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch(error => {
        console.error(error);
    });
