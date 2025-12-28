import { HotelsProvider, SearchQuery, ProviderHotel } from "../providers/types";

export type AggregatedHotel = ProviderHotel & {
  provider: string;
};

export function buildGroupSizesUpTo10(requested: number) {
  const sizes: number[] = [];
  for (let s = requested; s <= 10; s++) sizes.push(s);
  return sizes;
}

export function sortByPriceAsc(items: AggregatedHotel[]) {
  return [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
}

export async function searchAllProvidersParallel(
  providers: HotelsProvider[],
  baseQuery: SearchQuery,
  onChunk?: (chunk: { groupSize: number; items: AggregatedHotel[] }) => void
) {
  const sizes = buildGroupSizesUpTo10(baseQuery.group_size);

  const tasks = providers.flatMap((p) =>
    sizes.map(async (groupSize) => {
      const res = await p.search({ ...baseQuery, group_size: groupSize });
      const items: AggregatedHotel[] = res.hotels.map((h) => ({ ...h, provider: res.provider }));
      onChunk?.({ groupSize, items });
      return items;
    })
  );

  const all = (await Promise.allSettled(tasks))
    .filter((x): x is PromiseFulfilledResult<AggregatedHotel[]> => x.status === "fulfilled")
    .flatMap((x) => x.value);

  return sortByPriceAsc(all);
}
