import { VirtualMachineArchitecture, VirtualMachineConfig } from "../blocks";

export interface InstanceType {
  readonly name: string;
  readonly arch: string;
  readonly cpus: number;
  readonly memory: number;
  readonly gpus: number;
  readonly prod: boolean;
}

/**
 * Returns the instance size that is closest (equal or bigger) to the given memory, cpu and gpu requirements.
 *
 * @param instanceTypes The list of instance types to choose from.
 * @param config The configuration of the virtual machine.
 * @param production Whether to select production or non-production instance types.
 */
export function selectInstanceType(
  instanceTypes: InstanceType[],
  config: VirtualMachineConfig,
  production: boolean
): string {
  let arch =
    VirtualMachineArchitecture[
      config.architecture ?? VirtualMachineArchitecture.X86_64
    ].toLocaleLowerCase();
  let selected = instanceTypes
    .filter(
      (instance) =>
        (!production || instance.prod) &&
        instance.arch == arch &&
        (!config.memory || instance.memory >= config.memory) &&
        (!config.cpus || instance.cpus >= config.cpus) &&
        (!config.gpus || instance.gpus >= config.gpus)
    )
    .sort((a, b) => {
      // prefer non-production hardware for non-production use-case
      if (a.prod != b.prod) {
        return a.prod ? 1 : -1;
      }

      // most expensive: order too many GPUs low
      if (a.gpus > b.gpus) {
        return 1;
      } else if (a.gpus > b.gpus) {
        return -1;
      }

      // next expensive: order too many CPUs low
      if (a.cpus > b.cpus) {
        return 1;
      } else if (a.cpus < b.cpus) {
        return -1;
      }

      // least expensive: order too much memory low
      if (a.memory > b.memory) {
        return 1;
      } else if (a.memory < b.memory) {
        return -1;
      }
      return 0;
    });
  //console.log("insance types sorted", selected);
  if (selected.length == 0) {
    throw new Error(`No instance type found for ${config}`);
  }
  return selected[0].name;
}
