'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, UserPlus } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import UserModal from './UserModal';
import { useSession } from '@/lib/auth/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  organizationId: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
  };
}

interface UsersClientProps {
  organizationId: string | null;
  showOrganizationFilter?: boolean;
  organizations?: Array<{ id: string; name: string }>;
}

const UsersClient: React.FC<UsersClientProps> = ({
  organizationId,
  showOrganizationFilter = false,
  organizations = [],
}) => {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(organizationId);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedOrg) {
        params.append('organizationId', selectedOrg);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedOrg]);

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleSave = () => {
    setShowModal(false);
    fetchUsers();
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadge = (role: string) => {
    const roleClasses = {
      admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      staff: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      clinician: 'bg-green-500/10 text-green-400 border-green-500/20',
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium border ${
          roleClasses[role as keyof typeof roleClasses] || roleClasses.staff
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 flex gap-4">
          {showOrganizationFilter && (
            <select
              value={selectedOrg || ''}
              onChange={(e) => setSelectedOrg(e.target.value || null)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Error Display */}
      {error && <ErrorDisplay error={error} />}

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading users..." />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  {showOrganizationFilter && <th>Organization</th>}
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={showOrganizationFilter ? 7 : 6} className="text-center py-8 text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          {!user.emailVerified && (
                            <span className="text-xs text-yellow-400">Unverified</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-gray-300">{user.email}</span>
                      </td>
                      <td>
                        <span className="text-gray-400">{user.phone || '-'}</span>
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      {showOrganizationFilter && (
                        <td>
                          <span className="text-gray-300">
                            {user.organization?.name || '-'}
                          </span>
                        </td>
                      )}
                      <td>
                        <span className="text-gray-400 text-sm">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          organizationId={selectedOrg || organizationId}
          organizations={organizations}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default UsersClient;
