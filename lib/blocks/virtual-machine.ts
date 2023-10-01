import {
  BuildingBlock,
  BuildingBlockContainer,
  BuildingBlockResource,
} from "../core";
import { Disk } from "./disk";
import { Network } from "./network";

/**
 * The (latest LTS version of the) operating system to use for a virtual machine.
 */
export enum VirtualMachineImage {
  CentOS,
  Debian,
  Fedora,
  Ubuntu,
  Windows,
}

export function isVirtualMachineImage(
  image: VirtualMachineImage | string
): image is VirtualMachineImage {
  return (
    typeof image === "number" &&
    Object.values(VirtualMachineImage).includes(image)
  );
}

export enum VirtualMachineArchitecture {
  Arm64,
  X86_64,
}

export function isVirtualMachineArchitecture(
  architecture: VirtualMachineArchitecture | string
): architecture is VirtualMachineArchitecture {
  return (
    typeof architecture === "number" &&
    Object.values(VirtualMachineArchitecture).includes(architecture)
  );
}

export interface VirtualMachineConfig {
  /**
   * Amount of memory in megabytes.
   *
   * An instance with the least amount of memory that is equal or greater than
   * this value will be selected from the cloud provider.
   */
  readonly memory?: number;

  /**
   * Amount of CPUs.
   *
   * An instance with the least amount of CPUs that is equal or greater than
   * this value will be selected from the cloud provider.
   */
  readonly cpus?: number;

  /**
   * Amount of GPUs.
   *
   * An instance with the least amount of GPUs that is equal or greater than
   * this value will be selected from the cloud provider.
   */
  readonly gpus?: number;

  /**
   * The architecture to use.
   */
  readonly architecture?: VirtualMachineArchitecture;

  /**
   * The operating system to use.
   *
   * The attribute supports two types:
   * 1. VirtualMachineImage: The latest LTS image of the selected operating
   *    system will be used, if the cloud provider supports it.
   * 2. string: A cloud provider specific image id (e.g. AWS AMI id, DigitalOcean
   *    droplet slug, etc)
   *
   * Note: The operating system must be available in the selected region and
   * supported by the provider.
   */
  readonly image: VirtualMachineImage | string;

  /**
   * The cloud-init configuration to use.
   */
  readonly cloudInit?: string;

  /**
   * The availability zone to create the storage in.
   */
  readonly availabilityZone?: number;

  /**
   * The network(s) the virtual machine should be connected to.
   *
   * Note: All networks must be in the same availability zone as the virtual machine.
   */
  readonly networks: Network[];

  /**
   * The disk(s) associated to the virtual machine.
   *
   * Note: All disks must be in the same availability zone as the virtual machine.
   */
  readonly disks: Disk[];
}

export interface VirtualMachineResource extends BuildingBlockResource {}

export class VirtualMachine extends BuildingBlock<VirtualMachineResource> {
  constructor(
    scope: BuildingBlockContainer,
    id: string,
    config: VirtualMachineConfig
  ) {
    super(scope, id, scope.manager.createVirtualMachine(scope, id, config));
  }
}
