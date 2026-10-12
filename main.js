/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 */

// ========================================================
// DATA TRANSACTIONS
// ========================================================
let transactions = [];
let editingTransactionId = null;

const STORAGE_KEY = 'expenseTrackerTransactions';

const createId = () => +new Date();

const saveTransactions = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
};

const loadTransactions = () => {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    transactions = [];
    return;
  }

  try {
    const parsedData = JSON.parse(savedData);
    transactions = Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error('Gagal membaca data transaksi:', error);
    transactions = [];
  }
};

const notifyTransactionUpdated = () => {
  document.dispatchEvent(new Event('transaction:updated'));
};

// ========================================================
// Kriteria 1: Manipulasi DOM
// ========================================================
const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');

const transactionForm = document.getElementById('transactionForm');
const titleInput = document.getElementById('transactionFormTitleInput');
const amountInput = document.getElementById('transactionFormAmountInput');
const dateInput = document.getElementById('transactionFormDateInput');
const typeSelect = document.getElementById('transactionFormTypeSelect');
const submitButton = document.querySelector('[data-testid="transactionFormSubmitButton"]');
const formHeading = document.getElementById('form-heading');

const searchForm = document.getElementById('searchTransactionForm');
const searchInput = document.getElementById('searchTransactionFormTitleInput');

const balanceElement = document.querySelector('.tracker-summary__balance-amount');
const incomeElement = document.querySelector('.tracker-summary__stat-amount--income');
const expenseElement = document.querySelector('.tracker-summary__stat-amount--expense');

const formatRupiah = (amount) => {
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
};

const formatDate = (date) => {
  if (!date) return '-';

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const createTransactionCard = (transaction) => {
  const card = document.createElement('div');
  card.setAttribute('data-testid', 'transactionItem');
  card.className = 'tracker-transaction-item';

  const icon = document.createElement('div');
  icon.className = `tracker-transaction-item__icon tracker-transaction-item__icon--${transaction.type}`;
  icon.textContent = transaction.type === 'income' ? '↗' : '↘';
  icon.setAttribute('aria-hidden', 'true');

  const detail = document.createElement('div');
  detail.className = 'tracker-transaction-item__detail';

  const title = document.createElement('h3');
  title.setAttribute('data-testid', 'transactionItemTitle');
  title.className = 'tracker-transaction-item__title';
  title.textContent = transaction.title;

  const date = document.createElement('p');
  date.setAttribute('data-testid', 'transactionItemDate');
  date.className = 'tracker-transaction-item__date';
  date.textContent = `Tanggal: ${formatDate(transaction.date)}`;

  detail.append(title, date);

  const right = document.createElement('div');
  right.className = 'tracker-transaction-item__right';

  const amount = document.createElement('p');
  amount.setAttribute('data-testid', 'transactionItemAmount');
  amount.className = `tracker-transaction-item__amount tracker-transaction-item__amount--${transaction.type}`;
  amount.textContent = `${transaction.type === 'income' ? '+' : '-'} ${formatRupiah(transaction.amount)}`;

  const type = document.createElement('p');
  type.setAttribute('data-testid', 'transactionItemType');
  type.className = 'tracker-transaction-item__date';
  type.textContent = `Tipe: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

  const actions = document.createElement('div');
  actions.className = 'tracker-transaction-item__actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.setAttribute('data-testid', 'transactionItemEditButton');
  editButton.className = 'tracker-transaction-item__btn';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => startEditTransaction(transaction.id));

  const changeTypeButton = document.createElement('button');
  changeTypeButton.type = 'button';
  changeTypeButton.setAttribute('data-testid', 'transactionItemEditTypeButton');
  changeTypeButton.className = 'tracker-transaction-item__btn';
  changeTypeButton.textContent = 'Ubah Tipe';
  changeTypeButton.addEventListener('click', () => toggleTransactionType(transaction.id));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.setAttribute('data-testid', 'transactionItemDeleteButton');
  deleteButton.className = 'tracker-transaction-item__btn';
  deleteButton.textContent = 'Hapus';
  deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));

  actions.append(editButton, changeTypeButton, deleteButton);
  right.append(amount, type, actions);
  card.append(icon, detail, right);

  return card;
};

const renderTransactions = (data = transactions) => {
  incomeList.replaceChildren();
  expenseList.replaceChildren();

  data.forEach((transaction) => {
    const card = createTransactionCard(transaction);

    if (transaction.type === 'income') {
      incomeList.appendChild(card);
    } else {
      expenseList.appendChild(card);
    }
  });
};

// ========================================================
// Kriteria 1 — Validasi & Dashboard
// ========================================================
const updateDashboard = () => {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpense;

  incomeElement.textContent = formatRupiah(totalIncome);
  expenseElement.textContent = formatRupiah(totalExpense);
  balanceElement.textContent = formatRupiah(balance);
};

const resetForm = () => {
  transactionForm.reset();
  editingTransactionId = null;
  formHeading.textContent = 'Tambah Pencatatan Baru';
  submitButton.textContent = 'Simpan';
};

const startEditTransaction = (id) => {
  const transaction = transactions.find((item) => String(item.id) === String(id));

  if (!transaction) return;

  editingTransactionId = transaction.id;
  titleInput.value = transaction.title;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  typeSelect.value = transaction.type;

  formHeading.textContent = 'Edit Pencatatan';
  submitButton.textContent = 'Simpan Perubahan';
  titleInput.focus();
};

transactionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value || new Date().toISOString().split('T')[0];
  const type = typeSelect.value;

  if (!title) {
    alert('Judul transaksi tidak boleh kosong.');
    titleInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount < 1) {
    alert('Nominal transaksi harus lebih dari atau sama dengan Rp1.');
    amountInput.focus();
    return;
  }

  if (editingTransactionId !== null) {
    const transactionIndex = transactions.findIndex(
      (item) => String(item.id) === String(editingTransactionId),
    );

    if (transactionIndex !== -1) {
      transactions[transactionIndex] = {
        ...transactions[transactionIndex],
        title,
        amount,
        date,
        type,
      };
    }
  } else {
    transactions.push({
      id: createId(),
      title,
      amount,
      date,
      type,
    });
  }

  saveTransactions();
  resetForm();
  notifyTransactionUpdated();
});

// ========================================================
// Kriteria 2 — Hapus, Edit, Custom Event
// ========================================================
const deleteTransaction = (id) => {
  transactions = transactions.filter(
    (transaction) => String(transaction.id) !== String(id),
  );

  if (String(editingTransactionId) === String(id)) {
    resetForm();
  }

  saveTransactions();
  notifyTransactionUpdated();
};

const toggleTransactionType = (id) => {
  const transaction = transactions.find(
    (item) => String(item.id) === String(id),
  );

  if (!transaction) return;

  transaction.type = transaction.type === 'income' ? 'expense' : 'income';

  saveTransactions();
  notifyTransactionUpdated();
};

const updateView = () => {
  const keyword = searchInput.value.trim().toLowerCase();

  const filteredTransactions = keyword
    ? transactions.filter((transaction) =>
        transaction.title.toLowerCase().includes(keyword),
      )
    : transactions;

  renderTransactions(filteredTransactions);
  updateDashboard();
};

document.addEventListener('transaction:updated', updateView);

// ========================================================
// Kriteria 3 — Pencarian
// ========================================================
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  updateView();
});

searchInput.addEventListener('input', updateView);

// ========================================================
// INISIALISASI
// ========================================================
loadTransactions();
updateView();

// Isi tanggal hari ini saat form pertama kali dibuka.
if (!dateInput.value) {
  dateInput.value = new Date().toISOString().split('T')[0];
}
