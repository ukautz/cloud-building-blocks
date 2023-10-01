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
  VirtualMachineImage,
  VirtualMachineResource,
  isVirtualMachineImage,
} from "../../blocks";
import { BuildingBlockManager, BuildingBlockManagerRegister } from "../core";
import { selectInstanceType } from "../instance-type";
import { AVAILABILITY_ZONES } from "./availability-zones";
import { INSTANCE_TYPES } from "./instance-types";

export class AwsManager extends BuildingBlockManager {
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
    const region =
      (this.provider as AwsProvider).region ??
      process.env.AWS_REGION ??
      process.env.AWS_DEFAULT_REGION;
    if (!region) {
      throw new Error(
        "No AWS region provided in provider configuration or environment variables"
      );
    }
    return region;
    /* switch (this.config.region) {
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
    } */
  }

  protected getAvailabilityZone(num: number): string {
    if (num < 1) {
      throw new Error("availability zone must be greater than 0");
    }
    if (Math.round(num) != num) {
      throw new Error("availability zone must be integer");
    }
    const awsRegion = this.getRegion();
    if (!(awsRegion in AVAILABILITY_ZONES)) {
      throw new Error(`availability zone for region ${awsRegion} unknown`);
    }
    const azs = AVAILABILITY_ZONES[awsRegion];
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
      this.vpc = this.config.vendor?.vpcId
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
    const subnet = new aws.subnet.Subnet(scope, `${id}Subnet`, {
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
    const resource = new aws.eip.Eip(scope, `${id}Eip`, {
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
    const volume = new aws.ebsVolume.EbsVolume(scope, `${id}EbsVolume`, {
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

  protected amiCache: { [key: string]: string } = {};

  /**
   * Returns an AMI identifier for the given operating system and, architecture in the current region.
   *
   * @param scope
   * @param config
   */
  protected getAMI(scope: Construct, config: VirtualMachineConfig): string {
    // if an image is provided -> stop here
    const vmImage = config.image;
    if (!isVirtualMachineImage(vmImage)) {
      return vmImage;
    }

    const arch =
      VirtualMachineArchitecture[
        config.architecture ?? VirtualMachineArchitecture.X86_64
      ].toLowerCase();
    const image = VirtualMachineImage[vmImage].toLowerCase();

    // lookup images only once
    const lookupName = [image, arch].join("-");
    if (lookupName in this.amiCache) {
      return this.amiCache[lookupName];
    }

    // search for image
    let search: {
      owners?: string[];
      filters?: { name: string; values: string[] }[];
    } = {};
    switch (config.image as VirtualMachineImage) {
      // windows: Windows_Server-2022-English-STIG-Full-* ??
      case VirtualMachineImage.Ubuntu:
        search.owners = ["amazon"];
        search.filters = [
          {
            name: "name",
            values: [
              `ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-${arch}-server-*`,
            ],
          },
        ];
        break;
    }

    // found support search
    if (search.filters) {
      const ami = new aws.dataAwsAmi.DataAwsAmi(scope, `Ami${lookupName}`, {
        ...search,
        mostRecent: true,
        provider: this.provider,
      });
      this.amiCache[lookupName] = ami.id;

      return ami.id;
    }

    // TODO: maintain a map of latest images per supported region per supported OS per supported architecture
    throw new Error(
      `Auto-selecting an image for ${config.image} (arch: ${
        config.architecture ?? "undefined"
      }) in ${this.getRegion()} is currently not supported. Please provide an AMI identifier.`
    );
  }

  public createVirtualMachine(
    scope: Construct,
    id: string,
    config: VirtualMachineConfig
  ): VirtualMachineResource {
    // init AZ for checks
    const availabilityZone = this.getAvailabilityZone(
      config.availabilityZone ?? 1
    );

    // all disks must be in same AZ
    config.disks?.forEach((disk) => {
      if (disk.resource.availabilityZone != availabilityZone) {
        throw new Error(
          `All disks must be in the same availability zone ${availabilityZone} as the virtual machine`
        );
      }
    });

    // all networks must be in same AZ
    config.networks?.forEach((network) => {
      if (network.resource.availabilityZone != availabilityZone) {
        throw new Error(
          `All networks must be in the same availability zone ${availabilityZone} as the virtual machine`
        );
      }
    });

    // use machine image as provided or by selection (os + arch + ..)
    const ami = this.getAMI(scope, config);

    // create the instance
    const instance = new aws.instance.Instance(scope, `${id}Instance`, {
      ami,
      availabilityZone,
      instanceType: selectInstanceType(
        INSTANCE_TYPES,
        config,
        this.config.production
      ),
      ebsBlockDevice: config.disks
        .sort((a, b) => (a.resource.device > b.resource.device ? 1 : -1))
        .map((disk) => ({
          deviceName: disk.resource.device,
          volumeId: disk.resource.providerId,
        })),
      networkInterface: config.networks
        .sort((a, b) => {
          // must be sorted to give consistent `deviceIndex` below
          return a.resource.cidr > b.resource.cidr ? 1 : -1;
        })
        .map((network, deviceIndex) => ({
          networkInterfaceId: network.resource.providerId,
          deviceIndex,
        })),
    });

    return {
      providerId: instance.id,
      providerResource: instance,
    };
  }
}

BuildingBlockManagerRegister.register(AwsProvider.tfResourceType, AwsManager);
