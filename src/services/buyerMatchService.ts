// BuyerMatchService: We do NOT invent buyer contacts.
// We provide official e-NAM route information instead.
export function getBuyerMatchInfo() {
  return {
    hasVerifiedBuyers: false,
    message:
      'SmartFarm helps you find verified market-access pathways. We do not invent buyer contacts. Use e-NAM to discover traders and buyers through the official platform.',
    officialRoute: 'https://enam.gov.in/',
    routeLabel: 'Open e-NAM Marketplace',
  };
}
