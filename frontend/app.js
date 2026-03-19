const API_BASE = "https://willspend.onrender.com";

let chart = null;

// Store last simulation data for PDF generation
let lastSimulation = null;
let lastAiReport = null;
let lastFormatter = null;

// --- UTILS ---

function getVal(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) || 0 : 0;
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

  // Investments (Simple with rough compounding multiplier)
  total += getVal("monthly_investment_missed") * 12 * getVal("years_not_investing") * 1.5;

  // Country Specific
  const country = document.getElementById("country").value;
  if (country === "US") {
    const matchLeak = Math.max(0, getVal("employer_match_pct") - getVal("user_contribution_pct"));
    total += (matchLeak / 100) * getVal("current_salary") * 12 * getVal("years_not_matching_401k") * 1.5;
  } else {
    total += getVal("monthly_sip_missed") * 12 * getVal("years_sip_delayed") * 1.6;
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
    const currentRate = parseFloat(row.querySelector(".debt-current-rate").value) || 0;
    const refiRate = parseFloat(row.querySelector(".debt-refinance-rate").value) || 0;
    const years = parseInt(row.querySelector(".debt-years").value) || 0;
    const rd = (currentRate - refiRate) / 100;
    if (rd > 0) total += balance * rd * years;
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
  if (chart) { chart.destroy(); chart = null; }
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
  const colors = values.map((_, idx) =>
    idx === 0 ? "#ff3b3b" : idx === 1 ? "#ff6b35" : "#e8ff47"
  );
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
          ticks: {
            color: "#888",
            font: { family: "DM Mono", size: 10 },
            callback: val => val >= 1000 ? formatter(val / 1000).replace(/\.00$/, "") + "k" : formatter(val)
          },
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

// --- COLD START LOADING OVERLAY ---

const LOADING_MESSAGES = [
  "Waking up the engine...",
  "Running compound calculations...",
  "Analyzing your inaction...",
  "Generating your regret report...",
  "Almost there..."
];

let loadingMsgInterval = null;
let loadingProgressInterval = null;
let loadingTimeoutTimer = null;
let loadingMsgIndex = 0;
let loadingProgress = 0;

function showLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  const fill = document.getElementById("loading-progress-fill");
  const msg = document.getElementById("loading-message");
  const timeoutMsg = document.getElementById("loading-timeout-msg");

  // Reset state
  loadingMsgIndex = 0;
  loadingProgress = 0;
  fill.style.width = "0%";
  fill.style.transition = "none";
  msg.textContent = LOADING_MESSAGES[0];
  timeoutMsg.style.display = "none";

  overlay.style.display = "flex";

  // Cycle messages every 3 seconds
  loadingMsgInterval = setInterval(() => {
    loadingMsgIndex = (loadingMsgIndex + 1) % LOADING_MESSAGES.length;
    msg.textContent = LOADING_MESSAGES[loadingMsgIndex];
  }, 3000);

  // Progress bar: fill to ~95% over 60 seconds (linear steps)
  // We advance ~1.58% per second
  setTimeout(() => {
    fill.style.transition = "width 1s linear";
  }, 50);

  loadingProgressInterval = setInterval(() => {
    // Slow down as we approach 95%
    const increment = loadingProgress < 70 ? 1.8 : loadingProgress < 88 ? 0.8 : 0.2;
    loadingProgress = Math.min(95, loadingProgress + increment);
    fill.style.width = loadingProgress + "%";
  }, 1000);

  // Show timeout message after 90 seconds
  loadingTimeoutTimer = setTimeout(() => {
    timeoutMsg.style.display = "block";
  }, 90000);
}

function hideLoadingOverlay() {
  // Clear all timers
  clearInterval(loadingMsgInterval);
  clearInterval(loadingProgressInterval);
  clearTimeout(loadingTimeoutTimer);
  loadingMsgInterval = null;
  loadingProgressInterval = null;
  loadingTimeoutTimer = null;

  // Fill progress bar to 100% quickly
  const fill = document.getElementById("loading-progress-fill");
  fill.style.transition = "width 0.4s ease";
  fill.style.width = "100%";

  // Fade out overlay
  const overlay = document.getElementById("loading-overlay");
  overlay.style.transition = "opacity 0.5s ease";
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.style.display = "none";
    overlay.style.opacity = "1";
    overlay.style.transition = "";
  }, 500);
}

// --- MAIN ANALYZE FUNCTION ---

async function analyze() {
  const btn = document.getElementById("analyze-btn");
  const btnText = document.getElementById("btn-text");
  const btnLoader = document.getElementById("btn-loader");

  btn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline";

  showLoadingOverlay();

  try {
    const payload = buildPayload();
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errDetail = "Something went wrong.";
      try {
        const err = await res.json();
        errDetail = err.detail || errDetail;
      } catch (_) { }
      throw new Error(errDetail);
    }

    const data = await res.json();
    const { simulation, ai_report } = data;
    const formatter = getCurrencyFormatter();

    // Store for PDF use
    lastSimulation = simulation;
    lastAiReport = ai_report;
    lastFormatter = formatter;

    // Show results
    const resultsSection = document.getElementById("results");
    resultsSection.style.display = "block";

    // Bento Grid Updates
    document.getElementById("total-cost").textContent = formatter(simulation.total_inaction_cost);

    // Time Thief: use actual max years across items for better accuracy
    const avgYears = simulation.items.length > 0
      ? simulation.items.reduce((acc, _) => acc + 3, 0) / simulation.items.length
      : 3;
    const dailyLoss = simulation.total_inaction_cost / (avgYears * 365);
    document.getElementById("time-thief").textContent = formatter(dailyLoss);

    // Counterfactual You
    const netWorthIfActed = simulation.total_inaction_cost * 1.25;
    document.getElementById("counterfactual-text").innerHTML =
      `If you had acted ${Math.round(avgYears)} year(s) ago, your net worth would be approximately <strong>${formatter(netWorthIfActed)}</strong> higher today.`;

    // Recovery Speed: show the longest recovery time
    const maxRecovery = simulation.items.length > 0
      ? Math.max(...simulation.items.map(i => i.recovery_months))
      : 0;
    document.getElementById("recovery-speed").textContent = `${maxRecovery} Mo`;

    renderChart(simulation.items);

    const itemsList = document.getElementById("items-list");
    itemsList.innerHTML = simulation.items.map(item => `
      <div class="item-row">
        <div class="item-category">${escapeHTML(item.category.toUpperCase())}</div>
        <div class="item-desc">${escapeHTML(item.description)}</div>
        <div class="item-cost">${formatter(item.total_cost)}</div>
        <div class="item-recovery">Recovery goal: ~${item.recovery_months} months</div>
      </div>
    `).join("");

    document.getElementById("ai-report-content").innerHTML = marked.parse(ai_report);

    hideLoadingOverlay();
    resultsSection.scrollIntoView({ behavior: "smooth" });

  } catch (e) {
    hideLoadingOverlay();
    alert("Error: " + (e.message || "Could not connect to backend. Make sure the FastAPI server is running."));
  } finally {
    btn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
}

// --- UTILITY: HTML escaping for XSS prevention ---
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// --- PDF GENERATION ---

function downloadPDF() {
  if (!lastSimulation || !lastAiReport) {
    alert("No report data found. Please run an analysis first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const COLORS = {
    black: [10, 10, 10],
    dark: [30, 30, 30],
    grey: [100, 100, 100],
    lightGrey: [180, 180, 180],
    accent: [60, 80, 0],     // dark olive for accent text on white
    danger: [200, 30, 30],
    orange: [200, 80, 20],
    white: [255, 255, 255],
  };

  // Helper: add page if needed
  function checkPage(neededHeight = 12) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Helper: draw horizontal rule
  function drawHRule(color = COLORS.lightGrey) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  }

  // ===== HEADER =====
  // Background header bar
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.white);
  doc.text("WILL", margin, 20);

  // Measure "WILL" width
  const willWidth = doc.getTextWidth("WILL");
  doc.setTextColor(200, 220, 50); // accent yellow-green
  doc.text("SPEND", margin + willWidth, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text("COST OF INACTION ENGINE", margin, 27);

  // Total on header right side
  const totalStr = lastFormatter(lastSimulation.total_inaction_cost);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(220, 60, 60);
  doc.text("TOTAL INACTION COST", pageWidth - margin, 16, { align: "right" });
  doc.setFontSize(18);
  doc.text(totalStr, pageWidth - margin, 26, { align: "right" });

  y = 46;

  // ===== DATE & SUBTITLE =====
  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.text(`Financial Autopsy Report  •  Generated ${reportDate}`, margin, y);
  y += 6;
  drawHRule();

  // ===== INACTION ITEMS =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.black);
  doc.text("INACTION BREAKDOWN", margin, y);
  y += 2;
  drawHRule([220, 220, 220]);

  lastSimulation.items.forEach((item, idx) => {
    checkPage(28);

    // Category badge
    const badgeColor = idx === 0 ? COLORS.danger : idx === 1 ? COLORS.orange : COLORS.dark;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(margin, y, contentWidth, 6.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.text(item.category.toUpperCase(), margin + 2.5, y + 4.5);
    y += 8.5;

    // Cost (large)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...COLORS.danger);
    doc.text(lastFormatter(item.total_cost), margin, y);
    y += 7;

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.dark);
    const descLines = doc.splitTextToSize(item.description, contentWidth);
    descLines.forEach(line => {
      checkPage(5);
      doc.text(line, margin, y);
      y += 5;
    });

    // Recovery
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.grey);
    doc.text(`Recovery goal: ~${item.recovery_months} months at current income`, margin, y);
    y += 9;
  });

  // ===== AI ADVISOR SECTION =====
  checkPage(20);
  drawHRule();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.black);
  doc.text("AI ADVISOR REPORT", margin, y);
  y += 2;
  drawHRule([220, 220, 220]);

  // Strip markdown to plain text
  const plainAiReport = stripMarkdown(lastAiReport);
  const aiLines = plainAiReport.split("\n").filter(l => l.trim() !== "");

  aiLines.forEach(line => {
    // Treat lines starting with ## or # as section headers
    const isHeader = line.startsWith("## ") || line.startsWith("# ");
    const text = line.replace(/^#{1,3}\s*/, "").trim();
    if (!text) return;

    if (isHeader) {
      checkPage(14);
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.black);
      doc.text(text, margin, y);
      y += 2;
      doc.setDrawColor(...COLORS.lightGrey);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.dark);
      const wrappedLines = doc.splitTextToSize(text, contentWidth);
      wrappedLines.forEach(wl => {
        checkPage(5);
        doc.text(wl, margin, y);
        y += 5;
      });
      y += 1;
    }
  });

  // ===== FOOTER (every page) =====
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;
    doc.setDrawColor(...COLORS.lightGrey);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.grey);
    doc.text(`Generated by WillSpend  •  ${reportDate}`, margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
  }

  doc.save(`WillSpend_Report_${Date.now()}.pdf`);
}

// Strip markdown syntax to plain text for PDF
function stripMarkdown(md) {
  return md
    .replace(/\*\*(.+?)\*\*/g, "$1")    // bold
    .replace(/\*(.+?)\*/g, "$1")         // italic
    .replace(/`(.+?)`/g, "$1")           // code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")  // links
    .replace(/^[-*+]\s+/gm, "• ")        // bullets
    .replace(/^>\s+/gm, "")              // blockquotes
    .trim();
}

function restart() {
  document.getElementById("results").style.display = "none";
  lastSimulation = null;
  lastAiReport = null;
  lastFormatter = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Init
window.onload = () => {
  toggleCountryCards();
  calculateLiveLoss();
};
