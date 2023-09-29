import {
  BuildingBlock,
  BuildingBlockContainer,
  BuildingBlockResource,
} from "../core";

export interface NetworkConfig {
  readonly private: boolean;
  readonly cidr?: string;
  readonly availabilityZone?: number;
}

export interface NetworkResource extends BuildingBlockResource {
  readonly cidr: string;
  readonly availabilityZone: string;
}

export class Network extends BuildingBlock<NetworkResource> {
  constructor(
    scope: BuildingBlockContainer,
    id: string,
    config: NetworkConfig
  ) {
    super(scope, id, scope.manager.createNetwork(scope, id, config));
  }
}
