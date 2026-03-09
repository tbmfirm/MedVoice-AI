'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Check } from 'lucide-react';
// Removed prisma import - this is a client component

interface Organization {
  id: string;
  name: string;
}

const OrganizationSwitcher: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch organizations
    fetch('/api/admin/organizations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrganizations(data.organizations);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    // Get selected org from localStorage
    const stored = localStorage.getItem('selectedOrganizationId');
    if (stored) {
      setSelectedOrgId(stored);
    }
  }, []);

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

  const handleSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    localStorage.setItem('selectedOrganizationId', orgId);
    setIsOpen(false);
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 bg-slate-700 rounded-lg animate-pulse">
        <div className="w-32 h-4 bg-slate-600 rounded" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
      >
        <Building2 className="w-4 h-4 text-gray-300" />
        <span className="text-sm font-medium text-white">
          {selectedOrg?.name || 'All Clinics'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => handleSelect('all')}
                className={`
                  w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                  ${
                    selectedOrgId === 'all' || !selectedOrgId
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-slate-700'
                  }
                `}
              >
                <span>All Clinics</span>
                {(selectedOrgId === 'all' || !selectedOrgId) && (
                  <Check className="w-4 h-4" />
                )}
              </button>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                    ${
                      selectedOrgId === org.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-slate-700'
                    }
                  `}
                >
                  <span>{org.name}</span>
                  {selectedOrgId === org.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizationSwitcher;
