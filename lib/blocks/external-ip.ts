import {
  BuildingBlock,
  BuildingBlockContainer,
  BuildingBlockResource,
} from "../core";
import { Network } from "./network";

export interface ExternalIpConfig {
  readonly ip?: string;
  readonly network?: Network;
}

export interface ExternalIpResource extends BuildingBlockResource {
  readonly ip: string;
}

export class ExternalIp extends BuildingBlock<ExternalIpResource> {
  constructor(
    scope: BuildingBlockContainer,
    id: string,
    config: ExternalIpConfig
  ) {
    super(scope, id, scope.manager.createExternalIp(scope, id, config));
  }
}
