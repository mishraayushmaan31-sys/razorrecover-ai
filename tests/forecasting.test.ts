import { describe, expect, it } from 'vitest';
import { generateRevenueForecast } from '../src/server/services/forecasting-service';

describe('Prompt 19: Revenue Forecasting', () => {
  it('implements revenue forecasting for 1 hour, 4 hours, 12 hours, and 24 hours', () => {
    const forecast = generateRevenueForecast();

    // Verify all 4 required horizons exist in the map and list
    expect(forecast.horizons['1h']).toBeDefined();
    expect(forecast.horizons['4h']).toBeDefined();
    expect(forecast.horizons['12h']).toBeDefined();
    expect(forecast.horizons['24h']).toBeDefined();
    expect(forecast.horizonsList.length).toBe(4);

    // 1 hour
    const h1 = forecast.horizons['1h'];
    expect(h1.hours).toBe(1);
    expect(h1.horizonLabel).toBe('1 hour');
    expect(h1.projectedGrossRevenue).toContain('1,20,000');
    expect(h1.projectedRevenueAtRisk).toContain('26,200');
    expect(h1.expectedRevenueRescued).toContain('23,800');
    expect(h1.confidenceScore).toBe(96);

    // 4 hours
    const h4 = forecast.horizons['4h'];
    expect(h4.hours).toBe(4);
    expect(h4.horizonLabel).toBe('4 hours');
    expect(h4.projectedGrossRevenue).toContain('4,80,000');
    expect(h4.projectedRevenueAtRisk).toContain('1,05,000');
    expect(h4.expectedRevenueRescued).toContain('95,400');
    expect(h4.confidenceScore).toBe(94);

    // 12 hours
    const h12 = forecast.horizons['12h'];
    expect(h12.hours).toBe(12);
    expect(h12.horizonLabel).toBe('12 hours');
    expect(h12.projectedGrossRevenue).toContain('14,40,000');
    expect(h12.projectedRevenueAtRisk).toContain('3,15,000');
    expect(h12.expectedRevenueRescued).toContain('2,86,000');
    expect(h12.confidenceScore).toBe(89);

    // 24 hours
    const h24 = forecast.horizons['24h'];
    expect(h24.hours).toBe(24);
    expect(h24.horizonLabel).toBe('24 hours');
    expect(h24.projectedGrossRevenue).toContain('28,80,000');
    expect(h24.projectedRevenueAtRisk).toContain('6,42,800');
    expect(h24.expectedRevenueRescued).toContain('5,84,200');
    expect(h24.confidenceScore).toBe(85);
  });

  it('clearly labels all forecasts as predictions/estimates', () => {
    const forecast = generateRevenueForecast();

    // Overall root label
    expect(forecast.predictionLabel).toBe('PREDICTION / ESTIMATE');
    expect(forecast.isPredictionOrEstimate).toBe(true);
    expect(forecast.disclaimer.toLowerCase()).toContain('prediction');
    expect(forecast.disclaimer.toLowerCase()).toContain('estimate');

    // Each individual horizon forecast must be explicitly labeled
    for (const h of forecast.horizonsList) {
      expect(h.predictionLabel).toBe('PREDICTION / ESTIMATE');
      expect(h.confidenceInterval).toBeDefined();
      expect(h.confidenceInterval.lowerRescued).toBeTruthy();
      expect(h.confidenceInterval.upperRescued).toBeTruthy();
      expect(h.assumptions.length).toBeGreaterThan(0);
    }
  });

  it('provides a 24-hour aggregate estimate summary', () => {
    const forecast = generateRevenueForecast();

    expect(forecast.summary24h.projectedGrossRevenue).toContain('28,80,000');
    expect(forecast.summary24h.totalRevenueAtRisk).toContain('6,42,800');
    expect(forecast.summary24h.totalEstimatedRescue).toContain('5,84,200');
    expect(forecast.summary24h.estimatedRecoveryRate).toBe('90.9%');
  });
});
