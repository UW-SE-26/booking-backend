import fs from 'fs';
import crypto from 'crypto';

const privateKeyFile = `${process.cwd()}/privkey.pem`;

let privateKey: crypto.KeyObject;
let publicKey: crypto.KeyObject;

if (fs.existsSync(privateKeyFile)) {
    privateKey = crypto.createPrivateKey({
        key: fs.readFileSync(privateKeyFile),
        format: 'pem',
    });
    publicKey = crypto.createPublicKey({
        key: fs.readFileSync(privateKeyFile), //generate public key from private key
        format: 'pem',
    });
} else {
    const keys = crypto.generateKeyPairSync('ed25519');
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
    fs.writeFileSync(
        privateKeyFile,
        privateKey.export({
            type: 'pkcs8',
            format: 'pem',
        })
    );
    //not exporting the public key file since it's trivial to get it from the private key so let's save on some IO
}

export { privateKey, publicKey };
