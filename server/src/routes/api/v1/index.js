import express from 'express';
import { check, validationResult } from 'express-validator';
import appAuthenticate from '../../../middleware/authenticate';
import Entity from '../../../models/entity';
import migrations from '../../../models/migration';
import agenda from '../../../jobs';

const router = express.Router({ mergeParams: true });
/**
 * @swagger
 * path:
 *  /api/v1/migrations:
 *    post:
 *      tags:
 *      - migrations
 *      parameters:
 *      - name: name
 *        in: formData
 *        type: string
 *      responses:
 *        200:
 *          description: Success
 */
router.post('/migrations', async (req, res) => {
  const data = await migrations[req.body.name]();
  return res.success({ data });
});
router.use(appAuthenticate);
/**
 * @swagger
 * path:
 *  /api/v1/entities:
 *    post:
 *      tags:
 *      - entities
 *      parameters:
 *      - name: app-name
 *        in: header
 *        type: string
 *        default: test
 *      - name: app-token
 *        in: header
 *        type: string
 *      - name: name
 *        in: formData
 *        type: string
 *      - name: url
 *        in: formData
 *        type: string
 *      responses:
 *        200:
 *          description: Success
 */
router.post('/entities', [
  check('url').isURL(),
  check('name').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.error({ errors, status: 422 });
  }
  const entity = await Entity.create({
    name: req.body.name,
    description: req.body.description,
    sourceUrl: req.body.url,
    appId: res.locals.app.id,
  });
  agenda.now('process entity', { entityId: entity.id });
  return res.success({ data: entity });
});
/**
 * @swagger
 * path:
 *  /api/v1/entities/{entityId}:
 *    get:
 *      tags:
 *      - entities
 *      parameters:
 *      - name: app-name
 *        in: header
 *        type: string
 *        default: test
 *      - name: app-token
 *        in: header
 *        type: string
 *      - name: entityId
 *        in: path
 *        type: string
 *      responses:
 *        200:
 *          description: Success
 */
router.get('/entities/:entityId', async (req, res) => {
  const entity = await Entity.findOne({
    _id: req.params.entityId,
    appId: res.locals.app.id,
  });
  if (!entity) {
    return res.error({ status: 404, message: 'Entity is not exist!' });
  }
  return res.success({ data: entity });
});

export default router;
