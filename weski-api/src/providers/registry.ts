import { HotelsProvider } from "./types";
import { HotelsSimulatorProvider } from "./hotelsSimulator.provider";

export function getProviders(): HotelsProvider[] {
  const url = process.env.HOTELS_SIMULATOR_URL;
  if (!url) throw new Error("Missing HOTELS_SIMULATOR_URL");

// for now, only one provider: 
// HotelsSimulatorProvider
// (can be extended in the future to add more providers based on config)
  return [
    new HotelsSimulatorProvider(url)
  ];
}
