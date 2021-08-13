import fs from 'fs';
import crypto from 'crypto';

const keys = crypto.generateKeyPairSync('ed25519');

const privateKey = keys.privateKey;
const publicKey = keys.publicKey;

const privateKeyFile = `${process.cwd()}/privkey.pem`;
const publicKeyFile = `${process.cwd()}/pubkey.pem`;

if (!fs.existsSync(privateKeyFile)) {
    fs.writeFileSync(
        privateKeyFile,
        privateKey.export({
            type: 'pkcs8',
            format: 'pem',
        })
    );
}
if (!fs.existsSync(publicKeyFile)) {
    fs.writeFileSync(
        publicKeyFile,
        publicKey.export({
            type: 'spki',
            format: 'pem',
        })
    );
}

export { privateKey, publicKey };
