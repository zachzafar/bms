import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';


@Injectable()
export class ObjectStorageService {
    private s3Client: S3Client;

    constructor() {
        // Check if required environment variables are defined
        if (!process.env.SPACES_ENDPOINT || 
            !process.env.SPACES_KEY || !process.env.SPACES_SECRET) {
            throw new Error('Missing required environment variables for S3 client');
        }

        this.s3Client = new S3Client({
            endpoint: process.env.SPACES_ENDPOINT,
            credentials: {
                accessKeyId: process.env.SPACES_KEY!,
                secretAccessKey: process.env.SPACES_SECRET!
            }
        });
    }

    async uploadObject(file: Buffer,path: string, contentType: string): Promise<string> {
        
        const command = new PutObjectCommand({
            Bucket: 'drizzle',
            Key: path,
            Body: file,
        })
        try {
            const result = await this.s3Client.send(command);
        } catch (err) {
            throw new InternalServerErrorException(`Error occured while uploading file to S3: ${err}`)
        }
        
        return `${process.env.SPACES_ENDPOINT}/${process.env.SPACES_BUCKET}/${path}`;
    }
}
