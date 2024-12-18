'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Package2Icon,
  FileTextIcon,
  DownloadIcon,
  RefreshCwIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function Component() {
  const [reportType, setReportType] = useState('assetUtilization');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [assetType, setAssetType] = useState('All');
  const [generatedReports, setGeneratedReports] = useState([
    {
      id: 1,
      name: 'Asset Utilization Q2 2023',
      type: 'Asset Utilization',
      date: '2023-07-01',
      format: 'PDF',
    },
    {
      id: 2,
      name: 'Maintenance Costs 2023',
      type: 'Maintenance',
      date: '2023-06-15',
      format: 'Excel',
    },
    {
      id: 3,
      name: 'Booking Revenue Jan-Jun 2023',
      type: 'Revenue',
      date: '2023-07-05',
      format: 'PDF',
    },
  ]);

  // Mock data for the report preview
  const reportData = [
    { name: 'Cars', utilization: 75, maintenance: 5000, revenue: 50000 },
    { name: 'Rooms', utilization: 60, maintenance: 3000, revenue: 75000 },
    { name: 'Equipment', utilization: 40, maintenance: 2000, revenue: 25000 },
  ];

  const handleGenerateReport = () => {
    // In a real application, this would trigger the report generation process
    console.log('Generating report:', {
      reportType,
      startDate,
      endDate,
      assetType,
    });
    // For now, we'll just add a new entry to the generatedReports list
    const newReport = {
      id: generatedReports.length + 1,
      name: `${reportType} Report ${
        startDate?.toISOString().split('T')[0]
      } to ${endDate?.toISOString().split('T')[0]}`,
      type: reportType,
      date: new Date().toISOString().split('T')[0],
      format: 'PDF',
    };
    setGeneratedReports([newReport, ...generatedReports]);
  };

  return (
    <main className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6'>
      <div className='flex items-center'>
        <h1 className='font-semibold text-lg md:text-2xl'>Reports</h1>
      </div>
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Select parameters for your report</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='report-type'>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id='report-type'>
                  <SelectValue placeholder='Select report type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='assetUtilization'>
                    Asset Utilization
                  </SelectItem>
                  <SelectItem value='maintenanceCosts'>
                    Maintenance Costs
                  </SelectItem>
                  <SelectItem value='bookingRevenue'>
                    Booking Revenue
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Date Range</Label>
              <div className='flex space-x-2'>
                <div>
                  <Label htmlFor='start-date'>Start Date</Label>
                  <Calendar
                    mode='single'
                    selected={startDate}
                    onSelect={setStartDate}
                    className='rounded-md border'
                  />
                </div>
                <div>
                  <Label htmlFor='end-date'>End Date</Label>
                  <Calendar
                    mode='single'
                    selected={endDate}
                    onSelect={setEndDate}
                    className='rounded-md border'
                  />
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='asset-type'>Asset Type</Label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger id='asset-type'>
                  <SelectValue placeholder='Select asset type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='All'>All Assets</SelectItem>
                  <SelectItem value='Cars'>Cars</SelectItem>
                  <SelectItem value='Rooms'>Rooms</SelectItem>
                  <SelectItem value='Equipment'>Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>Preview of the generated report</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis yAxisId='left' orientation='left' stroke='#8884d8' />
                <YAxis yAxisId='right' orientation='right' stroke='#82ca9d' />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId='left'
                  dataKey='utilization'
                  fill='#8884d8'
                  name='Utilization (%)'
                />
                <Bar
                  yAxisId='right'
                  dataKey='maintenance'
                  fill='#82ca9d'
                  name='Maintenance Cost ($)'
                />
                <Bar
                  yAxisId='right'
                  dataKey='revenue'
                  fill='#ffc658'
                  name='Revenue ($)'
                />
              </BarChart>
            </ResponsiveContainer>
            <div className='mt-4 flex justify-end space-x-2'>
              <Button variant='outline'>
                <DownloadIcon className='mr-2 h-4 w-4' />
                Export as PDF
              </Button>
              <Button variant='outline'>
                <DownloadIcon className='mr-2 h-4 w-4' />
                Export as Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            List of previously generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Generated</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generatedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>{report.format}</TableCell>
                  <TableCell>
                    <Button variant='ghost' size='sm'>
                      <DownloadIcon className='mr-2 h-4 w-4' />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
