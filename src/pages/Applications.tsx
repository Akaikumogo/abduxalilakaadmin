import { useState, useCallback, memo, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { applicationsApi } from '@/services/api';
import { Modal, ConfirmDialog, Button, Card, EmptyState } from '@/components/ui';
import { PageLoading, SkeletonTable } from '@/components/ui/Loading';
import type { Application } from '@/types';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Yangi', color: 'text-primary-700', bg: 'bg-primary-100' },
  contacted: { label: "Bog'lanildi", color: 'text-warning-600', bg: 'bg-warning-100' },
  in_progress: { label: 'Jarayonda', color: 'text-purple-700', bg: 'bg-purple-100' },
  completed: { label: 'Yakunlandi', color: 'text-success-600', bg: 'bg-success-100' },
  cancelled: { label: 'Bekor qilindi', color: 'text-accent-700', bg: 'bg-accent-100' },
};

const statusOptions = [
  { value: 'all', label: 'Barchasi' },
  { value: 'new', label: 'Yangi' },
  { value: 'contacted', label: "Bog'lanildi" },
  { value: 'in_progress', label: 'Jarayonda' },
  { value: 'completed', label: 'Yakunlandi' },
  { value: 'cancelled', label: 'Bekor qilindi' },
];

// Export to CSV
const exportToCSV = (applications: Application[]) => {
  const headers = ['Ism', 'Telefon', 'Davlat', 'Status', 'Forma turi', 'Izoh', 'Sana'];
  const rows = applications.map(app => [
    app.name,
    app.phone,
    app.country || '',
    statusConfig[app.status]?.label || app.status,
    app.formType,
    app.notes || '',
    new Date(app.createdAt).toLocaleString('uz-UZ'),
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `arizalar_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  toast.success('CSV fayl yuklandi');
};

// Application Detail Modal
const ApplicationDetail = memo(function ApplicationDetail({
  application,
  onClose,
  onUpdate,
  isUpdating,
}: {
  application: Application;
  onClose: () => void;
  onUpdate: (data: Partial<Application>) => void;
  isUpdating: boolean;
}) {
  const [notes, setNotes] = useState(application.notes || '');
  const [status, setStatus] = useState(application.status);
  const config = statusConfig[application.status];

  const handleSave = () => {
    onUpdate({ status, notes });
  };

  return (
    <Modal isOpen onClose={onClose} title="Ariza tafsilotlari" size="lg">
      <div className="space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-dark-500">Ism</label>
            <p className="font-medium text-dark-900">{application.name}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-dark-500">Telefon</label>
            <a href={`tel:${application.phone}`} className="font-medium text-primary-600 hover:underline block">
              {application.phone}
            </a>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-dark-500">Davlat</label>
            <p className="font-medium text-dark-900">{application.country || '-'}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-dark-500">Forma turi</label>
            <p className="font-medium text-dark-900 capitalize">{application.formType}</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-dark-500">Yaratilgan</label>
            <p className="font-medium text-dark-900">
              {new Date(application.createdAt).toLocaleString('uz-UZ')}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-dark-500">Joriy status</label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${config?.bg} ${config?.color}`}>
              {config?.label}
            </span>
          </div>
        </div>

        <div className="divider" />

        {/* Edit Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Statusni o'zgartirish</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.slice(1).map(opt => {
                const cfg = statusConfig[opt.value];
                return (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatus(opt.value as Application['status'])}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      status === opt.value
                        ? `${cfg?.bg} ${cfg?.color} ring-2 ring-offset-2 ring-${cfg?.color.replace('text-', '')}`
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Izohlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Izoh qo'shing..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <a 
            href={`tel:${application.phone}`} 
            className="btn-primary flex-1 justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Qo'ng'iroq qilish
          </a>
          <Button
            variant="secondary"
            onClick={handleSave}
            isLoading={isUpdating}
            className="flex-1 justify-center"
          >
            Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export const Applications = memo(function Applications() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [deleteApp, setDeleteApp] = useState<Application | null>(null);

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['applications', { page, status, search: debouncedSearch }],
    queryFn: () => applicationsApi.getAll({ page, status, search: debouncedSearch }),
    staleTime: 30000,
    placeholderData: (previousData) => previousData,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Application> }) =>
      applicationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Ariza yangilandi');
      setSelectedApp(null);
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: applicationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success("Ariza o'chirildi");
      setDeleteApp(null);
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  });

  const handleStatusChange = useCallback((id: string, newStatus: string) => {
    updateMutation.mutate({ id, data: { status: newStatus as Application['status'] } });
  }, [updateMutation]);

  const handleExport = useCallback(() => {
    if (data?.items) {
      exportToCSV(data.items);
    }
  }, [data?.items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Arizalar</h1>
          <p className="text-dark-500 mt-1">Jami: {data?.total || 0} ta ariza</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={!data?.items?.length}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Export CSV
        </Button>
      </motion.div>

      {/* Filters */}
      <Card delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              className="input pl-10"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input w-full sm:w-48"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SkeletonTable rows={8} />
          </motion.div>
        ) : data?.items?.length ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`card p-0 overflow-hidden ${isFetching ? 'opacity-70' : ''}`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-50 border-b border-dark-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Ism</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Telefon</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Davlat</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Sana</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-dark-500 uppercase">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((app, index) => {
                    const config = statusConfig[app.status];
                    return (
                      <motion.tr
                        key={app._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-sm shrink-0">
                              {app.name.charAt(0)}
                            </div>
                            <span className="font-medium text-dark-900">{app.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <a href={`tel:${app.phone}`} className="text-primary-600 hover:underline">
                            {app.phone}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 text-dark-600">{app.country || '-'}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer ${config?.bg} ${config?.color}`}
                          >
                            {statusOptions.slice(1).map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-dark-500 text-sm">
                          {new Date(app.createdAt).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedApp(app)}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                              Ko'rish
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteApp(app)}
                              className="text-sm font-medium text-accent-600 hover:text-accent-700"
                            >
                              O'chirish
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-dark-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Oldingi
                </Button>
                <span className="text-sm text-dark-500">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Keyingi →
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <Card>
            <EmptyState
              title="Arizalar topilmadi"
              description="Qidiruv yoki filter bo'yicha arizalar topilmadi"
              icon={
                <svg className="w-16 h-16 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </Card>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={(data) => updateMutation.mutate({ id: selectedApp._id, data })}
          isUpdating={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteApp}
        onClose={() => setDeleteApp(null)}
        onConfirm={() => deleteApp && deleteMutation.mutate(deleteApp._id)}
        title="Arizani o'chirish"
        message={`"${deleteApp?.name}" arizasini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
        confirmText="O'chirish"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
});
