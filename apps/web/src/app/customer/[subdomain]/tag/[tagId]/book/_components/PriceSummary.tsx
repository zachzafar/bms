interface PriceQuote {
  rateSegments: Array<{ rateName: string; pricePerUnit: number; units: number; subtotal: number }>;
  rateTotal: number;
  addonLines: Array<{ name: string; quantity: number; unitPrice: number; billingType: string; total: number }>;
  addonsTotal: number;
  taxLines: Array<{ name: string; type: string; calculationType: string; rate: string; amount: number }>;
  taxTotal: number;
  grandTotal: number;
}

interface PriceSummaryProps {
  quote: PriceQuote | null;
  isLoading: boolean;
  error: string | null;
}

export function PriceSummary({ quote, isLoading, error }: PriceSummaryProps) {
  if (isLoading) {
    return (
      <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-muted-foreground">Checking rate...</p>
      </div>
    );
  }

  if (error || !quote || quote.rateSegments.length === 0) {
    return (
      <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600 font-medium">{error ?? 'No rate available for the selected dates'}</p>
      </div>
    );
  }

  return (
    <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded space-y-0.5">
      {quote.rateSegments.map((seg, i) => (
        <p key={i} className="text-green-800 font-medium">
          {seg.units} night{seg.units !== 1 ? 's' : ''} at ${seg.pricePerUnit}/night = ${seg.subtotal}
        </p>
      ))}

      {quote.addonLines.map((line, i) => (
        <p key={`addon-${i}`} className="text-green-800 font-medium">
          {line.name} x{line.quantity}
          {line.billingType === 'per_unit' ? ' (per unit)' : ''} = ${line.total.toFixed(2)}
        </p>
      ))}

      {quote.taxLines.map((line, i) => (
        <p key={`tax-${i}`} className="text-green-800 font-medium">
          {line.name}{line.calculationType === 'percentage' ? ` (${Number(line.rate)}%)` : ''}: ${line.amount.toFixed(2)}
        </p>
      ))}

      <p className="text-green-900 font-semibold mt-1">Total: ${quote.grandTotal.toFixed(2)}</p>
    </div>
  );
}
