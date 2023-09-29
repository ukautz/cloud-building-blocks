import * as aws from "@cdktf/provider-aws";
import { TerraformProvider } from "cdktf";
import { Construct } from "constructs";

/**
 * Regions are geographical locations in which a cloud provider operates.
 *
 * Not all cloud providers support all regions.
 */
enum BuildingBlockRegion {
  Africa,
  AfricaEast,
  AfricaNorth,
  AfricaSouth,
  AfricaWest,
  Asia,
  AsiaEast,
  AsiaNorth,
  AsiaSouth,
  AsiaWest,
  Europe,
  EuropeEast,
  EuropeNorth,
  EuropeSouth,
  EuropeWest,
  NorthAmerica,
  NorthAmericaEast,
  NorthAmericaNorth,
  NorthAmericaSouth,
  NorthAmericaWest,
  SouthAmerica,
  SouthAmericaEast,
  SouthAmericaNorth,
  SouthAmericaSouth,
  SouthAmericaWest,
}

interface BuildingBlockManagerConfig {
  /**
   * Where the building blocks should be created.
   */
  readonly region: BuildingBlockRegion;

  /**
   * Vendor specific, arbitrary configuration.
   */
  readonly vendor: { [key: string]: string };
}

abstract class BuildingBlockManager {
  protected readonly provider: TerraformProvider;
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
   * ```
   * aws ec2 describe-instance-types | \
   * jq '.InstanceTypes | map(select( (.SupportedVirtualizationTypes[] | contains("hvm")) and (.InstanceType | test("^(m7|t3|c7|r7|p5|g5)")) )) | map( { "name": .InstanceType, "arch": ( .ProcessorInfo.SupportedArchitectures | join(",") ), "cpus": .VCpuInfo.DefaultVCpus, "memory": (.MemoryInfo.SizeInMiB / 1024), "gpus": ( if (.GpuInfo == null) then 0 else .GpuInfo.Gpus[0].Count end) } )'
   * ```
   */
  protected instanceTypes: {
    name: string;
    arch: string;
    cpus: number;
    memory: number;
    gpus: number;
  }[] = [
    {
      name: "m7g.4xlarge",
      arch: "arm64",
      cpus: 16,
      memory: 64,
      gpus: 0,
    },
    {
      name: "m7i.16xlarge",
      arch: "x86_64",
      cpus: 64,
      memory: 256,
      gpus: 0,
    },
    {
      name: "c7gd.medium",
      arch: "arm64",
      cpus: 1,
      memory: 2,
      gpus: 0,
    },
    {
      name: "c7i.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 16,
      gpus: 0,
    },
    {
      name: "r7a.32xlarge",
      arch: "x86_64",
      cpus: 128,
      memory: 1024,
      gpus: 0,
    },
    {
      name: "c7gn.16xlarge",
      arch: "arm64",
      cpus: 64,
      memory: 128,
      gpus: 0,
    },
    {
      name: "g5.4xlarge",
      arch: "x86_64",
      cpus: 16,
      memory: 64,
      gpus: 1,
    },
    {
      name: "m7gd.16xlarge",
      arch: "arm64",
      cpus: 64,
      memory: 256,
      gpus: 0,
    },
    {
      name: "c7g.8xlarge",
      arch: "arm64",
      cpus: 32,
      memory: 64,
      gpus: 0,
    },
    {
      name: "r7a.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 64,
      gpus: 0,
    },
    {
      name: "m7gd.large",
      arch: "arm64",
      cpus: 2,
      memory: 8,
      gpus: 0,
    },
    {
      name: "m7gd.xlarge",
      arch: "arm64",
      cpus: 4,
      memory: 16,
      gpus: 0,
    },
    {
      name: "g5.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 32,
      gpus: 1,
    },
    {
      name: "r7a.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 32,
      gpus: 0,
    },
    {
      name: "c7gn.xlarge",
      arch: "arm64",
      cpus: 4,
      memory: 8,
      gpus: 0,
    },
    {
      name: "r7gd.xlarge",
      arch: "arm64",
      cpus: 4,
      memory: 32,
      gpus: 0,
    },
    {
      name: "c7gn.8xlarge",
      arch: "arm64",
      cpus: 32,
      memory: 64,
      gpus: 0,
    },
    {
      name: "r7a.4xlarge",
      arch: "x86_64",
      cpus: 16,
      memory: 128,
      gpus: 0,
    },
    {
      name: "c7g.4xlarge",
      arch: "arm64",
      cpus: 16,
      memory: 32,
      gpus: 0,
    },
    {
      name: "m7a.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 16,
      gpus: 0,
    },
    {
      name: "r7gd.8xlarge",
      arch: "arm64",
      cpus: 32,
      memory: 192,
      gpus: 0,
    },
    {
      name: "r7gd.16xlarge",
      arch: "arm64",
      cpus: 64,
      memory: 512,
      gpus: 0,
    },
    {
      name: "m7i.24xlarge",
      arch: "x86_64",
      cpus: 96,
      memory: 384,
      gpus: 0,
    },
    {
      name: "c7i.8xlarge",
      arch: "x86_64",
      cpus: 32,
      memory: 64,
      gpus: 0,
    },
    {
      name: "r7g.medium",
      arch: "arm64",
      cpus: 1,
      memory: 8,
      gpus: 0,
    },
    {
      name: "t3.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 32,
      gpus: 0,
    },
    {
      name: "m7g.large",
      arch: "arm64",
      cpus: 2,
      memory: 8,
      gpus: 0,
    },
    {
      name: "m7i.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 32,
      gpus: 0,
    },
    {
      name: "c7g.16xlarge",
      arch: "arm64",
      cpus: 64,
      memory: 128,
      gpus: 0,
    },
    {
      name: "c7gn.large",
      arch: "arm64",
      cpus: 2,
      memory: 4,
      gpus: 0,
    },
    {
      name: "t3a.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 32,
      gpus: 0,
    },
    {
      name: "m7i-flex.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 32,
      gpus: 0,
    },
    {
      name: "m7g.12xlarge",
      arch: "arm64",
      cpus: 48,
      memory: 192,
      gpus: 0,
    },
    {
      name: "m7i.8xlarge",
      arch: "x86_64",
      cpus: 32,
      memory: 128,
      gpus: 0,
    },
    {
      name: "m7a.16xlarge",
      arch: "x86_64",
      cpus: 64,
      memory: 256,
      gpus: 0,
    },
    {
      name: "r7a.large",
      arch: "x86_64",
      cpus: 2,
      memory: 16,
      gpus: 0,
    },
    {
      name: "t3.medium",
      arch: "x86_64",
      cpus: 2,
      memory: 4,
      gpus: 0,
    },
    {
      name: "t3.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 16,
      gpus: 0,
    },
    {
      name: "m7g.16xlarge",
      arch: "arm64",
      cpus: 64,
      memory: 256,
      gpus: 0,
    },
    {
      name: "r7g.2xlarge",
      arch: "arm64",
      cpus: 8,
      memory: 64,
      gpus: 0,
    },
    {
      name: "c7i.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 8,
      gpus: 0,
    },
    {
      name: "r7a.medium",
      arch: "x86_64",
      cpus: 1,
      memory: 8,
      gpus: 0,
    },
    {
      name: "c7i.large",
      arch: "x86_64",
      cpus: 2,
      memory: 4,
      gpus: 0,
    },
    {
      name: "c7g.xlarge",
      arch: "arm64",
      cpus: 4,
      memory: 8,
      gpus: 0,
    },
    {
      name: "t3a.small",
      arch: "x86_64",
      cpus: 2,
      memory: 2,
      gpus: 0,
    },
    {
      name: "m7gd.12xlarge",
      arch: "arm64",
      cpus: 48,
      memory: 192,
      gpus: 0,
    },
    {
      name: "c7gd.large",
      arch: "arm64",
      cpus: 2,
      memory: 4,
      gpus: 0,
    },
    {
      name: "t3.large",
      arch: "x86_64",
      cpus: 2,
      memory: 8,
      gpus: 0,
    },
    {
      name: "t3a.medium",
      arch: "x86_64",
      cpus: 2,
      memory: 4,
      gpus: 0,
    },
    {
      name: "c7i.16xlarge",
      arch: "x86_64",
      cpus: 64,
      memory: 128,
      gpus: 0,
    },
    {
      name: "m7gd.8xlarge",
      arch: "arm64",
      cpus: 32,
      memory: 128,
      gpus: 0,
    },
    {
      name: "m7a.32xlarge",
      arch: "x86_64",
      cpus: 128,
      memory: 512,
      gpus: 0,
    },
    {
      name: "r7g.xlarge",
      arch: "arm64",
      cpus: 4,
      memory: 32,
      gpus: 0,
    },
    {
      name: "g5.24xlarge",
      arch: "x86_64",
      cpus: 96,
      memory: 384,
      gpus: 4,
    },
    {
      name: "c7gd.16xlarge",
      arch: "arm64",
      cpus: 64,
      memory: 128,
      gpus: 0,
    },
    {
      name: "m7g.8xlarge",
      arch: "arm64",
      cpus: 32,
      memory: 128,
      gpus: 0,
    },
    {
      name: "r7g.metal",
      arch: "arm64",
      cpus: 64,
      memory: 512,
      gpus: 0,
    },
    {
      name: "m7a.medium",
      arch: "x86_64",
      cpus: 1,
      memory: 4,
      gpus: 0,
    },
    {
      name: "r7a.24xlarge",
      arch: "x86_64",
      cpus: 96,
      memory: 768,
      gpus: 0,
    },
    {
      name: "t3.nano",
      arch: "x86_64",
      cpus: 2,
      memory: 0.5,
      gpus: 0,
    },
    {
      name: "m7gd.medium",
      arch: "arm64",
      cpus: 1,
      memory: 4,
      gpus: 0,
    },
    {
      name: "m7g.xlarge",
      arch: "arm64",
      cpus: 4,
      memory: 16,
      gpus: 0,
    },
    {
      name: "c7i.24xlarge",
      arch: "x86_64",
      cpus: 96,
      memory: 192,
      gpus: 0,
    },
    {
      name: "m7i.48xlarge",
      arch: "x86_64",
      cpus: 192,
      memory: 768,
      gpus: 0,
    },
    {
      name: "m7gd.4xlarge",
      arch: "arm64",
      cpus: 16,
      memory: 64,
      gpus: 0,
    },
    {
      name: "r7gd.medium",
      arch: "arm64",
      cpus: 1,
      memory: 8,
      gpus: 0,
    },
    {
      name: "r7gd.2xlarge",
      arch: "arm64",
      cpus: 8,
      memory: 64,
      gpus: 0,
    },
    {
      name: "r7gd.4xlarge",
      arch: "arm64",
      cpus: 16,
      memory: 128,
      gpus: 0,
    },
    {
      name: "g5.12xlarge",
      arch: "x86_64",
      cpus: 48,
      memory: 192,
      gpus: 4,
    },
    {
      name: "c7gd.xlarge",
      arch: "arm64",
      cpus: 4,
      memory: 8,
      gpus: 0,
    },
    {
      name: "m7a.48xlarge",
      arch: "x86_64",
      cpus: 192,
      memory: 768,
      gpus: 0,
    },
    {
      name: "r7g.8xlarge",
      arch: "arm64",
      cpus: 32,
      memory: 256,
      gpus: 0,
    },
    {
      name: "c7g.2xlarge",
      arch: "arm64",
      cpus: 8,
      memory: 16,
      gpus: 0,
    },
    {
      name: "m7a.24xlarge",
      arch: "x86_64",
      cpus: 96,
      memory: 384,
      gpus: 0,
    },
    {
      name: "c7gd.2xlarge",
      arch: "arm64",
      cpus: 8,
      memory: 16,
      gpus: 0,
    },
    {
      name: "r7a.8xlarge",
      arch: "x86_64",
      cpus: 32,
      memory: 256,
      gpus: 0,
    },
    {
      name: "c7gd.8xlarge",
      arch: "arm64",
      cpus: 32,
      memory: 64,
      gpus: 0,
    },
    {
      name: "g5.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 16,
      gpus: 1,
    },
    {
      name: "m7i-flex.4xlarge",
      arch: "x86_64",
      cpus: 16,
      memory: 64,
      gpus: 0,
    },
    {
      name: "g5.16xlarge",
      arch: "x86_64",
      cpus: 64,
      memory: 256,
      gpus: 1,
    },
    {
      name: "m7a.8xlarge",
      arch: "x86_64",
      cpus: 32,
      memory: 128,
      gpus: 0,
    },
    {
      name: "t3a.large",
      arch: "x86_64",
      cpus: 2,
      memory: 8,
      gpus: 0,
    },
    {
      name: "c7g.medium",
      arch: "arm64",
      cpus: 1,
      memory: 2,
      gpus: 0,
    },
    {
      name: "m7a.4xlarge",
      arch: "x86_64",
      cpus: 16,
      memory: 64,
      gpus: 0,
    },
    {
      name: "t3.micro",
      arch: "x86_64",
      cpus: 2,
      memory: 1,
      gpus: 0,
    },
    {
      name: "r7g.4xlarge",
      arch: "arm64",
      cpus: 16,
      memory: 128,
      gpus: 0,
    },
    {
      name: "m7g.2xlarge",
      arch: "arm64",
      cpus: 8,
      memory: 32,
      gpus: 0,
    },
    {
      name: "r7gd.large",
      arch: "arm64",
      cpus: 2,
      memory: 16,
      gpus: 0,
    },
    {
      name: "m7i.large",
      arch: "x86_64",
      cpus: 2,
      memory: 8,
      gpus: 0,
    },
    {
      name: "c7g.metal",
      arch: "arm64",
      cpus: 64,
      memory: 128,
      gpus: 0,
    },
    {
      name: "m7a.12xlarge",
      arch: "x86_64",
      cpus: 48,
      memory: 192,
      gpus: 0,
    },
    {
      name: "m7a.2xlarge",
      arch: "x86_64",
      cpus: 8,
      memory: 32,
      gpus: 0,
    },
    {
      name: "c7g.12xlarge",
      arch: "arm64",
      cpus: 48,
      memory: 96,
      gpus: 0,
    },
    {
      name: "c7i.4xlarge",
      arch: "x86_64",
      cpus: 16,
      memory: 32,
      gpus: 0,
    },
    {
      name: "c7gd.12xlarge",
      arch: "arm64",
      cpus: 48,
      memory: 96,
      gpus: 0,
    },
    {
      name: "m7i.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 16,
      gpus: 0,
    },
    {
      name: "r7gd.12xlarge",
      arch: "arm64",
      cpus: 48,
      memory: 256,
      gpus: 0,
    },
    {
      name: "c7g.large",
      arch: "arm64",
      cpus: 2,
      memory: 4,
      gpus: 0,
    },
    {
      name: "m7g.medium",
      arch: "arm64",
      cpus: 1,
      memory: 4,
      gpus: 0,
    },
    {
      name: "c7i.12xlarge",
      arch: "x86_64",
      cpus: 48,
      memory: 96,
      gpus: 0,
    },
    {
      name: "m7g.metal",
      arch: "arm64",
      cpus: 64,
      memory: 256,
      gpus: 0,
    },
    {
      name: "m7i-flex.8xlarge",
      arch: "x86_64",
      cpus: 32,
      memory: 128,
      gpus: 0,
    },
    {
      name: "r7a.12xlarge",
      arch: "x86_64",
      cpus: 48,
      memory: 384,
      gpus: 0,
    },
    {
      name: "r7g.large",
      arch: "arm64",
      cpus: 2,
      memory: 16,
      gpus: 0,
    },
    {
      name: "t3.small",
      arch: "x86_64",
      cpus: 2,
      memory: 2,
      gpus: 0,
    },
    {
      name: "c7gn.12xlarge",
      arch: "arm64",
      cpus: 48,
      memory: 96,
      gpus: 0,
    },
    {
      name: "m7gd.2xlarge",
      arch: "arm64",
      cpus: 8,
      memory: 32,
      gpus: 0,
    },
    {
      name: "m7i.4xlarge",
      arch: "x86_64",
      cpus: 16,
      memory: 64,
      gpus: 0,
    },
    {
      name: "c7i.48xlarge",
      arch: "x86_64",
      cpus: 192,
      memory: 384,
      gpus: 0,
    },
    {
      name: "c7gn.2xlarge",
      arch: "arm64",
      cpus: 8,
      memory: 16,
      gpus: 0,
    },
    {
      name: "g5.48xlarge",
      arch: "x86_64",
      cpus: 192,
      memory: 768,
      gpus: 8,
    },
    {
      name: "m7i.12xlarge",
      arch: "x86_64",
      cpus: 48,
      memory: 192,
      gpus: 0,
    },
    {
      name: "t3a.micro",
      arch: "x86_64",
      cpus: 2,
      memory: 1,
      gpus: 0,
    },
    {
      name: "t3a.nano",
      arch: "x86_64",
      cpus: 2,
      memory: 0.5,
      gpus: 0,
    },
    {
      name: "r7a.48xlarge",
      arch: "x86_64",
      cpus: 192,
      memory: 1536,
      gpus: 0,
    },
    {
      name: "m7i-flex.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 16,
      gpus: 0,
    },
    {
      name: "c7gn.4xlarge",
      arch: "arm64",
      cpus: 16,
      memory: 32,
      gpus: 0,
    },
    {
      name: "m7a.metal-48xl",
      arch: "x86_64",
      cpus: 192,
      memory: 768,
      gpus: 0,
    },
    {
      name: "r7g.16xlarge",
      arch: "arm64",
      cpus: 64,
      memory: 512,
      gpus: 0,
    },
    {
      name: "c7gn.medium",
      arch: "arm64",
      cpus: 1,
      memory: 2,
      gpus: 0,
    },
    {
      name: "r7g.12xlarge",
      arch: "arm64",
      cpus: 48,
      memory: 384,
      gpus: 0,
    },
    {
      name: "r7a.16xlarge",
      arch: "x86_64",
      cpus: 64,
      memory: 512,
      gpus: 0,
    },
    {
      name: "m7a.large",
      arch: "x86_64",
      cpus: 2,
      memory: 8,
      gpus: 0,
    },
    {
      name: "g5.8xlarge",
      arch: "x86_64",
      cpus: 32,
      memory: 128,
      gpus: 1,
    },
    {
      name: "c7gd.4xlarge",
      arch: "arm64",
      cpus: 16,
      memory: 32,
      gpus: 0,
    },
    {
      name: "m7i-flex.large",
      arch: "x86_64",
      cpus: 2,
      memory: 8,
      gpus: 0,
    },
    {
      name: "t3a.xlarge",
      arch: "x86_64",
      cpus: 4,
      memory: 16,
      gpus: 0,
    },
  ];

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
    let types = this.instanceTypes
      .filter(
        (instanceType) =>
          instanceType.arch == arch &&
          (!config.memory || instanceType.memory >= config.memory) &&
          (!config.cpus || instanceType.cpus >= config.cpus) &&
          (!config.gpus || instanceType.gpus >= config.gpus)
      )
      .sort((a, b) => {
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
        : this.getVirtualMachineImageId(
            scope,
            config.image,
            config.architecture
          );
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

class BuildingBlockContainer extends Construct {
  public readonly provider: TerraformProvider;
  public readonly manager: BuildingBlockManager;
  constructor(
    scope: Construct,
    id: string,
    provider: TerraformProvider,
    config: BuildingBlockManagerConfig
  ) {
    super(scope, id);
    this.provider = provider;

    const providerName = provider.terraformProviderSource ?? "undefined";
    switch (providerName) {
      case "aws": {
        this.manager = new AwsManager(provider, config);
        break;
      }
      case "digitalocean/digitalocean": {
        throw new Error("TODO");
        break;
      }
      default: {
        throw new Error(`unsupported cloud provider ${providerName}`);
      }
    }
  }
}

class BuildingBlock<
  ResourceType extends BuildingBlockResource
> extends Construct {
  public readonly resource: ResourceType;
  constructor(
    scope: BuildingBlockContainer,
    id: string,
    resource: ResourceType
  ) {
    super(scope, id);
    this.resource = resource;
  }
}

interface BuildingBlockResource {
  readonly providerResource: any;
  readonly providerId: string;
}

interface NetworkConfig {
  readonly private: boolean;
  readonly cidr?: string;
  readonly availabilityZone?: number;
}

interface NetworkResource extends BuildingBlockResource {
  readonly cidr: string;
  readonly availabilityZone: string;
}

class Network extends BuildingBlock<NetworkResource> {
  constructor(
    scope: BuildingBlockContainer,
    id: string,
    config: NetworkConfig
  ) {
    super(scope, id, scope.manager.createNetwork(scope, id, config));
  }
}

interface ExternalIpConfig {
  readonly ip?: string;
  readonly network?: Network;
}

interface ExternalIpResource extends BuildingBlockResource {
  readonly ip: string;
}

class ExternalIp extends BuildingBlock<ExternalIpResource> {
  constructor(
    scope: BuildingBlockContainer,
    id: string,
    config: ExternalIpConfig
  ) {
    super(scope, id, scope.manager.createExternalIp(scope, id, config));
  }
}

interface DiskConfig {
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

interface DiskResource extends BuildingBlockResource {
  readonly size: number;
  readonly device: string;
  readonly availabilityZone: string;
}

class Disk extends BuildingBlock<DiskResource> {
  constructor(scope: BuildingBlockContainer, id: string, config: DiskConfig) {
    super(scope, id, scope.manager.createDisk(scope, id, config));
  }
}

/**
 * The (latest LTS version of the) operating system to use for a virtual machine.
 */
enum VirtualMachineImage {
  CentOS,
  Debian,
  Fedora,
  Ubuntu,
  Windows,
}

enum VirtualMachineArchitecture {
  Arm64,
  X86_64,
}

interface VirtualMachineConfig {
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

interface VirtualMachineResource extends BuildingBlockResource {}

class VirtualMachine extends BuildingBlock<VirtualMachineResource> {
  constructor(
    scope: BuildingBlockContainer,
    id: string,
    config: VirtualMachineConfig
  ) {
    super(scope, id, scope.manager.createVirtualMachine(scope, id, config));
  }
}
