// eslint-disable-next-line no-unused-vars
import express from 'express';
import createHttpError from 'http-errors';
import App from '../models/app';

/**
 * @type {express.RequestHandler}
 */
const appAuthenticate = async (req, res, next) => {
  try {
    const appName = req.header('app-name') || req.query['app-name'] || req.body['app-name'];
    const appToken = req.header('app-token') || req.query['app-token'] || req.body['app-token'];
    const app = await App.findOne({ name: appName, token: appToken });
    if (!app) throw createHttpError(403, 'Access denied!');
    res.locals.app = app;
    next();
  } catch {
    throw createHttpError(403, 'Access denied!');
  }
};

export default appAuthenticate;
