import express from 'express';
import https from 'https';
import http from 'http';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import cors from 'cors';

export default function createServer(rootPath: string): void {
  const config = YAML.parse(
    fs.readFileSync(path.join(rootPath, 'config.yaml')).toString(),
  );

  const frontend = express();
  const port = config['port'];

  frontend.use(cors());

  const serverHTTPS = https.createServer(
    {
      key: fs.readFileSync(path.join(rootPath, 'ssl', 'caKey.key'), 'utf8'),
      cert: fs.readFileSync(path.join(rootPath, 'ssl', 'cert.cer'), 'utf8'),
    },
    frontend,
  );

  const serverHTTP = http.createServer(frontend);

  serverHTTP.listen(port, () => {
    console.log(`[Server] Successfully starts at http://localhost:${port}`);
  });

  serverHTTPS.listen(port + 1, () => {
    console.log(
      `[Server] Successfully starts at https://localhost:${port + 1}`,
    );
  });

  frontend.use(
    '/assets',
    express.static(path.join(rootPath, 'build', 'assets')),
  );

  try {
    if (fs.existsSync(path.join(rootPath, 'build', 'dev.html'))) {
      frontend.use('/developers', async (req, res) => {
        res.sendFile(path.join(rootPath, 'build', 'dev.html'));
      });
    }
  } catch (err) {
    console.error(err);
  }

  try {
    if (fs.existsSync(path.join(rootPath, 'build', 'index.html'))) {
      frontend.use(
        [
          '/login',
          '/register',
          '/app',
          '/channels',
          '/users',
          '/library',
          '/guild-discovery',
          '/invite',
          '/billing',
          '/store',
          '/connections',
          '/oauth2',
        ],
        async (req, res) => {
          res.sendFile(path.join(rootPath, 'build', 'app.html'));
        },
      );

      frontend.use('*', async (req, res) => {
        res.sendFile(path.join(rootPath, 'build', 'index.html'));
      });
    } else {
      frontend.use('*', async (req, res) => {
        res.sendFile(path.join(rootPath, 'build', 'app.html'));
      });
    }
  } catch (err) {
    console.error(err);
  }
}
