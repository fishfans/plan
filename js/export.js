// ==================== 导出 ====================

function toggleExportMenu() {
  var menu = document.getElementById('export-menu');
  var btn = document.getElementById('btn-export');
  if (menu.classList.contains('open')) {
    menu.classList.remove('open');
  } else {
    var rect = btn.getBoundingClientRect();
    menu.style.top = rect.bottom + 'px';
    menu.style.left = rect.left + 'px';
    menu.classList.add('open');
  }
}

function closeExportMenu() {
  document.getElementById('export-menu').classList.remove('open');
}

function getExportData() {
  return {
    tags: state.tags,
    dates: state.dates,
    currentDate: state.currentDate
  };
}

function exportJSON() {
  closeExportMenu();
  var data = getExportData();
  var json = JSON.stringify(data, null, 2);
  downloadFile('plandata.json', json, 'application/json');
  showToast('JSON exported!');
}

function exportZIP() {
  closeExportMenu();
  showToast('Generating ZIP...');

  var zip = new JSZip();
  zip.file('plandata.json', JSON.stringify(getExportData(), null, 2));

  var picsFolder = zip.folder('pics');
  var dateKeys = Object.keys(state.dates).filter(function(k) {
    return state.dates[k].planSets && state.dates[k].planSets.length > 0;
  });
  var processed = 0;

  if (!dateKeys.length) {
    zip.generateAsync({ type: 'blob' }).then(function(blob) {
      downloadBlob('plan_export.zip', blob);
      showToast('ZIP exported!');
    });
    return;
  }

  function captureNext() {
    if (processed >= dateKeys.length) {
      zip.generateAsync({ type: 'blob' }).then(function(blob) {
        downloadBlob('plan_export.zip', blob);
        showToast('ZIP exported!');
      });
      return;
    }
    var dateKey = dateKeys[processed];
    var origDate = state.currentDate;
    var origSelected = state.selectedPlanSetId;
    state.currentDate = dateKey;
    state.selectedPlanSetId = null;
    render();

    setTimeout(function() {
      var target = document.getElementById('app');
      html2canvas(target, {
        backgroundColor: '#fdfdf8',
        scale: 1.5
      }).then(function(canvas) {
        canvas.toBlob(function(blob) {
          picsFolder.file(dateKey + '.png', blob);
          processed++;
          state.currentDate = origDate;
          state.selectedPlanSetId = origSelected;
          render();
          captureNext();
        }, 'image/png');
      }).catch(function() {
        processed++;
        state.currentDate = origDate;
        state.selectedPlanSetId = origSelected;
        render();
        captureNext();
      });
    }, 100);
  }
  captureNext();
}

function downloadFile(filename, content, mimeType) {
  var blob = new Blob([content], { type: mimeType });
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
