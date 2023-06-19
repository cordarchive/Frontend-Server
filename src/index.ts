import path from 'path';
import forge from 'node-forge';
import fs from 'fs';
import createCert from '@/createSsl';
import createServer from '@/createServer';
import YAML from 'yaml';

const rootPath = path.join(__dirname, '..');

const config = YAML.parse(
  fs.readFileSync(path.join(rootPath, 'config.yaml')).toString(),
);

if (config['environment'] == 'local') {
  try {
    fs.existsSync(path.join(rootPath, 'ssl'));
    if (
      forge.pki.certificateFromPem(
        fs
          .readFileSync(path.join(rootPath, 'ssl', 'caCert.cer'), 'utf8')
          .toString(),
      ).validity.notAfter.getTime > new Date().getTime
    ) {
      console.info('[SSL] The SSL certificate is expired, recreating...');
      fs.rmdirSync(path.join(rootPath, 'ssl'));
      createCert(path.join(rootPath));
    }
  } catch (err) {
    console.error(
      `[SSL] Either folder doesn't exist or SSL is corrupted. (${err})`,
    );
    if (fs.existsSync(path.join(rootPath, 'ssl'))) {
      fs.rmdirSync(path.join(rootPath, 'ssl'));
    }
    createCert(path.join(rootPath));
  }
}

createServer(path.join(rootPath));
