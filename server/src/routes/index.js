import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import apiRouter from './api/index';
import constants from '../config/constants';
import Entity from '../models/entity';

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

// video player

router.get('/videos/:entityId', async (req, res) => {
  try {
    const entity = await Entity.findById(req.params.entityId);
    const { timeshift, fullscreen, iframeId } = req.query;
    res.render('video', { entity, timeshift, fullscreen, iframeId });
  } catch {
    res.render('video', { entity: null });
  }
});

router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', (req, res) => res.send(swaggerUi.generateHTML(swaggerSpecClient)));

export default router;
