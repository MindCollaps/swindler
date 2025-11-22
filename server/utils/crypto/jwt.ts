import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { KeyObject } from 'crypto';
import { createPrivateKey, createPublicKey, generateKeyPairSync } from 'crypto';
import type { User } from '@prisma/client';

let privKey: KeyObject | null = null;
let pubKey: KeyObject | null = null;

export function initJWT() {
    const privKeyPath = process.env.NITRO_JWT_PRIVATE_KEY_PATH || './priv-key.pem';
    const pubKeyPath = process.env.NITRO_JWT_PUBLIC_KEY_PATH || './pub-key.pem';

    if (fs.existsSync(privKeyPath) && fs.existsSync(pubKeyPath)) {
        const privateKeyPem = fs.readFileSync(privKeyPath, 'utf8');
        const publicKeyPem = fs.readFileSync(pubKeyPath, 'utf8');

        privKey = createPrivateKey({
            key: privateKeyPem,
            format: 'pem',
        });
        pubKey = createPublicKey({
            key: publicKeyPem, // <-- Fix here, use public key content
            format: 'pem',
        });

        return true;
    }
    else {
        try {
            const { privateKey, publicKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });

            fs.writeFileSync(privKeyPath, privateKey, 'utf8');
            fs.writeFileSync(pubKeyPath, publicKey, 'utf8');

            privKey = createPrivateKey({
                key: privateKey,
                format: 'pem',
            });

            pubKey = createPublicKey({
                key: publicKey,
                format: 'pem',
            });

            return true;
        }
        catch (error: any) {
            console.error('JWT initialization failed:', error);
            return false;
        }
    }
}

export function generateJWT(user: User): string {
    if (!privKey) {
        throw new Error('JWT private key not initialized');
    }

    const payload = {
        userId: user.id.toString(),
        username: user.username,
        admin: user.admin,
    };

    return jsonwebtoken.sign(payload, privKey, {
        issuer: 'Swindler Corp',
        subject: user.id.toString(),
        audience: 'Swindler Users',
        expiresIn: '1h',
        algorithm: 'RS256',
    });
}

export function verifyJWT(jwtToken: string): JwtPayload | null {
    if (!pubKey) {
        throw new Error('JWT private key not initialized');
    }
    const decoded = decodeJWT(jwtToken);
    if (!decoded) {
        throw createApiError('Invalid JWT', 400);
    }

    try {
        return jsonwebtoken.verify(jwtToken, pubKey, {
            issuer: 'Swindler Corp',
            audience: 'Swindler Users',
            algorithms: ['RS256'],
            complete: true,
        });
    }
    catch {
        return null;
    }
}

export function decodeJWT(jwtToken: string) {
    return jsonwebtoken.decode(jwtToken);
}
