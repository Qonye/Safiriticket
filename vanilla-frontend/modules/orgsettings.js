// Attach to window for global access
window.renderOrgSettings = function(main) {
  // Helper to render the view mode
  function renderView(settings) {
    main.innerHTML = `
      <h2 style="color:#8c241c;">Organization Settings</h2>
      <div id="org-settings-view" style="max-width:600px;">
        <div><strong>Name:</strong> ${settings.name || ''}</div>
        <div><strong>Addresses:</strong><br>${(settings.addresses || []).map(a => `<div>${a}</div>`).join('')}</div>
        <div><strong>Emails:</strong> ${(settings.emails || []).join(', ')}</div>
        <div><strong>Phones:</strong> ${(settings.phones || []).join(', ')}</div>
        <div><strong>VAT:</strong> ${settings.vat || ''}</div>
        <div><strong>Website:</strong> <a href="${settings.website || '#'}" target="_blank">${settings.website || ''}</a></div>
        <div><strong>Logo URL:</strong> <a href="${settings.logoUrl || '#'}" target="_blank">${settings.logoUrl || ''}</a></div>
        <div style="margin-top:18px;">
          <button id="edit-org-settings-btn" style="padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Edit</button>
        </div>
      </div>
      <div id="org-settings-msg" style="margin-top:10px;color:#8c241c;"></div>
    `;
    document.getElementById('edit-org-settings-btn').onclick = () => renderEdit(settings);
  }

  // Helper to render the edit form
  function renderEdit(settings) {
    main.innerHTML = `
      <h2 style="color:#8c241c;">Organization Settings</h2>
      <form id="org-settings-form" style="max-width:600px;">
        <div>
          <label>Name<br>
            <input type="text" name="name" id="org-name" style="width:100%;padding:6px;" value="${settings.name || ''}">
          </label>
        </div>
        <div>
          <label>Addresses<br>
            <textarea name="addresses" id="org-addresses" rows="2" style="width:100%;padding:6px;" placeholder="One address per line">${(settings.addresses || []).join('\n')}</textarea>
          </label>
        </div>
        <div>
          <label>Emails<br>
            <input type="text" name="emails" id="org-emails" style="width:100%;padding:6px;" placeholder="Comma separated" value="${(settings.emails || []).join(', ')}">
          </label>
        </div>
        <div>
          <label>Phones<br>
            <input type="text" name="phones" id="org-phones" style="width:100%;padding:6px;" placeholder="Comma separated" value="${(settings.phones || []).join(', ')}">
          </label>
        </div>
        <div>
          <label>VAT<br>
            <input type="text" name="vat" id="org-vat" style="width:100%;padding:6px;" value="${settings.vat || ''}">
          </label>
        </div>
        <div>
          <label>Website<br>
            <input type="text" name="website" id="org-website" style="width:100%;padding:6px;" value="${settings.website || ''}">
          </label>
        </div>
        <div>
          <label>Logo URL<br>
            <input type="text" name="logoUrl" id="org-logoUrl" style="width:100%;padding:6px;" value="${settings.logoUrl || ''}">
          </label>
        </div>
        <button type="submit" style="margin-top:14px;padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">Save Settings</button>
        <button type="button" id="cancel-org-settings-btn" style="margin-left:10px;padding:8px 18px;background:#b47572;color:#fff;border:none;border-radius:6px;cursor:pointer;">Cancel</button>
        <span id="org-settings-msg" style="margin-left:18px;color:#8c241c;"></span>
      </form>
    `;
    document.getElementById('cancel-org-settings-btn').onclick = () => renderView(settings);

    document.getElementById('org-settings-form').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const data = {
        name: form.name.value.trim(),
        addresses: form.addresses.value.split('\n').map(a => a.trim()).filter(Boolean),
        emails: form.emails.value.split(',').map(e => e.trim()).filter(Boolean),
        phones: form.phones.value.split(',').map(p => p.trim()).filter(Boolean),
        vat: form.vat.value.trim(),
        website: form.website.value.trim(),
        logoUrl: form.logoUrl.value.trim()
      };
      fetch(`${window.API_BASE_URL}/api/orgsettings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(r => r.json())
        .then(saved => {
          window.currentOrgSettings = saved;
          document.getElementById('org-settings-msg').textContent = 'Saved!';
          setTimeout(() => {
            renderView(saved);
          }, 800);
        })
        .catch(() => {
          document.getElementById('org-settings-msg').textContent = 'Error saving settings.';
        });
    };
  }

  // Initial load
  fetch(`${window.API_BASE_URL}/api/orgsettings`)
    .then(r => r.json())
    .then(settings => {
      window.currentOrgSettings = settings || {}; // <-- Make available globally for other modules
      renderView(settings || {});
    });
};
