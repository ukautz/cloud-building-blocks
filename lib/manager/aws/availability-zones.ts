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
export const AVAILABILITY_ZONES: { [key: string]: string[] } = {
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
