import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import routes from './routes/index.js'; 
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InsuredMine Technical Assessment API',
      version: '1.0.0',
      description: 'REST API documentation for InsuredMine assessment.',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}/api` }],
  },
  apis: ['./src/routes/*.js', './src/routes/**/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// app.get('/', (req, res) => {
//   res.json({
//     message: 'InsuredMine Assessment API Service',
//     version: '1.0.0',
//     documentation: '/api/docs',
//   });
// });

app.use(express.static('public')); //to serve the html page

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;