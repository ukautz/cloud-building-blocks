import { Construct } from "constructs";
import { BuildingBlockContainer } from "./container";
import { BuildingBlockResource } from "./resource";

export class BuildingBlock<
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
