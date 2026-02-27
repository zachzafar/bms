import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class ObjectStorageService {
    private s3Client: S3Client;
    private readonly logger = new Logger(ObjectStorageService.name);

    constructor() {
        // Check if required environment variables are defined
        if (!process.env.SPACES_ENDPOINT || 
            !process.env.SPACES_KEY || !process.env.SPACES_SECRET) {
            throw new Error('Missing required environment variables for S3 client');
        }

        this.s3Client = new S3Client({
            endpoint: process.env.SPACES_ENDPOINT,
            region: process.env.SPACES_REGION,
            credentials: {
                accessKeyId: process.env.SPACES_KEY!,
                secretAccessKey: process.env.SPACES_SECRET!
            }
        });
    }

    async getObjectUrl(filePath: string): Promise<string> {
        if (filePath.includes('/image/')) {
            return `${process.env.SPACES_CDN_URL}/${filePath}`;
        }
        const command = new GetObjectCommand({
            Key: filePath,
            Bucket: 'bookos'
        });
        try {
            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
            return signedUrl;
        } catch (e) {
            this.logger.error(e);
            throw new Error('Error occured while generating signed url');
        }
    }

    async getObjectBuffer(filePath: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Key: filePath,
            Bucket: 'bookos'
        });
        try {
            const response = await this.s3Client.send(command);
            if (!response.Body) {
                throw new Error('Empty response body from S3');
            }
            // Convert stream to buffer
            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as Readable) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (e) {
            this.logger.error(e);
            throw new Error('Error occurred while fetching object from S3');
        }
    }

    async uploadObject(file: Buffer|Readable,uploadType: 'image'|'file',tenant:string,asset:string): Promise<string> {
        const filename = `tenants/${tenant}/assets/${asset}/${uploadType}/${uuidv4()}`

        const command = new PutObjectCommand({
            Key: filename,
            Body: file,
            Bucket: 'bookos',
            ...(uploadType === 'image' && { ACL: 'public-read' })
        })
        try {
            this.logger.log(`Uploading file to S3: ${filename}`)
            const result = await this.s3Client.send(command);
            if (result.$metadata.httpStatusCode !== 200) {
                throw new InternalServerErrorException(`Error occured while uploading file to S3: ${result.$metadata.httpStatusCode}`)
            }
            return filename;
        } catch (err) {
            throw new InternalServerErrorException(`Error occured while uploading file to S3: ${err}`)
        }
        
    }

    async deleteObject(filename: string) {
        const command = new DeleteObjectCommand({
            Bucket: 'bookos',
            Key: filename
        })
        try {
            const result = await this.s3Client.send(command);
            if (result.$metadata.httpStatusCode !== 204) {
                throw new InternalServerErrorException(`Error occured while deleting file from S3: ${result.$metadata.httpStatusCode}`)
            }
        } catch (err) {
            throw new InternalServerErrorException(`Error occured while deleting file from S3: ${err}`)
        }
    }
}
