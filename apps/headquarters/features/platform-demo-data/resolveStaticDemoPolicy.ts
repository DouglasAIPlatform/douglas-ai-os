import {
  isDemoSourceEnabled,
  resolveDemoDataPolicy,
  type DemoDataSource,
} from "@douglas/demo-data";
import { demoDataConfig } from "./config";

export function getHeadquartersDemoPolicy() {
  return resolveDemoDataPolicy(demoDataConfig);
}

export function isHeadquartersDemoSourceEnabled(source: DemoDataSource) {
  return isDemoSourceEnabled(getHeadquartersDemoPolicy(), source);
}
