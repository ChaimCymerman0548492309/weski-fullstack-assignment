export type SearchQuery = {
  ski_site: number;
  from_date: string; // "MM/DD/YYYY"
  to_date: string;   // "MM/DD/YYYY"
  group_size: number;
};

export type ProviderHotel = {
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomName?: string;
  maxPeople: number;
  price: number;
  currency?: string;
  raw: unknown;
};

export type ProviderSearchResult = {
  provider: string;
  query: SearchQuery;
  hotels: ProviderHotel[];
};

export interface HotelsProvider {
  name: string;
  search(query: SearchQuery): Promise<ProviderSearchResult>;
}


