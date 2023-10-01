// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { VirtualMachineArchitecture, VirtualMachineConfig } from "../../../lib";
import { INSTANCE_TYPES } from "../../../lib/manager/aws/instance-types";
import { selectInstanceType } from "../../../lib/manager/instance-type";
// import { Testing } from "cdktf";

describe("AWS Instance Types", () => {
  let expected: Map<
    VirtualMachineArchitecture,
    [string, boolean, Partial<VirtualMachineConfig>, string][]
  > = new Map();
  expected.set(VirtualMachineArchitecture.X86_64, [
    ["smallest non-production", false, {}, "t3.nano"],
    ["smallest production", true, {}, "c6i.large"],
    [
      "choose c-series with 1:2 ratio",
      true,
      {
        cpus: 8,
        memory: 16,
      },
      "c6i.2xlarge",
    ],
    [
      "choose m-series with 1:4 ratio",
      true,
      {
        cpus: 4,
        memory: 16,
      },
      "m6i.xlarge",
    ],
    [
      "choose r-series with 1:8 ratio",
      true,
      {
        cpus: 2,
        memory: 16,
      },
      "r6i.large",
    ],
  ]);
  expected.set(VirtualMachineArchitecture.Arm64, [
    ["smallest non-production", false, {}, "t4g.nano"],
    ["smallest production", true, {}, "c7g.medium"],
    [
      "choose c-series with 1:2 ratio",
      true,
      {
        cpus: 8,
        memory: 16,
      },
      "c7g.2xlarge",
    ],
    [
      "choose m-series with 1:4 ratio",
      true,
      {
        cpus: 4,
        memory: 16,
      },
      "m7g.xlarge",
    ],
    [
      "choose r-series with 1:8 ratio",
      true,
      {
        cpus: 2,
        memory: 16,
      },
      "r7g.large",
    ],
  ]);

  expected.forEach((tests, arch) => {
    describe(`Arch ${VirtualMachineArchitecture[arch]}`, () => {
      tests.forEach(([title, prod, config, expected]) => {
        it(`In ${
          prod ? "prod" : "non-prod"
        } expect ${expected} for ${JSON.stringify(config)}: ${title}`, () => {
          const name = selectInstanceType(
            INSTANCE_TYPES,
            {
              disks: [],
              networks: [],
              image: "bla",
              architecture: arch,
              ...config,
            },
            prod
          );
          expect(name).toEqual(expected);
        });
      });
    });
  });
});
