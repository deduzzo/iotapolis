import { motion } from 'framer-motion';
import {
  Users, FileText, MessageSquare, Activity,
  Wifi, WifiOff, Database, Clock,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../api/endpoints';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { data: dashboard, loading, error } = useApi(
    () => api.getDashboard(),
    [],
    ['thread', 'post', 'user'],
  );

  const { data: syncStatus } = useApi(
    () => api.getSyncStatus(),
    [],
    ['sync'],
  );

  if (loading) {
    return <LoadingSpinner size={32} className="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </div>
    );
  }

  const stats = dashboard || {};

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold mb-6 neon-text"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Dashboard
      </motion.h1>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <StatsCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers ?? 0}
          color="cyan"
        />
        <StatsCard
          icon={FileText}
          label="Total Threads"
          value={stats.totalThreads ?? 0}
          color="purple"
        />
        <StatsCard
          icon={MessageSquare}
          label="Total Posts"
          value={stats.totalPosts ?? 0}
          color="emerald"
        />
        <StatsCard
          icon={Activity}
          label="Active (24h)"
          value={stats.activeUsers24h ?? 0}
          color="amber"
        />
      </motion.div>

      {/* Blockchain sync status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <h2
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <Database size={20} style={{ color: 'var(--color-primary)' }} />
          Blockchain Sync Status
        </h2>

        {syncStatus ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: syncStatus.synced
                    ? 'rgba(0,255,136,0.1)'
                    : 'rgba(255,170,0,0.1)',
                  color: syncStatus.synced
                    ? 'var(--color-success)'
                    : 'var(--color-warning)',
                }}
              >
                {syncStatus.synced ? <Wifi size={16} /> : <WifiOff size={16} />}
                {syncStatus.synced ? 'Fully Synced' : 'Syncing...'}
              </div>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Current Milestone
                </p>
                <p className="text-sm font-mono font-bold">
                  {syncStatus.currentMilestone ?? '--'}
                </p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Latest Milestone
                </p>
                <p className="text-sm font-mono font-bold">
                  {syncStatus.latestMilestone ?? '--'}
                </p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Last Updated
                </p>
                <p className="text-sm flex items-center gap-1">
                  <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                  {syncStatus.updatedAt
                    ? new Date(syncStatus.updatedAt).toLocaleTimeString()
                    : '--'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Unable to fetch sync status
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
