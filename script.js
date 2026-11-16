let oddsData = [
  { stake: 50.00, profit: 0, totalReturn: 0, impliedProbability: 0 },
  { oddType: "decimalOdds", odd: 1.95, IsInput: true },
  { oddType: "fractionalOdds", odd: "19/20", IsInput: false },
  { oddType: "americanOdds", odd: -105, IsInput: false },
  { oddType: "hongKongOdds", odd: 0.95, IsInput: false },
  { oddType: "malaysianOdds", odd: 0.95, IsInput: false },
  { oddType: "indonesianOdds", odd: -1.05, IsInput: false }
];

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function decimalToFractional(dec) {
  const b = dec - 1;
  if (b < 0.01) return "1/100";

  const commonDenominators = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 25, 40, 50, 100];
  for (let den of commonDenominators) {
    let num = Math.round(b * den);
    if (num > 0 && Math.abs(b - (num / den)) < 0.002) {
      let common = gcd(num, den);
      return `${num / common}/${den / common}`;
    }
  }

  let num = Math.round(b * 1000);
  let den = 1000;
  let common = gcd(num, den);
  return `${num / common}/${den / common}`;
}

function validateInput(type, rawValue) {
  if (rawValue === "" || rawValue === "-" || rawValue === null) {
    return { valid: false, message: "" };
  }

  if (type === 'fractionalOdds') {
    const parts = String(rawValue).split('/');
    if (parts.length !== 2) {
      return { valid: false, message: "Fractional odds must be in 'numerator/denominator' format (e.g., 5/2)." };
    }
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (isNaN(num) || isNaN(den) || num <= 0 || den <= 0) {
      return { valid: false, message: "Both numbers in fractional odds must be greater than 0." };
    }
    return { valid: true };
  }

  const num = parseFloat(rawValue);
  if (isNaN(num)) {
    return { valid: false, message: "Please enter a valid number." };
  }

  switch (type) {
    case 'decimalOdds':
      if (num <= 1.00) return { valid: false, message: "Decimal odds must be greater than 1.00." };
      break;
    case 'americanOdds':
      if (num > -100 && num < 100) return { valid: false, message: "American odds must be ≤ -100 or ≥ +100." };
      break;
    case 'hongKongOdds':
      if (num <= 0) return { valid: false, message: "Hong Kong odds must be greater than 0." };
      break;
    case 'malaysianOdds':
      if (num < -1 || num > 1 || num === 0) {
        return { valid: false, message: "Malaysian odds must be strictly between -1.00 and 1.00." };
      }
      break;
    case 'indonesianOdds':
      if (num > -1 && num < 1) {
        return { valid: false, message: "Indonesian odds must be ≤ -1.00 or ≥ 1.00." };
      }
      break;
  }

  return { valid: true };
}

function setErrorState(activeFieldId, message) {
  const banner = document.getElementById('error-banner');
  document.querySelectorAll('input').forEach(el => el.classList.remove('input-error'));

  if (message) {
    document.getElementById(activeFieldId).classList.add('input-error');
    banner.innerText = message;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
    banner.innerText = "";
  }
}

function processOdds(activeType, rawValue) {
  const stakeEl = document.getElementById('stake');
  const stakeInput = parseFloat(stakeEl.value);

  if (isNaN(stakeInput) || stakeInput < 0) {
    setErrorState('stake', "Stake cannot be negative.");
    return;
  }

  const check = validateInput(activeType, rawValue);
  if (!check.valid) {
    setErrorState(activeType, check.message);
    return;
  }

  setErrorState(null, "");

  let globalMetrics = oddsData.find(item => item.stake !== undefined);
  globalMetrics.stake = stakeInput;

  oddsData.forEach(item => {
    if (item.oddType) {
      if (item.oddType === activeType) {
        item.IsInput = true;
        item.odd = rawValue;
      } else {
        item.IsInput = false;
      }
    }
  });

  let baseDecimal;

  switch (activeType) {
    case 'decimalOdds':
      baseDecimal = parseFloat(rawValue);
      break;
    case 'fractionalOdds':
      let parts = rawValue.split('/');
      baseDecimal = (parseFloat(parts[0]) / parseFloat(parts[1])) + 1;
      break;
    case 'americanOdds':
      let numAm = parseFloat(rawValue);
      baseDecimal = numAm >= 0 ? (numAm / 100) + 1 : (100 / Math.abs(numAm)) + 1;
      break;
    case 'hongKongOdds':
      baseDecimal = parseFloat(rawValue) + 1;
      break;
    case 'malaysianOdds':
      let numMal = parseFloat(rawValue);
      baseDecimal = numMal > 0 ? numMal + 1 : 1 - (1 / numMal);
      break;
    case 'indonesianOdds':
      let numInd = parseFloat(rawValue);
      baseDecimal = numInd >= 0 ? (numInd + 1) : (1 / Math.abs(numInd) + 1);
      break;
  }

  let dec = baseDecimal;
  let fractionalStr = decimalToFractional(dec);
  let american = dec >= 2.0 ? Math.round((dec - 1) * 100) : Math.round(-100 / (dec - 1));
  let hongKong = Number((dec - 1).toFixed(2));
  let malaysian = dec < 2.0 ? Number((dec - 1).toFixed(4)) : Number((-1 / (dec - 1)).toFixed(4));
  let indonesian = dec >= 2.0 ? Number((dec - 1).toFixed(2)) : Number((-1 / (dec - 1)).toFixed(2));

  let profit = Number(((dec - 1) * stakeInput).toFixed(2));
  let totalReturn = Number((dec * stakeInput).toFixed(2));
  let impliedProbability = Number(((1 / dec) * 100).toFixed(2));

  globalMetrics.profit = profit;
  globalMetrics.totalReturn = totalReturn;
  globalMetrics.impliedProbability = impliedProbability;

  oddsData.forEach(item => {
    if (item.oddType) {
      switch (item.oddType) {
        case 'decimalOdds': item.odd = Number(dec.toFixed(2)); break;
        case 'fractionalOdds': item.odd = fractionalStr; break;
        case 'americanOdds': item.odd = american; break;
        case 'hongKongOdds': item.odd = hongKong; break;
        case 'malaysianOdds': item.odd = malaysian; break;
        case 'indonesianOdds': item.odd = indonesian; break;
      }
    }
  });

  if (activeType !== 'decimalOdds') document.getElementById('decimalOdds').value = Number(dec.toFixed(2));
  if (activeType !== 'fractionalOdds') document.getElementById('fractionalOdds').value = fractionalStr;
  if (activeType !== 'americanOdds') document.getElementById('americanOdds').value = american;
  if (activeType !== 'hongKongOdds') document.getElementById('hongKongOdds').value = hongKong;
  if (activeType !== 'malaysianOdds') document.getElementById('malaysianOdds').value = malaysian;
  if (activeType !== 'indonesianOdds') document.getElementById('indonesianOdds').value = indonesian;

  document.getElementById('profit').innerText = `$${profit.toFixed(2)}`;
  document.getElementById('totalReturn').innerText = `$${totalReturn.toFixed(2)}`;
  document.getElementById('impliedProbability').innerText = `${impliedProbability.toFixed(2)}%`;
}

const fields = ['decimalOdds', 'fractionalOdds', 'americanOdds', 'hongKongOdds', 'malaysianOdds', 'indonesianOdds'];

fields.forEach(fieldId => {
  const el = document.getElementById(fieldId);
  el.addEventListener('input', (e) => {
    processOdds(fieldId, e.target.value);
  });
});

document.getElementById('stake').addEventListener('input', () => {
  let currentDecimal = document.getElementById('decimalOdds').value || 1.95;
  processOdds('decimalOdds', currentDecimal);
});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('decimalOdds').value = 1.95;
  processOdds('decimalOdds', 1.95);
});
