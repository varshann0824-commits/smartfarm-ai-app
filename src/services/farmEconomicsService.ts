import type { FarmEconomicsResult, SourceMetadata } from '@/types';
import { formatLastUpdated } from './sourceMetadata';

export interface EconomicsResult {
  result: FarmEconomicsResult | null;
  source: SourceMetadata;
}

export interface FarmEconomicsInput {
  landArea: number;
  seedCost: number;
  fertilizerCost: number;
  cropProtectionCost: number;
  labourCost: number;
  irrigationCost: number;
  machineryCost: number;
  transportCost: number;
  otherCost: number;
  expectedYield: number;
  expectedPrice: number;
}

export function calculateFarmEconomics(input: FarmEconomicsInput): EconomicsResult {
  const costs = [
    { label: 'Seed', amount: input.seedCost },
    { label: 'Fertilizer/Inputs', amount: input.fertilizerCost },
    { label: 'Crop Protection', amount: input.cropProtectionCost },
    { label: 'Labour', amount: input.labourCost },
    { label: 'Irrigation', amount: input.irrigationCost },
    { label: 'Machinery', amount: input.machineryCost },
    { label: 'Transport', amount: input.transportCost },
    { label: 'Other Costs', amount: input.otherCost },
  ];

  const totalCost = costs.reduce((a, c) => a + c.amount, 0);
  const expectedRevenue = input.expectedYield * input.expectedPrice;
  const estimatedProfit = expectedRevenue - totalCost;

  return {
    result: {
      totalCost,
      expectedRevenue,
      estimatedProfit,
      costBreakdown: costs.filter(c => c.amount > 0),
    },
    source: {
      sourceName: 'Farm Economics Calculator',
      sourceType: 'AI',
      isLive: false,
      isVerified: false,
      lastUpdated: formatLastUpdated(new Date()),
      status: 'available',
    },
  };
}
