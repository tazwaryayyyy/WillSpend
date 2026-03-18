const API_BASE = "http://localhost:8000";

let chart = null;

// --- UTILS ---

function getVal(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function formatUSD(val) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

function formatINR(val) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

function getCurrencyFormatter() {
  const country = document.getElementById("country").value;
  return country === "India" ? formatINR : formatUSD;
}

// --- UI TOGGLES ---

function toggleCountryCards() {
  const country = document.getElementById("country").value;
  const card401k = document.getElementById("card-401k");
  const cardSip = document.getElementById("card-sip");
  
  if (country === "US") {
    card401k.style.display = "block";
    cardSip.style.display = "none";
  } else {
    card401k.style.display = "none";
    cardSip.style.display = "block";
  }
  calculateLiveLoss();
}

function addSubscription() {
  const container = document.getElementById("subscriptions-container");
  const row = document.createElement("div");
  row.className = "sub-row";
  row.innerHTML = `
    <input type="text" class="sub-name" placeholder="Netflix, Gym, etc."/>
    <input type="number" class="sub-cost" placeholder="$/mo" min="0" oninput="calculateLiveLoss()"/>
    <input type="number" class="sub-months" placeholder="months active" min="0" oninput="calculateLiveLoss()"/>
    <button type="button" class="remove-btn" onclick="removeRow(this)">✕</button>
  `;
  container.appendChild(row);
}

function addDebt() {
  const container = document.getElementById("debts-container");
  const row = document.createElement("div");
  row.className = "debt-row";
  row.innerHTML = `
    <input type="text" class="debt-name" placeholder="Student loan, Credit card..."/>
    <input type="number" class="debt-balance" placeholder="Balance $" min="0" oninput="calculateLiveLoss()"/>
    <input type="number" class="debt-current-rate" placeholder="Current rate %" min="0" oninput="calculateLiveLoss()"/>
    <input type="number" class="debt-refinance-rate" placeholder="Refi rate %" min="0" oninput="calculateLiveLoss()"/>
    <input type="number" class="debt-years" placeholder="Years" min="0" oninput="calculateLiveLoss()"/>
    <button type="button" class="remove-btn" onclick="removeRow(this)">✕</button>
  `;
  container.appendChild(row);
}

function removeRow(btn) {
  btn.parentElement.remove();
  calculateLiveLoss();
}

// --- LIVE CALCULATION ---

function calculateLiveLoss() {
  let total = 0;
  
  // Salary Gap (Simple)
  const salaryDiff = getVal("market_rate_salary") - getVal("current_salary");
  if (salaryDiff > 0) total += salaryDiff * 12 * getVal("years_at_same_salary");
  
  // Savings (Simple compounding estimate)
  const savings = getVal("savings_balance");
  const rateDiff = (getVal("high_yield_savings_rate") - getVal("current_savings_rate")) / 100;
  if (savings > 0 && rateDiff > 0) total += savings * rateDiff * getVal("years_savings_idle");
  
  // Investments (Simple)
  total += getVal("monthly_investment_missed") * 12 * getVal("years_not_investing") * 1.5; // 1.5 multiplier for rough compounding

  // Country Specific
  const country = document.getElementById("country").value;
  if (country === "US") {
    const matchLeak = Math.max(0, getVal("employer_match_pct") - getVal("user_contribution_pct"));
    total += (matchLeak / 100) * getVal("current_salary") * 12 * getVal("years_not_matching_401k") * 1.5;
  } else {
    total += getVal("monthly_sip_missed") * 12 * getVal("years_sip_delayed") * 1.6; // Nifty 12% is higher
  }

  // Subscriptions
  document.querySelectorAll(".sub-row").forEach(row => {
    const cost = parseFloat(row.querySelector(".sub-cost").value) || 0;
    const months = parseInt(row.querySelector(".sub-months").value) || 0;
    total += cost * months;
  });

  // Debts
  document.querySelectorAll(".debt-row").forEach(row => {
    const balance = parseFloat(row.querySelector(".debt-balance").value) || 0;
    const rateDiff = (parseFloat(row.querySelector(".debt-current-rate").value) - parseFloat(row.querySelector(".debt-refinance-rate").value)) / 100;
    const years = parseInt(row.querySelector(".debt-years").value) || 0;
    if (rateDiff > 0) total += balance * rateDiff * years;
  });

  const formatter = getCurrencyFormatter();
  document.getElementById("live-ticker-cost").textContent = formatter(total);
}

// --- API ACTIONS ---

function buildPayload() {
  const subscriptions = [];
  document.querySelectorAll(".sub-row").forEach(row => {
    const name = row.querySelector(".sub-name").value.trim();
    const cost = parseFloat(row.querySelector(".sub-cost").value) || 0;
    const months = parseInt(row.querySelector(".sub-months").value) || 0;
    if (name && cost > 0 && months > 0) {
      subscriptions.push({ name, monthly_cost: cost, months_active: months });
    }
  });

  const debts = [];
  document.querySelectorAll(".debt-row").forEach(row => {
    const name = row.querySelector(".debt-name").value.trim();
    const balance = parseFloat(row.querySelector(".debt-balance").value) || 0;
    const current_rate = parseFloat(row.querySelector(".debt-current-rate").value) || 0;
    const refinance_rate = parseFloat(row.querySelector(".debt-refinance-rate").value) || 0;
    const years = parseInt(row.querySelector(".debt-years").value) || 0;
    if (name && balance > 0 && current_rate > 0 && years > 0) {
      debts.push({ name, balance, current_rate, refinance_rate, years });
    }
  });

  return {
    country: document.getElementById("country").value,
    city: document.getElementById("city").value.trim(),
    age: parseInt(document.getElementById("age").value) || 25,
    monthly_income: getVal("monthly_income"),
    current_salary: getVal("current_salary"),
    market_rate_salary: getVal("market_rate_salary"),
    years_at_same_salary: parseInt(document.getElementById("years_at_same_salary").value) || 0,
    savings_balance: getVal("savings_balance"),
    current_savings_rate: getVal("current_savings_rate"),
    high_yield_savings_rate: getVal("high_yield_savings_rate"),
    years_savings_idle: parseInt(document.getElementById("years_savings_idle").value) || 0,
    monthly_investment_missed: getVal("monthly_investment_missed"),
    years_not_investing: parseInt(document.getElementById("years_not_investing").value) || 0,
    employer_match_pct: getVal("employer_match_pct"),
    user_contribution_pct: getVal("user_contribution_pct"),
    years_not_matching_401k: parseInt(document.getElementById("years_not_matching_401k").value) || 0,
    monthly_sip_missed: getVal("monthly_sip_missed"),
    years_sip_delayed: parseInt(document.getElementById("years_sip_delayed").value) || 0,
    subscriptions,
    debts
  };
}

function renderChart(items) {
  if (chart) chart.destroy();
  const ctx = document.getElementById("inactionChart").getContext("2d");
  
  const labels = items.map(i => {
    const cat = i.category;
    if (cat.length > 18) {
      if (cat.includes(":")) {
        return cat.split(":").map((s, idx) => idx === 0 ? s + ":" : s.trim());
      }
      const mid = Math.floor(cat.length / 2);
      const spaceIdx = cat.indexOf(" ", mid);
      if (spaceIdx !== -1) {
        return [cat.substring(0, spaceIdx), cat.substring(spaceIdx + 1)];
      }
    }
    return cat;
  });

  const values = items.map(i => i.total_cost);
  const colors = values.map((_, idx) => idx === 0 ? "#ff3b3b" : idx === 1 ? "#ff6b35" : "#e8ff47");
  const formatter = getCurrencyFormatter();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 2,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      layout: { padding: { left: 80, right: 30, top: 10, bottom: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${formatter(ctx.raw)}` },
          backgroundColor: "#1a1a1a",
          borderColor: "#2a2a2a",
          borderWidth: 1,
          titleFont: { family: "DM Mono" },
          bodyFont: { family: "DM Mono" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#888", font: { family: "DM Mono", size: 10 }, callback: val => val >= 1000 ? formatter(val / 1000).replace(/\.00$/, "") + "k" : formatter(val) }, 
          grid: { color: "#1f1f1f" },
          border: { color: "#2a2a2a" }
        },
        y: {
          ticks: { color: "#ccc", font: { family: "DM Mono", size: 9 }, padding: 10, autoSkip: false },
          grid: { display: false },
          border: { color: "#2a2a2a" }
        }
      }
    }
  });
}

async function analyze() {
  const btn = document.getElementById("analyze-btn");
  const btnText = document.getElementById("btn-text");
  const btnLoader = document.getElementById("btn-loader");

  btn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline";

  try {
    const payload = buildPayload();
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Error: " + (err.detail || "Something went wrong."));
      return;
    }

    const data = await res.json();
    const { simulation, ai_report } = data;
    const formatter = getCurrencyFormatter();

    // Show results
    document.getElementById("results").style.display = "block";
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });

    // Bento Grid Updates
    document.getElementById("total-cost").textContent = formatter(simulation.total_inaction_cost);
    
    // Time Thief (per day)
    const avgYears = 3; // Rough average of inaction periods
    const dailyLoss = simulation.total_inaction_cost / (avgYears * 365);
    document.getElementById("time-thief").textContent = formatter(dailyLoss);

    // Counterfactual You
    const netWorthIfActed = simulation.total_inaction_cost * 1.25; // Estimate including further potential growth
    document.getElementById("counterfactual-text").innerHTML = 
      `If you had acted ${avgYears} years ago, your net worth would be approximately <strong>${formatter(netWorthIfActed)}</strong> higher today.`;

    // Recovery Speed
    const maxRecovery = Math.max(...simulation.items.map(i => i.recovery_months));
    document.getElementById("recovery-speed").textContent = `${maxRecovery} Mo`;

    renderChart(simulation.items);
    
    const itemsList = document.getElementById("items-list");
    itemsList.innerHTML = simulation.items.map(item => `
      <div class="item-row">
        <div class="item-category">${item.category.toUpperCase()}</div>
        <div class="item-desc">${item.description}</div>
        <div class="item-cost">${formatter(item.total_cost)}</div>
        <div class="item-recovery">Recovery goal: ~${item.recovery_months} months</div>
      </div>
    `).join("");

    document.getElementById("ai-report-content").innerHTML = marked.parse(ai_report);

  } catch (e) {
    alert("Could not connect to backend. Make sure the FastAPI server is running.");
  } finally {
    btn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
}

function restart() {
  document.getElementById("results").style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Init
window.onload = () => {
  toggleCountryCards();
  calculateLiveLoss(); // Initial calculation on load
  // Add event listeners for all relevant input fields to trigger live calculation
  document.querySelectorAll("input[type='number'], input[type='text'], select").forEach(input => {
    input.addEventListener("input", calculateLiveLoss);
  });
};
