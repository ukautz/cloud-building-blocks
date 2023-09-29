import * as aws from "@cdktf/provider-aws";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Construct } from "constructs";
import {
  DiskConfig,
  DiskResource,
  ExternalIpConfig,
  ExternalIpResource,
  NetworkConfig,
  NetworkResource,
  VirtualMachineArchitecture,
  VirtualMachineConfig,
  VirtualMachineResource,
} from "../../blocks";
import { BuildingBlockRegion } from "../../core";
import { BuildingBlockManager, BuildingBlockManagerRegister } from "../core";
import { INSTANCE_TYPES } from "./instance-types";

class AwsManager extends BuildingBlockManager {
  /**
   * The appropriate AWS region is selected by availability (e.g.: there is only one region in Africa)
   * and then amount of available services, availability zones, local zones and wavelength zones as
   * listed 2023-09 here:
   * https://aws.amazon.com/about-aws/global-infrastructure/regions_az/
   * https://www.aws-services.info/
   *
   * @returns Returns the region code for the selected region.
   */
  protected getRegion(): string {
    switch (this.config.region) {
      // AFRICA
      case (BuildingBlockRegion.Africa,
      BuildingBlockRegion.AfricaEast,
      BuildingBlockRegion.AfricaNorth,
      BuildingBlockRegion.AfricaSouth,
      BuildingBlockRegion.AfricaWest):
        return "af-south-1";

      // ASIA
      case BuildingBlockRegion.Asia:
        return "ap-northeast-1"; // Tokyo
      case BuildingBlockRegion.AsiaEast:
        return "ap-northeast-1"; // Tokyo
      case BuildingBlockRegion.AsiaSouth:
        return "ap-southeast-1"; // Singapore
      case BuildingBlockRegion.AsiaWest:
        return "ap-south-1"; // Mumbai

      // EUROPE
      case BuildingBlockRegion.Europe:
        return "eu-central-1"; // Frankfurt
      case BuildingBlockRegion.EuropeEast:
        return "eu-central-1"; // Frankfurt
      case BuildingBlockRegion.EuropeNorth:
        return "eu-north-1"; // Stockholm
      case BuildingBlockRegion.EuropeSouth:
        return "eu-south-1"; // Milan

      // NORTH AMERICA
      case BuildingBlockRegion.NorthAmerica:
        return "us-east-1"; // N. Virginia
      case BuildingBlockRegion.NorthAmericaEast:
        return "us-east-1"; // N. Virginia
      case BuildingBlockRegion.NorthAmericaNorth:
        return "us-canada-1"; // Montreal
      case BuildingBlockRegion.NorthAmericaSouth:
        return "us-east-1"; // N. Virginia
      case BuildingBlockRegion.NorthAmericaWest:
        return "us-west-2"; // Oregon

      // SOUTH AMERICA
      case (BuildingBlockRegion.SouthAmerica,
      BuildingBlockRegion.SouthAmericaEast,
      BuildingBlockRegion.SouthAmericaNorth,
      BuildingBlockRegion.SouthAmericaSouth,
      BuildingBlockRegion.SouthAmericaWest):
        return "sa-east-1"; // Sao Paulo

      // This should never happen - it's an enum, why do I need to provide this?
      default:
        throw Error("unsupported region");
    }
  }

  /**
   * The appropriate AWS availability zone in the selected region
   *
   * TODO: opt-in to all regions, so can do:
   * ```
   * for region in $(aws ec2 describe-regions --all-regions | jq -r '.Regions[] | .RegionName'); do
   *  echo -n "# $region"
   *  aws ec2 describe-availability-zones --region "$region" | jq -r '.AvailabilityZones[] | select(.State == "available") | .ZoneName'
   * done
   * ```
   *
   *
   * Until then:
   * ```
   * Africa (Cape Town)	af-south-1a, af-south-1b, af-south-1c
   * Asia Pacific (Hong Kong)	ap-east-1a, ap-east-1b, ap-east-1c
   * Asia Pacific (Tokyo)	ap-northeast-1a, ap-northeast-1b, ap-northeast-1c, ap-northeast-2d
   * Asia Pacific (Seoul)	ap-northeast-2a, ap-northeast-2b, ap-northeast-2c, ap-northeast-2d
   * Asia Pacific (Osaka)	ap-northeast-3a, ap-northeast-3b, ap-northeast-3c
   * Asia Pacific (Mumbai)	ap-south-1a, ap-south-1b, ap-south-1c
   * Asia Pacific (Hyderabad)	ap-south-2a, ap-south-2b, ap-south-2c
   * Asia Pacific (Singapore)	ap-southeast-1a, ap-southeast-1b, ap-southeast-1c
   * Asia Pacific (Sydney)	ap-southeast-2a, ap-southeast-2b, ap-southeast-2c
   * Asia Pacific (Jakarta)	ap-southeast-3a, ap-southeast-3b, ap-southeast-3c
   * Asia Pacific (Melbourne)	ap-southeast-4a, ap-southeast-4b, ap-southeast-4c
   * Canada (Central)	ca-central-1a, ca-central-1b, ca-central-1c
   * China (Beijing)	cn-north-1a, cn-north-1b, cn-north-1c
   * China (Ningxia)	cn-northwest-1a, cn-northwest-1b, cn-northwest-1c
   * Europe (Frankfurt)	eu-central-1a, eu-central-1b, eu-central-1c
   * Europe (Zurich)	eu-central-2a, eu-central-2b, eu-central-2c
   * Europe (Stockholm)	eu-north-1a, eu-north-1b, eu-north-1c
   * Europe (Milan)	eu-south-1a, eu-south-1b, eu-south-1c
   * Europe (Spain)	eu-south-2a, eu-south-2b, eu-south-2c
   * Europe (Ireland)	eu-west-1a, eu-west-1b, eu-west-1c
   * Europe (London)	eu-west-2a, eu-west-2b, eu-west-2c
   * Europe (Paris)	eu-west-3a, eu-west-3b, eu-west-3c
   * Middle East (UAE)	me-central-1a, me-central-1b, me-central-1c
   * Middle East (Bahrain)	me-south-1a, me-south-1b, me-south-1c
   * South America (Sao Paulo)	sa-east-1a, sa-east-1b, sa-east-1c
   * US East (N. Virginia)	us-east-1a, us-east-1b, us-east-1c, us-east-1d, us-east-1e, us-east-1f
   * US East (Ohio)	us-east-2a, us-east-2b, us-east-2c
   * AWS GovCloud (US-East)	us-gov-east-1a, us-gov-east-1b, us-gov-east-1c
   * AWS GovCloud (US-West)	us-gov-west-1a, us-gov-west-1b, us-gov-west-1c
   * US West (N. California)	us-west-1a, us-west-1b, us-west-1c
   * US West (Oregon)	us-west-2a, us-west-2b, us-west-2c, us-west-2d
   * ```
   *
   */
  protected static availabilityZones: { [key: string]: string[] } = {
    "af-south-1": ["a", "b", "c"],
    "ap-east-1": ["a", "b", "c"],
    "ap-northeast-1": ["a", "b", "c", "d"],
    "ap-northeast-2": ["a", "b", "c", "d"],
    "ap-northeast-3": ["a", "b", "c"],
    "ap-south-1": ["a", "b", "c"],
    "ap-south-2": ["a", "b", "c"],
    "ap-southeast-1": ["a", "b", "c"],
    "ap-southeast-2": ["a", "b", "c"],
    "ap-southeast-3": ["a", "b", "c"],
    "ap-southeast-4": ["a", "b", "c"],
    "ca-central-1": ["a", "b", "c"],
    "cn-north-1": ["a", "b", "c"],
    "cn-northwest-1": ["a", "b", "c"],
    "eu-central-1": ["a", "b", "c"],
    "eu-central-2": ["a", "b", "c"],
    "eu-north-1": ["a", "b", "c"],
    "eu-south-1": ["a", "b", "c"],
    "eu-south-2": ["a", "b", "c"],
    "eu-west-1": ["a", "b", "c"],
    "eu-west-2": ["a", "b", "c"],
    "eu-west-3": ["a", "b", "c"],
    "me-central-1": ["a", "b", "c"],
    "me-south-1": ["a", "b", "c"],
    "sa-east-1": ["a", "b", "c"],
    "us-east-1": ["a", "b", "c", "d", "e", "f"],
    "us-east-2": ["a", "b", "c"],
    "us-gov-e": ["a", "b", "c"],
    "us-gov-w": ["a", "b", "c"],
    "us-west-1": ["a", "b", "c"],
    "us-west-2": ["a", "b", "c", "d"],
  };
  protected getAvailabilityZone(num: number): string {
    if (num < 1) {
      throw new Error("availability zone must be greater than 0");
    }
    if (Math.round(num) != num) {
      throw new Error("availability zone must be integer");
    }
    const awsRegion = this.getRegion();
    if (!(awsRegion in AwsManager.availabilityZones)) {
      throw new Error(`availability zone for region ${awsRegion} unknown`);
    }
    const azs = AwsManager.availabilityZones[awsRegion];
    if (num > azs.length) {
      throw new Error(
        `availability zone ${num} not available in region ${awsRegion}`
      );
    }
    return `${awsRegion}${azs[num - 1]}`;
  }

  protected vpc?: aws.dataAwsVpc.DataAwsVpc | aws.vpc.Vpc;

  protected getVpc(
    scope: Construct,
    config?: NetworkConfig
  ): aws.dataAwsVpc.DataAwsVpc | aws.vpc.Vpc {
    if (!this.vpc) {
      this.vpc = this.config.vendor.vpcId
        ? new aws.dataAwsVpc.DataAwsVpc(scope, "Vpc", {
            id: this.config.vendor.vpcId,
          })
        : new aws.vpc.Vpc(scope, "Vpc", {
            provider: this.provider,
            cidrBlock: config?.cidr,
          });
    }
    return this.vpc;
  }

  public createNetwork(
    scope: Construct,
    id: string,
    config: NetworkConfig
  ): NetworkResource {
    const vpc = this.getVpc(scope, config);
    const availabilityZone = this.getAvailabilityZone(
      config.availabilityZone ?? 1
    );
    const subnet = new aws.subnet.Subnet(scope, id, {
      provider: this.provider,
      vpcId: vpc.id,
      cidrBlock: config.cidr,
      availabilityZone,
    });

    return {
      cidr: subnet.cidrBlock,
      providerId: subnet.id,
      providerResource: subnet,
      availabilityZone,
    };
  }

  public createExternalIp(
    scope: Construct,
    id: string,
    config: ExternalIpConfig
  ): ExternalIpResource {
    const resource = new aws.eip.Eip(scope, id, {
      provider: this.provider,
      domain: config.network ? "vpc" : "standard",
      address: config.ip,
    });

    return {
      ip: resource.publicIp,
      providerId: resource.id,
      providerResource: resource,
    };
  }

  public createDisk(
    scope: Construct,
    id: string,
    config: DiskConfig
  ): DiskResource {
    const availabilityZone = this.getAvailabilityZone(
      config.availabilityZone ?? 1
    );
    const volume = new aws.ebsVolume.EbsVolume(scope, id, {
      provider: this.provider,
      size: config.size,
      availabilityZone,
    });

    return {
      size: volume.size,
      device: config.device,
      providerId: volume.id,
      providerResource: volume,
      availabilityZone,
    };
  }

  /**
   * Returns an AMI identifier for the given operating system and, architecture in the current region.
   *
   * @param scope
   * @param config
   */
  protected getVirtualMachineImageId(
    scope: Construct,
    config: VirtualMachineConfig
  ): string {
    // TODO: maintain a map of latest images per supported region per supported OS per supported architecture
    throw new Error(
      `Auto-selecting an image for ${config.image} (arch: ${
        config.architecture ?? "undefined"
      }) in ${this.getRegion()} is currently not supported. Please provide an AMI identifier.`
    );
  }

  /**
   * Returns the instance size that is closest (equal or bigger) to the given memory, cpu and gpu requirements.
   *
   * @param scope
   * @param config
   */
  protected getInstanceType(config: VirtualMachineConfig): string {
    let arch =
      VirtualMachineArchitecture[
        config.architecture ?? VirtualMachineArchitecture.X86_64
      ].toLocaleLowerCase();
    let types = INSTANCE_TYPES.filter(
      (instanceType) =>
        instanceType.arch == arch &&
        (!config.memory || instanceType.memory >= config.memory) &&
        (!config.cpus || instanceType.cpus >= config.cpus) &&
        (!config.gpus || instanceType.gpus >= config.gpus)
    ).sort((a, b) => {
      if (a.cpus > b.cpus) {
        return 1;
      } else if (a.cpus < b.cpus) {
        return -1;
      }
      if (a.memory > b.memory) {
        return 1;
      } else if (a.memory < b.memory) {
        return -1;
      }
      if (a.gpus > b.gpus) {
        return 1;
      } else if (a.gpus > b.gpus) {
        return -1;
      }
      return 0;
    });
    if (types.length == 0) {
      throw new Error(`No instance type found for ${config}`);
    }
    return types[0].name;
  }

  public createVirtualMachine(
    scope: Construct,
    id: string,
    config: VirtualMachineConfig
  ): VirtualMachineResource {
    const availabilityZone = this.getAvailabilityZone(
      config.availabilityZone ?? 1
    );
    config.disks?.forEach((disk) => {
      if (disk.resource.availabilityZone != availabilityZone) {
        throw new Error(
          `All disks must be in the same availability zone ${availabilityZone} as the virtual machine`
        );
      }
    });
    config.networks?.forEach((network) => {
      if (network.resource.availabilityZone != availabilityZone) {
        throw new Error(
          `All networks must be in the same availability zone ${availabilityZone} as the virtual machine`
        );
      }
    });
    const ami =
      typeof config.image == "string"
        ? config.image
        : this.getVirtualMachineImageId(scope, config);
    const instance = new aws.instance.Instance(scope, id, {
      ami,
      availabilityZone,
      instanceType: this.getInstanceType(config),
    });
    config.networks?.forEach((network) => {
      new aws.networkInterface.NetworkInterface(
        scope,
        `${id}-${network.resource.providerId}`,
        {
          subnetId: network.resource.providerId,
        }
      );
    });
  }
}

BuildingBlockManagerRegister.register(AwsProvider.tfResourceType, AwsManager);
