class InvoiceApp {
    constructor() {
        this.isEditMode = false;
        this.itemCount = 1;
        this.gstEnabled = false;
        this.gstPercentage = 18;
        this.initializeApp();
        this.attachEventListeners();
        this.updateCalculations();
    }

    initializeApp() {
        // Set initial mode
        document.body.classList.add('view-mode');
        // Initialize form values
        this.updateViewTexts();
        this.setupPagination();
        this.initializeGST();
        
        // Add new functionality
        this.addRemarkSection();
        this.createEditableAmountTitles(); // Updated method name
        
        // Disable signature upload
        const signatureUpload = document.getElementById('signatureUpload');
        if (signatureUpload) {
            signatureUpload.style.display = 'none';
        }
    }


    initializeGST() {
        // Set initial GST state
        const gstCheckbox = document.getElementById('gstEnabled');
        const gstPercentageGroup = document.getElementById('gstPercentageGroup');
        const gstAmountRow = document.getElementById('gstAmountRow');
        
        gstCheckbox.checked = false;
        this.gstEnabled = false;
        gstPercentageGroup.style.display = 'none';
        gstAmountRow.style.display = 'none';
    }

    attachEventListeners() {
        // Mode toggle
        const toggleBtn = document.getElementById('toggleMode');
        toggleBtn.addEventListener('click', () => this.toggleMode());

        // Print button
        const printBtn = document.getElementById('printBtn');
        printBtn.addEventListener('click', () => this.printInvoice());

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', () => this.downloadPDF());

        // Add row button
        const addRowBtn = document.getElementById('addRowBtn');
        addRowBtn.addEventListener('click', () => this.addItemRow());

        // GST controls
        const gstCheckbox = document.getElementById('gstEnabled');
        gstCheckbox.addEventListener('change', (e) => this.toggleGST(e.target.checked));

        const gstPercentageInput = document.getElementById('gstPercentage');
        gstPercentageInput.addEventListener('input', () => this.updateGSTPercentage());

        // Form field listeners
        this.attachFormListeners();

        // Signature upload (disabled)
        const signatureUpload = document.getElementById('signatureUpload');
        if (signatureUpload) {
            signatureUpload.addEventListener('change', (e) => this.handleSignatureUpload(e));
        }

        // Initial row calculation listeners
        this.attachRowListeners(0);
    }

    attachFormListeners() {
        // Invoice metadata listeners
        document.getElementById('invoiceNumber').addEventListener('input', () => this.updateViewTexts());
        document.getElementById('invoiceDate').addEventListener('change', () => this.updateViewTexts());
        document.getElementById('dueDate').addEventListener('change', () => this.updateViewTexts());

        // Client details listeners
        document.getElementById('clientName').addEventListener('input', () => this.updateViewTexts());
        document.getElementById('clientAddress').addEventListener('input', () => this.updateViewTexts());
        document.getElementById('clientContact').addEventListener('input', () => this.updateViewTexts());

        // Received amount listener
        document.getElementById('receivedAmount').addEventListener('input', () => {
            this.updateCalculations();
            this.updateViewTexts();
        });

        // Add remark field listener
        setTimeout(() => {
            const remarkField = document.getElementById('remarkField');
            if (remarkField) {
            remarkField.addEventListener('input', () => this.updateViewTexts());
            }
        }, 100);
    }

    attachRowListeners(rowIndex) {
        const row = document.querySelector(`[data-row="${rowIndex}"]`);
        if (!row) return;

        const descInput = row.querySelector('.item-description');
        const rateInput = row.querySelector('.item-rate');
        const qtyInput = row.querySelector('.item-qty');

        descInput.addEventListener('input', () => this.updateRowView(rowIndex));
        rateInput.addEventListener('input', () => {
            this.updateRowCalculation(rowIndex);
            this.updateRowView(rowIndex);
            this.updateCalculations();
        });
        qtyInput.addEventListener('input', () => {
            this.updateRowCalculation(rowIndex);
            this.updateRowView(rowIndex);
            this.updateCalculations();
        });
    }

    // Add this new method to your InvoiceApp class
    // Add this method to your InvoiceApp class - Updated with italic styling
    addRemarkSection() {
    const remarkContainer = document.getElementById('remarkSection');
    if (!remarkContainer) {
        const signatureSection = document.querySelector('.signature-section');
        const remarkDiv = document.createElement('div');
        remarkDiv.id = 'remarkSection';
        remarkDiv.className = 'remark-section';
        remarkDiv.style.marginBottom = '20px';
        remarkDiv.innerHTML = `
        <div class="field-group">
            <label class="field-label">REMARK:</label>
            <input type="text" id="remarkField" class="edit-field" placeholder="Enter remark here" 
                style="width: 100%; padding: 8px; font-style: italic;">
            <span class="view-text" id="remarkView" style="font-style: italic;">-</span>
        </div>
        `;
        signatureSection.parentNode.insertBefore(remarkDiv, signatureSection);
    }
    }


    // Update the amount section titles
    // Add this method to make amount section titles editable
    createEditableAmountTitles() {
        const totalsSection = document.querySelector('.totals-section');
        if (!totalsSection || document.getElementById('subtotalTitleInput')) return;

        const defaultTitles = {
            'subtotal': 'SUBTOTAL',
            'gst': 'GST AMOUNT',
            'total': 'TOTAL', 
            'received': 'RECEIVED AMOUNT',
            'balance': 'BALANCE DUE'
        };

        // Find all totals rows and make titles editable
        const rows = totalsSection.querySelectorAll('.totals-row, .total-row, .balance-due-row, .gst-row');
        
        rows.forEach((row, index) => {
            const label = row.querySelector('label');
            if (!label) return;

            const currentText = label.textContent.replace(' :', '').trim();
            const fieldType = Object.keys(defaultTitles).find(key => 
            defaultTitles[key] === currentText || currentText.includes(defaultTitles[key])
            ) || 'custom' + index;

            // Create container for editable title
            const titleContainer = document.createElement('div');
            titleContainer.className = 'title-container';
            titleContainer.style.display = 'flex';
            titleContainer.style.alignItems = 'center';
            titleContainer.style.minWidth = '150px';

            // Create editable input for title
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.id = fieldType + 'TitleInput';
            titleInput.className = 'edit-field title-edit';
            titleInput.value = currentText;
            titleInput.style.fontWeight = '600';
            titleInput.style.fontSize = '14px';
            titleInput.style.border = 'none';
            titleInput.style.background = 'transparent';
            titleInput.style.minWidth = '120px';

            // Create display span for view mode
            const titleView = document.createElement('span');
            titleView.className = 'view-text title-view';
            titleView.textContent = currentText + ' :';
            titleView.style.fontWeight = '600';

            // Add event listener to sync input with display
            titleInput.addEventListener('input', () => {
            titleView.textContent = titleInput.value + ' :';
            label.textContent = titleInput.value + ' :';
            });

            // Replace label content with our container
            titleContainer.appendChild(titleInput);
            titleContainer.appendChild(titleView);
            
            // Replace the original label
            label.parentNode.replaceChild(titleContainer, label);
        });
        }


    // Override the signature upload handler to disable upload
    handleSignatureUpload(e) {
        // Disable signature upload functionality
        e.preventDefault();
        e.target.value = '';
        alert('Signature upload has been disabled. Use the signature placeholder only.');
        return false;
    }

    toggleGST(enabled) {
        this.gstEnabled = enabled;
        const gstPercentageGroup = document.getElementById('gstPercentageGroup');
        const gstAmountRow = document.getElementById('gstAmountRow');
        
        if (enabled) {
            gstPercentageGroup.style.display = 'flex';
            gstAmountRow.style.display = 'flex';
        } else {
            gstPercentageGroup.style.display = 'none';
            gstAmountRow.style.display = 'none';
        }
        
        this.updateCalculations();
    }

    updateGSTPercentage() {
        const gstPercentageInput = document.getElementById('gstPercentage');
        this.gstPercentage = parseFloat(gstPercentageInput.value) || 0;
        
        // Update the display percentage
        document.getElementById('gstPercentageDisplay').textContent = this.gstPercentage;
        
        this.updateCalculations();
    }

    toggleMode() {
        this.isEditMode = !this.isEditMode;
        const body = document.body;
        const toggleBtn = document.getElementById('toggleMode');

        if (this.isEditMode) {
            body.classList.remove('view-mode');
            body.classList.add('edit-mode');
            toggleBtn.textContent = 'Switch to View Mode';
            this.enableFields();
        } else {
            body.classList.remove('edit-mode');
            body.classList.add('view-mode');
            toggleBtn.textContent = 'Switch to Edit Mode';
            this.disableFields();
            this.updateViewTexts();
        }
    }

    enableFields() {
        const editFields = document.querySelectorAll('.edit-field');
        editFields.forEach(field => {
            field.removeAttribute('readonly');
            field.removeAttribute('disabled');
        });

        // Enable GST checkbox
        const gstCheckbox = document.getElementById('gstEnabled');
        gstCheckbox.removeAttribute('disabled');
    }

    disableFields() {
        const editFields = document.querySelectorAll('.edit-field');
        editFields.forEach(field => {
            field.setAttribute('readonly', true);
        });

        // Disable GST checkbox in view mode
        const gstCheckbox = document.getElementById('gstEnabled');
        gstCheckbox.setAttribute('disabled', true);
    }

    updateViewTexts() {
        // Invoice metadata
        const invoiceNumber = document.getElementById('invoiceNumber').value || 'INV002';
        document.querySelector('#invoiceNumber + .view-text').textContent = invoiceNumber;

        const invoiceDate = document.getElementById('invoiceDate').value;
        const formattedDate = invoiceDate ? this.formatDate(invoiceDate) : '22-08-2025';
        document.querySelector('#invoiceDate + .view-text').textContent = formattedDate;

        const dueDate = document.getElementById('dueDate').value;
        const formattedDueDate = dueDate ? this.formatDate(dueDate) : '-';
        document.querySelector('#dueDate + .view-text').textContent = formattedDueDate;

        // Client details
        const clientName = document.getElementById('clientName').value || '-';
        document.getElementById('clientNameView').textContent = clientName;

        const clientAddress = document.getElementById('clientAddress').value || '-';
        document.getElementById('clientAddressView').innerHTML = clientAddress.replace(/\n/g, '<br>');

        const clientContact = document.getElementById('clientContact').value || '-';
        document.getElementById('clientContactView').textContent = clientContact;

        // Received amount
        const receivedAmount = parseFloat(document.getElementById('receivedAmount').value) || 0;
        document.getElementById('receivedAmountView').textContent = this.formatCurrency(receivedAmount);

        // Add remark update
        const remarkField = document.getElementById('remarkField');
        const remarkView = document.getElementById('remarkView');
        if (remarkField && remarkView) {
            remarkView.textContent = remarkField.value || '-';
            remarkView.style.fontStyle = 'italic'; // Ensure italic style
        }

        // Update all row views
        document.querySelectorAll('.item-row').forEach((row, index) => {
            this.updateRowView(index);
        });
        }

    updateRowView(rowIndex) {
        const row = document.querySelector(`[data-row="${rowIndex}"]`);
        if (!row) return;

        const description = row.querySelector('.item-description').value || '-';
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const qty = parseInt(row.querySelector('.item-qty').value) || 1;

        row.querySelector('.item-description-view').textContent = description;
        row.querySelector('.item-rate-view').textContent = this.formatCurrency(rate);
        row.querySelector('.item-qty-view').textContent = qty.toString();
    }

    addItemRow() {
        const tbody = document.getElementById('itemsTableBody');
        const newRow = document.createElement('tr');
        newRow.className = 'item-row';
        newRow.setAttribute('data-row', this.itemCount);

        newRow.innerHTML = `
            <td>
                <input type="text" class="item-description edit-field" placeholder="Enter description" readonly>
                <span class="view-text item-description-view">-</span>
            </td>
            <td>
                <input type="number" class="item-rate edit-field" step="0.01" min="0" placeholder="0.00" readonly>
                <span class="view-text item-rate-view">₹0.00</span>
            </td>
            <td>
                <input type="number" class="item-qty edit-field" min="1" value="1" readonly>
                <span class="view-text item-qty-view">1</span>
            </td>
            <td class="item-amount">₹0.00</td>
            <td class="edit-only">
                <button class="remove-row-btn" onclick="invoiceApp.removeRow(${this.itemCount})">×</button>
            </td>
        `;

        tbody.appendChild(newRow);
        this.attachRowListeners(this.itemCount);
        
        // If in edit mode, enable the fields
        if (this.isEditMode) {
            const editFields = newRow.querySelectorAll('.edit-field');
            editFields.forEach(field => field.removeAttribute('readonly'));
        }

        this.itemCount++;
        this.checkPagination();
    }

    removeRow(rowIndex) {
        const row = document.querySelector(`[data-row="${rowIndex}"]`);
        if (row) {
            row.remove();
            this.updateCalculations();
            this.checkPagination();
        }
    }

    updateRowCalculation(rowIndex) {
        const row = document.querySelector(`[data-row="${rowIndex}"]`);
        if (!row) return;

        // Parse values carefully to ensure correct calculation
        const rateValue = row.querySelector('.item-rate').value;
        const qtyValue = row.querySelector('.item-qty').value;
        
        const rate = parseFloat(rateValue) || 0;
        const qty = parseInt(qtyValue) || 1;
        
        // Ensure both values are valid numbers before calculation
        const amount = isNaN(rate) || isNaN(qty) ? 0 : rate * qty;

        // Update the amount display
        row.querySelector('.item-amount').textContent = this.formatCurrency(amount);
        
        // Debug logging for troubleshooting
        console.log(`Row ${rowIndex}: Rate=${rate}, Qty=${qty}, Amount=${amount}`);
    }

    // updateCalculations() {
    //     let subtotal = 0;
        
    //     document.querySelectorAll('.item-row').forEach((row, index) => {
    //         const rateValue = row.querySelector('.item-rate').value;
    //         const qtyValue = row.querySelector('.item-qty').value;
            
    //         const rate = parseFloat(rateValue) || 0;
    //         const qty = parseInt(qtyValue) || 1;
            
    //         // Ensure both values are valid numbers before calculation
    //         const amount = isNaN(rate) || isNaN(qty) ? 0 : rate * qty;
            
    //         // Update the row amount display
    //         row.querySelector('.item-amount').textContent = this.formatCurrency(amount);
            
    //         // Add to subtotal
    //         subtotal += amount;
            
    //         // Debug logging
    //         console.log(`Calculation - Row ${index}: Rate=${rate}, Qty=${qty}, Amount=${amount}, Subtotal so far=${subtotal}`);
    //     });

    //     // Update subtotal display
    //     document.getElementById('subtotalAmount').textContent = this.formatCurrency(subtotal);

    //     // Calculate GST if enabled
    //     let gstAmount = 0;
    //     let total = subtotal;

    //     if (this.gstEnabled) {
    //         gstAmount = (subtotal * this.gstPercentage) / 100;
    //         total = subtotal + gstAmount;
            
    //         // Update GST displays
    //         document.getElementById('gstAmount').textContent = this.formatCurrency(gstAmount);
    //         document.getElementById('gstPercentageDisplay').textContent = this.gstPercentage;
    //     }

    //     const receivedAmount = parseFloat(document.getElementById('receivedAmount').value) || 0;
    //     const balanceDue = total - receivedAmount;

    //     // Update displays
    //     document.getElementById('totalAmount').textContent = this.formatCurrency(total);
    //     document.getElementById('finalBalanceDue').textContent = this.formatCurrency(balanceDue);
    //     document.getElementById('balanceDueDisplay').textContent = this.formatCurrency(balanceDue);
        
    //     console.log(`Final totals: Subtotal=${subtotal}, GST=${gstAmount}, Total=${total}, Received=${receivedAmount}, Balance=${balanceDue}`);
    // }

    updateCalculations() {
        let subtotal = 0;
        
        document.querySelectorAll('.item-row').forEach((row, index) => {
            const rateValue = row.querySelector('.item-rate').value;
            const qtyValue = row.querySelector('.item-qty').value;
            
            const rate = parseFloat(rateValue) || 0;
            const qty = parseInt(qtyValue) || 1;
            
            const amount = isNaN(rate) || isNaN(qty) ? 0 : rate * qty;
            
            row.querySelector('.item-amount').textContent = this.formatCurrency(amount);
            subtotal += amount;
        });
    
        // Update subtotal
        document.getElementById('subtotalAmount').textContent = this.formatCurrency(subtotal);
    
        // GST & Total calculation
        let gstAmount = 0;
        let total = subtotal;
    
        if (this.gstEnabled) {
            gstAmount = (subtotal * this.gstPercentage) / 100;
            total = subtotal + gstAmount;
    
            document.getElementById('gstAmount').textContent = this.formatCurrency(gstAmount);
            document.getElementById('gstAmountRow').style.display = ''; // ensure row visible
        } else {
            document.getElementById('gstAmount').textContent = this.formatCurrency(0);
            document.getElementById('gstAmountRow').style.display = 'none';
        }
    
        // ✅ Always update total
        document.getElementById('totalAmount').textContent = this.formatCurrency(total);
        
        // Received Amount
        const receivedValue = parseFloat(document.getElementById('receivedAmountInput')?.value) || 0;
        document.getElementById('receivedAmount').textContent = this.formatCurrency(receivedValue);
        
        // Balance = Total - Received
        const balanceDue = total - receivedValue;
        document.getElementById('balanceDue').textContent = this.formatCurrency(balanceDue);

    }


    formatCurrency(amount) {
        // Ensure amount is a valid number
        const numAmount = parseFloat(amount) || 0;
        return `₹${numAmount.toFixed(2)}`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    printInvoice() {
        // Save current mode
        const wasEditMode = this.isEditMode;
        
        // Switch to view mode for printing
        if (this.isEditMode) {
            this.toggleMode();
        }

        // Small delay to ensure mode switch is complete
        setTimeout(() => {
            window.print();
            
            // Restore previous mode
            if (wasEditMode) {
                setTimeout(() => {
                    this.toggleMode();
                }, 100);
            }
        }, 100);
    }

    async downloadPDF() {
        // Switch to view mode for clean export
        const wasEditMode = this.isEditMode;
        if (this.isEditMode) {
            this.toggleMode();
        }

        try {
            const { jsPDF } = window.jspdf;
            const html2canvas = window.html2canvas;

            if (!jsPDF || !html2canvas) {
                alert('PDF libraries not loaded. Please refresh the page and try again.');
                return;
            }

            const invoiceElement = document.querySelector('.invoice-container');
            // Use higher dpi for good quality
            const canvas = await html2canvas(invoiceElement, { scale: 2, useCORS: true, backgroundColor: '#fff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            // A4 size in pixels at html2canvas default 96dpi: (approx)
            const pdfWidth = 210;
            const pdfHeight = 297;
            const imgWidth = pdfWidth;
            const pageHeightPx = Math.floor(pdf.internal.pageSize.getHeight() * (canvas.width / pdf.internal.pageSize.getWidth()));
            let position = 0;
            let pageCount = 0;

            // Split and add each page
            while (position < canvas.height) {
                // Create canvas slice for the current page
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = Math.min(pageHeightPx, canvas.height - position);
                const ctx = pageCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, position, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);

                const pageImgData = pageCanvas.toDataURL('image/png');
                if (pageCount > 0) pdf.addPage();
                pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, imgWidth * (pageCanvas.height / canvas.width));
                position += pageHeightPx;
                pageCount += 1;
            }

            // File name setup
            const invoiceNumber = document.getElementById('invoiceNumber')?.value || 'INV002';
            const today = new Date().toISOString().split('T')[0];
            const filename = `Invoice_${invoiceNumber}_${today}.pdf`;

            pdf.save(filename);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            if (wasEditMode) this.toggleMode();
        }
    }

    setupPagination() {
        this.checkPagination();
        
        // Listen for window resize to recalculate pagination
        window.addEventListener('resize', () => {
            this.checkPagination();
        });
    }

    checkPagination() {
        const itemsTable = document.querySelector('.items-table tbody');
        const rows = itemsTable.querySelectorAll('tr');
        const itemsPerPage = this.calculateItemsPerPage();
        
        console.log(`Total rows: ${rows.length}, Items per page: ${itemsPerPage}`);
        
        if (rows.length > itemsPerPage) {
            this.createMultiplePages(rows, itemsPerPage);
        } else {
            this.ensureSinglePage();
        }
    }

    calculateItemsPerPage() {
        // Estimate items per page based on page height and row height
        // This is a simplified calculation - in a real app, you'd measure actual heights
        return 20; // Conservative estimate for A4 page
    }

    createMultiplePages(rows, itemsPerPage) {
        const container = document.getElementById('invoiceContainer');
        const currentPage = document.getElementById('page1');
        
        // Remove any existing additional pages
        const existingPages = container.querySelectorAll('.page:not(#page1)');
        existingPages.forEach(page => page.remove());
        
        // Hide totals section on first page since we have multiple pages
        const firstPageTotals = currentPage.querySelector('.totals-section');
        const firstPageSignature = currentPage.querySelector('.signature-section');
        const firstPageRemark = currentPage.querySelector('#remarkSection');
        
        if (firstPageTotals) firstPageTotals.style.display = 'none';
        if (firstPageSignature) firstPageSignature.style.display = 'none';
        if (firstPageRemark) firstPageRemark.style.display = 'none';
        
        // Clear the original table body and add first page items
        const originalTableBody = currentPage.querySelector('.items-table tbody');
        originalTableBody.innerHTML = '';
        
        // Add first batch of rows to original page
        for (let i = 0; i < Math.min(itemsPerPage, rows.length); i++) {
            const rowClone = rows[i].cloneNode(true);
            originalTableBody.appendChild(rowClone);
        }
        
        // Create additional pages for remaining rows
        let currentRowIndex = itemsPerPage;
        let pageNumber = 2;
        
        while (currentRowIndex < rows.length) {
            const remainingRows = rows.length - currentRowIndex;
            const rowsForThisPage = Math.min(itemsPerPage, remainingRows);
            const isLastPage = (currentRowIndex + rowsForThisPage) >= rows.length;
            
            console.log(`Page ${pageNumber}: rows ${currentRowIndex} to ${currentRowIndex + rowsForThisPage - 1}, isLastPage: ${isLastPage}`);
            
            const newPage = this.createContinuationPage(pageNumber, isLastPage);
            const newTableBody = newPage.querySelector('.items-table tbody');
            
            // Add rows to this page
            for (let i = 0; i < rowsForThisPage; i++) {
                if (rows[currentRowIndex + i]) {
                    const rowClone = rows[currentRowIndex + i].cloneNode(true);
                    newTableBody.appendChild(rowClone);
                }
            }
            
            container.appendChild(newPage);
            currentRowIndex += rowsForThisPage;
            pageNumber++;
        }
    }


    createContinuationPage(pageNumber, isLastPage) {
        const newPage = document.createElement('div');
        newPage.className = 'page page-break continued-page';
        newPage.id = `page${pageNumber}`;
        
        // Get current invoice number for header
        const invoiceNumber = document.getElementById('invoiceNumber').value || 'INV002';
        
        let pageHTML = `
            <div class="page-header">
                <div class="company-name">BOEHM TECH LLP</div>
                <div>Invoice ${invoiceNumber} - Continued</div>
            </div>
            
            <div class="items-section">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>DESCRIPTION</th>
                            <th>RATE</th>
                            <th>QTY</th>
                            <th>AMOUNT</th>
                            <th class="edit-only">ACTION</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        // Only add totals, remark, and signature sections to the last page
        if (isLastPage) {
            pageHTML += this.getTotalsHTML();
        }
        
        newPage.innerHTML = pageHTML;
        return newPage;
    }


    getTotalPages() {
        const rows = document.querySelectorAll('.items-table tbody tr');
        const itemsPerPage = this.calculateItemsPerPage();
        return Math.ceil(rows.length / itemsPerPage);
    }

    getTotalsHTML() {
        const gstRowHTML = this.gstEnabled ? `
            <div class="totals-row gst-row">
                <label>GST AMOUNT (${this.gstPercentage}%):</label>
                <span>${document.getElementById('gstAmount').textContent}</span>
            </div>
        ` : '';

        const remarkValue = document.getElementById('remarkField')?.value || '';
        const remarkHTML = remarkValue ? `
            <div class="remark-section" style="margin-bottom: 20px;">
                <div class="field-group">
                    <label class="field-label">REMARK:</label>
                    <span class="view-text">${remarkValue}</span>
                </div>
            </div>
        ` : '';

        return `
            <div class="totals-section">
                <div class="totals-row">
                    <label>SUBTOTAL:</label>
                    <span>${document.getElementById('subtotalAmount').textContent}</span>
                </div>
                ${gstRowHTML}
                <div class="totals-row total-row">
                    <label>TOTAL:</label>
                    <span>${document.getElementById('totalAmount').textContent}</span>
                </div>
                <div class="totals-row">
                    <label>RECEIVED AMOUNT:</label>
                    <span>${document.getElementById('receivedAmountView').textContent}</span>
                </div>
                <div class="totals-row balance-due-row">
                    <label>BALANCE DUE:</label>
                    <span>${document.getElementById('finalBalanceDue').textContent}</span>
                </div>
            </div>
            
            ${remarkHTML}
            
            <div class="signature-section">
                <div class="signature-display">
                    <div class="signature-label">SIGNATURE</div>
                    <div class="signature-area">
                        <div class="signature-placeholder">_________________</div>
                    </div>
                </div>
            </div>
        `;
    }


    ensureSinglePage() {
        const container = document.getElementById('invoiceContainer');
        const additionalPages = container.querySelectorAll('.page:not(#page1)');
        additionalPages.forEach(page => page.remove());
        
        // Show totals section on first page when there's only one page
        const currentPage = document.getElementById('page1');
        const firstPageTotals = currentPage.querySelector('.totals-section');
        const firstPageSignature = currentPage.querySelector('.signature-section');
        const firstPageRemark = currentPage.querySelector('#remarkSection');
        
        if (firstPageTotals) firstPageTotals.style.display = 'block';
        if (firstPageSignature) firstPageSignature.style.display = 'block';
        if (firstPageRemark) firstPageRemark.style.display = 'block';
        
        console.log('Ensured single page - totals should be visible');
    }

    // Data persistence methods
    saveData() {
        const data = {
            invoiceNumber: document.getElementById('invoiceNumber').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            clientName: document.getElementById('clientName').value,
            clientAddress: document.getElementById('clientAddress').value,
            clientContact: document.getElementById('clientContact').value,
            receivedAmount: document.getElementById('receivedAmount').value,
            remarkField: document.getElementById('remarkField')?.value || '',
            gstEnabled: this.gstEnabled,
            gstPercentage: this.gstPercentage,
            items: []
        };

        document.querySelectorAll('.item-row').forEach(row => {
            data.items.push({
                description: row.querySelector('.item-description').value,
                rate: row.querySelector('.item-rate').value,
                qty: row.querySelector('.item-qty').value
            });
        });

        return data;
    }

    loadData(data) {
        if (!data) return;

        // Load basic fields
        if (data.invoiceNumber) document.getElementById('invoiceNumber').value = data.invoiceNumber;
        if (data.invoiceDate) document.getElementById('invoiceDate').value = data.invoiceDate;
        if (data.dueDate) document.getElementById('dueDate').value = data.dueDate;
        if (data.clientName) document.getElementById('clientName').value = data.clientName;
        if (data.clientAddress) document.getElementById('clientAddress').value = data.clientAddress;
        if (data.clientContact) document.getElementById('clientContact').value = data.clientContact;
        if (data.receivedAmount) document.getElementById('receivedAmount').value = data.receivedAmount;
        if (data.remarkField) document.getElementById('remarkField').value = data.remarkField;

        // Load GST settings
        if (data.gstEnabled !== undefined) {
            document.getElementById('gstEnabled').checked = data.gstEnabled;
            this.toggleGST(data.gstEnabled);
        }
        if (data.gstPercentage !== undefined) {
            document.getElementById('gstPercentage').value = data.gstPercentage;
            this.updateGSTPercentage();
        }

        // Load items
        if (data.items && data.items.length > 0) {
            // Clear existing rows
            const tbody = document.getElementById('itemsTableBody');
            tbody.innerHTML = '';
            this.itemCount = 0;

            // Add rows from data
            data.items.forEach((item, index) => {
                if (index === 0) {
                    // Use existing first row
                    const row = this.createFirstRow();
                    tbody.appendChild(row);
                } else {
                    this.addItemRow();
                }

                const currentRow = tbody.children[index];
                currentRow.querySelector('.item-description').value = item.description || '';
                currentRow.querySelector('.item-rate').value = item.rate || '';
                currentRow.querySelector('.item-qty').value = item.qty || '1';
                
                this.updateRowCalculation(index);
            });
        }

        this.updateViewTexts();
        this.updateCalculations();
    }

    createFirstRow() {
        const row = document.createElement('tr');
        row.className = 'item-row';
        row.setAttribute('data-row', '0');
        row.innerHTML = `
            <td>
                <input type="text" class="item-description edit-field" placeholder="Enter description" readonly>
                <span class="view-text item-description-view">-</span>
            </td>
            <td>
                <input type="number" class="item-rate edit-field" step="0.01" min="0" placeholder="0.00" readonly>
                <span class="view-text item-rate-view">₹0.00</span>
            </td>
            <td>
                <input type="number" class="item-qty edit-field" min="1" value="1" readonly>
                <span class="view-text item-qty-view">1</span>
            </td>
            <td class="item-amount">₹0.00</td>
            <td class="edit-only">
                <button class="remove-row-btn" onclick="invoiceApp.removeRow(0)">×</button>
            </td>
        `;
        
        this.attachRowListeners(0);
        this.itemCount = 1;
        return row;
    }
}

// Initialize the application
let invoiceApp;

document.addEventListener('DOMContentLoaded', () => {
    invoiceApp = new InvoiceApp();
    
    // Make removeRow globally accessible for inline onclick handlers
    window.removeRow = (index) => invoiceApp.removeRow(index);
});

// Add beforeunload event to warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (invoiceApp && invoiceApp.isEditMode) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!invoiceApp) return;
    
    // Ctrl+P for print
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        invoiceApp.printInvoice();
    }
    
    // Ctrl+E for edit mode toggle
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        invoiceApp.toggleMode();
    }
    
    // Ctrl+Enter to add new row (in edit mode)
    if (e.ctrlKey && e.key === 'Enter' && invoiceApp.isEditMode) {
        e.preventDefault();
        invoiceApp.addItemRow();
    }
});

// Export functionality for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvoiceApp;
}
