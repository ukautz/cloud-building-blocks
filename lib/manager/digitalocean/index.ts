import * as digitalocean from "@cdktf/provider-digitalocean";
import { Construct } from "constructs";
import {
  DiskConfig,
  DiskResource,
  ExternalIpConfig,
  ExternalIpResource,
  NetworkConfig,
  NetworkResource,
  VirtualMachineConfig,
  VirtualMachineImage,
  VirtualMachineResource,
  isVirtualMachineImage,
} from "../../blocks";
import { BuildingBlockManager } from "../core";

/* enum DigitalOceanRegion {
  Singapore = "sgp1",
  Bangalore = "blr1",
  Amsterdam = "ams3",
  Frankfurt = "fra1",
  SanFrancisco = "sfo3",
  NewYork = "nyc3",
  Toronto = "tor1",
  London = "lon1",
  Sydney = "syd1",
} */

export class DigitalOceanManager extends BuildingBlockManager {
  protected getRegion(): string {
    if (this.config.vendor?.region) {
      return this.config.vendor.region;
    }
    throw new Error("Missing region in provider.vendor config.");
  }
  /* protected getRegion(): string {
    // user override:
    if (this.config.vendor?.region) {
      return this.config.vendor.region;
    }

    // based on provided region
    switch (this.config.region) {
      case (BuildingBlockRegion.Africa,
      BuildingBlockRegion.AfricaEast,
      BuildingBlockRegion.AfricaNorth,
      BuildingBlockRegion.AfricaSouth,
      BuildingBlockRegion.AfricaWest):
        throw new Error("DigitalOcean does not run data-centers in Africa");
      case (BuildingBlockRegion.Asia,
      BuildingBlockRegion.AsiaEast,
      BuildingBlockRegion.AsiaSouth):
        return DigitalOceanRegion.Singapore;
      case (BuildingBlockRegion.AsiaWest, BuildingBlockRegion.AsiaNorth):
        return DigitalOceanRegion.Bangalore;
      case (BuildingBlockRegion.Europe, BuildingBlockRegion.EuropeNorth):
        return DigitalOceanRegion.Amsterdam;
      case (BuildingBlockRegion.EuropeEast, BuildingBlockRegion.EuropeSouth):
        return DigitalOceanRegion.Frankfurt;
      case BuildingBlockRegion.EuropeWest:
        return DigitalOceanRegion.London;

    }
  } */

  public createNetwork(
    scope: Construct,
    id: string,
    config: NetworkConfig
  ): NetworkResource {
    const vpc = new digitalocean.vpc.Vpc(scope, id, {
      region: this.getRegion(),
      provider: this.provider,
      name: id,
      ipRange: config.cidr,
    });
    return {
      providerId: vpc.id,
      providerResource: vpc,
      cidr: vpc.ipRange,
      availabilityZone: vpc.region,
    };
  }

  public createExternalIp(
    scope: Construct,
    id: string,
    config: ExternalIpConfig
  ): ExternalIpResource {
    const reservedIp = new digitalocean.reservedIp.ReservedIp(scope, id, {
      region: this.getRegion(),
      provider: this.provider,
      ipAddress: config.ip,
    });
    return {
      providerId: reservedIp.id,
      providerResource: reservedIp,
      ip: reservedIp.ipAddress,
    };
  }

  public createDisk(
    scope: Construct,
    id: string,
    config: DiskConfig
  ): DiskResource {
    const volume = new digitalocean.volume.Volume(scope, id, {
      region: this.getRegion(),
      provider: this.provider,
      name: id,
      size: config.size,
      initialFilesystemLabel: config.device,
    });
    return {
      providerId: volume.id,
      providerResource: volume,
      size: volume.size,
      device: volume.initialFilesystemLabel,
      availabilityZone: volume.region,
    };
  }

  protected getImage(config: VirtualMachineConfig): string {
    if (!isVirtualMachineImage(config.image)) {
      return config.image;
    }
    switch (config.image) {
      case VirtualMachineImage.CentOS:
        return "centos-stream-9-x64";
      case VirtualMachineImage.Debian:
        return "debian-12-x64";
      case VirtualMachineImage.Fedora:
        return "fedora-38-x64";
      case VirtualMachineImage.Ubuntu:
        return "ubuntu-22-04-x64";
      default:
        throw new Error(
          `DigitalOcean does not support ${
            VirtualMachineImage[config.image]
          } images`
        );
    }
  }

  public createVirtualMachine(
    scope: Construct,
    id: string,
    config: VirtualMachineConfig
  ): VirtualMachineResource {
    const droplet = new digitalocean.droplet.Droplet(scope, id, {
      region: this.getRegion(),
      provider: this.provider,
      image: this.getImage(config),
      name: id,
      size: config.size,
    });
  }
}
