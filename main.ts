import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DigitaloceanProvider } from "@cdktf/provider-digitalocean/lib/provider";
import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import * as hcloud from "./.gen/providers/hcloud";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    var providers: String[] = [];
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
    throw new Error(`provider is:\n${providers.join("\n\n")}`);

    // define resources here
  }
}

const app = new App();
new MyStack(app, "cloud-building-blocks");
app.synth();
