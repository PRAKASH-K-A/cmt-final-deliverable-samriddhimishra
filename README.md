# Individual Task Submission - G4-M4 (Options Price Screen UI)

This submission contains the complete frontend implementation for **Group 4, Member 4**:

- Display fair price results from pricing stream
- Real-time chart and table updates with throttled rendering
- UX: last update time, symbol selection, pricing parameter display

## Folder Contents

- `frontend/src/app/options-price-screen/options-price.models.ts`
- `frontend/src/app/options-price-screen/options-price.config.ts`
- `frontend/src/app/options-price-screen/options-price-stream.service.ts`
- `frontend/src/app/options-price-screen/options-price-screen.component.ts`
- `frontend/src/app/options-price-screen/options-price-screen.component.html`
- `frontend/src/app/options-price-screen/options-price-screen.component.css`
- `frontend/src/app/options-price-screen/options-price.module.ts`

## Integration Steps

1. Copy the `options-price-screen` folder into your Angular project under `src/app/`.
2. Import `OptionsPriceModule` in `app.module.ts` (or any feature module).
3. Add `<app-options-price-screen></app-options-price-screen>` in the target template.
4. Set stream mode in `options-price.config.ts`:
   - `useMockStream: true` for local demo
   - `useMockStream: false` to consume WebSocket from G4-M1 gateway
5. Update `wsUrl` to your aggregator endpoint.

## Expected WebSocket Event Shape

```json
{
  "eventType": "OPTION_PRICE",
  "symbol": "AAPL-202606-C-190",
  "fairPrice": 12.4832,
  "bid": 12.4300,
  "ask": 12.5300,
  "timestamp": "2026-04-07T11:02:13.820Z",
  "parameters": {
    "model": "Black-Scholes",
    "optionSide": "CALL",
    "spot": 194.2000,
    "strike": 190.0000,
    "volatility": 0.2200,
    "rate": 0.0300,
    "timeToExpiryYears": 0.5400
  }
}
```

## Performance Notes

- Rendering is throttled using `bufferTime` with `renderThrottleMs`.
- Each render cycle collapses multiple events per symbol to the latest event.
- Chart history is capped (`chartPointsLimit`) to keep UI responsive.
- Table rows are capped (`tableRowsLimit`) for stable browser performance.

## UX Delivered

- Last stream update timestamp
- Symbol dropdown selection
- Live fair-price chart for selected symbol
- Live table across symbols (fair/bid/ask/time)
- Parameter panel for model inputs
