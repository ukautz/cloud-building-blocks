import { TerraformProvider } from "cdktf";
import { Construct } from "constructs";
import { BuildingBlockManager } from "../manager";

export class BuildingBlockContainer extends Construct {
  public readonly provider: TerraformProvider;
  public readonly manager: BuildingBlockManager;

  constructor(scope: Construct, id: string, manager: BuildingBlockManager) {
    super(scope, id);
    this.provider = manager.provider;
    this.manager = manager;
  }
}
