import { TerraformProvider } from "cdktf";
import { Construct } from "constructs";
import {
  DiskConfig,
  DiskResource,
  ExternalIpConfig,
  ExternalIpResource,
  NetworkConfig,
  NetworkResource,
  VirtualMachineConfig,
  VirtualMachineResource,
} from "../blocks";

export interface BuildingBlockManagerConfig {
  /**
   * Where the building blocks should be created.
   */
  //readonly region: BuildingBlockRegion;

  /**
   * Toggle for production mode. Allows the manager of the provider to select
   * resources that are less expensive but not as reliable when not in production.
   */
  readonly production: boolean;

  /**
   * Vendor specific, arbitrary configuration.
   */
  readonly vendor?: { [key: string]: string };
}

export abstract class BuildingBlockManager {
  public readonly provider: TerraformProvider;
  protected readonly config: BuildingBlockManagerConfig;

  constructor(provider: TerraformProvider, config: BuildingBlockManagerConfig) {
    this.provider = provider;
    this.config = config;
  }

  public abstract createNetwork(
    scope: Construct,
    id: string,
    config: NetworkConfig
  ): NetworkResource;

  public abstract createExternalIp(
    scope: Construct,
    id: string,
    config: ExternalIpConfig
  ): ExternalIpResource;

  public abstract createDisk(
    scope: Construct,
    id: string,
    config: DiskConfig
  ): DiskResource;

  public abstract createVirtualMachine(
    scope: Construct,
    id: string,
    config: VirtualMachineConfig
  ): VirtualMachineResource;
}

export type BuildingBlockManagerConstructor<T extends BuildingBlockManager> = {
  new (provider: TerraformProvider, config: BuildingBlockManagerConfig): T;
};

export class BuildingBlockManagerRegister {
  protected static managers: {
    [key: string]: BuildingBlockManagerConstructor<BuildingBlockManager>;
  } = {};

  public static register<T extends BuildingBlockManager>(
    name: string,
    manager: BuildingBlockManagerConstructor<T>
  ) {
    BuildingBlockManagerRegister.managers[name] = manager;
  }

  public static create(
    provider: TerraformProvider,
    config: BuildingBlockManagerConfig
  ): BuildingBlockManager {
    const name = provider.terraformProviderSource ?? "undefined";
    if (!(name in BuildingBlockManagerRegister.managers)) {
      throw new Error(`No manager registered for provider ${name}`);
    }

    const managerClass = BuildingBlockManagerRegister.managers[name];
    return new managerClass(provider, config);
  }
}
