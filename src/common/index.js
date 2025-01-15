import { BigNumber ,ethers} from 'ethers';
import converter from 'hex2dec'
import bigdecimal from 'bigdecimal'


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

export const convertBalanceToWei = (strValue, iDecimal = 18) => {
  try {
    const multiplyNum = new bigdecimal.BigDecimal(Math.pow(10, iDecimal))
    const convertValue = new bigdecimal.BigDecimal(String(strValue))
    return multiplyNum.multiply(convertValue).toString().split('.')[0]
  } catch (err) {
    return 0
  }
}

export const convertWeiToBalance = (strValue, iDecimal = 18) => {
  try {
    const decimalFormat = parseFloat(iDecimal)

    const multiplyNum = new bigdecimal.BigDecimal(Math.pow(10, decimalFormat))
    const convertValue = new bigdecimal.BigDecimal(String(strValue))
    return convertValue
      .divide(multiplyNum, decimalFormat, bigdecimal.RoundingMode.DOWN())
      .toString()
  } catch (error) {
    return 0
  }
}