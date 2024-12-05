import { Injectable } from '@nestjs/common';
import csv from 'csv-parser';

@Injectable()
export class ImportService {

    async parseCsvSchema(fileBuffer: Buffer): Promise<any> {
        const rows:any[] = []
        const schema:any[] = [];

        return new Promise((resolve, reject) => {  
            const stream = require('stream');  
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);

            bufferStream.pipe(csv()).on('headers', (row:any)=> {
                if (schema.length === 0) {
                    Object.keys(row).forEach((key) => {
                        schema.push({
                            name: row[key],
                            type: typeof row[key],
                            
                        });
                    });
                }
            }).on('data', (row: any) => {
                rows.push(row);
            }).on('end', () => {
                console.log("Row",rows);
                console.log("Schema",schema);
    
                resolve({schema, rows: rows.slice(0, 5)}); 
        }).on('error', (error: any) => {    
            reject(error);
        })
    })

    }
}