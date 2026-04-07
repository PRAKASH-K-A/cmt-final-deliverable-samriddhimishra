export type OptionSide = 'CALL' | 'PUT';

export interface PricingParameters {
  model: string;
  optionSide: OptionSide;
  spot: number;
  strike: number;
  volatility: number;
  rate: number;
  timeToExpiryYears: number;
}

export interface OptionPriceEvent {
  eventType: 'OPTION_PRICE';
  symbol: string;
  fairPrice: number;
  bid: number;
  ask: number;
  timestamp: string;
  parameters: PricingParameters;
}

export interface PriceSubscriptionRequest {
  action: 'SUBSCRIBE';
  topic: 'OPTION_PRICE';
  symbols: string[];
}
