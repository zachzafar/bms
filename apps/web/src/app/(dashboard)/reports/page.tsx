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
import ReportingDashboard from '@/components/custom/reporting-dashboard';

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
    <div className="container space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select parameters for your report</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportingDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
