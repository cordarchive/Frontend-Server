import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import promptSync from 'prompt-sync';

const prompt = promptSync({ sigint: true });

export default function createCert(rootPath: string): void {
  try {
    fs.mkdirSync(path.join(rootPath, 'ssl'));
    console.log('[Info] SSL folder Created.');
  } catch (err) {
    console.error(`[Error] SSL folder creation error: ${err}`);
  }

  const caAttrs = [
    {
      name: 'commonName',
      value: 'discordLocalCa',
    },
    {
      name: 'countryName',
      value: 'United Nations',
    },
    {
      shortName: 'ST',
      value: 'N/A',
    },
    {
      name: 'localityName',
      value: 'N/A',
    },
    {
      name: 'organizationName',
      value: 'localhost',
    },
    {
      shortName: 'OU',
      value: 'discordCa',
    },
  ];

  const attrs = [
    {
      name: 'commonName',
      value: 'discordLocal',
    },
    {
      name: 'countryName',
      value: 'United Nations',
    },
    {
      shortName: 'ST',
      value: 'N/A',
    },
    {
      name: 'localityName',
      value: 'N/A',
    },
    {
      name: 'organizationName',
      value: 'localhost',
    },
    {
      shortName: 'OU',
      value: 'discord',
    },
  ];

  const caKeys = forge.pki.rsa.generateKeyPair(2048);
  const caCert = forge.pki.createCertificate();

  caCert.publicKey = caKeys.publicKey;
  caCert.serialNumber = '01';
  caCert.validity.notBefore = new Date();
  caCert.validity.notAfter = new Date();
  caCert.validity.notAfter.setFullYear(
    caCert.validity.notBefore.getFullYear() + 1,
  );

  caCert.setSubject(caAttrs);
  caCert.setIssuer(caAttrs);
  caCert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2,
          value: 'localhost',
        },
        {
          type: 7,
          ip: '127.0.0.1',
        },
      ],
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ]);
  caCert.sign(caKeys.privateKey, forge.md.sha256.create());

  try {
    fs.writeFileSync(
      path.join(rootPath, 'ssl', 'caKey.key'),
      forge.pki.privateKeyToPem(caKeys.privateKey),
    );
  } catch (err) {
    console.log(`[Error]: CA Private key not saved: ${err}`);
  }

  try {
    fs.writeFileSync(
      path.join(rootPath, 'ssl', 'caCert.cer'),
      forge.pki.certificateToPem(caCert),
    );
  } catch (err) {
    console.log(`[Error]: CA not saved: ${err}`);
  }

  const cert = forge.pki.createCertificate();
  cert.publicKey = caCert.publicKey;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  cert.setSubject(attrs);
  cert.setIssuer(caCert.subject.attributes);
  cert.setExtensions([
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2,
          value: 'localhost',
        },
        {
          type: 7,
          ip: '127.0.0.1',
        },
      ],
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ]);
  cert.sign(caKeys.privateKey, forge.md.sha256.create());

  try {
    fs.writeFileSync(
      path.join(rootPath, 'ssl', 'cert.cer'),
      forge.pki.certificateToPem(cert),
    );
  } catch (err) {
    console.log(`[Error]: Cert not saved: ${err}`);
  }

  prompt(
    "[Info] Please import caCert.cer to your computer's CA store, search on Google for help. Press enter after you imported it.",
  );
}
