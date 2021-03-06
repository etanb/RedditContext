 // Saves options to chrome.storage
function save_options() {
  var chartChoice = document.getElementById('chart-display').value,
      accessibleChoice = document.getElementById('accessible-colors').value;

  chrome.storage.sync.set({
    chartChoice: chartChoice,
    accessibleChoice: accessibleChoice
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

document.getElementById('save').addEventListener('click',
    save_options);