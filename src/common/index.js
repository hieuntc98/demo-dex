import { BigNumber } from 'ethers';

export const toBigNumber = (value) => {
  return value ? BigNumber.from(value).mul(BigNumber.from(10).pow(18)) : BigNumber.from(0);
};
