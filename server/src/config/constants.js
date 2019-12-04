import dotenv from 'dotenv';

dotenv.config();

const constants = {
  appName: 'HLS',
  env: process.env.ENV,
  jwtKey: `hls-${process.env.ENV}`,
  localStorageFolder: 'upload',
  mongodbUrl: `mongodb://localhost:27017/hls-${process.env.ENV}`,
  s3: {
    accessKeyId: 'AKIARILCIGEJMUDYZL6R',
    secretAccessKey: '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',
    region: 'ap-southeast-1',
    bucket: 'rabita-hls',
  },
  googleDrive: {
    developerKey: 'AIzaSyAUp6Kl6e3erds8AicU8yJoHg953mgJTKA',
    appId: '799017060213',
    clientId: '799017060213-1m83kb7gn98p6iqt5u9gnf2lfs8nl4ps.apps.googleusercontent.com',
  },
  cdnServer: {
    host: 'push-30.cdn77.com',
    user: 'user_bll5egmj',
    password: 'eNJoOIlnWZdl2Hz2ngiz',
  },
};

export default constants;
