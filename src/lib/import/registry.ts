import "server-only";
import type { MetricDescriptor } from "./types";
import { airEmissionDescriptor } from "./descriptors/air-emission";
import { wasteDescriptor } from "./descriptors/waste";
import { waterDescriptor } from "./descriptors/water";
import { electricityDescriptor } from "./descriptors/electricity";

// The single source of truth for which metrics can be imported / synced today.
// Adding a metric = import its descriptor and add one entry here.
const REGISTRY = new Map<string, MetricDescriptor<unknown>>([
  [airEmissionDescriptor.key, airEmissionDescriptor],
  [wasteDescriptor.key, wasteDescriptor],
  [waterDescriptor.key, waterDescriptor],
  [electricityDescriptor.key, electricityDescriptor],
]);

export function getDescriptor(key: string): MetricDescriptor<unknown> | undefined {
  return REGISTRY.get(key);
}

export function listDescriptors(): MetricDescriptor<unknown>[] {
  return [...REGISTRY.values()];
}

export function isRegistered(key: string): boolean {
  return REGISTRY.has(key);
}
