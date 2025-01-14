import { BigNumber ,ethers} from 'ethers';
import converter from 'hex2dec'

export const convertHexToDecimal = hexNum => {
  return hexNum ? converter.hexToDec(hexNum) : 0
}

export const hexToDecimal = (hex) =>{
  hex = hex.replace(/^0x/, '');

  return hex.split('').reduceRight((decimal, digit, index) => {
    const digitValue = parseInt(digit, 16);
    return decimal + digitValue * Math.pow(16, index);
  }, 0);
}


export const toBigNumber = (value) => {
  return value ? ethers.utils.parseEther(value.toString()) : ethers.constants.Zero;
};