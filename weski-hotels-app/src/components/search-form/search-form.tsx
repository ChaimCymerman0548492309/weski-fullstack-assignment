import React, { useRef, useState } from 'react';
import './search-form.scss';
import ResortsSelect from './resorts-select/resorts-select';
import GuestsSelect from './guests-select/guests-select';
import SearchButton from './search-button/search-button';
import DatePicker from 'react-datepicker';
import dayjs from 'dayjs';
import { HotelItem, SearchQuery, RawHotelData } from '../../types';

type Props = {
  onResults: (items: HotelItem[]) => void;
  onLoading: (v: boolean) => void;
  onError: (msg: string | null) => void;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseJsonRecord(str: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(str);
    if (!isRecord(parsed)) throw new Error('Invalid SSE JSON payload');
    return parsed;
  } catch {
    throw new Error('Failed to parse SSE data');
  }
}

function createBasicRawHotelData(hotelId: string, hotelName: string, price: number): RawHotelData {
  return {
    HotelCode: hotelId,
    HotelName: hotelName,
    HotelDescriptiveContent: { Images: [] },
    HotelInfo: {
      Position: { Latitude: '', Longitude: '', Distances: [] },
      Rating: '0',
      Beds: '0',
    },
    PricesInfo: {
      AmountAfterTax: price.toString(),
      AmountBeforeTax: price.toString(),
    },
  };
}

function parseRawHotelData(raw: unknown): RawHotelData {
  try {
    if (typeof raw === 'string') {
      return JSON.parse(raw) as RawHotelData;
    }
    if (isRecord(raw)) {
      return raw as unknown as RawHotelData;
    }
    throw new Error('Invalid raw data format');
  } catch {
    return createBasicRawHotelData('', '', 0);
  }
}

function toHotelItem(item: Record<string, unknown>): HotelItem {
  const provider = typeof item.provider === 'string' ? item.provider : '';
  const hotelId = typeof item.hotelId === 'string' ? item.hotelId : '';
  const hotelName = typeof item.hotelName === 'string' ? item.hotelName : '';
  const roomId = typeof item.roomId === 'string' ? item.roomId : '';
  const roomName = typeof item.roomName === 'string' ? item.roomName : undefined;
  const maxPeople = typeof item.maxPeople === 'number' ? item.maxPeople : 0;
  const price = typeof item.price === 'number' ? item.price : 0;
  const currency = typeof item.currency === 'string' ? item.currency : 'EUR';

  const rawData = parseRawHotelData(item.raw);

  return {
    provider,
    hotelId,
    hotelName,
    roomId,
    roomName,
    maxPeople,
    price,
    currency,
    raw: rawData,
  };
}

function toHotelItems(v: unknown): HotelItem[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isRecord).map(toHotelItem);
}

function mergeAndSort(prev: HotelItem[], next: HotelItem[]): HotelItem[] {
  const map = new Map<string, HotelItem>();
  [...prev, ...next].forEach((x) => map.set(`${x.provider}:${x.roomId}`, x));
  return Array.from(map.values()).sort((a, b) => a.price - b.price);
}

const formatApiDate = (d: Date) => dayjs(d).format('MM/DD/YYYY');

const SearchForm: React.FC<Props> = ({ onResults, onLoading, onError }) => {
  const [skiSiteId, setSkiSiteId] = useState<number>(1);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date>(dayjs().toDate());
  const [endDate, setEndDate] = useState<Date>(dayjs().add(7, 'days').toDate());

  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HotelItem[]>([]);

  const runSearch = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    onError(null);
    resultsRef.current = [];
    onResults([]);
    onLoading(true);

    const query: SearchQuery = {
      ski_site: skiSiteId,
      from_date: formatApiDate(startDate),
      to_date: formatApiDate(endDate),
      group_size: groupSize,
    };

    try {
      const resp = await fetch('http://localhost:3001/api/search/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: ac.signal,
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let currentEvent = 'message';
      let currentData = '';

      const handleEvent = (eventName: string, dataStr: string) => {
        if (!dataStr) return;
        const rec = parseJsonRecord(dataStr);

        switch (eventName) {
          case 'chunk': {
            const items = toHotelItems(rec.items);
            resultsRef.current = mergeAndSort(resultsRef.current, items);
            onResults(resultsRef.current);
            break;
          }
          case 'done': {
            const items = toHotelItems(rec.items);
            resultsRef.current = items.sort((a, b) => a.price - b.price);
            onResults(resultsRef.current);
            onLoading(false);
            break;
          }
          case 'error': {
            const msg = typeof rec.error === 'string' ? rec.error : 'Search error';
            onLoading(false);
            onError(msg);
            break;
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).replace(/\r$/, '');
          buffer = buffer.slice(idx + 1);

          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            currentData += line.slice(5).trim();
          } else if (line === '') {
            handleEvent(currentEvent, currentData);
            currentEvent = 'message';
            currentData = '';
          }
        }
      }

      onLoading(false);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'Search failed';
      onLoading(false);
      onError(msg);
    }
  };

  return (
    <div className="search-form">
      <ResortsSelect value={skiSiteId} onChange={setSkiSiteId} />
      <GuestsSelect value={groupSize} onChange={setGroupSize} />
      <DatePicker
        className="search-form-date-picker"
        selected={startDate}
        onChange={(date) => date && setStartDate(date)}
        enableTabLoop={false}
      />
      <DatePicker
        className="search-form-date-picker"
        selected={endDate}
        onChange={(date) => date && setEndDate(date)}
        enableTabLoop={false}
      />
      <SearchButton onClick={runSearch} />
    </div>
  );
};

export default SearchForm;
