// data.js - RBC Royal Bank Data
// All amounts in CAD

// Initialize or load from localStorage
function loadData() {
  // Try to load from localStorage first
  const savedAccounts = localStorage.getItem('rbc_accounts');
  const savedTransactions = localStorage.getItem('rbc_transactions');
  const savedNotifications = localStorage.getItem('rbc_notifications');
  
  // Account data
  window.accounts = savedAccounts ? JSON.parse(savedAccounts) : {
    checking: { 
      name: 'Primary Checking', 
      balance: 500000.00, 
      number: '•••• 4582', 
      icon: '💳' 
    },
    savings: { 
      name: 'High-Yield Savings', 
      balance: 0.00, 
      number: '•••• 7890', 
      icon: '🏦' 
    },
    investment: { 
      name: 'Investment Portfolio', 
      balance: 0.00, 
      number: '•••• 1234', 
      icon: '📈' 
    }
  };

  // Transaction data
  window.transactions = savedTransactions ? JSON.parse(savedTransactions) : [
    { 
      id: 1, 
      name: 'CSBG Assistant Program Deposit', 
      date: 'Today', 
      amount: 500000.00, 
      type: 'positive', 
      icon: 'fas fa-arrow-down', 
      iconBg: '#e6f7e6',
      timestamp: Date.now() - 86400000 // 1 day ago
    }
  ];

  // Notification data
  window.notifications = savedNotifications ? JSON.parse(savedNotifications) : [
    {
      id: 1,
      title: 'Large deposit detected',
      subtitle: '$500,000.00 deposited to Primary Checking',
      time: '1 day ago',
      icon: 'fas fa-dollar-sign',
      read: false,
      timestamp: Date.now() - 86400000
    },
    {
      id: 2,
      title: 'CSBG Assistant Program',
      subtitle: 'Funds have been successfully deposited',
      time: '1 day ago',
      icon: 'fas fa-hand-holding-heart',
      read: false,
      timestamp: Date.now() - 86400000
    },
    {
      id: 3,
      title: 'Account alert',
      subtitle: 'Your balance has increased significantly',
      time: '1 day ago',
      icon: 'fas fa-chart-line',
      read: false,
      timestamp: Date.now() - 86400000
    }
  ];
  
  // Process existing data to add timestamps if they don't exist
  processExistingData();
}

// Add timestamps to existing data
function processExistingData() {
  let needsSave = false;
  
  // Process transactions
  if (window.transactions) {
    window.transactions.forEach((t, index) => {
      if (!t.timestamp) {
        // Assign timestamps based on index (older items get older timestamps)
        t.timestamp = Date.now() - (index * 3600000); // Subtract hours based on index
        t.date = getRelativeTimeString(t.timestamp);
        needsSave = true;
      }
    });
  }
  
  // Process notifications
  if (window.notifications) {
    window.notifications.forEach((n, index) => {
      if (!n.timestamp) {
        n.timestamp = Date.now() - (index * 3600000);
        n.time = getRelativeTimeString(n.timestamp);
        needsSave = true;
      }
    });
  }
  
  if (needsSave) {
    saveData();
  }
}

// Helper function to get relative time string
function getRelativeTimeString(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('rbc_accounts', JSON.stringify(window.accounts));
  localStorage.setItem('rbc_transactions', JSON.stringify(window.transactions));
  localStorage.setItem('rbc_notifications', JSON.stringify(window.notifications));
}

// Function to add a new transaction
window.addTransaction = function(transaction) {
  const timestamp = Date.now();
  
  // Create transaction with timestamp
  const newTransaction = {
    id: window.transactions.length > 0 ? Math.max(...window.transactions.map(t => t.id)) + 1 : 1,
    date: getRelativeTimeString(timestamp),
    timestamp: timestamp,
    ...transaction
  };
  
  // Add to beginning of array
  window.transactions.unshift(newTransaction);
  
  // Add notification for the transaction
  window.addNotification({
    title: transaction.type === 'positive' ? 'Deposit Received' : 'Transfer Sent',
    subtitle: `${transaction.type === 'positive' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)} - ${transaction.name}`,
    icon: transaction.type === 'positive' ? 'fas fa-arrow-down' : 'fas fa-arrow-right',
    read: false
  });
  
  saveData();
  
  // Refresh UI if functions exist - CHECK IF DOM IS READY
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof window.renderRecentTransactions === 'function') {
      window.renderRecentTransactions();
    }
    if (typeof window.updateNotificationBadge === 'function') {
      window.updateNotificationBadge();
    }
  }
};

// Function to add a notification
window.addNotification = function(notification) {
  const timestamp = Date.now();
  
  const newNotification = {
    id: window.notifications.length > 0 ? Math.max(...window.notifications.map(n => n.id)) + 1 : 1,
    time: getRelativeTimeString(timestamp),
    timestamp: timestamp,
    ...notification
  };
  
  window.notifications.unshift(newNotification);
  saveData();
  
  // Only update badge if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof window.updateNotificationBadge === 'function') {
      window.updateNotificationBadge();
    }
    if (typeof window.renderNotifications === 'function') {
      window.renderNotifications();
    }
  }
};

// Function to update account balance
window.updateAccountBalance = function(accountKey, newBalance) {
  if (window.accounts[accountKey]) {
    window.accounts[accountKey].balance = newBalance;
    saveData();
  }
};

// Function to transfer money
window.transferMoney = function(fromAccount, toAccount, amount, description, isExternal = false, externalDetails = null) {
  const from = window.accounts[fromAccount];
  
  if (!from || from.balance < amount) {
    return { success: false, error: 'Insufficient funds' };
  }
  
  // Deduct from source
  from.balance -= amount;
  
  let toName = '';
  
  if (!isExternal && window.accounts[toAccount]) {
    // Internal transfer - add to destination
    window.accounts[toAccount].balance += amount;
    toName = window.accounts[toAccount].name;
  } else {
    // External transfer
    toName = externalDetails ? externalDetails.name : 'External Account';
  }
  
  // Create transaction record
  const transaction = {
    name: description || 'Transfer',
    amount: -amount,
    type: 'negative',
    icon: 'fas fa-arrow-right',
    iconBg: '#ffe8e8'
  };
  
  window.addTransaction(transaction);
  
  // Add notification
  window.addNotification({
    title: 'Transfer Completed',
    subtitle: `$${amount.toFixed(2)} transferred to ${toName}`,
    icon: 'fas fa-exchange-alt',
    read: false
  });
  
  saveData();
  
  // Refresh accounts display if function exists and DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof window.renderAccountCards === 'function') {
      window.renderAccountCards();
    }
  }
  
  return { success: true };
};

// Function to deposit money
window.depositMoney = function(toAccount, amount, description) {
  const to = window.accounts[toAccount];
  
  if (!to) {
    return { success: false, error: 'Account not found' };
  }
  
  // Add to destination
  to.balance += amount;
  
  // Create transaction record
  const transaction = {
    name: description || 'Deposit',
    amount: amount,
    type: 'positive',
    icon: 'fas fa-arrow-down',
    iconBg: '#e6f7e6'
  };
  
  window.addTransaction(transaction);
  
  // Add notification
  window.addNotification({
    title: 'Deposit Received',
    subtitle: `$${amount.toFixed(2)} deposited to ${to.name}`,
    icon: 'fas fa-download',
    read: false
  });
  
  saveData();
  
  // Refresh accounts display if function exists and DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof window.renderAccountCards === 'function') {
      window.renderAccountCards();
    }
  }
  
  return { success: true };
};

// Function to get unread count
window.getUnreadNotificationCount = function() {
  return window.notifications ? window.notifications.filter(n => !n.read).length : 0;
};

// Function to mark notification as read
window.markNotificationAsRead = function(notificationId) {
  const notification = window.notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    saveData();
  }
  
  // Only update badge if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateNotificationBadge();
  }
};

// Function to mark all as read
window.markAllNotificationsAsRead = function() {
  window.notifications.forEach(n => n.read = true);
  saveData();
  
  // Only update badge if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    updateNotificationBadge();
  }
};

// Helper to update badge - SAFE VERSION with null checks
function updateNotificationBadge() {
  // Wait for DOM to be ready
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    return; // Exit if DOM isn't ready yet
  }
  
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    const unreadCount = window.getUnreadNotificationCount();
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Function to refresh all timestamps (call periodically)
window.refreshTimestamps = function() {
  if (window.transactions) {
    window.transactions.forEach(t => {
      if (t.timestamp) {
        t.date = getRelativeTimeString(t.timestamp);
      }
    });
  }
  
  if (window.notifications) {
    window.notifications.forEach(n => {
      if (n.timestamp) {
        n.time = getRelativeTimeString(n.timestamp);
      }
    });
  }
  
  // Refresh UI if functions exist and DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof window.renderRecentTransactions === 'function') {
      window.renderRecentTransactions();
    }
    if (typeof window.renderNotifications === 'function') {
      window.renderNotifications();
    }
  }
};

// Export the update function
window.updateNotificationBadge = updateNotificationBadge;

// Load data on script initialization
loadData();

// Only try to update badge when DOM is fully loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  updateNotificationBadge();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    updateNotificationBadge();
  });
}

// Refresh timestamps every minute to keep them updated
setInterval(() => {
  if (typeof window.refreshTimestamps === 'function') {
    window.refreshTimestamps();
  }
}, 60000); // Update every minute

// Save data when page is closed
window.addEventListener('beforeunload', function() {
  saveData();
});