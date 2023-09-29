import { TerraformProvider } from "cdktf";
import { Construct } from "constructs";
import {
  BuildingBlockManager,
  BuildingBlockManagerConfig,
  BuildingBlockManagerRegister,
} from "../manager";

export class BuildingBlockContainer extends Construct {
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
    this.manager = BuildingBlockManagerRegister.create(provider, config);
  }
}
