import express from 'express';
import 'express-async-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import methodOverride from 'method-override';
import engine from 'ejs-locals';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import rootRouter from './routes/index';
import constants from './config/constants';
import './models/index';
import './jobs/index';

dotenv.config();
mongoose.connect(constants.mongodbUrl, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: true,
});

const app = express();


app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', engine);

app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: constants.env === 'dev' ? '1s' : '2h' }));
if (constants.env === 'dev') {
  app.use(logger('tiny'));
}

app.use('/', rootRouter);
export default app;
