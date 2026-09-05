// Strict Admin Session Validation
(function guardAdminPortal() {
    if (sessionStorage.getItem("VTC_ADMIN_TOKEN") !== "AUTHENTICATED_VTC_ADMIN_2026") {
        alert("Restricted Access! Please login as administrator.");
        window.location.href = "login.html";
    }
})();

function logoutAdmin() {
    if (confirm("Quit Tally Accounting ERP?")) {
        sessionStorage.removeItem("VTC_ADMIN_TOKEN");
        sessionStorage.removeItem("VTC_ADMIN_USER");
        window.location.href = "login.html";
    }
}

const STORAGE_PREFIX = "VTC_DATA_SECURE_";

function getDB(key, defaultVal) {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultVal;
    try { return JSON.parse(raw); } catch (e) { return defaultVal; }
}

function setDB(key, val) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
}

// Initial Seed Data
if (!localStorage.getItem(STORAGE_PREFIX + "INITIALIZED")) {
    const defaultLedgers = [
        { id: "L1", name: "Cash in Hand", group: "Cash-in-Hand", balance: 45000, gstin: "" },
        { id: "L2", name: "HDFC Bank A/c", group: "Bank Accounts", balance: 185000, gstin: "09AABCH1234F1Z1" },
        { id: "L3", name: "Sharma Electricals", group: "Sundry Debtors", balance: 24000, city: "Moradabad", gstin: "09AAACS1122D1Z3" },
        { id: "L4", name: "Gupta Hardware Store", group: "Sundry Debtors", balance: 18500, city: "Bilari", gstin: "09BBBPG4455E1Z5" },
        { id: "L5", name: "Havells Wire Distributors", group: "Sundry Creditors", balance: -52000, city: "Delhi", gstin: "07AAACH0099K1Z8" },
        { id: "L6", name: "Anchor Modular Systems", group: "Sundry Creditors", balance: -31000, city: "Noida", gstin: "09AAACA9988M1Z2" }
    ];
    setDB("LEDGERS", defaultLedgers);

    const defaultStock = [
        { code: "MOD-001", name: "Modular Box 8-Module Powder Coated", group: "Modular Boxes", hsn: "8538", qty: 450, rate: 85, gst: 18 },
        { code: "MOD-002", name: "Modular Box 12-Module Heavy Metal", group: "Modular Boxes", hsn: "8538", qty: 280, rate: 125, gst: 18 },
        { code: "LED-009", name: "9W High-Lumen B22 LED Bulb", group: "Lighting", hsn: "9405", qty: 1200, rate: 42, gst: 12 },
        { code: "LED-020", name: "20W Slim LED Batten Light", group: "Lighting", hsn: "9405", qty: 350, rate: 165, gst: 18 },
        { code: "WIR-150", name: "1.5 Sq mm Copper FR Wire 90m", group: "Wires & Cables", hsn: "8544", qty: 85, rate: 1150, gst: 18 },
        { code: "FAN-ROD", name: "Ceiling Fan Heavy Down Rod 3ft", group: "Hardware", hsn: "8414", qty: 500, rate: 48, gst: 18 }
    ];
    setDB("STOCK", defaultStock);

    const defaultVouchers = [
        {
            vchNo: "VTC/26-27/001",
            date: "2026-09-01",
            type: "Sales",
            party: "Sharma Electricals",
            debit: 14500,
            credit: 0,
            narration: "Being 9W LED & Modular boxes sold against invoice"
        }
    ];
    setDB("VOUCHERS", defaultVouchers);
    setDB("INITIALIZED", true);
}

function switchView(viewName) {
    document.querySelectorAll('.view-panel').forEach(el => el.style.display = 'none');
    const target = document.getElementById('view-' + viewName);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.gateway-menu-item').forEach(el => el.classList.remove('active'));

    if (viewName === 'dashboard') renderDashboard();
    if (viewName === 'salesVoucher') prepareSalesVoucherForm();
    if (viewName === 'purchaseVoucher') preparePurchaseVoucherForm();
    if (viewName === 'paymentVoucher') preparePaymentVoucherForm();
    if (viewName === 'receiptVoucher') prepareReceiptVoucherForm();
    if (viewName === 'inventory') renderInventoryTable();
    if (viewName === 'ledgers') renderLedgersTable();
    if (viewName === 'daybook') renderDayBookTable();
    if (viewName === 'plStatement') renderPLStatement();
}

function renderDashboard() {
    const vouchers = getDB("VOUCHERS", []);
    const ledgers = getDB("LEDGERS", []);

    let totalSales = 0;
    let totalPurchases = 0;
    vouchers.forEach(v => {
        if (v.type === "Sales") totalSales += (v.debit || 0);
        if (v.type === "Purchase") totalPurchases += (v.credit || 0);
    });

    let cashBank = 0;
    let sundryDebtors = 0;
    ledgers.forEach(l => {
        if (l.group === "Cash-in-Hand" || l.group === "Bank Accounts") cashBank += l.balance;
        if (l.group === "Sundry Debtors" && l.balance > 0) sundryDebtors += l.balance;
    });

    document.getElementById("metricSales").innerText = "₹" + totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById("metricPurchase").innerText = "₹" + totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById("metricCashBank").innerText = "₹" + cashBank.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById("metricDebtors").innerText = "₹" + sundryDebtors.toLocaleString('en-IN', {minimumFractionDigits: 2});

    const tbody = document.getElementById("dashboardRecentTable");
    tbody.innerHTML = "";
    const recent = vouchers.slice(0, 8);
    if (recent.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#64748b;'>No transactions recorded yet.</td></tr>";
        return;
    }
    recent.forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${v.vchNo}</strong></td>
                <td>${v.date}</td>
                <td><span class="gateway-shortcut">${v.type}</span></td>
                <td>${v.party}</td>
                <td class="text-right">${v.debit > 0 ? '₹' + v.debit.toFixed(2) : '-'}</td>
                <td class="text-right">${v.credit > 0 ? '₹' + v.credit.toFixed(2) : '-'}</td>
                <td class="text-center">
                    ${v.type === 'Sales' && v.invoiceData ? `<button onclick='viewInvoiceModal(${JSON.stringify(v.invoiceData)})' class='btn-tally-secondary' style='padding:2px 8px; font-size:0.75rem;'>Print Bill</button>` : '-'}
                </td>
            </tr>
        `;
    });
}

function prepareSalesVoucherForm() {
    const vouchers = getDB("VOUCHERS", []);
    const nextNo = "VTC/26-27/" + String(vouchers.filter(v => v.type === "Sales").length + 1).padStart(3, '0');
    document.getElementById("salesVchNo").value = nextNo;
    document.getElementById("salesDate").valueAsDate = new Date();

    const partySelect = document.getElementById("salesParty");
    partySelect.innerHTML = "<option value='Cash Sale (Counter)'>Cash Sale (Counter Customer)</option>";
    const ledgers = getDB("LEDGERS", []);
    ledgers.filter(l => l.group === "Sundry Debtors").forEach(l => {
        partySelect.innerHTML += `<option value="${l.name}">${l.name} (${l.city || 'Debtor'})</option>`;
    });

    populateItemSelects();
    calculateSalesTotals();
}

function populateItemSelects() {
    const stock = getDB("STOCK", []);
    document.querySelectorAll('.item-select').forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = "<option value=''>-- Select Stock Item --</option>";
        stock.forEach(item => {
            sel.innerHTML += `<option value="${item.code}" data-hsn="${item.hsn}" data-rate="${item.rate}" data-gst="${item.gst}">${item.name} [Stk: ${item.qty}]</option>`;
        });
        if (currentVal) sel.value = currentVal;
    });
}

function onItemSelectRow(selectElem) {
    const row = selectElem.closest('tr');
    const selectedOption = selectElem.options[selectElem.selectedIndex];
    if (!selectedOption || !selectedOption.value) return;

    row.querySelector('.item-hsn').value = selectedOption.getAttribute('data-hsn') || '';
    row.querySelector('.item-rate').value = selectedOption.getAttribute('data-rate') || 0;
    row.querySelector('.item-gst').value = selectedOption.getAttribute('data-gst') || 18;
    calculateSalesTotals();
}

function addSalesItemRow() {
    const tbody = document.getElementById("salesItemsBody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><select class="tally-select item-select" onchange="onItemSelectRow(this)" required></select></td>
        <td><input type="text" class="tally-input item-hsn" placeholder="HSN" readonly></td>
        <td><input type="number" step="0.01" class="tally-input item-qty" value="1" min="0.01" oninput="calculateSalesTotals()" required></td>
        <td><input type="number" step="0.01" class="tally-input item-rate" value="0" min="0" oninput="calculateSalesTotals()" required></td>
        <td>
            <select class="tally-select item-gst" onchange="calculateSalesTotals()">
                <option value="18">18%</option>
                <option value="12">12%</option>
                <option value="28">28%</option>
                <option value="5">5%</option>
                <option value="0">0%</option>
            </select>
        </td>
        <td class="text-right item-row-total" style="font-weight: bold;">₹0.00</td>
    `;
    tbody.appendChild(newRow);
    populateItemSelects();
}

function calculateSalesTotals() {
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    document.querySelectorAll('#salesItemsBody tr').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const gstRate = parseFloat(row.querySelector('.item-gst').value) || 0;

        const rowTaxable = qty * rate;
        const rowTax = (rowTaxable * gstRate) / 100;
        const rowTotal = rowTaxable + rowTax;

        row.querySelector('.item-row-total').innerText = "₹" + rowTotal.toFixed(2);

        subtotal += rowTaxable;
        totalCGST += (rowTax / 2);
        totalSGST += (rowTax / 2);
    });

    const grandTotal = subtotal + totalCGST + totalSGST;

    document.getElementById("salesSubTotal").innerText = "₹" + subtotal.toFixed(2);
    document.getElementById("salesCGST").innerText = "₹" + totalCGST.toFixed(2);
    document.getElementById("salesSGST").innerText = "₹" + totalSGST.toFixed(2);
    document.getElementById("salesGrandTotal").innerText = "₹" + grandTotal.toFixed(2);
}

document.getElementById("salesVoucherForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const vchNo = document.getElementById("salesVchNo").value;
    const date = document.getElementById("salesDate").value;
    const party = document.getElementById("salesParty").value;
    const payMode = document.getElementById("salesPayMode").value;
    const narration = document.getElementById("salesNarration").value;

    const items = [];
    let grandTotal = 0;
    let totalTaxable = 0;
    let totalTax = 0;

    const stock = getDB("STOCK", []);

    document.querySelectorAll('#salesItemsBody tr').forEach(row => {
        const sel = row.querySelector('.item-select');
        const itemCode = sel.value;
        const itemName = sel.options[sel.selectedIndex].text.split(' [')[0];
        const hsn = row.querySelector('.item-hsn').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const gst = parseFloat(row.querySelector('.item-gst').value) || 0;

        const taxable = qty * rate;
        const tax = (taxable * gst) / 100;
        const rowTotal = taxable + tax;

        items.push({ itemCode, itemName, hsn, qty, rate, gst, taxable, rowTotal });

        totalTaxable += taxable;
        totalTax += tax;
        grandTotal += rowTotal;

        const targetStock = stock.find(s => s.code === itemCode);
        if (targetStock) targetStock.qty = Math.max(0, targetStock.qty - qty);
    });

    setDB("STOCK", stock);

    const vouchers = getDB("VOUCHERS", []);
    const invoicePayload = {
        vchNo, date, party, payMode, items, totalTaxable, totalTax, grandTotal, narration
    };

    vouchers.unshift({
        vchNo: vchNo,
        date: date,
        type: "Sales",
        party: party,
        debit: grandTotal,
        credit: 0,
        narration: narration,
        invoiceData: invoicePayload
    });
    setDB("VOUCHERS", vouchers);

    const ledgers = getDB("LEDGERS", []);
    if (payMode === "Credit") {
        const targetParty = ledgers.find(l => l.name === party);
        if (targetParty) targetParty.balance += grandTotal;
    } else if (payMode === "Cash") {
        const cashA = ledgers.find(l => l.name === "Cash in Hand");
        if (cashA) cashA.balance += grandTotal;
    } else if (payMode === "Bank") {
        const bankA = ledgers.find(l => l.name === "HDFC Bank A/c");
        if (bankA) bankA.balance += grandTotal;
    }
    setDB("LEDGERS", ledgers);

    viewInvoiceModal(invoicePayload);
    switchView("dashboard");
});

function viewInvoiceModal(inv) {
    const modal = document.getElementById("invoiceModal");
    const container = document.getElementById("printableInvoiceContent");

    let itemsRowsHtml = "";
    inv.items.forEach((item, index) => {
        itemsRowsHtml += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align:center;">${index + 1}</td>
                <td style="padding: 8px;"><strong>${item.itemName}</strong></td>
                <td style="padding: 8px; text-align:center;">${item.hsn}</td>
                <td style="padding: 8px; text-align:right;">${item.qty}</td>
                <td style="padding: 8px; text-align:right;">₹${item.rate.toFixed(2)}</td>
                <td style="padding: 8px; text-align:right;">${item.gst}%</td>
                <td style="padding: 8px; text-align:right;"><strong>₹${item.rowTotal.toFixed(2)}</strong></td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div style="border: 2px solid #000; padding: 24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #000; padding-bottom: 16px;">
                <div>
                    <div style="width:50px; height:50px; border:1px dashed #666; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:bold; margin-bottom:6px;">LOGO</div>
                    <h2 style="margin:0; font-size:1.6rem; color:#0f172a;">VIKRANT TRADING COMPANY</h2>
                    <p style="margin:4px 0 0; font-size:0.85rem; color:#333;">Main Commercial Market, Bilari, Moradabad (UP) - 243411</p>
                    <p style="margin:2px 0 0; font-size:0.85rem; font-weight:bold;">GSTIN: 09AABCV1234F1Z8 | State: Uttar Pradesh (09)</p>
                </div>
                <div style="text-align:right;">
                    <div style="background:#0f172a; color:#fff; padding:6px 14px; font-weight:bold; display:inline-block; margin-bottom:8px;">TAX INVOICE</div>
                    <p style="margin:0; font-size:0.9rem;"><strong>Invoice No:</strong> ${inv.vchNo}</p>
                    <p style="margin:2px 0; font-size:0.9rem;"><strong>Date:</strong> ${inv.date}</p>
                    <p style="margin:2px 0; font-size:0.9rem;"><strong>Payment Mode:</strong> ${inv.payMode}</p>
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; margin:16px 0; border-bottom:1px solid #000; padding-bottom:14px; font-size:0.9rem;">
                <div>
                    <span style="color:#666; font-size:0.8rem; text-transform:uppercase;">Billed To / Buyer:</span>
                    <h4 style="margin:4px 0;">${inv.party}</h4>
                    <p style="margin:0;">Authorized Client / Dealer</p>
                    <p style="margin:0;">State Code: 09 (Uttar Pradesh)</p>
                </div>
                <div style="text-align:right;">
                    <span style="color:#666; font-size:0.8rem; text-transform:uppercase;">Place of Supply:</span>
                    <p style="margin:4px 0 0;"><strong>Bilari / Moradabad (09)</strong></p>
                </div>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:0.88rem; margin:16px 0;">
                <thead>
                    <tr style="background:#f1f5f9; border-top:1px solid #000; border-bottom:1px solid #000;">
                        <th style="padding:8px; text-align:center;">S.N.</th>
                        <th style="padding:8px; text-align:left;">Description of Goods</th>
                        <th style="padding:8px; text-align:center;">HSN</th>
                        <th style="padding:8px; text-align:right;">Qty</th>
                        <th style="padding:8px; text-align:right;">Rate (₹)</th>
                        <th style="padding:8px; text-align:right;">GST</th>
                        <th style="padding:8px; text-align:right;">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRowsHtml}
                </tbody>
            </table>

            <div style="display:flex; justify-content:space-between; border-top: 1px solid #000; padding-top:12px; margin-top:16px;">
                <div style="max-width: 420px; font-size:0.8rem;">
                    <p><strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                </div>
                <div style="width: 280px; font-size:0.9rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>Taxable Subtotal:</span>
                        <strong>₹${inv.totalTaxable.toFixed(2)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>CGST Tax:</span>
                        <strong>₹${(inv.totalTax / 2).toFixed(2)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>SGST Tax:</span>
                        <strong>₹${(inv.totalTax / 2).toFixed(2)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; border-top:2px solid #000; padding-top:6px; margin-top:6px; font-size:1.15rem;">
                        <strong>Grand Total:</strong>
                        <strong style="color:#0f172a;">₹${inv.grandTotal.toFixed(2)}</strong>
                    </div>
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:40px; padding-top:20px; border-top:1px dashed #bbb;">
                <div style="text-align:center; font-size:0.85rem;">Customer's Signature</div>
                <div style="text-align:center; font-size:0.85rem;">
                    <strong>For VIKRANT TRADING COMPANY</strong><br><br>
                    <span>Authorised Signatory</span>
                </div>
            </div>
        </div>

        <div class="no-print" style="margin-top:20px; text-align:center; display:flex; justify-content:center; gap:12px;">
            <button onclick="window.print()" class="btn-tally-action" style="padding:10px 24px;">🖨️ Print Invoice (Laser)</button>
            <button onclick="closeInvoiceModal()" class="btn-tally-secondary" style="padding:10px 20px;">Close Window</button>
        </div>
    `;

    modal.style.display = "flex";
}

function closeInvoiceModal() {
    document.getElementById("invoiceModal").style.display = "none";
}

function renderInventoryTable() {
    const stock = getDB("STOCK", []);
    const tbody = document.getElementById("inventoryStockTable");
    tbody.innerHTML = "";

    stock.forEach(item => {
        const val = item.qty * item.rate;
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.code}</strong></td>
                <td>${item.name}</td>
                <td><span class="gateway-shortcut">${item.group}</span></td>
                <td>${item.hsn}</td>
                <td class="text-right" style="font-weight:bold; color:${item.qty < 50 ? '#ef4444' : '#10b981'};">${item.qty} Nos</td>
                <td class="text-right">₹${item.rate.toFixed(2)}</td>
                <td class="text-right" style="font-weight:bold;">₹${val.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
        `;
    });
}

function openNewItemModal() {
    const code = prompt("Enter Item Code (e.g. MOD-014):");
    if (!code) return;
    const name = prompt("Enter Item Name:");
    if (!name) return;
    const group = prompt("Enter Group (Modular Boxes, Lighting, Wires):") || "General";
    const hsn = prompt("Enter HSN Code:") || "8538";
    const qty = parseFloat(prompt("Enter Opening Quantity:") || "0");
    const rate = parseFloat(prompt("Enter Standard Selling Rate (₹):") || "0");

    const stock = getDB("STOCK", []);
    stock.push({ code, name, group, hsn, qty, rate, gst: 18 });
    setDB("STOCK", stock);
    renderInventoryTable();
    alert("Stock Item Created in Inventory!");
}

function renderLedgersTable() {
    const ledgers = getDB("LEDGERS", []);
    const tbody = document.getElementById("ledgerAccountsTable");
    tbody.innerHTML = "";

    ledgers.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${l.name}</strong></td>
                <td><span class="gateway-shortcut">${l.group}</span></td>
                <td>${l.city || '-'}</td>
                <td>${l.gstin || 'Unregistered'}</td>
                <td class="text-right" style="font-weight:bold; color:${l.balance >= 0 ? '#10b981' : '#ef4444'}">
                    ₹${Math.abs(l.balance).toLocaleString('en-IN', {minimumFractionDigits: 2})} ${l.balance >= 0 ? 'Dr' : 'Cr'}
                </td>
            </tr>
        `;
    });
}

function openNewLedgerModal() {
    const name = prompt("Enter Ledger Name:");
    if (!name) return;
    const group = prompt("Group (Sundry Debtors / Sundry Creditors / Bank Accounts):") || "Sundry Debtors";
    const city = prompt("City / Location:") || "Bilari";
    const gstin = prompt("GSTIN (Optional):") || "";
    const balance = parseFloat(prompt("Opening Balance (₹):") || "0");

    const ledgers = getDB("LEDGERS", []);
    ledgers.push({ id: "L_" + Date.now(), name, group, city, gstin, balance });
    setDB("LEDGERS", ledgers);
    renderLedgersTable();
    alert("New Ledger Account Created!");
}

function renderDayBookTable() {
    const vouchers = getDB("VOUCHERS", []);
    const tbody = document.getElementById("daybookFullTable");
    tbody.innerHTML = "";

    vouchers.forEach((v, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${v.date}</td>
                <td><strong>${v.vchNo}</strong></td>
                <td><span class="gateway-shortcut">${v.type}</span></td>
                <td>${v.party} <br><small style="color:#64748b;">${v.narration || ''}</small></td>
                <td class="text-right">${v.debit > 0 ? '₹' + v.debit.toFixed(2) : '-'}</td>
                <td class="text-right">${v.credit > 0 ? '₹' + v.credit.toFixed(2) : '-'}</td>
                <td class="text-center">
                    <button onclick="deleteVoucher(${idx})" class="btn-tally-secondary" style="color:#ef4444; padding:2px 8px; font-size:0.75rem;">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteVoucher(index) {
    if (!confirm("Delete this voucher?")) return;
    const vouchers = getDB("VOUCHERS", []);
    vouchers.splice(index, 1);
    setDB("VOUCHERS", vouchers);
    renderDayBookTable();
    renderDashboard();
}

function preparePurchaseVoucherForm() {
    document.getElementById("purDate").valueAsDate = new Date();
    const supSelect = document.getElementById("purSupplierSelect");
    supSelect.innerHTML = "";
    getDB("LEDGERS", []).filter(l => l.group === "Sundry Creditors").forEach(l => {
        supSelect.innerHTML += `<option value="${l.name}">${l.name}</option>`;
    });

    const itemSelect = document.getElementById("purItemSelect");
    itemSelect.innerHTML = "";
    getDB("STOCK", []).forEach(s => {
        itemSelect.innerHTML += `<option value="${s.code}">${s.name}</option>`;
    });
}

document.getElementById("purchaseVoucherForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const vchNo = document.getElementById("purVchNo").value;
    const date = document.getElementById("purDate").value;
    const supplier = document.getElementById("purSupplierSelect").value;
    const itemCode = document.getElementById("purItemSelect").value;
    const qty = parseFloat(document.getElementById("purQty").value);
    const rate = parseFloat(document.getElementById("purRate").value);
    const narration = document.getElementById("purNarration").value;

    const total = qty * rate;

    const stock = getDB("STOCK", []);
    const item = stock.find(s => s.code === itemCode);
    if (item) item.qty += qty;
    setDB("STOCK", stock);

    const vouchers = getDB("VOUCHERS", []);
    vouchers.unshift({ vchNo, date, type: "Purchase", party: supplier, debit: 0, credit: total, narration });
    setDB("VOUCHERS", vouchers);

    alert("Purchase Voucher Recorded & Stock Increased! 📦");
    switchView("dashboard");
});

function preparePaymentVoucherForm() {
    document.getElementById("payDate").valueAsDate = new Date();
    const select = document.getElementById("payToParty");
    select.innerHTML = "";
    getDB("LEDGERS", []).filter(l => l.group === "Sundry Creditors").forEach(l => {
        select.innerHTML += `<option value="${l.name}">${l.name} (Cr: ₹${Math.abs(l.balance)})</option>`;
    });
}

document.getElementById("paymentVoucherForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const from = document.getElementById("payFromAccount").value;
    const date = document.getElementById("payDate").value;
    const party = document.getElementById("payToParty").value;
    const amt = parseFloat(document.getElementById("payAmount").value);
    const narration = document.getElementById("payNarration").value;

    const ledgers = getDB("LEDGERS", []);
    const creditor = ledgers.find(l => l.name === party);
    if (creditor) creditor.balance += amt;

    const source = ledgers.find(l => l.name === from || l.name.startsWith(from.split(' ')[0]));
    if (source) source.balance -= amt;
    setDB("LEDGERS", ledgers);

    const vouchers = getDB("VOUCHERS", []);
    vouchers.unshift({ vchNo: "PAY-" + Date.now().toString().slice(-4), date, type: "Payment", party, debit: 0, credit: amt, narration });
    setDB("VOUCHERS", vouchers);

    alert("Payment Voucher Saved!");
    switchView("dashboard");
});

function prepareReceiptVoucherForm() {
    document.getElementById("rcptDate").valueAsDate = new Date();
    const select = document.getElementById("rcptFromParty");
    select.innerHTML = "";
    getDB("LEDGERS", []).filter(l => l.group === "Sundry Debtors").forEach(l => {
        select.innerHTML += `<option value="${l.name}">${l.name} (Due: ₹${l.balance})</option>`;
    });
}

document.getElementById("receiptVoucherForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const toAcc = document.getElementById("rcptToAccount").value;
    const date = document.getElementById("rcptDate").value;
    const party = document.getElementById("rcptFromParty").value;
    const amt = parseFloat(document.getElementById("rcptAmount").value);
    const narration = document.getElementById("rcptNarration").value;

    const ledgers = getDB("LEDGERS", []);
    const debtor = ledgers.find(l => l.name === party);
    if (debtor) debtor.balance -= amt;

    const dest = ledgers.find(l => l.name === toAcc || l.name.startsWith(toAcc.split(' ')[0]));
    if (dest) dest.balance += amt;
    setDB("LEDGERS", ledgers);

    const vouchers = getDB("VOUCHERS", []);
    vouchers.unshift({ vchNo: "RCP-" + Date.now().toString().slice(-4), date, type: "Receipt", party, debit: amt, credit: 0, narration });
    setDB("VOUCHERS", vouchers);

    alert("Receipt Voucher Saved!");
    switchView("dashboard");
});

function renderPLStatement() {
    const vouchers = getDB("VOUCHERS", []);
    const stock = getDB("STOCK", []);

    let totalSales = 0;
    let totalPurchases = 0;
    vouchers.forEach(v => {
        if (v.type === "Sales") totalSales += (v.debit || 0);
        if (v.type === "Purchase") totalPurchases += (v.credit || 0);
    });

    let closingStockVal = 0;
    stock.forEach(s => closingStockVal += (s.qty * s.rate));

    const grossProfit = (totalSales + closingStockVal) - totalPurchases;

    document.getElementById("plSales").innerText = "₹" + totalSales.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById("plPurchases").innerText = "₹" + totalPurchases.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById("plClosingStock").innerText = "₹" + closingStockVal.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById("plTotalIncomes").innerText = "₹" + (totalSales + closingStockVal).toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById("plGrossProfit").innerText = "₹" + grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2});
}

function exportDataBackup() {
    const backup = {
        vouchers: getDB("VOUCHERS", []),
        stock: getDB("STOCK", []),
        ledgers: getDB("LEDGERS", []),
        backupDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "VTC_Tally_Backup_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
}

document.addEventListener("DOMContentLoaded", function() {
    renderDashboard();
});