import progress from 'request-progress';
import request from 'request';
import fs from 'fs';

/**
 * stream download file
 * @param {Object} param
 * @param {String} param.uri
 * @param {Object} param.headers
 * @param {String} param.savePath
 */
const streamDownload = ({ uri, headers, savePath }) => new Promise((resolve, reject) => {
  progress(request({ uri, headers }))
    .on('progress', (state) => {
      console.log(`Download percentage: ${(state.percent * 100).toFixed(2)}%`);
    })
    .on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Error Code: ${response.statusCode}`));
      }
    })
    .on('error', reject)
    .on('end', resolve)
    .pipe(fs.createWriteStream(savePath));
});

export default streamDownload;
