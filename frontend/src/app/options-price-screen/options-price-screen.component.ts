import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, bufferTime, filter } from 'rxjs';
import { OPTIONS_PRICE_CONFIG } from './options-price.config';
import { OptionPriceEvent } from './options-price.models';
import { OptionsPriceStreamService } from './options-price-stream.service';

@Component({
  selector: 'app-options-price-screen',
  templateUrl: './options-price-screen.component.html',
  styleUrls: ['./options-price-screen.component.css']
})
export class OptionsPriceScreenComponent implements OnInit, OnDestroy {
  readonly symbols: string[] = [
    'AAPL-202606-C-190',
    'AAPL-202606-P-190',
    'MSFT-202606-C-430',
    'NVDA-202606-C-1000',
    'TSLA-202606-P-190'
  ];

  selectedSymbol = this.symbols[0];
  lastUpdateTime: Date | null = null;
  liveRows: OptionPriceEvent[] = [];

  private readonly latestBySymbol = new Map<string, OptionPriceEvent>();
  private readonly historyBySymbol = new Map<string, number[]>();
  private streamSub?: Subscription;

  constructor(private readonly streamService: OptionsPriceStreamService) {}

  ngOnInit(): void {
    this.streamSub = this.streamService.prices$
      .pipe(
        bufferTime(OPTIONS_PRICE_CONFIG.renderThrottleMs),
        filter((batch: OptionPriceEvent[]) => batch.length > 0)
      )
      .subscribe((batch: OptionPriceEvent[]) => this.applyBatch(batch));

    if (OPTIONS_PRICE_CONFIG.useMockStream) {
      this.streamService.startMockStream(this.symbols);
    } else {
      this.streamService.connect(OPTIONS_PRICE_CONFIG.wsUrl);
      setTimeout(() => this.streamService.subscribeToSymbols(this.symbols), 200);
    }
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
    this.streamService.disconnect();
  }

  onSymbolChange(symbol: string): void {
    this.selectedSymbol = symbol;
  }

  get selectedSymbolLatest(): OptionPriceEvent | null {
    return this.latestBySymbol.get(this.selectedSymbol) ?? null;
  }

  get selectedSymbolHistory(): number[] {
    return this.historyBySymbol.get(this.selectedSymbol) ?? [];
  }

  get chartPath(): string {
    const points = this.selectedSymbolHistory;
    if (points.length < 2) {
      return '';
    }

    const width = 580;
    const height = 160;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const spread = Math.max(max - min, 0.0001);

    return points
      .map((price, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((price - min) / spread) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  trackBySymbol(_: number, item: OptionPriceEvent): string {
    return item.symbol;
  }

  private applyBatch(batch: OptionPriceEvent[]): void {
    const perSymbolLatest = new Map<string, OptionPriceEvent>();
    for (const evt of batch) {
      perSymbolLatest.set(evt.symbol, evt);
    }

    for (const evt of perSymbolLatest.values()) {
      this.latestBySymbol.set(evt.symbol, evt);
      this.pushHistory(evt.symbol, evt.fairPrice);
      this.lastUpdateTime = new Date(evt.timestamp);
    }

    this.liveRows = Array
      .from(this.latestBySymbol.values())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, OPTIONS_PRICE_CONFIG.tableRowsLimit);
  }

  private pushHistory(symbol: string, fairPrice: number): void {
    const history = this.historyBySymbol.get(symbol) ?? [];
    history.push(fairPrice);

    if (history.length > OPTIONS_PRICE_CONFIG.chartPointsLimit) {
      history.splice(0, history.length - OPTIONS_PRICE_CONFIG.chartPointsLimit);
    }

    this.historyBySymbol.set(symbol, history);
  }
}
