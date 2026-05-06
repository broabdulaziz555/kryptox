// Client-side wallet utilities

export function generateWallet() {
  try {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const words = [
      'abandon','ability','able','about','above','absent','absorb','abstract',
      'absurd','abuse','access','accident','account','accuse','achieve','acid',
      'acoustic','acquire','across','action','actor','actual','adapt','add',
      'addict','address','adjust','admit','adult','advance','advice','afford',
      'afraid','again','agent','agree','ahead','aim','air','airport','aisle',
      'alarm','album','alcohol','alert','alien','all','alley','allow','almost',
      'alone','alpha','already','also','alter','always','amateur','amazing',
      'among','amount','amused','analyst','anchor','ancient','anger','angle',
      'angry','animal','ankle','announce','annual','another','answer','antenna',
      'antique','anxiety','any','apart','apology','appear','apple','approve',
      'april','arch','arctic','area','arena','argue','arm','armed','armor',
      'army','around','arrange','arrest','arrive','arrow','art','artefact',
      'artist','artwork','ask','aspect','assault','asset','assist','assume',
      'asthma','athlete','atom','attack','attend','attitude','attract','auction',
      'audit','august','aunt','author','auto','autumn','average','avocado',
      'avoid','awake','aware','away','awesome','awful','awkward','axis'
    ];
    const mnemonic = Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
    let hash = 0;
    for (const c of mnemonic) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0').repeat(5).slice(0, 40);
    const privKeyArray = new Uint8Array(32);
    crypto.getRandomValues(privKeyArray);
    const privateKey = '0x' + Array.from(privKeyArray).map(b => b.toString(16).padStart(2, '0')).join('');
    return { mnemonic, address: '0x' + hexHash, privateKey };
  } catch {
    return { mnemonic: 'error generating please reload', address: '0x0000000000000000000000000000000000000000', privateKey: '0x0' };
  }
}

export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatAmount(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  const num = parseFloat(amount);
  if (num === 0) return '0';
  if (num < 0.0001) return num.toExponential(2);
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  if (num >= 100) return num.toFixed(2);
  return num.toFixed(4);
}

export function formatUSD(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCoinLogo(symbol) {
  const logos = {
    BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    TRX: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
    TON: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
    XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
    LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
    LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    UNI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
    ATOM: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
    DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  };
  const s = symbol?.toUpperCase();
  return logos[s] || `https://via.placeholder.com/32/7B5EA7/FFFFFF?text=${s?.[0] || '?'}`;
}

// Returns { bg, text } colour pair for a given coin symbol
const COIN_COLOUR_MAP = {
  BTC:  { bg: '#F7931A22', text: '#F7931A' },
  ETH:  { bg: '#627EEA22', text: '#627EEA' },
  USDT: { bg: '#26A17B22', text: '#26A17B' },
  USDC: { bg: '#2775CA22', text: '#2775CA' },
  BNB:  { bg: '#F3BA2F22', text: '#F3BA2F' },
  SOL:  { bg: '#9945FF22', text: '#9945FF' },
  TRX:  { bg: '#EF002722', text: '#EF0027' },
  TON:  { bg: '#0098EA22', text: '#0098EA' },
  XRP:  { bg: '#00AAE422', text: '#00AAE4' },
  ADA:  { bg: '#0033AD22', text: '#0033AD' },
  DOGE: { bg: '#C2A63322', text: '#C2A633' },
  AVAX: { bg: '#E8414222', text: '#E84142' },
  MATIC:{ bg: '#8247E522', text: '#8247E5' },
  DOT:  { bg: '#E6007A22', text: '#E6007A' },
  LTC:  { bg: '#BFBBBB22', text: '#BFBBBB' },
  LINK: { bg: '#375BD222', text: '#375BD2' },
  UNI:  { bg: '#FF007A22', text: '#FF007A' },
  ATOM: { bg: '#6F739022', text: '#A8ABBE' },
  DAI:  { bg: '#F5AC3722', text: '#F5AC37' },
};

export function getCoinColors(symbol) {
  return COIN_COLOUR_MAP[symbol?.toUpperCase()] || { bg: '#7B5EA722', text: '#7B5EA7' };
}
