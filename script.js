const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("fromCurrency");
const toSelect = document.getElementById("toCurrency");
const resultDiv = document.getElementById("result");
const rateInfo = document.getElementById("rateInfo");
const swapBtn = document.getElementById("swapBtn");
const loader = document.getElementById("loader");
const isWindows = navigator.platform.toLowerCase().includes("win");
const rateCache = {};
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = "lastCurrencyState";

// Load cached rates from localStorage
const storedCache = localStorage.getItem("rateCache");
if (storedCache) {
  try {
    Object.assign(rateCache, JSON.parse(storedCache));
  } catch {
    localStorage.removeItem("rateCache");
  }
}

const currencyToCountry = {
  AUD: "AU",
  BRL: "BR",
  CAD: "CA",
  CHF: "CH",
  CNY: "CN",
  CZK: "CZ",
  DKK: "DK",
  EUR: "EU",
  GBP: "GB",
  HKD: "HK",
  HUF: "HU",
  IDR: "ID",
  ILS: "IL",
  INR: "IN",
  ISK: "IS",
  JPY: "JP",
  KRW: "KR",
  MXN: "MX",
  MYR: "MY",
  NOK: "NO",
  NZD: "NZ",
  PHP: "PH",
  PLN: "PL",
  RON: "RO",
  SEK: "SE",
  SGD: "SG",
  THB: "TH",
  TRY: "TR",
  USD: "US",
  ZAR: "ZA"
};

const currencySymbolFallback = {
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  TRY: "₺",
  ILS: "₪",
  THB: "฿",
  PHP: "₱",
  MYR: "RM",
  IDR: "Rp",
  ZAR: "R",
  KRW: "₩",
  SGD: "S$",
  HKD: "HK$",
  MXN: "$",
  BRL: "R$"
};

let currencies = {};
let lastQuery = "";
let controller = null;
let convertingInterval = null;
let dotCount = 0;

// Debounce
function debounce(fn, delay = 400) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function showConverting() {
  resultDiv.innerText = "Converting…";
  rateInfo.innerText = "";
}

function saveUserState() {
  const state = {
    amount: amountInput.value,
    from: fromSelect.value,
    to: toSelect.value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreUserState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const { amount, from, to } = JSON.parse(saved);

    if (amount) amountInput.value = amount;
    if (from) fromSelect.value = from;
    if (to) toSelect.value = to;

    if (amount && from && to) {
      convertCurrency();
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function countryCodeToFlag(countryCode) {
  return countryCode
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}

// Load currencies dynamically
async function loadCurrencies() {
  try {
    loader.classList.add("active"); // show while loading

    const res = await fetch("https://api.frankfurter.app/currencies");
    currencies = await res.json();

    let optionsHTML = "";

    Object.entries(currencies).forEach(([code, name]) => {
      const countryCode = currencyToCountry[code];
      const flag = (!isWindows && countryCode)
        ? countryCodeToFlag(countryCode)
        : "";

      optionsHTML = `<option value="${code}">
        ${flag ? flag + " " : ""}${name} (${code})
      </option>`;

      fromSelect.innerHTML += optionsHTML;
      toSelect.innerHTML += optionsHTML;
    });

  } catch (err) {
    console.error(err);
    alert("Failed to load currencies. Please refresh.");
  } finally {
    loader.classList.remove("active");
    await preCacheBaseRates();
    restoreUserState();
  }
}

requestIdleCallback
  ? requestIdleCallback(loadCurrencies)
  : setTimeout(loadCurrencies, 0);

function formatWithCommas(input) {
  const start = input.selectionStart;
  const end = input.selectionEnd;

  // Keep only digits
  const digits = input.value.replace(/[^\d]/g, "");

  if (!digits) {
    input.value = "";
    return;
  }

  // Add commas manually (no Number())
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Calculate cursor shift
  const diff = formatted.length - digits.length;

  input.value = formatted;
  input.setSelectionRange(start + diff, end + diff);
}

const debouncedConvert = debounce(convertCurrency);

amountInput.addEventListener("input", () => {
  formatWithCommas(amountInput);
  saveUserState();
  debouncedConvert();
});

fromSelect.addEventListener("change", () => {
  saveUserState();
  convertCurrency();
});

toSelect.addEventListener("change", () => {
  saveUserState();
  convertCurrency();
});

swapBtn.addEventListener("click", () => {
  swapBtn.classList.add("rotate");

  [fromSelect.value, toSelect.value] = [toSelect.value, fromSelect.value];
  convertCurrency();

  setTimeout(() => swapBtn.classList.remove("rotate"), 400);
});

window.addEventListener("load", () => {
  amountInput.focus();
});

amountInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    convertCurrency();
  }
});

function startConvertingAnimation() {
  stopConvertingAnimation(); // safety

  dotCount = 0;
  resultDiv.innerText = "Converting";
  rateInfo.innerText = "";

  convertingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4; // 0 → 3
    resultDiv.innerText = "Converting" + ".".repeat(dotCount);
  }, 400);
}

function stopConvertingAnimation() {
  if (convertingInterval) {
    clearInterval(convertingInterval);
    convertingInterval = null;
  }
}

async function preCacheBaseRates() {
  if (!navigator.onLine) return;

  try {
    const res = await fetch("https://api.frankfurter.app/latest");
    const data = await res.json();

    Object.entries(data.rates).forEach(([currency, rate]) => {
      rateCache[`EUR-${currency}`] = {
        rate,
        time: Date.now()
      };
      rateCache[`${currency}-EUR`] = {
        rate: 1 / rate,
        time: Date.now()
      };
    });

    localStorage.setItem("rateCache", JSON.stringify(rateCache));
  } catch (e) {
    console.warn("Base rate pre-cache failed");
  }
}

async function convertCurrency() {
  const amount = parseFloat(amountInput.value.replace(/,/g, ""));
  const from = fromSelect.value;
  const to = toSelect.value;
  const cacheKey = `${from}-${to}`;
  const now = Date.now();

  // =======================
  // OFFLINE MODE HANDLING
  // =======================
  if (!navigator.onLine) {
    stopConvertingAnimation();

    // Same currency → instant
    if (from === to) {
      resultDiv.innerText = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: to
      }).format(amount);

      rateInfo.innerText = "Offline • same currency";
      return;
    }

    const eurFrom = rateCache[`${from}-EUR`];
    const eurTo = rateCache[`EUR-${to}`];

    if (eurFrom && eurTo) {
      const rate = eurFrom.rate * eurTo.rate;
      const value = amount * rate;

      resultDiv.innerText = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: to,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);

      rateInfo.innerText =
        `Offline • cached rate (1 ${from} ≈ ${rate.toFixed(4)} ${to})`;
      return;
    }

    resultDiv.innerText = "Offline – no cached rate available";
    rateInfo.innerText = "Connect once to cache rates";
    return;
  }

  if (!amount || amount <= 0) {
    stopConvertingAnimation();
    resultDiv.innerText = "—";
    rateInfo.innerText = "";
    return;
  }

  if (from === to) {
    stopConvertingAnimation();
    resultDiv.innerText = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: to
    }).format(amount);

    rateInfo.innerText = "Same currency selected";
    return;
  }

  if (rateCache[cacheKey] && now - rateCache[cacheKey].time < CACHE_TIME) {
    stopConvertingAnimation();
    const cachedRate = rateCache[cacheKey].rate;

    resultDiv.innerText = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: to,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount * cachedRate);

    rateInfo.innerText = `1 ${from} = ${cachedRate.toFixed(4)} ${to}`;
    return;
  }

  const query = `${amount}-${from}-${to}`;
  if (query === lastQuery) return;
  lastQuery = query;
  startConvertingAnimation();

  if (controller) controller.abort();
  controller = new AbortController();
  const signal = controller.signal;

  try {
    let rate;

    if (from === "EUR") {
      // EUR → other
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=EUR&to=${to}`,
        { signal }
      );
      const data = await res.json();
      rate = data.rates[to];

    } else if (to === "EUR") {
      // other → EUR
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${from}&to=EUR`,
        { signal }
      );
      const data = await res.json();
      rate = data.rates.EUR;

    } else {
      // other → EUR → other
      const res1 = await fetch(
        `https://api.frankfurter.app/latest?from=${from}&to=EUR`,
        { signal }
      );
      const data1 = await res1.json();

      const res2 = await fetch(
        `https://api.frankfurter.app/latest?from=EUR&to=${to}`,
        { signal }
      );
      const data2 = await res2.json();

      rate = data1.rates.EUR * data2.rates[to];
    }

    const value = amount * rate;

    let formatted;

    try {
      formatted = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: to,
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
    }).format(value);

    } catch {
      const symbol = currencySymbolFallback[to] || to;
      formatted = `${symbol} ${value.toFixed(2)}`;
    }

    // Apply fade ONLY when real value arrives
    stopConvertingAnimation();
    resultDiv.classList.remove("result-fade");
    resultDiv.innerText = formatted;

    // Force next paint, then animate
    requestAnimationFrame(() => {
      resultDiv.classList.add("result-fade");
    });
  
    rateInfo.innerText = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    rateCache[`${from}-${to}`] = {
      rate,
      time: Date.now()
    };

    localStorage.setItem("rateCache", JSON.stringify(rateCache));

  } catch (err) {
      stopConvertingAnimation();
      if (err.name === "AbortError") return;

      console.error(err);

      // 🔁 Offline fallback (Feature 8)
      if (rateCache[cacheKey]) {
        const fallbackRate = rateCache[cacheKey].rate;
        const value = amount * fallbackRate;

        resultDiv.innerText = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: to
        }).format(value);

        rateInfo.innerText = `Using last known rate • 1 ${from} = ${fallbackRate.toFixed(4)} ${to}`;
        return;
      }

      // ❌ No cache available
      resultDiv.innerText = "Rates temporarily unavailable. Try again.";
      rateInfo.innerText = "";
    }
}

// =======================
// PWA: Service Worker
// =======================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() =>
        navigator.serviceWorker.register("./sw.js")
      );
    } else {
      setTimeout(() =>
        navigator.serviceWorker.register("./sw.js"), 0
      );
    }
  });
}
