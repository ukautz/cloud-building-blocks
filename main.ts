import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import {
  BuildingBlockContainer,
  BuildingBlockManager,
  Disk,
  Network,
  VirtualMachine,
  VirtualMachineArchitecture,
  VirtualMachineImage,
} from "./lib";
import { AwsManager } from "./lib/manager/aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /* var providers: String[] = [];
    [
      new AwsProvider(this, "AwsProviderId"),
      new DigitaloceanProvider(this, "DigitalOceanProviderId"),
      new hcloud.provider.HcloudProvider(this, "HcloudProviderId", {
        token: "todo",
      }),
    ].forEach((provider) => {
      providers.push(`# ${provider.friendlyUniqueId}`);
      providers.push(
        [
          `* terraformResourceType: ${provider.terraformResourceType}`,
          `* terraformProviderSource: ${provider.terraformProviderSource}`,
          `* alias: ${provider.alias}`,
          `* fqn: ${provider.fqn}`,
          `* toString: ${provider.toString()}`,
        ].join("\n")
      );
    });
    throw new Error(`provider is:\n${providers.join("\n\n")}`); */

    // define resources here

    const awsProvider = new AwsProvider(this, "AwsProviderId", {
      region: "eu-central-1",
    });
    const awsManager = new AwsManager(awsProvider, {
      production: false,
      //region: BuildingBlockRegion.Europe,
      vendor: {},
    });
    new TheResources(this, "AwsResources", awsManager);

    /* const digitalOceanProvider = new DigitaloceanProvider(
      this,
      "DigitalOceanProviderId"
    );
    new TheResources(this, "DigitalOceanResources", digitalOceanProvider, {
      production: false,
      //region: BuildingBlockRegion.Europe,
      vendor: {},
    }); */
  }
}

class TheResources extends BuildingBlockContainer {
  constructor(scope: Construct, id: string, manager: BuildingBlockManager) {
    super(scope, id, manager);

    const network = new Network(this, "PrivateNetwork", {
      private: true,
    });
    const disk = new Disk(this, "Disk", {
      size: 100,
      device: "data",
    });
    const vm = new VirtualMachine(this, "VirtualMachine", {
      disks: [disk],
      networks: [network],
      image: VirtualMachineImage.Ubuntu,
      architecture: VirtualMachineArchitecture.Arm64,
      cpus: 1,
      memory: 1,
    });

    new TerraformOutput(this, "vm_id", {
      value: vm.resource.providerId,
    });
  }
}

const app = new App();
new MyStack(app, "cloud-building-blocks");
app.synth();
