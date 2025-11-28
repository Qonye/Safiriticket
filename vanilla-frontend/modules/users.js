// Valid roles
const VALID_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'admin', label: 'Admin' },
  { value: 'systemsadmin', label: 'Systems Admin' },
  { value: 'superadmin', label: 'Super Admin' }
];

// Helper function to check if user has superadmin-level privileges
function isSuperAdminLevel(role) {
  return role === 'superadmin' || role === 'systemsadmin';
}

// User management module (admin, systemsadmin, and superadmin)
window.renderUsers = function(main) {
  // Check if user is admin, systemsadmin, or superadmin
  if (!window.auth || !window.auth.user || (!isSuperAdminLevel(window.auth.user.role) && window.auth.user.role !== 'admin')) {
    main.innerHTML = `
      <h2 style="color:#8c241c;">User Management</h2>
      <p style="color:#943c34;padding:16px;background:#ffe6e6;border-radius:8px;">
        Access denied. Only administrators can manage users.
      </p>
    `;
    return;
  }

  main.innerHTML = `
    <h2 style="color:#8c241c;">User Management</h2>
    <div style="margin-bottom:18px;">
      <button id="add-user-btn" style="padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.95em;">
        + Add New User
      </button>
      <div id="user-form-msg" style="margin-top:8px;font-size:0.98em;"></div>
    </div>
    <div id="users-list">Loading users...</div>
  `;

  // Add user form modal
  function showAddUserForm() {
    const modal = document.createElement('div');
    modal.id = 'add-user-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;width:90%;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
        <h3 style="color:#8c241c;margin-top:0;">Add New User</h3>
        <form id="new-user-form">
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">Username *</label>
            <input type="text" name="username" required style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">Password *</label>
            <input type="password" name="password" required minlength="6" style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
            <small style="color:#666;font-size:0.85em;">Minimum 6 characters</small>
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">Full Name *</label>
            <input type="text" name="name" required style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">Role *</label>
            <select name="role" required style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
              ${VALID_ROLES.filter(r => {
                // Only superadmin-level can create admin, systemsadmin, or superadmin users
                if ((r.value === 'admin' || r.value === 'systemsadmin' || r.value === 'superadmin') && !isSuperAdminLevel(window.auth.user.role)) {
                  return false;
                }
                return true;
              }).map(r => `<option value="${r.value}">${r.label}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;">
            <button type="button" id="cancel-add-user" style="padding:8px 18px;background:#b47572;color:#fff;border:none;border-radius:6px;cursor:pointer;">
              Cancel
            </button>
            <button type="submit" style="padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">
              Create User
            </button>
          </div>
        </form>
        <div id="add-user-error" style="margin-top:12px;color:#943c34;display:none;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancel-add-user').onclick = () => modal.remove();
    document.getElementById('new-user-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        username: formData.get('username'),
        password: formData.get('password'),
        name: formData.get('name'),
        role: formData.get('role')
      };

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_BASE_URL}/api/auth/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
          modal.remove();
          showMessage('User created successfully!', 'success');
          fetchUsers();
        } else {
          document.getElementById('add-user-error').textContent = result.error || 'Failed to create user';
          document.getElementById('add-user-error').style.display = 'block';
        }
      } catch (error) {
        document.getElementById('add-user-error').textContent = 'Network error: ' + error.message;
        document.getElementById('add-user-error').style.display = 'block';
      }
    };
  }

  // Edit user modal
  function showEditUserModal(user) {
    const modal = document.createElement('div');
    modal.id = 'edit-user-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;width:90%;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
        <h3 style="color:#8c241c;margin-top:0;">Edit User</h3>
        <form id="edit-user-form">
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">Username</label>
            <input type="text" value="${user.username}" disabled style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;background:#f5f5f5;">
            <small style="color:#666;font-size:0.85em;">Username cannot be changed</small>
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">Full Name *</label>
            <input type="text" name="name" value="${user.name}" required style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">Role *</label>
            <select name="role" required style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
              ${VALID_ROLES.filter(r => {
                // Only superadmin-level can change role to admin, systemsadmin, or superadmin
                if ((r.value === 'admin' || r.value === 'systemsadmin' || r.value === 'superadmin') && !isSuperAdminLevel(window.auth.user.role)) {
                  return false;
                }
                return true;
              }).map(r => `<option value="${r.value}" ${user.role === r.value ? 'selected' : ''}>${r.label}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">New Password</label>
            <input type="password" name="password" minlength="6" style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
            <small style="color:#666;font-size:0.85em;">Leave blank to keep current password</small>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;">
            <button type="button" id="cancel-edit-user" style="padding:8px 18px;background:#b47572;color:#fff;border:none;border-radius:6px;cursor:pointer;">
              Cancel
            </button>
            <button type="submit" style="padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">
              Save Changes
            </button>
          </div>
        </form>
        <div id="edit-user-error" style="margin-top:12px;color:#943c34;display:none;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancel-edit-user').onclick = () => modal.remove();
    document.getElementById('edit-user-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        role: formData.get('role')
      };
      const password = formData.get('password');
      if (password) {
        data.password = password;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_BASE_URL}/api/auth/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
          modal.remove();
          showMessage('User updated successfully!', 'success');
          fetchUsers();
        } else {
          document.getElementById('edit-user-error').textContent = result.error || 'Failed to update user';
          document.getElementById('edit-user-error').style.display = 'block';
        }
      } catch (error) {
        document.getElementById('edit-user-error').textContent = 'Network error: ' + error.message;
        document.getElementById('edit-user-error').style.display = 'block';
      }
    };
  }

  // Reset password modal
  function showResetPasswordModal(user) {
    const modal = document.createElement('div');
    modal.id = 'reset-password-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;width:90%;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
        <h3 style="color:#8c241c;margin-top:0;">Reset Password</h3>
        <p style="color:#232946;margin-bottom:16px;">Reset password for: <strong>${user.name} (${user.username})</strong></p>
        <form id="reset-password-form">
          <div style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:4px;color:#232946;font-weight:bold;">New Password *</label>
            <input type="password" name="password" required minlength="6" style="width:100%;padding:8px;border:1px solid #e9c7bf;border-radius:4px;box-sizing:border-box;">
            <small style="color:#666;font-size:0.85em;">Minimum 6 characters</small>
          </div>
          <div style="display:flex;gap:12px;justify-content:flex-end;">
            <button type="button" id="cancel-reset-password" style="padding:8px 18px;background:#b47572;color:#fff;border:none;border-radius:6px;cursor:pointer;">
              Cancel
            </button>
            <button type="submit" style="padding:8px 18px;background:#8c241c;color:#fff;border:none;border-radius:6px;cursor:pointer;">
              Reset Password
            </button>
          </div>
        </form>
        <div id="reset-password-error" style="margin-top:12px;color:#943c34;display:none;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancel-reset-password').onclick = () => modal.remove();
    document.getElementById('reset-password-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const password = formData.get('password');

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_BASE_URL}/api/auth/users/${user.id}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password })
        });

        const result = await response.json();
        if (response.ok) {
          modal.remove();
          showMessage('Password reset successfully!', 'success');
        } else {
          document.getElementById('reset-password-error').textContent = result.error || 'Failed to reset password';
          document.getElementById('reset-password-error').style.display = 'block';
        }
      } catch (error) {
        document.getElementById('reset-password-error').textContent = 'Network error: ' + error.message;
        document.getElementById('reset-password-error').style.display = 'block';
      }
    };
  }

  // Show message
  function showMessage(msg, type) {
    const msgDiv = document.getElementById('user-form-msg');
    msgDiv.textContent = msg;
    msgDiv.style.color = type === 'success' ? '#2ecc40' : '#943c34';
    msgDiv.style.display = 'block';
    setTimeout(() => {
      msgDiv.style.display = 'none';
    }, 3000);
  }

  // Fetch and display users
  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.API_BASE_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          document.getElementById('users-list').innerHTML = `
            <p style="color:#943c34;padding:16px;background:#ffe6e6;border-radius:8px;">
              Access denied. Only administrators can manage users.
            </p>
          `;
        } else {
          throw new Error('Failed to fetch users');
        }
        return;
      }

      const users = await response.json();
      if (!users.length) {
        document.getElementById('users-list').innerHTML = '<p>No users found.</p>';
        return;
      }

      const currentUserId = window.auth.user.id;
      document.getElementById('users-list').innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th style="background:#8c241c;">Username</th>
              <th style="background:#8c241c;">Name</th>
              <th style="background:#8c241c;">Role</th>
              <th style="background:#8c241c;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              // Normalize ID - ensure both _id and id are available
              const userId = u._id || u.id;
              const normalizedUser = { ...u, id: userId, _id: userId };
              return `
              <tr data-id="${userId}">
                <td>${u.username}</td>
                <td>${u.name}</td>
                <td>
                  <span style="padding:4px 8px;border-radius:4px;font-size:0.85em;font-weight:bold;background:${
                    u.role === 'superadmin' ? '#8c241c' : 
                    u.role === 'systemsadmin' ? '#6c1a0c' : 
                    u.role === 'admin' ? '#be292c' : 
                    u.role === 'accounting' ? '#2ecc40' : 
                    u.role === 'marketing' ? '#3498db' : 
                    u.role === 'receptionist' ? '#9b59b6' : 
                    '#ee9f64'
                  };color:#fff;">
                    ${VALID_ROLES.find(r => r.value === u.role)?.label || u.role}
                  </span>
                </td>
                <td>
                  <button class="edit-user-btn" data-user='${JSON.stringify(normalizedUser)}' style="background:#ee9f64;color:#8c241c;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;margin-right:6px;font-size:0.9em;">
                    Edit
                  </button>
                  <button class="reset-password-btn" data-user='${JSON.stringify(normalizedUser)}' style="background:#2ecc40;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;margin-right:6px;font-size:0.9em;">
                    Reset Password
                  </button>
                  ${userId !== currentUserId ? `
                    <button class="delete-user-btn" data-id="${userId}" data-name="${u.name}" style="background:#943c34;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.9em;">
                      Delete
                    </button>
                  ` : '<span style="color:#999;font-size:0.85em;">(Current user)</span>'}
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      `;

      // Attach event handlers
      document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.onclick = () => {
          const user = JSON.parse(btn.getAttribute('data-user'));
          // Normalize ID - use _id if available, otherwise id
          user.id = user._id || user.id;
          showEditUserModal(user);
        };
      });

      document.querySelectorAll('.reset-password-btn').forEach(btn => {
        btn.onclick = () => {
          const user = JSON.parse(btn.getAttribute('data-user'));
          // Normalize ID - use _id if available, otherwise id
          user.id = user._id || user.id;
          showResetPasswordModal(user);
        };
      });

      document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          if (confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${window.API_BASE_URL}/api/auth/users/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              const result = await response.json();
              if (response.ok) {
                showMessage('User deleted successfully!', 'success');
                fetchUsers();
              } else {
                showMessage(result.error || 'Failed to delete user', 'error');
              }
            } catch (error) {
              showMessage('Network error: ' + error.message, 'error');
            }
          }
        };
      });
    } catch (error) {
      document.getElementById('users-list').innerHTML = `
        <p style="color:#943c34;padding:16px;background:#ffe6e6;border-radius:8px;">
          Error loading users: ${error.message}
        </p>
      `;
    }
  }

  // Add user button handler
  document.getElementById('add-user-btn').onclick = showAddUserForm;

  // Initial fetch
  fetchUsers();
};

