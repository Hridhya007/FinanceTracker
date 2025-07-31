const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

// Store transactions in localStorage
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}
// Highlight current page in navigation
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage || 
        (currentPage === 'home.html' && link.getAttribute('href') === '#hero')) {
      link.classList.add('active-nav-link');
    }
  });
});

// Add new transaction
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("transaction-form");
  const list = document.getElementById("transaction-list");

  const amountInput = document.getElementById("amount");
  const categoryInput = document.getElementById("category");
  const dateInput = document.getElementById("date");

  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      
      // Validate inputs
      const errorMessage = document.getElementById("error-message");
      errorMessage.textContent = "";
      
      if (!amountInput.value || !categoryInput.value || 
          !dateInput.value || !document.getElementById("type").value) {
        errorMessage.textContent = "All fields are required.";
        errorMessage.classList.add("alignment");
        return;
      }
      
      // Create transaction object
      const transaction = {
        amount: parseFloat(amountInput.value),
        type: document.getElementById("type").value,
        category: categoryInput.value,
        date: dateInput.value,
        note: document.getElementById("note").value || ""
      };
      
      // Add to transactions array
      transactions.push(transaction);
      saveTransactions();
      
      // Reset form and update UI
      this.reset();
      renderTransactions();
      
      // Update charts if the function exists
      if (typeof window.updateFinanceCharts === 'function') {
        window.updateFinanceCharts();
      }
    });

    renderTransactions();
  }

  // Render transactions
  function renderTransactions() {
    if (!list) return;
    list.innerHTML = "";

  transactions.forEach((t, index) => {
    const item = document.createElement("li");
    item.classList.add("transaction-item");

    // Create content container
    const content = document.createElement("span");
  content.classList.add("transaction-content");
  content.innerHTML = `
    ${new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(t.amount)} - ${t.category} - ${t.date}
    <br>
    <span class="note">${t.note || ""}</span>`;


    // Edit button
    const editBtn = document.createElement("button");
    editBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
    `;
    editBtn.title = "Edit";
    editBtn.classList.add("edit-btn");
    editBtn.onclick = () => {
      amountInput.value = t.amount;
      document.getElementById("type").value = t.type;
      categoryInput.value = t.category;
      dateInput.value = t.date;
      document.getElementById("note").value = t.note;
      transactions.splice(index, 1);
      saveTransactions();
      renderTransactions();
    };

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6m5 0V4h4v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
    `;
    deleteBtn.title = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = () => {
      transactions.splice(index, 1);
      saveTransactions();
      renderTransactions();
    };

    // Create a button container
    const btnGroup = document.createElement("div");
    btnGroup.classList.add("button-group");
    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteBtn);

    // ✅ Append content first, then buttons (to show on right)
    item.appendChild(content);
    item.appendChild(btnGroup);
    list.appendChild(item);
  });
}


  // For summary page
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");

if (incomeEl && expenseEl && balanceEl) {
  let income = 0, expense = 0;
  transactions.forEach(t => {
    if (t.type === "Income") income += t.amount;
    else expense += t.amount;
  });
  
  const balance = income - expense;
  
  // Format and display values
  incomeEl.textContent = income.toLocaleString("en-IN", { 
    style: "currency", 
    currency: "INR" 
  });
  incomeEl.className = "income-value";
  expenseEl.textContent = expense.toLocaleString("en-IN", { 
    style: "currency", 
    currency: "INR" 
  }); 
  
  balanceEl.textContent = balance.toLocaleString("en-IN", { 
    style: "currency", 
    currency: "INR" 
  });
  expenseEl.className = "expense-value";
  // Add color class based on balance
  if (balance >= 0) {
    balanceEl.classList.add("positive-balance");
    balanceEl.classList.remove("negative-balance");
  } else {
    balanceEl.classList.add("negative-balance");
    balanceEl.classList.remove("positive-balance");
  }
}
  // Chart Initialization and Data Processing
document.addEventListener("DOMContentLoaded", () => {
  // Initialize charts only if their canvases exist
  const pieCtx = document.getElementById('pieChart')?.getContext('2d');
  const barCtx = document.getElementById('barChart')?.getContext('2d');
  
  let pieChart, barChart;

  // Function to process transaction data for charts
  function processChartData() {
    const spendingData = {};
    const monthlyData = {};
    
    transactions.forEach(tx => {
      if (tx.type === "Expense") {
        // Process for pie chart (by category)
        spendingData[tx.category] = (spendingData[tx.category] || 0) + Number(tx.amount);
        
        // Process for bar chart (by month)
        const month = new Date(tx.date).toLocaleString("default", { month: "short" });
        monthlyData[month] = (monthlyData[month] || 0) + Number(tx.amount);
      }
    });

    return {
      pieLabels: Object.keys(spendingData),
      pieValues: Object.values(spendingData),
      barLabels: Object.keys(monthlyData),
      barValues: Object.values(monthlyData)
    };
  }

  // Function to initialize or update charts
  function updateCharts() {
    const { pieLabels, pieValues, barLabels, barValues } = processChartData();
    
    // Pie Chart
    if (pieCtx) {
      if (pieChart) {
        // Update existing chart
        pieChart.data.labels = pieLabels;
        pieChart.data.datasets[0].data = pieValues;
        pieChart.update();
      } else {
        // Create new chart
        pieChart = new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: pieLabels,
            datasets: [{
              data: pieValues,
              backgroundColor: ['#31d6a3', '#0c2d28', '#65e8c7', '#7bdcb5', '#9ef3de'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  font: {
                    size: 14
                  },
                  padding: 20
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ₹${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Bar Chart
    if (barCtx) {
      if (barChart) {
        // Update existing chart
        barChart.data.labels = barLabels;
        barChart.data.datasets[0].data = barValues;
        barChart.update();
      } else {
        // Create new chart
        barChart = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: barLabels,
            datasets: [{
              label: 'Expenses (₹)',
              data: barValues,
              backgroundColor: '#31d6a3',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '₹' + value;
                  },
                  font: {
                    size: 12
                  }
                }
              },
              x: {
                ticks: {
                  font: {
                    size: 12
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return '₹' + context.raw;
                  }
                }
              }
            }
          }
        });
      }
    }
  }

  // Initial chart creation
  updateCharts();

  // Update charts when transactions change (add this to your transaction submission handler)
  window.updateFinanceCharts = updateCharts;
});

// Add this to your transaction form submission handler after saving transactions:
// window.updateFinanceCharts();
});
