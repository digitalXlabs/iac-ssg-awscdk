/**
   * Return the domain from the A record
   * @param a 
   * @returns string
   */
export const GetDomain = (a: any, domainApex: string): string => {

  let o = Array.isArray(a) ? a[0] : a;

  if (a.length > 1) {
    throw new Error(' Cannot handle more than one A record');
  }
  return (o.recordName === '') ? domainApex : `${o.recordName}.${domainApex}`;
}


