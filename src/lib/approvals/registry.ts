import "server-only";
import type { ApprovalDescriptor } from "./types";
import { airEmissionApprovalDescriptor } from "./descriptors/air-emission";
import { wasteApprovalDescriptor } from "./descriptors/waste";
import { waterApprovalDescriptor } from "./descriptors/water";
import { electricityApprovalDescriptor } from "./descriptors/electricity";

// Which metrics can be approved today. Adding a metric = import its descriptor +
// add one entry here (and build its module).
const REGISTRY = new Map<string, ApprovalDescriptor>([
  [airEmissionApprovalDescriptor.key, airEmissionApprovalDescriptor],
  [wasteApprovalDescriptor.key, wasteApprovalDescriptor],
  [waterApprovalDescriptor.key, waterApprovalDescriptor],
  [electricityApprovalDescriptor.key, electricityApprovalDescriptor],
]);

export function getApprovalDescriptor(
  key: string,
): ApprovalDescriptor | undefined {
  return REGISTRY.get(key);
}

export function listApprovalDescriptors(): ApprovalDescriptor[] {
  return [...REGISTRY.values()];
}

export function isApprovalRegistered(key: string): boolean {
  return REGISTRY.has(key);
}
