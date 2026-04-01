export interface RateSegment {
  rateName: string;
  pricePerUnit: number;
  days: number;
  subtotal: number;
}

type Rate = {
  id: number;
  name: string;
  pricePerUnit: any;
  startMonth: number | null;
  startDay: number | null;
  endMonth: number | null;
  endDay: number | null;
  createdAt: any;
};

function toProxy(month: number, day: number) {
  return month * 32 + day;
}

function getRateForDay(allRates: Rate[], month: number, day: number): Rate | null {
  const proxy = toProxy(month, day);
  return (
    allRates
      .filter((r) => {
        if (!r.startMonth || !r.startDay || !r.endMonth || !r.endDay) return false;
        const start = toProxy(r.startMonth, r.startDay);
        const end = toProxy(r.endMonth, r.endDay);
        return end < start
          ? proxy >= start || proxy <= end
          : proxy >= start && proxy <= end;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
  );
}

export function computeRateSegments(
  allRates: Rate[],
  from: Date,
  to: Date,
): { rateSegments: RateSegment[]; totalPrice: number; numberOfNights: number } {
  const numberOfNights = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  const segments: RateSegment[] = [];
  const current = new Date(from);
  let currentRate: Rate | null = null;
  let segDays = 0;

  while (current < to) {
    const dayRate = getRateForDay(allRates, current.getMonth() + 1, current.getDate());

    if (currentRate && dayRate && currentRate.id === dayRate.id) {
      segDays++;
    } else {
      if (currentRate && segDays > 0) {
        const ppu = Number(currentRate.pricePerUnit) || 0;
        segments.push({ rateName: currentRate.name, pricePerUnit: ppu, days: segDays, subtotal: ppu * segDays });
      }
      currentRate = dayRate;
      segDays = dayRate ? 1 : 0;
    }

    current.setDate(current.getDate() + 1);
  }

  if (currentRate && segDays > 0) {
    const ppu = Number(currentRate.pricePerUnit) || 0;
    segments.push({ rateName: currentRate.name, pricePerUnit: ppu, days: segDays, subtotal: ppu * segDays });
  }

  return {
    rateSegments: segments,
    totalPrice: segments.reduce((sum, s) => sum + s.subtotal, 0),
    numberOfNights,
  };
}
