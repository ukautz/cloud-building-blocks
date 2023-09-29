import {
  BuildingBlock,
  BuildingBlockContainer,
  BuildingBlockResource,
} from "../core";

export interface DiskConfig {
  /**
   * The storage size in gigabytes.
   */
  readonly size: number;

  /**
   * The name or label on the filesystem (if applicable)
   */
  readonly device: string;

  /**
   * The availability zone to create the storage in.
   */
  readonly availabilityZone?: number;
}

export interface DiskResource extends BuildingBlockResource {
  readonly size: number;
  readonly device: string;
  readonly availabilityZone: string;
}

export class Disk extends BuildingBlock<DiskResource> {
  constructor(scope: BuildingBlockContainer, id: string, config: DiskConfig) {
    super(scope, id, scope.manager.createDisk(scope, id, config));
  }
}
