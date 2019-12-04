import uuid from 'uuid/v4';
import App from '../app';

const createDefaultApp = async () => {
  if ((await App.countDocuments()) === 0) {
    await App.create({
      name: 'Rabita',
      token: uuid(),
    }, {
      name: 'test',
      token: uuid(),
    });
  }
  return App.find({});
};

export default createDefaultApp;
