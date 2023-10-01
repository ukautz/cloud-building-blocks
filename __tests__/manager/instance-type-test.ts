// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { VirtualMachineArchitecture } from "../../lib";
import {
  InstanceType,
  selectInstanceType,
} from "../../lib/manager/instance-type";
// import { Testing } from "cdktf";

const instanceTypes: InstanceType[] = [
  {
    name: "foo1",
    arch: "x86_64",
    cpus: 4,
    memory: 1,
    gpus: 0,
    prod: true,
  },
  {
    name: "foo2",
    arch: "x86_64",
    cpus: 1,
    memory: 1,
    gpus: 0,
    prod: false,
  },
  {
    name: "foo3",
    arch: "x86_64",
    cpus: 1,
    memory: 1,
    gpus: 0,
    prod: true,
  },
  {
    name: "foo4",
    arch: "arm64",
    cpus: 1,
    memory: 1,
    gpus: 0,
    prod: true,
  },
  {
    name: "foo5",
    arch: "x86_64",
    cpus: 1,
    memory: 1,
    gpus: 4,
    prod: true,
  },
  {
    name: "foo6",
    arch: "x86_64",
    cpus: 1,
    memory: 4,
    gpus: 0,
    prod: true,
  },
  {
    name: "foo7",
    arch: "x86_64",
    cpus: 5,
    memory: 5,
    gpus: 5,
    prod: true,
  },
];

describe("My CDKTF Application", () => {
  // The tests below are example tests, you can find more information at
  // https://cdk.tf/testing
  it("Selects the smallest non-production image", () => {
    const name = selectInstanceType(
      instanceTypes,
      {
        disks: [],
        networks: [],
        image: "bla",
        architecture: VirtualMachineArchitecture.X86_64,
      },
      false
    );
    expect(name).toEqual("foo2");
  });
  it("Selects the smallest production image", () => {
    const name = selectInstanceType(
      instanceTypes,
      {
        disks: [],
        networks: [],
        image: "bla",
        architecture: VirtualMachineArchitecture.X86_64,
      },
      true
    );
    expect(name).toEqual("foo3");
  });
  it("Selects the image which provides sufficient CPUs", () => {
    const name = selectInstanceType(
      instanceTypes,
      {
        disks: [],
        networks: [],
        image: "bla",
        architecture: VirtualMachineArchitecture.X86_64,
        cpus: 3,
      },
      true
    );
    expect(name).toEqual("foo1");
  });
  it("Selects the image which provides sufficient Memory", () => {
    const name = selectInstanceType(
      instanceTypes,
      {
        disks: [],
        networks: [],
        image: "bla",
        architecture: VirtualMachineArchitecture.X86_64,
        memory: 3,
      },
      true
    );
    expect(name).toEqual("foo6");
  });
  it("Selects the image which provides sufficient GPUs", () => {
    const name = selectInstanceType(
      instanceTypes,
      {
        disks: [],
        networks: [],
        image: "bla",
        architecture: VirtualMachineArchitecture.X86_64,
        gpus: 3,
      },
      true
    );
    expect(name).toEqual("foo5");
  });
});
