
/**
 * Machine name a string
 * @param value 
 */
export const machineName = (value: string) => {
  return value.replace(/\s|-/g, '_').toLowerCase()
}

/**
 * Make a string lowerCamelCase
 * @param str 
 */
export const camelCase = (str: string) => {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return '' // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase()
  })
}

/**
 * Make a string UpperCamelCase
 * @param str 
 */
export const camelCaseUpper = (str: string): string => {
  str = camelCase(str);
  str = str.replace(/^./, str[0].toUpperCase());
  return str;
}