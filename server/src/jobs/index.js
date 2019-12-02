import Agenda from 'agenda';
import mkdirp from 'mkdirp-promise';
import fs from 'fs-extra';
import ffmpeg from 'fluent-ffmpeg';
import { getVideoDurationInSeconds } from 'get-video-duration';
import constants from '../config/constants';
import Entity, { entityStatuses } from '../models/entity';
import streamDownload from '../util/streamDownload';

const agenda = new Agenda({
  db: { address: constants.mongodbUrl },
  maxConcurrency: 1,
  defaultLockLifetime: 1000 * 60,
});

agenda.define('process entity', { priority: 10 }, async (job, done) => {
  const { entityId } = job.attrs.data;
  console.log(`Start: process entity, entityId: ${entityId}`);
  const entity = await Entity.findById(entityId);
  if (!entity) {
    return done(new Error('Error: Entity not found'));
  }
  if (entity.status !== entityStatuses.pending) {
    return done();
  }
  entity.status = entityStatuses.inprogress;
  await entity.save();
  const tmpFolder = `tmp/${entity.id}`;
  await mkdirp(tmpFolder);
  const filePath = `${tmpFolder}/${entity.id}`;
  const playlistPath = `${tmpFolder}/${entity.id}.m3u8`;
  await streamDownload({ uri: entity.sourceUrl, savePath: filePath });
  const duration = await getVideoDurationInSeconds(filePath);
  console.log('Duration', duration);
  entity.duration = duration;
  await entity.save();
  await (new Promise((resolve, reject) => {
    ffmpeg(filePath, { timeout: 432000 }).addOptions([
      '-profile:v baseline', // baseline profile (level 3.0) for H264 video codec
      '-level 3.0',
      // '-s 10x80',
      '-start_number 0', // start the first .ts segment at index 0
      '-hls_time 10', // 10 second segment duration
      '-hls_list_size 0', // Maxmimum number of playlist entries (0 means all entries/infinite)
      '-f hls', // HLS format
    ]).output(playlistPath)
      .on('end', resolve)
      .on('progress', (progress) => console.log(`Convert progress: ${progress.percent}%`))
      .on('error', reject)
      .run();
  }));
  await fs.remove(filePath);
  // await fs.remove(tmpFolder);
  console.log(`Finish: process entity, entityId: ${entityId}`);
  return done();
});


agenda.on('ready', () => {
  removeStaleJobs(() => {
    agenda.start();
    agenda.purge();
  });
});

// restart old job when restart server
function removeStaleJobs(callback) {
  agenda._collection.updateMany({
    lockedAt: {
      $exists: true,
    },
    lastFinishedAt: {
      $exists: false,
    },
  }, {
    $unset: {
      lockedAt: undefined,
      lastModifiedBy: undefined,
      lastRunAt: undefined,
    },
    $set: {
      nextRunAt: new Date(),
    },
  }, callback);
}

export default agenda;
