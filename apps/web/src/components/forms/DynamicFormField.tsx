'use client';

import { Control, FieldValues, Path } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/date';
import { Slider } from '@/components/ui/slider';

type FormFieldType = 'number' | 'text' | 'textarea' | 'date' | 'time' | 'date_range' | 'range' | 'boolean';

interface DynamicFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  type: FormFieldType;
  required?: boolean;
  description?: string;
}

export function DynamicFormField<T extends FieldValues>({
  control,
  name,
  label,
  type,
  required = false,
  description,
}: DynamicFormFieldProps<T>) {
  const renderField = (field: any) => {
    switch (type) {
      case 'number':
        return (
          <Input
            type="number"
            placeholder={`Enter ${label.toLowerCase()}`}
            {...field}
            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
          />
        );

      case 'text':
        return (
          <Input
            type="text"
            placeholder={`Enter ${label.toLowerCase()}`}
            {...field}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={`Enter ${label.toLowerCase()}`}
            className="min-h-[100px]"
            {...field}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !field.value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? formatDisplayDate(field.value) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => field.onChange(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'time':
        return (
          <Input
            type="time"
            {...field}
          />
        );

      case 'date_range':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !field.value?.start && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value?.start ? formatDisplayDate(field.value.start) : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value?.start ? new Date(field.value.start) : undefined}
                    onSelect={(date) => field.onChange({ ...field.value, start: date?.toISOString() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !field.value?.end && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value?.end ? formatDisplayDate(field.value.end) : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value?.end ? new Date(field.value.end) : undefined}
                    onSelect={(date) => field.onChange({ ...field.value, end: date?.toISOString() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Value: {field.value || 0}</span>
            </div>
            <Slider
              value={[field.value || 0]}
              onValueChange={(values) => field.onChange(values[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {description || label}
            </label>
          </div>
        );

      default:
        return (
          <Input
            type="text"
            placeholder={`Enter ${label.toLowerCase()}`}
            {...field}
          />
        );
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-destructive">*</span>}
          </FormLabel>
          <FormControl>{renderField(field)}</FormControl>
          {description && type !== 'boolean' && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
