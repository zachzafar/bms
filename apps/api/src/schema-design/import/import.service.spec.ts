import { Test, TestingModule } from '@nestjs/testing';
import { ImportService } from './import.service';

describe('ImportService', () => {
  let service: ImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportService],
    }).compile();

    service = module.get<ImportService>(ImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should parse csv and detect schema', async () => {
    const csvContent = `"Name","Description","Type","Status","Owner","CreatedDate","Value"
"Asset A","Description of Asset A","Type 1","Active","Owner 1","2024-01-01","1000"
"Asset B","Description of Asset B, with a comma","Type 2","Inactive","Owner 2","2024-02-15","1500"
"Asset C","Description with ""quotes""","Type 3","Active","Owner 3","2024-03-10","1200"`;
    const fileBuffer = Buffer.from(csvContent);
    const result = await service.parseCsvSchema(fileBuffer);
    const expectedSchema = [
      { name: 'Name', type: 'string' },
      { name: 'Description', type: 'string' },
      { name: 'Type', type: 'string' },
      { name: 'Status', type: 'string' },
      { name: 'Owner', type: 'string' },
      { name: 'CreatedDate', type: 'string' },
      { name: 'Value', type: 'string' }, // CSV fields are always parsed as strings initially
    ];

    // Expected preview rows
    const expectedRows = [
      {
        Name: 'Asset A',
        Description: 'Description of Asset A',
        Type: 'Type 1',
        Status: 'Active',
        Owner: 'Owner 1',
        CreatedDate: '2024-01-01',
        Value: '1000',
      },
      {
        Name: 'Asset B',
        Description: 'Description of Asset B',
        Type: 'Type 2',
        Status: 'Inactive',
        Owner: 'Owner 2',
        CreatedDate: '2024-02-15',
        Value: '1500',
      },
    ];
    expect(result.schema).toEqual(expectedSchema);
    expect(result.rows).toEqual(expectedRows);
  })
});
