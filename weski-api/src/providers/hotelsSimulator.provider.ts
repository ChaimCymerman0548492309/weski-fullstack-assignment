// src/providers/hotelsSimulator.provider.ts
import { HotelsProvider, ProviderSearchResult, SearchQuery, ProviderHotel } from './types';

type Accommodation = {
  HotelCode: string;
  HotelName: string;
  HotelDescriptiveContent?: {
    PricesInfo?: {
      AmountAfterTax?: string | number;
    };
  };
  PricesInfo?: {
    AmountAfterTax?: string | number;
  };
};

type SimulatorBody = {
  accommodations?: Accommodation[];
  success?: boolean;
};

type HotelApiResponse = {
  statusCode?: number;
  body?: string | SimulatorBody;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasAccommodations(v: unknown): v is { accommodations: Accommodation[] } {
  if (!isRecord(v)) return false;
  const acc = v['accommodations'];
  return Array.isArray(acc);
}

function safeParseBody(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

export class HotelsSimulatorProvider implements HotelsProvider {
  name = 'HotelsSimulator';
  private url: string;

  constructor(url: string = 'https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator') {
    this.url = url;
  }

  private parseAmount(amount: string | number | undefined): number {
    if (typeof amount === 'number' && Number.isFinite(amount)) return amount;
    if (typeof amount === 'string') {
      const n = Number.parseFloat(amount);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }

  private mapAccommodation(acc: Accommodation, groupSize: number): ProviderHotel {
    const amount = acc.PricesInfo?.AmountAfterTax ?? acc.HotelDescriptiveContent?.PricesInfo?.AmountAfterTax;

    const price = this.parseAmount(amount);

    return {
      hotelId: acc.HotelCode,
      hotelName: acc.HotelName,
      roomId: `${acc.HotelCode}:${groupSize}:${price}`,
      roomName: undefined,
      maxPeople: groupSize,
      price,
      currency: 'EUR',
      raw: acc,
    };
  }

  async search(query: SearchQuery): Promise<ProviderSearchResult> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`API error: ${response.status} ${text}`);
    }

    const data: unknown = (await response.json()) as unknown;

    // simulator envelope: { statusCode, body: string | { accommodations: [...] } }
    let accommodations: Accommodation[] = [];

    if (isRecord(data)) {
      const maybeBody = data['body'];

      if (typeof maybeBody === 'string') {
        const parsed = safeParseBody(maybeBody);
        if (hasAccommodations(parsed)) accommodations = parsed.accommodations;
      } else if (hasAccommodations(maybeBody)) {
        accommodations = maybeBody.accommodations;
      } else if (hasAccommodations(data)) {
        // fallback if simulator returns body-less payload
        accommodations = data.accommodations;
      }
    }

    const hotels = accommodations.map((acc) => this.mapAccommodation(acc, query.group_size));
    return { provider: this.name, query, hotels };
  }
}
