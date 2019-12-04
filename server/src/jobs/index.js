import Agenda from 'agenda';
import { Client } from 'basic-ftp';
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
  const tmpFolder = `${constants.env}/videos/${entity.id}`;
  const filePath = `${tmpFolder}/${entity.id}`;

  const client = new Client(0);
  client.ftp.verbose = constants.env === 'dev';

  try {
    entity.status = entityStatuses.inprogress;
    await entity.save();
    await mkdirp(tmpFolder);
    // Download file
    await streamDownload({ uri: entity.sourceUrl, savePath: filePath });
    const duration = await getVideoDurationInSeconds(filePath);
    console.log('Duration', duration);
    entity.duration = duration;
    await entity.save();
    // Convert video to hls
    const playlistPath = `${tmpFolder}/${entity.id}.m3u8`;
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

    // Upload to CDN
    await client.access({
      host: constants.cdnServer.host,
      user: constants.cdnServer.user,
      password: constants.cdnServer.password,
      secure: false,
    });
    client.ftp.verbose = true;
    await client.ensureDir(`www/${tmpFolder}`);
    await client.clearWorkingDir();
    await client.uploadFromDir(tmpFolder);
    entity.status = entityStatuses.success;
    entity.playlistPath = playlistPath;
    await entity.save();
    console.log(`Finish: process entity, entityId: ${entityId}`);
    return done();
  } catch (error) {
    entity.status = entityStatuses.error;
    await entity.save();
    console.log(`Error: process entity, entityId: ${entityId}`, error);
    return done(error);
  } finally {
    // Clean processed files
    await fs.remove(tmpFolder);
    client.close();
  }
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
