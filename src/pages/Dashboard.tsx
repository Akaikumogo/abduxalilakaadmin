import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { applicationsApi } from '@/services/api';
import { StatCard, Card, EmptyState } from '@/components/ui';
import { PageLoading } from '@/components/ui/Loading';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Yangi', color: 'text-primary-700', bg: 'bg-primary-100' },
  contacted: { label: "Bog'lanildi", color: 'text-warning-600', bg: 'bg-warning-100' },
  in_progress: { label: 'Jarayonda', color: 'text-purple-700', bg: 'bg-purple-100' },
  completed: { label: 'Yakunlandi', color: 'text-success-600', bg: 'bg-success-100' },
  cancelled: { label: 'Bekor qilindi', color: 'text-accent-700', bg: 'bg-accent-100' },
};

// Status distribution bar
const StatusBar = memo(function StatusBar({ 
  stats 
}: { 
  stats: Record<string, number>;
}) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-dark-100">
        {Object.entries(stats).map(([status, count], i) => {
          const config = statusConfig[status];
          if (!config || count === 0) return null;
          const width = (count / total) * 100;
          
          return (
            <motion.div
              key={status}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`${config.bg}`}
              title={`${config.label}: ${count}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4">
        {Object.entries(stats).map(([status, count]) => {
          const config = statusConfig[status];
          if (!config) return null;
          
          return (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.bg}`} />
              <span className="text-sm text-dark-600">
                {config.label}: <span className="font-semibold text-dark-900">{count}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const Dashboard = memo(function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: applicationsApi.getStats,
    staleTime: 30000,
  });

  // Generate mock weekly data for chart
  const weeklyData = useMemo(() => {
    return [4, 7, 5, 9, 6, 8, stats?.todayCount || 0];
  }, [stats?.todayCount]);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
          <p className="text-dark-500 mt-1">Buran Consulting boshqaruv paneli</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link to="/applications" className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Barcha arizalar
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jami arizalar"
          value={stats?.total || 0}
          delay={0}
          color="primary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Bugungi arizalar"
          value={stats?.todayCount || 0}
          delay={0.1}
          color="accent"
          trend={stats?.todayCount ? { value: 12, isPositive: true } : undefined}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Yangi arizalar"
          value={stats?.byStatus?.new || 0}
          delay={0.2}
          color="warning"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
        <StatCard
          title="Yakunlangan"
          value={stats?.byStatus?.completed || 0}
          delay={0.3}
          color="success"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Activity */}
        <Card delay={0.2} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-dark-900">Haftalik faollik</h2>
              <p className="text-sm text-dark-500">So'nggi 7 kun statistikasi</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <span className="w-3 h-3 rounded bg-primary-500" />
              Arizalar
            </div>
          </div>
          <div className="h-40 flex items-end gap-2">
            {['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((weeklyData[i] / Math.max(...weeklyData)) * 100, 100)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg min-h-[8px]"
                />
                <span className="text-xs text-dark-500">{day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Status Distribution */}
        <Card delay={0.3}>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Status bo'yicha</h2>
          {stats?.byStatus ? (
            <StatusBar stats={stats.byStatus} />
          ) : (
            <p className="text-dark-500 text-sm">Ma'lumot yo'q</p>
          )}
        </Card>
      </div>

      {/* Recent Applications */}
      <Card delay={0.4}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark-900">So'nggi arizalar</h2>
          <Link to="/applications" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Barchasini ko'rish →
          </Link>
        </div>

        {stats?.recentApplications?.length ? (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Ism</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Telefon</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Davlat</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-dark-500 uppercase tracking-wider">Sana</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentApplications.map((app, index) => {
                  const config = statusConfig[app.status];
                  return (
                    <motion.tr
                      key={app._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="font-medium text-dark-900">{app.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <a href={`tel:${app.phone}`} className="text-primary-600 hover:underline">
                          {app.phone}
                        </a>
                      </td>
                      <td className="py-4 px-6 text-dark-600">{app.country || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${config?.bg} ${config?.color}`}>
                          {config?.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-dark-500">
                        {new Date(app.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Arizalar yo'q"
            description="Hozircha arizalar mavjud emas"
            icon={
              <svg className="w-16 h-16 text-dark-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        )}
      </Card>
    </div>
  );
});
