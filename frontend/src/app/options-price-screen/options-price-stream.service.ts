import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, interval, map, Subscription } from 'rxjs';
import { OptionPriceEvent, PriceSubscriptionRequest } from './options-price.models';

@Injectable({ providedIn: 'root' })
export class OptionsPriceStreamService implements OnDestroy {
  private readonly pricesSubject = new Subject<OptionPriceEvent>();
  private socket: WebSocket | null = null;
  private mockSubscription: Subscription | null = null;

  readonly prices$: Observable<OptionPriceEvent> = this.pricesSubject.asObservable();

  connect(url: string): void {
    this.disconnect();

    this.socket = new WebSocket(url);
    this.socket.onmessage = (event: MessageEvent<string>) => {
      this.handleInboundMessage(event.data);
    };

    this.socket.onerror = () => {
      this.disconnect();
    };

    this.socket.onclose = () => {
      this.disconnect();
    };
  }

  subscribeToSymbols(symbols: string[]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const request: PriceSubscriptionRequest = {
      action: 'SUBSCRIBE',
      topic: 'OPTION_PRICE',
      symbols
    };

    this.socket.send(JSON.stringify(request));
  }

  startMockStream(symbols: string[]): void {
    this.stopMockStream();

    const seed: Record<string, number> = {};
    for (const symbol of symbols) {
      seed[symbol] = 80 + Math.random() * 60;
    }

    this.mockSubscription = interval(120)
      .pipe(
        map(() => {
          const symbol = symbols[Math.floor(Math.random() * symbols.length)];
          seed[symbol] = Math.max(1, seed[symbol] + (Math.random() - 0.5) * 1.8);

          const fair = Number(seed[symbol].toFixed(4));
          return this.makeMockEvent(symbol, fair);
        })
      )
      .subscribe((evt: OptionPriceEvent) => this.pricesSubject.next(evt));
  }

  stopMockStream(): void {
    if (!this.mockSubscription) {
      return;
    }

    this.mockSubscription.unsubscribe();
    this.mockSubscription = null;
  }

  disconnect(): void {
    this.stopMockStream();

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.pricesSubject.complete();
  }

  private handleInboundMessage(raw: string): void {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        for (const evt of parsed) {
          if (this.isOptionPriceEvent(evt)) {
            this.pricesSubject.next(evt);
          }
        }
        return;
      }

      if (this.isOptionPriceEvent(parsed)) {
        this.pricesSubject.next(parsed);
      }
    } catch {
      // Ignore malformed messages to keep stream resilient.
    }
  }

  private isOptionPriceEvent(value: unknown): value is OptionPriceEvent {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<OptionPriceEvent>;
    return candidate.eventType === 'OPTION_PRICE'
      && typeof candidate.symbol === 'string'
      && typeof candidate.fairPrice === 'number'
      && typeof candidate.timestamp === 'string';
  }

  private makeMockEvent(symbol: string, fair: number): OptionPriceEvent {
    const spot = Number((fair + 5 + Math.random() * 5).toFixed(4));
    const strike = Number((spot * (0.95 + Math.random() * 0.1)).toFixed(4));

    return {
      eventType: 'OPTION_PRICE',
      symbol,
      fairPrice: fair,
      bid: Number((fair - 0.15).toFixed(4)),
      ask: Number((fair + 0.15).toFixed(4)),
      timestamp: new Date().toISOString(),
      parameters: {
        model: 'Black-Scholes',
        optionSide: Math.random() > 0.5 ? 'CALL' : 'PUT',
        spot,
        strike,
        volatility: Number((0.12 + Math.random() * 0.2).toFixed(4)),
        rate: Number((0.015 + Math.random() * 0.02).toFixed(4)),
        timeToExpiryYears: Number((0.02 + Math.random() * 1.2).toFixed(4))
      }
    };
  }
}
