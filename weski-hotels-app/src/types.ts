// src/types/index.ts

// קודם כל כל הטיפוסים הפנימיים
export interface HotelDistance {
  type: string;
  distance: string;
}

export interface HotelPosition {
  Latitude: string;
  Longitude: string;
  Distances: HotelDistance[];
}

export interface HotelImage {
  URL: string;
  MainImage?: string;
}

export interface HotelInfo {
  Position: HotelPosition;
  Rating: string;
  Beds: string;
}

export interface PricesInfo {
  AmountAfterTax: string;
  AmountBeforeTax: string;
}

export interface HotelDescriptiveContent {
  Images: HotelImage[];
}

export interface RawHotelData {
  HotelCode: string;
  HotelName: string;
  HotelDescriptiveContent: HotelDescriptiveContent;
  HotelInfo: HotelInfo;
  PricesInfo: PricesInfo;
}

// הטיפוס הראשי היחיד - איחוד של HotelItem ו-HotelResult
export interface HotelItem {
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomName?: string;
  maxPeople: number;
  price: number;
  currency: string; // שדה זה היה אופציונלי, צריך להיות חובה
  provider: string;
  raw: RawHotelData; // היה unknown, צריך להיות RawHotelData
}

export interface SearchQuery {
  ski_site: number;
  from_date: string; // MM/DD/YYYY
  to_date: string; // MM/DD/YYYY
  group_size: number;
}

// הסר את HotelResult לחלוטין!
// export interface HotelResult { ... }
