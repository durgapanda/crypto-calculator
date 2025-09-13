function getEntries() {
  return JSON.parse(localStorage.getItem("tradeEntries") || "[]");
}
function saveEntries(entries) {
  localStorage.setItem("tradeEntries", JSON.stringify(entries));
}
function saveEntry(entry) {
  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);
}
function updateEntry(index, updatedEntry) {
  const entries = getEntries();
  if (index >= 0 && index < entries.length) {
    entries[index] = updatedEntry;
    saveEntries(entries);
  }
}
function deleteEntry(index) {
  const entries = getEntries();
  if (index >= 0 && index < entries.length) {
    entries.splice(index, 1);
    saveEntries(entries);
  }
}
function getLastEntry() {
  const entries = getEntries();
  return entries.length ? entries[entries.length - 1] : {};
}
function getSummary() {
  const entries = getEntries();
  const summary = {};
  entries.forEach((e) => {
    if (!summary[e.symbol])
      summary[e.symbol] = { margin: 0, entrySum: 0, levSum: 0, count: 0 };
    summary[e.symbol].margin += parseFloat(e.margin);
    summary[e.symbol].entrySum += parseFloat(e.entryPrice);
    summary[e.symbol].levSum += parseFloat(e.leverage);
    summary[e.symbol].count += 1;
  });
  return Object.entries(summary).map(([symbol, agg]) => {
    const avgEntry = agg.entrySum / agg.count;
    const avgLeverage = agg.levSum / agg.count;
    return {
      symbol,
      totalMargin: agg.margin.toFixed(2),
      avgEntry: avgEntry.toFixed(2),
      avgLeverage: avgLeverage.toFixed(2),
      positions: agg.count,
      liqLong: getLiquidationPrice(avgEntry, avgLeverage, "Long"),
      liqShort: getLiquidationPrice(avgEntry, avgLeverage, "Short"),
    };
  });
}
function getLiquidationPrice(entryPrice, leverage, direction) {
  entryPrice = parseFloat(entryPrice);
  leverage = parseFloat(leverage);
  if (direction === "Long") return (entryPrice * (1 - 1 / leverage)).toFixed(2);
  else return (entryPrice * (1 + 1 / leverage)).toFixed(2);
}
function refreshSummary() {
  const tbody = document.querySelector("#summaryTable tbody");
  const summary = getSummary();
  tbody.innerHTML = "";
  summary.forEach((row) => {
    tbody.innerHTML += `
      <tr>
        <td>${row.symbol}</td>
        <td>${row.totalMargin}</td>
        <td>${row.avgEntry}</td>
        <td>${row.avgLeverage}</td>
        <td>${row.positions}</td>
        <td>${row.liqLong}</td>
        <td>${row.liqShort}</td>
      </tr>`;
  });
}
function refreshTable() {
  const tbody = document.querySelector("#entriesTable tbody");
  const entries = getEntries();
  tbody.innerHTML = "";
  entries.forEach((entry, index) => {
    const liq = getLiquidationPrice(
      entry.entryPrice,
      entry.leverage,
      entry.direction
    );
    tbody.innerHTML += `
      <tr data-index="${index}">
        <td>${entry.symbol}</td>
        <td>${entry.margin}</td>
        <td>${entry.entryPrice}</td>
        <td>${entry.leverage}</td>
        <td>${entry.direction}</td>
        <td>${liq}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </td>
      </tr>`;
  });

  tbody
    .querySelectorAll("button.edit-btn")
    .forEach((btn) => (btn.onclick = onEditClick));
  tbody
    .querySelectorAll("button.delete-btn")
    .forEach((btn) => (btn.onclick = onDeleteClick));
}
function onEditClick(event) {
  const tr = event.target.closest("tr");
  const idx = parseInt(tr.dataset.index);
  const entry = getEntries()[idx];

  tr.innerHTML = `
    <td>
      <select id="editSymbol${idx}">
        <option value="BTC" ${
          entry.symbol === "BTC" ? "selected" : ""
        }>BTC</option>
        <option value="ETH" ${
          entry.symbol === "ETH" ? "selected" : ""
        }>ETH</option>
        <option value="SOL" ${
          entry.symbol === "SOL" ? "selected" : ""
        }>SOL</option>
      </select>
    </td>
    <td><input type="number" step="0.01" id="editMargin${idx}" value="${
    entry.margin
  }"></td>
    <td><input type="number" step="0.01" id="editEntryPrice${idx}" value="${
    entry.entryPrice
  }"></td>
    <td><input type="number" step="1" id="editLeverage${idx}" value="${
    entry.leverage
  }"></td>
    <td>
      <select id="editDirection${idx}">
        <option value="Long" ${
          entry.direction === "Long" ? "selected" : ""
        }>Long</option>
        <option value="Short" ${
          entry.direction === "Short" ? "selected" : ""
        }>Short</option>
      </select>
    </td>
    <td colspan="2">Editing...</td>
    <td>
      <button class="save-btn">Save</button>
      <button class="cancel-btn">Cancel</button>
    </td>
  `;

  tr.querySelector("button.save-btn").onclick = () => onSaveClick(idx);
  tr.querySelector("button.cancel-btn").onclick = () => refreshTable();
}
function onSaveClick(idx) {
  const updatedEntry = {
    symbol: document.getElementById(`editSymbol${idx}`).value,
    margin: document.getElementById(`editMargin${idx}`).value,
    entryPrice: document.getElementById(`editEntryPrice${idx}`).value,
    leverage: document.getElementById(`editLeverage${idx}`).value,
    direction: document.getElementById(`editDirection${idx}`).value,
  };
  updateEntry(idx, updatedEntry);
  refreshSummary();
  refreshTable();
}
function onDeleteClick(event) {
  const tr = event.target.closest("tr");
  const idx = parseInt(tr.dataset.index);
  if (confirm("Are you sure you want to delete this entry?")) {
    deleteEntry(idx);
    refreshSummary();
    refreshTable();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const last = getLastEntry();
  if (last.margin) document.getElementById("margin").value = last.margin;
  if (last.entryPrice)
    document.getElementById("entryPrice").value = last.entryPrice;
  if (last.leverage) document.getElementById("leverage").value = last.leverage;
  if (last.symbol) document.getElementById("symbol").value = last.symbol;
  if (last.direction)
    document.getElementById("direction").value = last.direction;
  refreshSummary();
  refreshTable();

  document.getElementById("tradeForm").onsubmit = (e) => {
    e.preventDefault();
    const entry = {
      margin: document.getElementById("margin").value,
      entryPrice: document.getElementById("entryPrice").value,
      leverage: document.getElementById("leverage").value,
      symbol: document.getElementById("symbol").value,
      direction: document.getElementById("direction").value,
    };
    saveEntry(entry);
    refreshSummary();
    refreshTable();
    // Clear inputs except symbol
    document.getElementById("margin").value = "";
    document.getElementById("entryPrice").value = "";
    document.getElementById("leverage").value = "";
    document.getElementById("direction").value = "Long"; // reset direction
  };
});
