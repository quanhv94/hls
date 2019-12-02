import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import apiRouter from './api/index';
import constants from '../config/constants';

const swaggerSpecClient = swaggerJSDoc({
  swaggerDefinition: {
    info: {
      title: `${constants.appName} API`,
      version: '1.0.0',
      description: `${constants.appName} API`,
    },
    basePath: '/',
  },
  apis: [path.join(__dirname, 'api/**/*.js')],
});

const router = express.Router({ mergeParams: true });

router.use('/api', apiRouter);

router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', (req, res) => res.send(swaggerUi.generateHTML(swaggerSpecClient)));

export default router;
