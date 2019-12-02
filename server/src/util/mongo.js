import { exec } from 'child_process';
import mongoUri from 'mongo-uri';
import zipFolder from 'zip-folder';
import os from 'os';

export default class MongoUtil {
  static dump = ({ uri }) => {
    const args = mongoUri.parse(uri);
    const host = args.ports[0] ? `${args.hosts[0]}:${args.ports[0]}` : args.hosts[0];
    const output = `${os.tmpdir}/${Date.now()}`;

    const command = ['mongodump'];
    command.push('-h', host);
    command.push('-d', args.database);
    command.push('-o', output);
    if (args.username) {
      command.push('-u', args.username);
    }
    if (args.password) {
      command.push('-p', args.password);
    }

    return new Promise((resolve, reject) => {
      exec(command.join(' '), (err) => {
        if (err) {
          reject(err);
        } else {
          const zipOutput = `${output}.zip`;
          zipFolder(output, zipOutput, (zipErr) => {
            if (zipErr) {
              reject(err);
            } else {
              resolve(zipOutput);
            }
          });
        }
      });
    });
  }
}
