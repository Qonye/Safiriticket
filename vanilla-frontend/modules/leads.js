window.renderLeads = function(main) {
  main.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #8c241c;">
      <h2 style="color:#8c241c;margin:0;">Lead Management</h2>
      <button id="refresh-leads-btn" style="padding:8px 20px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;transition:background 0.2s;">
        🔄 Refresh
      </button>
    </div>
    
    <!-- Summary Cards -->
    <div id="leads-stats" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:20px;margin-bottom:32px;"></div>
    
    <!-- Filters Section -->
    <div style="margin-bottom:24px;padding:16px;background:#f8f9fa;border-radius:8px;">
      <h3 style="color:#8c241c;margin-top:0;margin-bottom:16px;">Filter Leads</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:12px;">
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">Search</label>
          <input type="text" id="lead-search" placeholder="Name, email, or phone" class="lead-form-input" style="margin-bottom:0;">
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">Status</label>
          <select id="lead-status-filter" class="lead-form-select" style="margin-bottom:0;">
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">Source</label>
          <select id="lead-source-filter" class="lead-form-select" style="margin-bottom:0;">
            <option value="">All Sources</option>
            <option value="jungledwellers">Jungle Dwellers</option>
            <option value="safiritickets">Safiri Tickets</option>
          </select>
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">From Date</label>
          <input type="date" id="lead-date-from" class="lead-form-input" style="margin-bottom:0;">
        </div>
        <div>
          <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;font-size:0.9em;">To Date</label>
          <input type="date" id="lead-date-to" class="lead-form-input" style="margin-bottom:0;">
        </div>
      </div>
      <button id="clear-lead-filters-btn" style="padding:8px 16px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;">Clear Filters</button>
    </div>
    
    <!-- Leads List -->
    <div id="leads-list-container" style="padding:20px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <div id="leads-list">Loading leads...</div>
      <div id="leads-pagination"></div>
    </div>
    
    <!-- Lead Detail Modal -->
    <div id="lead-detail-modal" class="lead-modal" style="display:none;">
      <div class="lead-modal-content" style="max-width:700px;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #8c241c;">
          <h3 style="color:#8c241c;margin:0;">Lead Details</h3>
          <button id="close-lead-modal" style="background:#666;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:1.2em;">&times;</button>
        </div>
        <div id="lead-detail-content"></div>
      </div>
    </div>
    
    <style>
      .lead-form-input {
        width: 100%;
        padding: 0.7rem;
        margin-bottom: 0;
        border: 1.5px solid #8c241c;
        border-radius: 6px;
        background: #fff;
        font-size: 1em;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px rgba(140, 36, 28, 0.1);
      }
      .lead-form-input:focus {
        outline: none;
        border-color: #eb7b24;
        box-shadow: 0 2px 8px rgba(140, 36, 28, 0.2);
      }
      .lead-form-select {
        width: 100%;
        padding: 0.7rem;
        margin-bottom: 0;
        border: 1.5px solid #8c241c;
        border-radius: 6px;
        background: #fff;
        font-size: 1em;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px rgba(140, 36, 28, 0.1);
      }
      .lead-form-select:focus {
        outline: none;
        border-color: #eb7b24;
        box-shadow: 0 2px 8px rgba(140, 36, 28, 0.2);
      }
      .lead-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
        z-index: 2000;
        align-items: center;
        justify-content: center;
      }
      .lead-modal.show {
        display: flex !important;
      }
      .lead-modal-content {
        background: #fff;
        padding: 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        width: 90%;
        max-width: 800px;
      }
      .lead-card {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-left: 4px solid #8c241c;
      }
      #refresh-leads-btn:hover {
        background: #a63a2e;
      }
    </style>
  `;
  
  let allLeadsData = [];
  let currentPage = 1;
  const itemsPerPage = 15;
  
  function getStatusColor(status) {
    const colors = {
      'new': '#2ecc40',
      'contacted': '#f39c12',
      'converted': '#3498db',
      'lost': '#e74c3c'
    };
    return colors[status] || '#666';
  }
  
  function getStatusBadge(status) {
    const badges = {
      'new': '🆕',
      'contacted': '📞',
      'converted': '✅',
      'lost': '❌'
    };
    return badges[status] || '';
  }
  
  function getSourceBadge(source) {
    if (source === 'jungledwellers') {
      return '<span style="background:#2ecc40;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.85em;font-weight:bold;">JD</span>';
    } else if (source === 'safiritickets') {
      return '<span style="background:#3498db;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.85em;font-weight:bold;">ST</span>';
    }
    return '';
  }
  
  function fetchLeadStats() {
    fetch(`${window.API_BASE_URL}/api/leads/stats`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const stats = data.stats;
          document.getElementById('leads-stats').innerHTML = `
            <div class="lead-card" style="border-left-color:#8c241c;">
              <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Total Leads</div>
              <div style="font-size:2em;font-weight:bold;color:#8c241c;">${stats.total || 0}</div>
            </div>
            <div class="lead-card" style="border-left-color:#2ecc40;">
              <div style="font-size:0.9em;color:#666;margin-bottom:8px;">New Leads</div>
              <div style="font-size:2em;font-weight:bold;color:#2ecc40;">${stats.new || 0}</div>
            </div>
            <div class="lead-card" style="border-left-color:#f39c12;">
              <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Contacted</div>
              <div style="font-size:2em;font-weight:bold;color:#f39c12;">${stats.contacted || 0}</div>
            </div>
            <div class="lead-card" style="border-left-color:#3498db;">
              <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Converted</div>
              <div style="font-size:2em;font-weight:bold;color:#3498db;">${stats.converted || 0}</div>
            </div>
            <div class="lead-card" style="border-left-color:#e74c3c;">
              <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Lost</div>
              <div style="font-size:2em;font-weight:bold;color:#e74c3c;">${stats.lost || 0}</div>
            </div>
          `;
        }
      })
      .catch(err => {
        console.error('Error fetching lead stats:', err);
      });
  }
  
  function renderLeadsTable(leads, page = 1) {
    if (!leads || leads.length === 0) {
      document.getElementById('leads-list').innerHTML = '<p style="color:#666;padding:20px;text-align:center;">No leads match your filters.</p>';
      document.getElementById('leads-pagination').innerHTML = '';
      return;
    }
    
    const totalPages = Math.ceil(leads.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLeads = leads.slice(startIndex, endIndex);
    
    document.getElementById('leads-list').innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Source</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${paginatedLeads.map(lead => {
            const date = new Date(lead.createdAt).toLocaleDateString();
            const statusColor = getStatusColor(lead.status);
            const statusBadge = getStatusBadge(lead.status);
            const sourceBadge = getSourceBadge(lead.sourceWebsite);
            
            return `
              <tr>
                <td><strong>${lead.name || 'N/A'}</strong></td>
                <td>${lead.email || 'N/A'}</td>
                <td>${lead.phone || 'N/A'}</td>
                <td>${sourceBadge}</td>
                <td style="color:${statusColor};font-weight:bold;">${statusBadge} ${lead.status || 'new'}</td>
                <td>${date}</td>
                <td>
                  <button class="view-lead-btn" data-lead-id="${lead._id}" style="background:#8c241c;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.85em;margin-right:4px;">View</button>
                  ${lead.status !== 'converted' ? `
                    <button class="convert-lead-btn" data-lead-id="${lead._id}" style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.85em;margin-right:4px;">Convert</button>
                  ` : ''}
                  <button class="delete-lead-btn" data-lead-id="${lead._id}" style="background:#e74c3c;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.85em;">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    // Pagination controls
    let paginationHtml = '';
    if (totalPages > 1) {
      paginationHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding:16px;background:#f8f9fa;border-radius:6px;">
          <div style="color:#666;">
            Showing ${startIndex + 1}-${Math.min(endIndex, leads.length)} of ${leads.length} leads
          </div>
          <div style="display:flex;gap:8px;">
            <button id="prev-leads-page-btn" ${page <= 1 ? 'disabled' : ''} style="padding:6px 16px;background:${page <= 1 ? '#ccc' : '#8c241c'};color:#fff;border:none;border-radius:4px;cursor:${page <= 1 ? 'not-allowed' : 'pointer'};" ${page <= 1 ? '' : 'onclick="window.goToLeadsPage(' + (page - 1) + ')"'}>
              ← Previous
            </button>
            <span style="padding:6px 12px;background:#fff;border-radius:4px;font-weight:bold;color:#8c241c;">
              Page ${page} of ${totalPages}
            </span>
            <button id="next-leads-page-btn" ${page >= totalPages ? 'disabled' : ''} style="padding:6px 16px;background:${page >= totalPages ? '#ccc' : '#8c241c'};color:#fff;border:none;border-radius:4px;cursor:${page >= totalPages ? 'not-allowed' : 'pointer'};" ${page >= totalPages ? '' : 'onclick="window.goToLeadsPage(' + (page + 1) + ')"'}>
              Next →
            </button>
          </div>
        </div>
      `;
    }
    document.getElementById('leads-pagination').innerHTML = paginationHtml;
    
    // Add event listeners
    document.querySelectorAll('.view-lead-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const leadId = this.getAttribute('data-lead-id');
        viewLeadDetails(leadId);
      });
    });
    
    document.querySelectorAll('.convert-lead-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const leadId = this.getAttribute('data-lead-id');
        convertLeadToClient(leadId);
      });
    });
    
    document.querySelectorAll('.delete-lead-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const leadId = this.getAttribute('data-lead-id');
        deleteLead(leadId);
      });
    });
  }
  
  function filterLeads() {
    const statusFilter = document.getElementById('lead-status-filter')?.value || '';
    const sourceFilter = document.getElementById('lead-source-filter')?.value || '';
    const searchTerm = document.getElementById('lead-search')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('lead-date-from')?.value || '';
    const dateTo = document.getElementById('lead-date-to')?.value || '';
    
    let filtered = [...allLeadsData];
    
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    if (sourceFilter) {
      filtered = filtered.filter(lead => lead.sourceWebsite === sourceFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(lead => {
        const name = (lead.name || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const company = (lead.company || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || company.includes(searchTerm);
      });
    }
    
    if (dateFrom) {
      filtered = filtered.filter(lead => new Date(lead.createdAt) >= new Date(dateFrom));
    }
    
    if (dateTo) {
      filtered = filtered.filter(lead => new Date(lead.createdAt) <= new Date(dateTo));
    }
    
    currentPage = 1;
    renderLeadsTable(filtered, currentPage);
  }
  
  window.goToLeadsPage = function(page) {
    const statusFilter = document.getElementById('lead-status-filter')?.value || '';
    const sourceFilter = document.getElementById('lead-source-filter')?.value || '';
    const searchTerm = document.getElementById('lead-search')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('lead-date-from')?.value || '';
    const dateTo = document.getElementById('lead-date-to')?.value || '';
    
    let filtered = [...allLeadsData];
    
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    if (sourceFilter) {
      filtered = filtered.filter(lead => lead.sourceWebsite === sourceFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(lead => {
        const name = (lead.name || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const company = (lead.company || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || company.includes(searchTerm);
      });
    }
    
    if (dateFrom) {
      filtered = filtered.filter(lead => new Date(lead.createdAt) >= new Date(dateFrom));
    }
    
    if (dateTo) {
      filtered = filtered.filter(lead => new Date(lead.createdAt) <= new Date(dateTo));
    }
    
    currentPage = page;
    renderLeadsTable(filtered, currentPage);
  };
  
  function viewLeadDetails(leadId) {
    fetch(`${window.API_BASE_URL}/api/leads/${leadId}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const lead = data.lead;
          const statusColor = getStatusColor(lead.status);
          const sourceBadge = getSourceBadge(lead.sourceWebsite);
          
          // Format metadata
          let metadataHtml = '';
          if (lead.metadata && Object.keys(lead.metadata).length > 0) {
            metadataHtml = `
              <div style="margin-top:20px;padding:16px;background:#f8f9fa;border-radius:6px;">
                <h4 style="color:#8c241c;margin-top:0;">Additional Information</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;">
                  ${Object.entries(lead.metadata).map(([key, value]) => {
                    if (value && typeof value === 'object') {
                      return Object.entries(value).map(([subKey, subValue]) => 
                        `<div><strong>${subKey}:</strong> ${subValue}</div>`
                      ).join('');
                    }
                    return `<div><strong>${key}:</strong> ${value}</div>`;
                  }).join('')}
                </div>
              </div>
            `;
          }
          
          // Format notes
          let notesHtml = '';
          if (lead.notes && lead.notes.length > 0) {
            notesHtml = `
              <div style="margin-top:20px;">
                <h4 style="color:#8c241c;margin-bottom:12px;">Notes & Activity</h4>
                <div style="max-height:200px;overflow-y:auto;">
                  ${lead.notes.map(note => `
                    <div style="padding:8px;background:#f8f9fa;border-radius:4px;margin-bottom:8px;border-left:3px solid #8c241c;">
                      <div style="font-size:0.9em;color:#666;">${new Date(note.addedAt).toLocaleString()}</div>
                      <div>${note.note}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }
          
          document.getElementById('lead-detail-content').innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:16px;margin-bottom:20px;">
              <div>
                <strong style="color:#666;">Name:</strong>
                <div style="font-size:1.1em;margin-top:4px;">${lead.name || 'N/A'}</div>
              </div>
              <div>
                <strong style="color:#666;">Email:</strong>
                <div style="font-size:1.1em;margin-top:4px;">${lead.email || 'N/A'}</div>
              </div>
              <div>
                <strong style="color:#666;">Phone:</strong>
                <div style="font-size:1.1em;margin-top:4px;">${lead.phone || 'N/A'}</div>
              </div>
              <div>
                <strong style="color:#666;">Company:</strong>
                <div style="font-size:1.1em;margin-top:4px;">${lead.company || 'N/A'}</div>
              </div>
              <div>
                <strong style="color:#666;">Source:</strong>
                <div style="font-size:1.1em;margin-top:4px;">${sourceBadge} ${lead.sourceWebsite}</div>
              </div>
              <div>
                <strong style="color:#666;">Status:</strong>
                <div style="font-size:1.1em;margin-top:4px;color:${statusColor};font-weight:bold;">
                  ${getStatusBadge(lead.status)} ${lead.status}
                </div>
              </div>
              <div>
                <strong style="color:#666;">Date:</strong>
                <div style="font-size:1.1em;margin-top:4px;">${new Date(lead.createdAt).toLocaleString()}</div>
              </div>
              ${lead.convertedToClient ? `
                <div>
                  <strong style="color:#666;">Converted To:</strong>
                  <div style="font-size:1.1em;margin-top:4px;color:#2ecc40;">
                    ✅ ${lead.convertedToClient.name || 'Client'}
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${lead.message ? `
              <div style="margin-top:20px;padding:16px;background:#f8f9fa;border-radius:6px;">
                <strong style="color:#8c241c;">Message:</strong>
                <div style="margin-top:8px;white-space:pre-wrap;">${lead.message}</div>
              </div>
            ` : ''}
            
            ${metadataHtml}
            ${notesHtml}
            
            <div style="margin-top:24px;padding-top:20px;border-top:2px solid #eee;">
              <h4 style="color:#8c241c;margin-bottom:12px;">Update Status</h4>
              <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                <select id="update-lead-status" class="lead-form-select" style="max-width:200px;">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
                <button id="update-status-btn" data-lead-id="${lead._id}" style="padding:8px 16px;background:#8c241c;color:#fff;border:none;border-radius:4px;cursor:pointer;">Update Status</button>
                ${lead.status !== 'converted' ? `
                  <button id="convert-from-detail-btn" data-lead-id="${lead._id}" style="padding:8px 16px;background:#2ecc40;color:#fff;border:none;border-radius:4px;cursor:pointer;">Convert to Client</button>
                ` : ''}
              </div>
              
              <div style="margin-top:16px;">
                <label style="display:block;margin-bottom:6px;font-weight:bold;color:#333;">Add Note</label>
                <textarea id="new-lead-note" class="lead-form-input" rows="3" placeholder="Add internal note about this lead..."></textarea>
                <button id="add-note-btn" data-lead-id="${lead._id}" style="margin-top:8px;padding:8px 16px;background:#8c241c;color:#fff;border:none;border-radius:4px;cursor:pointer;">Add Note</button>
              </div>
            </div>
          `;
          
          // Set current status in dropdown
          document.getElementById('update-lead-status').value = lead.status;
          
          // Event listeners for detail modal
          document.getElementById('update-status-btn').addEventListener('click', function() {
            const newStatus = document.getElementById('update-lead-status').value;
            updateLeadStatus(lead._id, newStatus);
          });
          
          if (document.getElementById('convert-from-detail-btn')) {
            document.getElementById('convert-from-detail-btn').addEventListener('click', function() {
              convertLeadToClient(lead._id);
            });
          }
          
          document.getElementById('add-note-btn').addEventListener('click', function() {
            const note = document.getElementById('new-lead-note').value;
            if (note.trim()) {
              addLeadNote(lead._id, note);
            }
          });
          
          // Show modal
          document.getElementById('lead-detail-modal').classList.add('show');
        }
      })
      .catch(err => {
        console.error('Error fetching lead details:', err);
        alert('Error loading lead details');
      });
  }
  
  function updateLeadStatus(leadId, newStatus) {
    fetch(`${window.API_BASE_URL}/api/leads/${leadId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          alert('Lead status updated successfully!');
          fetchLeads();
          if (document.getElementById('lead-detail-modal').classList.contains('show')) {
            viewLeadDetails(leadId);
          }
        } else {
          alert('Error: ' + (data.error || 'Failed to update status'));
        }
      })
      .catch(err => {
        console.error('Error updating lead status:', err);
        alert('Error updating lead status');
      });
  }
  
  function addLeadNote(leadId, note) {
    fetch(`${window.API_BASE_URL}/api/leads/${leadId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ notes: { note } })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          document.getElementById('new-lead-note').value = '';
          alert('Note added successfully!');
          viewLeadDetails(leadId);
          fetchLeads();
        } else {
          alert('Error: ' + (data.error || 'Failed to add note'));
        }
      })
      .catch(err => {
        console.error('Error adding note:', err);
        alert('Error adding note');
      });
  }
  
  function convertLeadToClient(leadId) {
    if (!confirm('Convert this lead to a client? This will create a new client record.')) {
      return;
    }
    
    fetch(`${window.API_BASE_URL}/api/leads/${leadId}/convert`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          alert('Lead converted to client successfully!');
          fetchLeads();
          fetchLeadStats();
          if (document.getElementById('lead-detail-modal').classList.contains('show')) {
            viewLeadDetails(leadId);
          }
        } else {
          alert('Error: ' + (data.error || 'Failed to convert lead'));
        }
      })
      .catch(err => {
        console.error('Error converting lead:', err);
        alert('Error converting lead to client');
      });
  }
  
  function deleteLead(leadId) {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }
    
    fetch(`${window.API_BASE_URL}/api/leads/${leadId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          alert('Lead deleted successfully!');
          fetchLeads();
          fetchLeadStats();
        } else {
          alert('Error: ' + (data.error || 'Failed to delete lead'));
        }
      })
      .catch(err => {
        console.error('Error deleting lead:', err);
        alert('Error deleting lead');
      });
  }
  
  function fetchLeads() {
    const statusFilter = document.getElementById('lead-status-filter')?.value || '';
    const sourceFilter = document.getElementById('lead-source-filter')?.value || '';
    const searchTerm = document.getElementById('lead-search')?.value || '';
    const dateFrom = document.getElementById('lead-date-from')?.value || '';
    const dateTo = document.getElementById('lead-date-to')?.value || '';
    
    let queryParams = [];
    if (statusFilter) queryParams.push(`status=${encodeURIComponent(statusFilter)}`);
    if (sourceFilter) queryParams.push(`sourceWebsite=${encodeURIComponent(sourceFilter)}`);
    if (searchTerm) queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
    if (dateFrom) queryParams.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
    if (dateTo) queryParams.push(`dateTo=${encodeURIComponent(dateTo)}`);
    
    const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    
    fetch(`${window.API_BASE_URL}/api/leads${queryString}`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          allLeadsData = data.leads;
          renderLeadsTable(data.leads, currentPage);
        } else {
          document.getElementById('leads-list').innerHTML = '<p style="color:#666;padding:20px;text-align:center;">Error loading leads.</p>';
        }
      })
      .catch(err => {
        console.error('Error fetching leads:', err);
        document.getElementById('leads-list').innerHTML = '<p style="color:#666;padding:20px;text-align:center;">Error loading leads. Please try again.</p>';
      });
  }
  
  // Event listeners
  document.getElementById('refresh-leads-btn').addEventListener('click', function() {
    fetchLeads();
    fetchLeadStats();
  });
  
  document.getElementById('lead-search').addEventListener('input', filterLeads);
  document.getElementById('lead-status-filter').addEventListener('change', filterLeads);
  document.getElementById('lead-source-filter').addEventListener('change', filterLeads);
  document.getElementById('lead-date-from').addEventListener('change', filterLeads);
  document.getElementById('lead-date-to').addEventListener('change', filterLeads);
  
  document.getElementById('clear-lead-filters-btn').addEventListener('click', function() {
    document.getElementById('lead-search').value = '';
    document.getElementById('lead-status-filter').value = '';
    document.getElementById('lead-source-filter').value = '';
    document.getElementById('lead-date-from').value = '';
    document.getElementById('lead-date-to').value = '';
    filterLeads();
  });
  
  document.getElementById('close-lead-modal').addEventListener('click', function() {
    document.getElementById('lead-detail-modal').classList.remove('show');
  });
  
  // Close modal when clicking outside
  document.getElementById('lead-detail-modal').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('show');
    }
  });
  
  // Initial load
  fetchLeads();
  fetchLeadStats();
};

