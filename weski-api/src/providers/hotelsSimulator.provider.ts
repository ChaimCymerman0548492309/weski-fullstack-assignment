
// src/providers/hotelsSimulator.provider.ts
import { HotelsProvider, ProviderSearchResult, SearchQuery, ProviderHotel } from './types';

interface HotelApiResponse {
  statusCode?: number;
  body?:
    | string
    | {
        accommodations?: Accommodation[];
      };
}

interface Accommodation {
  HotelCode: string;
  HotelName: string;
  HotelDescriptiveContent?: {
    PricesInfo?: {
      AmountAfterTax: string | number;
    };
  };
  PricesInfo?: {
    AmountAfterTax: string | number;
  };
}

export class HotelsSimulatorProvider implements HotelsProvider {
  name = 'HotelsSimulator';
  private url: string;

  constructor(url: string = 'https://gya7b1xubh.execute-api.eu-west-2.amazonaws.com/default/HotelsSimulator') {
    this.url = url;
  }

  private parseAmount(amount: string | number | undefined): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') return parseFloat(amount) || 0;
    return 0;
  }

  private mapAccommodation(acc: Accommodation, groupSize: number): ProviderHotel {
    const amount = acc.PricesInfo?.AmountAfterTax || acc.HotelDescriptiveContent?.PricesInfo?.AmountAfterTax;
    const price = this.parseAmount(amount);

    return {
      hotelId: acc.HotelCode,
      hotelName: acc.HotelName,
      roomId: `${acc.HotelCode}:${groupSize}:${price}`,
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

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data: HotelApiResponse = await response.json();

    let accommodations: Accommodation[] = [];

    if (data.body) {
      const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      accommodations = body.accommodations || [];
    } else if ('accommodations' in data) {
      accommodations = (data as any).accommodations || [];
    }

    const hotels = accommodations.map((acc) => this.mapAccommodation(acc, query.group_size));

    return { provider: this.name, query, hotels };
  }
}

// src/providers/hotelSearchService.ts
export class HotelSearchService {
  private providers: HotelsProvider[] = [];

  constructor(providers: HotelsProvider[] = []) {
    this.providers = providers;
  }

  addProvider(provider: HotelsProvider): void {
    this.providers.push(provider);
  }

  async searchProgressive(query: SearchQuery, onProgress: (hotels: ProviderHotel[]) => void): Promise<ProviderHotel[]> {
    const allHotels: ProviderHotel[] = [];
    const groupSearches: Promise<void>[] = [];

    // Search for requested size and larger rooms (up to 10)
    for (let size = query.group_size; size <= 10; size++) {
      const sizeQuery = { ...query, group_size: size };

      const sizeSearch = (async () => {
        const providerPromises = this.providers.map((p) =>
          p.search(sizeQuery).catch(() => ({ provider: p.name, query: sizeQuery, hotels: [] })),
        );

        const results = await Promise.all(providerPromises);
        results.forEach((result) => {
          const newHotels = result.hotels.filter(
            (h) => !allHotels.some((e) => e.hotelId === h.hotelId && e.roomId === h.roomId),
          );

          if (newHotels.length) {
            allHotels.push(...newHotels);
            onProgress([...allHotels].sort((a, b) => a.price - b.price));
          }
        });
      })();

      groupSearches.push(sizeSearch);
    }

    await Promise.all(groupSearches);
    return allHotels.sort((a, b) => a.price - b.price);
  }
}
